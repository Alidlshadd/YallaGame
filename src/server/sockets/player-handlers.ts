import type { Server, Socket } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@shared/events.js"
import type { PendingJoin, Player, SocketData } from "@shared/types.js"
import type { RoomStore } from "../store/store.js"
import type { GameResolver } from "../domain/visibility.js"
import { bind } from "./bind.js"
import { projectRoomFor, takenCharacters } from "../domain/visibility.js"
import { isCharacterId } from "../../shared/characters.js"
import { makeSecret } from "../domain/codes.js"
import { fillerRoleId } from "../domain/roles.js"
import { JoinPayload, CancelRequestPayload } from "./schemas.js"
import type { Config } from "../config.js"
import { logger } from "../logger.js"

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>

export interface PlayerDeps {
  io: TypedServer
  store: RoomStore
  resolveGame: GameResolver
  config: Config
}

export function registerPlayerHandlers(socket: TypedSocket, deps: PlayerDeps): void {
  bind(socket, "player:join", JoinPayload, async ({ code, name, character, accessory, playerId }) => {
    if (character !== undefined && !isCharacterId(character)) throw new Error("UNKNOWN_CHARACTER")
    let bound: Player | null = null
    let queued: PendingJoin | null = null

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
        // Still queued from before the tab reloaded — keep the place in line
        // instead of asking the host a second time.
        const waiting = room.pending.find(r => r.id === playerId)
        if (waiting) { queued = waiting; return room }
      }

      const collision = room.players.find(p => p.name.toLowerCase() === name.toLowerCase())
      if (collision && collision.connected) throw new Error("NAME_TAKEN")
      if (collision && !collision.connected) {
        // Coming back to a seat that is still theirs: keep the character they
        // already had unless they explicitly picked a different free one.
        const wanted = character && character !== collision.character
          && !takenCharacters(room).includes(character) ? character : collision.character
        bound = { ...collision, connected: true, role: roleFor(collision.role), character: wanted, accessory: accessory ?? collision.accessory ?? "" }
        return { ...room, players: room.players.map(p => p.id === collision.id ? bound! : p) }
      }
      // A name already waiting in the queue is just as taken as one in a seat.
      if (room.pending.some(r => r.name.toLowerCase() === name.toLowerCase())) throw new Error("NAME_TAKEN")

      // Whoever asks second for the same face is told now, not after they have
      // sat down or waited for the host.
      if (character && takenCharacters(room).includes(character)) throw new Error("CHARACTER_TAKEN")

      if (room.requireApproval) {
        const request: PendingJoin = { id: makeSecret(), name, requestedAt: Date.now(), character: character ?? "", accessory: accessory ?? "" }
        queued = request
        return { ...room, pending: [...room.pending, request] }
      }

      if (room.players.length >= deps.config.MAX_PLAYERS_PER_ROOM) throw new Error("ROOM_FULL")
      const fresh: Player = { id: makeSecret(), name, role: roleFor(null), connected: true, character: character ?? "", accessory: accessory ?? "" }
      bound = fresh
      return { ...room, players: [...room.players, fresh] }
    })

    if (queued) {
      const request: PendingJoin = queued
      const game = deps.resolveGame(updated.gameId)!
      socket.data.roomCode = code
      socket.data.pendingRequestId = request.id
      // A private room of its own, so approve/reject reaches exactly this
      // person without ever putting them inside `room:` first.
      socket.join(`pending:${code}:${request.id}`)
      const adminProjection = projectRoomFor(updated, { kind: "admin", adminSecret: updated.adminSecret }, deps.resolveGame)
      deps.io.to(`admin:${code}`).emit("admin:room-updated", adminProjection)
      logger.info({ code, requestId: request.id }, "join requested")
      return { status: "pending" as const, requestId: request.id, code, theme: game.theme }
    }

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
    return {
      status: "joined" as const, room: myProjection,
      player: { id: me.id, name: me.name, role: me.role, roleData, character: me.character, accessory: me.accessory ?? "" }
    }
  })

  bind(socket, "player:cancel-request", CancelRequestPayload, async ({ code, requestId }) => {
    // Only the socket holding the request may withdraw it.
    if (socket.data.pendingRequestId !== requestId) throw new Error("AUTHZ_MISMATCH")
    const updated = await deps.store.update(code, room => ({
      ...room, pending: room.pending.filter(r => r.id !== requestId)
    }))
    delete socket.data.pendingRequestId
    socket.leave(`pending:${code}:${requestId}`)
    const adminProjection = projectRoomFor(updated, { kind: "admin", adminSecret: updated.adminSecret }, deps.resolveGame)
    deps.io.to(`admin:${code}`).emit("admin:room-updated", adminProjection)
    return { cancelled: true as const }
  })

  socket.on("disconnect", async () => {
    const code = socket.data.roomCode
    const playerId = socket.data.playerId
    const pendingRequestId = socket.data.pendingRequestId

    // Somebody who closed the tab while waiting should not stay in the host's
    // queue as a request that can never be answered.
    if (code && pendingRequestId) {
      try {
        const updated = await deps.store.update(code, room => ({
          ...room, pending: room.pending.filter(r => r.id !== pendingRequestId)
        }))
        const adminProjection = projectRoomFor(updated, { kind: "admin", adminSecret: updated.adminSecret }, deps.resolveGame)
        deps.io.to(`admin:${code}`).emit("admin:room-updated", adminProjection)
      } catch { /* room may have been deleted; ignore */ }
    }

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
