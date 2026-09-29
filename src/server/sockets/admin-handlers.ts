import type { Server, Socket } from "socket.io"
import type { ClientToServerEvents, JoinedData, ServerToClientEvents } from "@shared/events.js"
import type { Player, Room, SocketData } from "@shared/types.js"
// A value, so it takes the relative path the server build can resolve at
// runtime — the `@shared` alias only survives in type-only imports.
import { IDLE_PHASE } from "../../shared/types.js"
import { isModerator, playingPlayers } from "../../shared/room-players.js"
import type { RoomStore } from "../store/store.js"
import type { GameResolver } from "../domain/visibility.js"
import { bind } from "./bind.js"
import { projectRoomFor, summarizeRoom, takenCharacters } from "../domain/visibility.js"
import { CHARACTERS, isCharacterId } from "../../shared/characters.js"
import { characterAccessory } from "../../shared/accessories.js"
import { normalizeSettings } from "../domain/settings.js"
import { buildRolePool, assignRolesToConnected, resolveRoleData } from "../domain/roles.js"
import { dealSpyWord, SPY_GAME_ID } from "../domain/spyWords.js"
import { makeRoomCode, makeSecret, playerResumeToken, resumeKey } from "../domain/codes.js"
import { bindIdentity, revokeRoomSubscriptions } from "./membership.js"
import { cancelTimer } from "../domain/scheduler.js"
import { onPlayerLeft, sendPhaseTo, type EngineResolver } from "../domain/engine.js"
import { engineDeps } from "./game-handlers.js"
import {
  CreateRoomPayload,
  ReconnectPayload,
  UpdateSettingsPayload,
  AssignRolesPayload,
  ClearRolesPayload,
  KickPlayerPayload,
  TransferHostPayload,
  UpdateRoomPayload,
  JoinDecisionPayload,
  CloseRoomPayload,
  ListRoomsPayload,
  PeekRoomPayload
} from "./schemas.js"
import { logger } from "../logger.js"
import { emitGameFinished } from "./completion.js"
import type { Config } from "../config.js"

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>

export interface AdminDeps {
  io: TypedServer
  store: RoomStore
  resolveGame: GameResolver
  resolveEngine: EngineResolver
  config: Config
  rng: () => number
  canCreateGame?: (id: string) => boolean
  isValidCharacter?: (id: string) => boolean
  selectableCharacters?: () => readonly string[]
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
    const roleData = resolveRoleData(game, room, player.role)
    deps.io.to(`pending:${room.code}:${id}`).emit("player:join-approved", {
      status: "joined",
      resumeToken: playerResumeToken(resumeKey(room), player.id),
      room: projectRoomFor(room, { kind: "player", playerId: id }, deps.resolveGame),
      player: { id: player.id, name: player.name, role: player.role, roleData, character: player.character, accessory: player.accessory ?? "" }
    })
    deps.io.in(`pending:${room.code}:${id}`).socketsLeave(`pending:${room.code}:${id}`)
    for (const peer of deps.io.sockets.sockets.values()) {
      if (peer.data.roomCode === room.code && peer.data.pendingRequestId === id) delete peer.data.pendingRequestId
    }
  }
}

async function generateUniqueCode(store: RoomStore): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const code = makeRoomCode(() => false)
    if (!(await store.get(code))) return code
  }
  throw new Error("SERVER_BUSY")
}

const creationQueues = new WeakMap<RoomStore, Promise<unknown>>()

/** Counting and inserting must share a lock or concurrent sockets bypass the global cap. */
function serializeCreation<T>(store: RoomStore, create: () => Promise<T>): Promise<T> {
  const previous = creationQueues.get(store) ?? Promise.resolve()
  const next = previous.catch(() => {}).then(create)
  creationQueues.set(store, next)
  return next.finally(() => {
    if (creationQueues.get(store) === next) creationQueues.delete(store)
  })
}

export function registerAdminHandlers(socket: TypedSocket, deps: AdminDeps): void {
  bind(socket, "admin:create-room", CreateRoomPayload, async ({ gameId, hostName, hostCharacter, hostAccessory, isPublic, requireApproval }) => serializeCreation(deps.store, async () => {
    const game = deps.resolveGame(gameId)
    if (!game) throw new Error("UNKNOWN_GAME")
    if (deps.canCreateGame?.(gameId) === false) throw new Error("UNKNOWN_GAME")
    if (!(deps.isValidCharacter?.(hostCharacter) ?? isCharacterId(hostCharacter))) throw new Error("UNKNOWN_CHARACTER")

    const totalRooms = await deps.store.countActiveRooms()
    if (totalRooms >= deps.config.MAX_TOTAL_ROOMS) throw new Error("SERVER_BUSY")

    const adminRoomCount = socket.data.adminRoomCount ?? 0
    if (adminRoomCount >= deps.config.MAX_ROOMS_PER_SOCKET) throw new Error("RATE_LIMITED")

    const finalCode = await generateUniqueCode(deps.store)
    const adminSecret = makeSecret()
    const now = Date.now()
    // Keep the owner's identity for reconnects and the browser's "created by".
    // playingPlayers excludes this identity when the host only moderates.
    const host: Player = { id: makeSecret(), name: hostName, role: null, connected: true, character: hostCharacter, accessory: characterAccessory(hostCharacter, hostAccessory) }
    const room: Room = {
      code: finalCode, gameId: game.id, adminSecret,
      assigned: false,
      settings: normalizeSettings(game, game.defaultSettings),
      players: [host], createdAt: now, updatedAt: now,
      hostPlayerId: host.id, isPublic, requireApproval, pending: [],
      phase: IDLE_PHASE, phaseSeq: 0, phaseEndsAt: null,
      round: 0, gameState: {}, scores: {}
    }
    await deps.store.create(room)
    // Also covers codes reused after TTL expiry, when former sockets may still be open.
    await revokeRoomSubscriptions(deps, finalCode)

    await bindIdentity(socket, deps, finalCode, host.id)
    socket.data.adminSecret = adminSecret
    socket.data.adminRoomCount = adminRoomCount + 1
    await socket.join(`admin:${finalCode}`)

    logger.info({ code: finalCode, gameId, isPublic, requireApproval }, "room created")
    const projection = projectRoomFor(room, { kind: "admin", adminSecret }, deps.resolveGame)
    return { code: finalCode, adminSecret, room: projection, hostPlayerId: host.id }
  }))

  bind(socket, "admin:reconnect", ReconnectPayload, async ({ code, adminSecret }) => {
    const room = await deps.store.get(code)
    if (!room || room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
    await bindIdentity(socket, deps, code, room.hostPlayerId)
    socket.data.adminSecret = adminSecret
    await socket.join(`admin:${code}`)
    // Coming back from a dropped connection: the host is playing again.
    const revived = await deps.store.update(code, r => ({
      ...r,
      players: r.players.map(p => p.id === r.hostPlayerId
        ? { ...p, connected: true, role: isModerator(r, p.id) ? null : p.role } : p)
    }))
    await broadcastRoom(deps, revived)
    // The host's own screen has to come back to the running turn too, and a
    // restarted process re-arms the phase clock off the back of this call.
    if (revived.phase !== IDLE_PHASE) {
      void sendPhaseTo(engineDeps(deps), code, revived.hostPlayerId)
    }
    return { room: projectRoomFor(revived, { kind: "admin", adminSecret }, deps.resolveGame) }
  })

  bind(socket, "admin:update-settings", UpdateSettingsPayload, async ({ code, adminSecret, settings }) => {
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      const game = deps.resolveGame(room.gameId)
      if (!game) throw new Error("UNKNOWN_GAME")
      // Settings feed role counts and deck sizes; changing them under a running
      // turn would leave the game state describing a game nobody is playing.
      if (room.phase !== IDLE_PHASE) throw new Error("INVALID_INPUT")
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

  bind(socket, "admin:assign-roles", AssignRolesPayload, async ({ code, adminSecret, settings }) => {
    let redeal = false
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      const game = deps.resolveGame(room.gameId)
      if (!game) throw new Error("UNKNOWN_GAME")
      // Turn-based games deal their own roles when the game starts; redealing
      // mid-round would hand somebody a card the table has already seen played.
      if (room.phase !== IDLE_PHASE) throw new Error("INVALID_INPUT")
      const participants = playingPlayers(room)
      const connectedCount = participants.filter(p => p.connected).length
      if (connectedCount < game.minPlayers) throw new Error("NEED_MORE_PLAYERS")
      const nextSettings = settings ? normalizeSettings(game, { ...room.settings, ...settings }) : room.settings
      const pool = buildRolePool(game, nextSettings, connectedCount)
      const dealt = new Map(assignRolesToConnected(participants, pool, deps.rng).map(p => [p.id, p]))
      const players = room.players.map(p => dealt.get(p.id) ?? { ...p, role: null })
      redeal = room.assigned
      // Spy Game hides one secret word per round behind the generic role pool —
      // picked fresh on every deal, skipping the room's recently used words.
      const gameState = game.id === SPY_GAME_ID
        ? dealSpyWord(nextSettings, room.gameState, deps.rng)
        : room.gameState
      return { ...room, settings: nextSettings, players, assigned: true, gameState }
    })
    if (redeal) deps.store.recordRoleRedeal?.(updated)
    const game = deps.resolveGame(updated.gameId)!
    await broadcastRoom(deps, updated)
    for (const p of updated.players) {
      if (!p.role) continue
      const role = resolveRoleData(game, updated, p.role)!
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
    // The one person a running vote was still waiting on may be the one who left.
    await onPlayerLeft(engineDeps(deps), code)
    logger.info({ code, playerId }, "player kicked")
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })

  /**
   * The host hands the room to another player and sits down as an ordinary
   * one. There is only ever one host: the admin secret is rotated, so the old
   * host's saved credential stops working, and the seats already handed out
   * keep theirs because resume tokens stay signed with the frozen old key.
   */
  bind(socket, "admin:transfer-host", TransferHostPayload, async ({ code, adminSecret, playerId }) => {
    const newSecret = makeSecret()
    let oldHostId = ""
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      const target = room.players.find(p => p.id === playerId)
      if (!target || !target.connected || playerId === room.hostPlayerId) throw new Error("INVALID_INPUT")
      // A running turn is driven from the host's screen; hand over between games.
      if (room.phase !== IDLE_PHASE) throw new Error("INVALID_INPUT")
      // A moderating host holds no card, so swapping seats would break a dealt table.
      if (room.assigned && (isModerator(room, room.hostPlayerId) || isModerator({ ...room, hostPlayerId: playerId }, playerId))) {
        throw new Error("INVALID_INPUT")
      }
      oldHostId = room.hostPlayerId
      return { ...room, hostPlayerId: playerId, adminSecret: newSecret, resumeSecret: resumeKey(room) }
    })

    // Admin rights move with the sockets, not only with the stored secret.
    for (const peer of deps.io.sockets.sockets.values()) {
      if (peer.data.roomCode !== code) continue
      if (peer.data.playerId === oldHostId) {
        await peer.leave(`admin:${code}`)
        delete peer.data.adminSecret
      } else if (peer.data.playerId === playerId) {
        await peer.join(`admin:${code}`)
        peer.data.adminSecret = newSecret
      }
    }

    const game = deps.resolveGame(updated.gameId)!
    deps.io.to(`p:${code}:${playerId}`).emit("player:host-granted", {
      code, adminSecret: newSecret,
      room: projectRoomFor(updated, { kind: "admin", adminSecret: newSecret }, deps.resolveGame)
    })
    const formerHost = updated.players.find(p => p.id === oldHostId)!
    const formerHostView: JoinedData = {
      status: "joined",
      resumeToken: playerResumeToken(resumeKey(updated), formerHost.id),
      room: projectRoomFor(updated, { kind: "player", playerId: formerHost.id }, deps.resolveGame),
      player: {
        id: formerHost.id, name: formerHost.name, role: formerHost.role,
        roleData: resolveRoleData(game, updated, formerHost.role),
        character: formerHost.character, accessory: formerHost.accessory ?? ""
      }
    }
    deps.io.to(`p:${code}:${oldHostId}`).emit("admin:host-revoked", formerHostView)
    await broadcastRoom(deps, updated)
    logger.info({ code }, "host transferred")
    return { room: formerHostView.room }
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
            // Same rule as a direct join: a face is shared only once all are taken.
            const cast = deps.selectableCharacters?.() ?? CHARACTERS.map(c => c.id)
            const free = r.character && (!claimed.has(r.character) || cast.every(id => claimed.has(id)))
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
      // The request id becomes the player id, so the waiting socket is already
      // in the right room name and needs no second round trip to find itself.
      // A character can go stale between the request and the decision: somebody
       // else may have taken it. The seat is worth more than the picture, so
       // admit them without one rather than rejecting a person the host accepted.
      // With every avatar already claimed, faces are shared (see player:join).
      const taken = takenCharacters({ ...room, pending: [] })
      const cast = deps.selectableCharacters?.() ?? CHARACTERS.map(c => c.id)
      const stillFree = !taken.includes(request.character) || !cast.some(id => !taken.includes(id))
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
    cancelTimer(code)
    await deps.store.delete(code)
    // Without this an abandoned room would sit in the public browser until the
    // TTL sweep hours later, and everyone who clicked it would hit a dead code.
    deps.io.to(`room:${code}`).emit("room:closed")
    for (const r of room.pending) {
      deps.io.to(`pending:${code}:${r.id}`).emit("player:join-rejected")
    }
    // Room codes can be reused. No old subscriber may receive a future room's secrets.
    await revokeRoomSubscriptions(deps, code)
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

  bind(socket, "admin:clear-roles", ClearRolesPayload, async ({ code, adminSecret, finished }) => {
    let completed = false
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      // A running turn (a Spy Game vote, say) is built on the dealt cards;
      // taking them back underneath it would leave a vote over nobody.
      if (room.phase !== IDLE_PHASE) throw new Error("INVALID_INPUT")
      completed = finished === true && room.assigned
      return { ...room, assigned: false, players: room.players.map(p => ({ ...p, role: null })) }
    })
    await broadcastRoom(deps, updated)
    for (const p of updated.players) deps.io.to(`p:${code}:${p.id}`).emit("player:role-cleared")
    if (completed) emitGameFinished(deps.io, updated)
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })
}
