import type { Server, Socket } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@shared/events.js"
import type { Player, SocketData } from "@shared/types.js"
import type { RoomStore } from "../store/store.js"
import type { GameResolver } from "../domain/visibility.js"
import { bind } from "./bind.js"
import { projectRoomFor } from "../domain/visibility.js"
import { makeSecret } from "../domain/codes.js"
import { fillerRoleId } from "../domain/roles.js"
import { JoinPayload } from "./schemas.js"
import type { Config } from "../config.js"

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>

export interface PlayerDeps {
  io: TypedServer
  store: RoomStore
  resolveGame: GameResolver
  config: Config
}

export function registerPlayerHandlers(socket: TypedSocket, deps: PlayerDeps): void {
  bind(socket, "player:join", JoinPayload, async ({ code, name, playerId }) => {
    let bound: Player | null = null

    const updated = await deps.store.update(code, room => {
      const game = deps.resolveGame(room.gameId)
      if (!game) throw new Error("UNKNOWN_GAME")

      // Late joiners / role-less rebinds get the filler role once roles are out.
      const roleFor = (current: string | null) =>
        current ?? (room.assigned ? fillerRoleId(game) : null)

      if (playerId) {
        const existing = room.players.find(p => p.id === playerId)
        if (existing) {
          bound = { ...existing, connected: true, role: roleFor(existing.role) }
          return { ...room, players: room.players.map(p => p.id === playerId ? bound! : p) }
        }
      }

      const collision = room.players.find(p => p.name.toLowerCase() === name.toLowerCase())
      if (collision && collision.connected) throw new Error("NAME_TAKEN")
      if (collision && !collision.connected) {
        bound = { ...collision, connected: true, role: roleFor(collision.role) }
        return { ...room, players: room.players.map(p => p.id === collision.id ? bound! : p) }
      }

      const fresh: Player = { id: makeSecret(), name, role: roleFor(null), connected: true }
      bound = fresh
      return { ...room, players: [...room.players, fresh] }
    })

    if (!bound) throw new Error("INVALID_INPUT")
    const me: Player = bound

    socket.data.roomCode = code
    socket.data.playerId = me.id
    socket.join(`room:${code}`)
    socket.join(`p:${code}:${me.id}`)

    const game = deps.resolveGame(updated.gameId)!
    const roleData = me.role ? (game.roles.find(r => r.id === me.role) ?? null) : null

    const adminProjection = projectRoomFor(updated, { kind: "admin", adminSecret: updated.adminSecret }, deps.resolveGame)
    deps.io.to(`admin:${code}`).emit("admin:room-updated", adminProjection)
    for (const p of updated.players) {
      const projection = projectRoomFor(updated, { kind: "player", playerId: p.id }, deps.resolveGame)
      deps.io.to(`p:${code}:${p.id}`).emit("room:status", projection)
    }

    if (updated.assigned && me.role) {
      deps.io.to(`p:${code}:${me.id}`).emit("player:role-assigned", {
        role: me.role, roleData: roleData!, name: me.name, code, game
      })
    }

    const myProjection = projectRoomFor(updated, { kind: "player", playerId: me.id }, deps.resolveGame)
    return { room: myProjection, player: { id: me.id, name: me.name, role: me.role, roleData } }
  })

  socket.on("disconnect", async () => {
    const code = socket.data.roomCode
    const playerId = socket.data.playerId
    if (!code || !playerId) return
    try {
      const updated = await deps.store.update(code, room => ({
        ...room,
        players: room.players.map(p => p.id === playerId ? { ...p, connected: false } : p)
      }))
      const adminProjection = projectRoomFor(updated, { kind: "admin", adminSecret: updated.adminSecret }, deps.resolveGame)
      deps.io.to(`admin:${code}`).emit("admin:room-updated", adminProjection)
    } catch { /* room may have been deleted; ignore */ }
  })
}
