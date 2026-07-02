import type { Server, Socket } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@shared/events.js"
import type { Room, SocketData } from "@shared/types.js"
import type { RoomStore } from "../store/store.js"
import type { GameResolver } from "../domain/visibility.js"
import { bind } from "./bind.js"
import { projectRoomFor } from "../domain/visibility.js"
import { normalizeSettings } from "../domain/settings.js"
import { buildRolePool, assignRolesToConnected } from "../domain/roles.js"
import { makeRoomCode, makeSecret } from "../domain/codes.js"
import {
  CreateRoomPayload,
  ReconnectPayload,
  UpdateSettingsPayload,
  AssignRolesPayload,
  ClearRolesPayload
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

async function generateUniqueCode(store: RoomStore): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const code = makeRoomCode(() => false)
    if (!(await store.get(code))) return code
  }
  throw new Error("SERVER_BUSY")
}

export function registerAdminHandlers(socket: TypedSocket, deps: AdminDeps): void {
  bind(socket, "admin:create-room", CreateRoomPayload, async ({ gameId }) => {
    const game = deps.resolveGame(gameId)
    if (!game) throw new Error("UNKNOWN_GAME")

    const totalRooms = await deps.store.countActiveRooms()
    if (totalRooms >= deps.config.MAX_TOTAL_ROOMS) throw new Error("SERVER_BUSY")

    const adminRoomCount = socket.data.adminRoomCount ?? 0
    if (adminRoomCount >= deps.config.MAX_ROOMS_PER_SOCKET) throw new Error("RATE_LIMITED")

    const finalCode = await generateUniqueCode(deps.store)
    const adminSecret = makeSecret()
    const now = Date.now()
    const room: Room = {
      code: finalCode, gameId: game.id, adminSecret,
      assigned: false,
      settings: normalizeSettings(game, game.defaultSettings),
      players: [], createdAt: now, updatedAt: now
    }
    await deps.store.create(room)

    socket.data.adminSecret = adminSecret
    socket.data.roomCode = finalCode
    socket.data.adminRoomCount = adminRoomCount + 1
    socket.join(`room:${finalCode}`)
    socket.join(`admin:${finalCode}`)

    logger.info({ code: finalCode, gameId }, "room created")
    const projection = projectRoomFor(room, { kind: "admin", adminSecret }, deps.resolveGame)
    return { code: finalCode, adminSecret, room: projection }
  })

  bind(socket, "admin:reconnect", ReconnectPayload, async ({ code, adminSecret }) => {
    const room = await deps.store.get(code)
    if (!room || room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
    socket.data.adminSecret = adminSecret
    socket.data.roomCode = code
    socket.join(`room:${code}`)
    socket.join(`admin:${code}`)
    return { room: projectRoomFor(room, { kind: "admin", adminSecret }, deps.resolveGame) }
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
