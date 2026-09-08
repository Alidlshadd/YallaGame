import type { Server, Socket } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@shared/events.js"
import type { Player, Room, SocketData } from "@shared/types.js"
import type { RoomStore } from "../store/store.js"
import type { GameResolver } from "../domain/visibility.js"
import { bind } from "./bind.js"
import { projectRoomFor, summarizeRoom, takenCharacters } from "../domain/visibility.js"
import { isCharacterId } from "../../shared/characters.js"
import { characterAccessory } from "../../shared/accessories.js"
import { normalizeSettings } from "../domain/settings.js"
import { buildRolePool, assignRolesToConnected } from "../domain/roles.js"
import { makeRoomCode, makeSecret } from "../domain/codes.js"
import {
  CreateRoomPayload,
  ReconnectPayload,
  UpdateSettingsPayload,
  AssignRolesPayload,
  ClearRolesPayload,
  KickPlayerPayload,
  UpdateRoomPayload,
  JoinDecisionPayload,
  CloseRoomPayload,
  ListRoomsPayload,
  PeekRoomPayload
} from "./schemas.js"
import { logger } from "../logger.js"
import type { Config } from "../config.js"

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>

export interface AdminDeps {
  io: TypedServer
  store: RoomStore
  resolveGame: GameResolver
  config: Config
  rng: () => number
}

async function broadcastRoom(deps: AdminDeps, room: Room): Promise<void> {
  const adminProjection = projectRoomFor(room, { kind: "admin", adminSecret: room.adminSecret }, deps.resolveGame)
  deps.io.to(`admin:${room.code}`).emit("admin:room-updated", adminProjection)

  for (const p of room.players) {
    const projection = projectRoomFor(room, { kind: "player", playerId: p.id }, deps.resolveGame)
    deps.io.to(`p:${room.code}:${p.id}`).emit("room:status", projection)
  }
}

/**
 * Tell freshly admitted players they are in. They were never in `room:` before,
 * so the normal broadcast never reached them.
 */
async function announceApprovals(deps: AdminDeps, room: Room, playerIds: string[]): Promise<void> {
  const game = deps.resolveGame(room.gameId)
  if (!game) return
  for (const id of playerIds) {
    const player = room.players.find(p => p.id === id)
    if (!player) continue
    const roleData = player.role ? (game.roles.find(r => r.id === player.role) ?? null) : null
    deps.io.to(`pending:${room.code}:${id}`).emit("player:join-approved", {
      status: "joined",
      room: projectRoomFor(room, { kind: "player", playerId: id }, deps.resolveGame),
      player: { id: player.id, name: player.name, role: player.role, roleData, character: player.character, accessory: player.accessory ?? "" }
    })
    deps.io.in(`pending:${room.code}:${id}`).socketsLeave(`pending:${room.code}:${id}`)
  }
}

async function generateUniqueCode(store: RoomStore): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const code = makeRoomCode(() => false)
    if (!(await store.get(code))) return code
  }
  throw new Error("SERVER_BUSY")
}

export function registerAdminHandlers(socket: TypedSocket, deps: AdminDeps): void {
  bind(socket, "admin:create-room", CreateRoomPayload, async ({ gameId, hostName, hostCharacter, hostAccessory, isPublic, requireApproval }) => {
    const game = deps.resolveGame(gameId)
    if (!game) throw new Error("UNKNOWN_GAME")
    if (!isCharacterId(hostCharacter)) throw new Error("UNKNOWN_CHARACTER")

    const totalRooms = await deps.store.countActiveRooms()
    if (totalRooms >= deps.config.MAX_TOTAL_ROOMS) throw new Error("SERVER_BUSY")

    const adminRoomCount = socket.data.adminRoomCount ?? 0
    if (adminRoomCount >= deps.config.MAX_ROOMS_PER_SOCKET) throw new Error("RATE_LIMITED")

    const finalCode = await generateUniqueCode(deps.store)
    const adminSecret = makeSecret()
    const now = Date.now()
    // The host plays too, so they take the first seat rather than sitting
    // outside the game: their name is what the room browser shows as "created by".
    const host: Player = { id: makeSecret(), name: hostName, role: null, connected: true, character: hostCharacter, accessory: characterAccessory(hostCharacter, hostAccessory) }
    const room: Room = {
      code: finalCode, gameId: game.id, adminSecret,
      assigned: false,
      settings: normalizeSettings(game, game.defaultSettings),
      players: [host], createdAt: now, updatedAt: now,
      hostPlayerId: host.id, isPublic, requireApproval, pending: []
    }
    await deps.store.create(room)

    socket.data.adminSecret = adminSecret
    socket.data.roomCode = finalCode
    socket.data.playerId = host.id
    socket.data.adminRoomCount = adminRoomCount + 1
    socket.join(`room:${finalCode}`)
    socket.join(`admin:${finalCode}`)
    // Also a player room, so the host receives their own role like everybody else.
    socket.join(`p:${finalCode}:${host.id}`)

    logger.info({ code: finalCode, gameId, isPublic, requireApproval }, "room created")
    const projection = projectRoomFor(room, { kind: "admin", adminSecret }, deps.resolveGame)
    return { code: finalCode, adminSecret, room: projection, hostPlayerId: host.id }
  })

  bind(socket, "admin:reconnect", ReconnectPayload, async ({ code, adminSecret }) => {
    const room = await deps.store.get(code)
    if (!room || room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
    socket.data.adminSecret = adminSecret
    socket.data.roomCode = code
    socket.data.playerId = room.hostPlayerId
    socket.join(`room:${code}`)
    socket.join(`admin:${code}`)
    socket.join(`p:${code}:${room.hostPlayerId}`)
    // Coming back from a dropped connection: the host is playing again.
    const revived = await deps.store.update(code, r => ({
      ...r,
      players: r.players.map(p => p.id === r.hostPlayerId ? { ...p, connected: true } : p)
    }))
    await broadcastRoom(deps, revived)
    return { room: projectRoomFor(revived, { kind: "admin", adminSecret }, deps.resolveGame) }
  })

  bind(socket, "admin:update-settings", UpdateSettingsPayload, async ({ code, adminSecret, settings }) => {
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      const game = deps.resolveGame(room.gameId)
      if (!game) throw new Error("UNKNOWN_GAME")
      return {
        ...room,
        settings: normalizeSettings(game, settings as Record<string, unknown>),
        assigned: false,
        players: room.players.map(p => ({ ...p, role: null }))
      }
    })
    await broadcastRoom(deps, updated)
    for (const p of updated.players) deps.io.to(`p:${code}:${p.id}`).emit("player:role-cleared")
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })

  bind(socket, "admin:assign-roles", AssignRolesPayload, async ({ code, adminSecret }) => {
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      const game = deps.resolveGame(room.gameId)
      if (!game) throw new Error("UNKNOWN_GAME")
      const connectedCount = room.players.filter(p => p.connected).length
      if (connectedCount < game.minPlayers) throw new Error("NEED_MORE_PLAYERS")
      const pool = buildRolePool(game, room.settings, connectedCount)
      const players = assignRolesToConnected(room.players, pool, deps.rng)
      return { ...room, players, assigned: true }
    })
    const game = deps.resolveGame(updated.gameId)!
    await broadcastRoom(deps, updated)
    for (const p of updated.players) {
      if (!p.role) continue
      const role = game.roles.find(r => r.id === p.role)!
      deps.io.to(`p:${code}:${p.id}`).emit("player:role-assigned", {
        role: p.role, roleData: role, name: p.name, code, game
      })
    }
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })

  bind(socket, "admin:kick-player", KickPlayerPayload, async ({ code, adminSecret, playerId }) => {
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      if (!room.players.some(p => p.id === playerId)) throw new Error("INVALID_INPUT")
      // Removing the host would leave a room nobody can play in or close.
      if (playerId === room.hostPlayerId) throw new Error("INVALID_INPUT")
      return { ...room, players: room.players.filter(p => p.id !== playerId) }
    })
    deps.io.to(`p:${code}:${playerId}`).emit("player:kicked")
    deps.io.in(`p:${code}:${playerId}`).socketsLeave([`room:${code}`, `p:${code}:${playerId}`])
    await broadcastRoom(deps, updated)
    logger.info({ code, playerId }, "player kicked")
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })

  bind(socket, "admin:update-room", UpdateRoomPayload, async ({ code, adminSecret, isPublic, requireApproval }) => {
    let promoted: string[] = []
    const updated = await deps.store.update(code, room => {
      promoted = []
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      const next = {
        ...room,
        isPublic: isPublic ?? room.isPublic,
        requireApproval: requireApproval ?? room.requireApproval
      }
      // Turning approval off is also an answer to everyone already queued:
      // leaving them stranded in a queue nobody looks at would be worse.
      if (room.requireApproval && next.requireApproval === false && room.pending.length > 0) {
        promoted = room.pending.map(r => r.id)
        const claimed = new Set(takenCharacters({ ...room, pending: [] }))
        next.players = [
          ...room.players,
          ...room.pending.map(r => {
            const free = r.character && !claimed.has(r.character)
            if (free) claimed.add(r.character)
            return { id: r.id, name: r.name, role: null, connected: true, character: free ? r.character : "", accessory: r.accessory ?? "" }
          })
        ]
        next.pending = []
      }
      return next
    })
    // Admitted-by-switch players still need their sockets wired into the room.
    for (const id of promoted) {
      deps.io.in(`pending:${code}:${id}`).socketsJoin([`room:${code}`, `p:${code}:${id}`])
    }
    await broadcastRoom(deps, updated)
    await announceApprovals(deps, updated, promoted)
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })

  bind(socket, "admin:approve-join", JoinDecisionPayload, async ({ code, adminSecret, requestId }) => {
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      const request = room.pending.find(r => r.id === requestId)
      if (!request) throw new Error("REQUEST_NOT_FOUND")
      if (room.players.length >= deps.config.MAX_PLAYERS_PER_ROOM) throw new Error("ROOM_FULL")
      // The request id becomes the player id, so the waiting socket is already
      // in the right room name and needs no second round trip to find itself.
      // A character can go stale between the request and the decision: somebody
       // else may have taken it. The seat is worth more than the picture, so
       // admit them without one rather than rejecting a person the host accepted.
      const stillFree = !takenCharacters({ ...room, pending: [] }).includes(request.character)
      const seat = {
        id: request.id, name: request.name, role: null, connected: true,
        character: stillFree ? request.character : "", accessory: request.accessory ?? ""
      }
      return { ...room, players: [...room.players, seat], pending: room.pending.filter(r => r.id !== requestId) }
    })
    deps.io.in(`pending:${code}:${requestId}`).socketsJoin([`room:${code}`, `p:${code}:${requestId}`])
    await broadcastRoom(deps, updated)
    await announceApprovals(deps, updated, [requestId])
    logger.info({ code, requestId }, "join approved")
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })

  bind(socket, "admin:reject-join", JoinDecisionPayload, async ({ code, adminSecret, requestId }) => {
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      if (!room.pending.some(r => r.id === requestId)) throw new Error("REQUEST_NOT_FOUND")
      return { ...room, pending: room.pending.filter(r => r.id !== requestId) }
    })
    deps.io.to(`pending:${code}:${requestId}`).emit("player:join-rejected")
    deps.io.in(`pending:${code}:${requestId}`).socketsLeave(`pending:${code}:${requestId}`)
    await broadcastRoom(deps, updated)
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })

  bind(socket, "admin:close-room", CloseRoomPayload, async ({ code, adminSecret }) => {
    const room = await deps.store.get(code)
    if (!room || room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
    await deps.store.delete(code)
    // Without this an abandoned room would sit in the public browser until the
    // TTL sweep hours later, and everyone who clicked it would hit a dead code.
    deps.io.to(`room:${code}`).emit("room:closed")
    for (const r of room.pending) {
      deps.io.to(`pending:${code}:${r.id}`).emit("player:join-rejected")
    }
    logger.info({ code }, "room closed by host")
    return { closed: true as const }
  })

  bind(socket, "rooms:peek", PeekRoomPayload, async ({ code }) => {
    const room = await deps.store.get(code)
    if (!room) throw new Error("ROOM_NOT_FOUND")
    const summary = summarizeRoom(room, deps.resolveGame)
    if (!summary) throw new Error("UNKNOWN_GAME")
    return { room: summary }
  })

  bind(socket, "rooms:list", ListRoomsPayload, async () => {
    const rooms = await deps.store.listPublic(deps.config.ROOM_LIST_LIMIT)
    const summaries = rooms
      // A room whose every member has closed the tab is a ghost: it would still
      // accept a join, but nobody is there to start the game.
      .filter(r => r.players.some(p => p.connected))
      .map(r => summarizeRoom(r, deps.resolveGame))
      .filter((r): r is NonNullable<typeof r> => r !== null)
    return { rooms: summaries }
  })

  bind(socket, "admin:clear-roles", ClearRolesPayload, async ({ code, adminSecret }) => {
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      return { ...room, assigned: false, players: room.players.map(p => ({ ...p, role: null })) }
    })
    await broadcastRoom(deps, updated)
    for (const p of updated.players) deps.io.to(`p:${code}:${p.id}`).emit("player:role-cleared")
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })
}
