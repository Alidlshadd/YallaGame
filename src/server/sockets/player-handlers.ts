import type { Server, Socket } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@shared/events.js"
import type { PendingJoin, Player, SocketData } from "@shared/types.js"
import { IDLE_PHASE } from "../../shared/types.js"
import { isModerator } from "../../shared/room-players.js"
import type { RoomStore } from "../store/store.js"
import type { GameResolver } from "../domain/visibility.js"
import { bind } from "./bind.js"
import { projectRoomFor, takenCharacters } from "../domain/visibility.js"
import { CHARACTERS, isCharacterId } from "../../shared/characters.js"
import { characterAccessory } from "../../shared/accessories.js"
import { makeSecret, playerResumeToken, resumeKey, validResumeToken } from "../domain/codes.js"
import { bindIdentity } from "./membership.js"
import { fillerRoleId, resolveRoleData } from "../domain/roles.js"
import { JoinPayload, CancelRequestPayload } from "./schemas.js"
import type { EngineResolver } from "../domain/engine.js"
import { onPlayerLeft, sendPhaseTo } from "../domain/engine.js"
import { engineDeps } from "./game-handlers.js"
import type { Config } from "../config.js"
import { logger } from "../logger.js"

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>

export interface PlayerDeps {
  io: TypedServer
  store: RoomStore
  resolveGame: GameResolver
  resolveEngine: EngineResolver
  config: Config
  rng: () => number
  isValidCharacter?: (id: string) => boolean
  /** Every avatar a player can pick right now; the bundled cast when absent. */
  selectableCharacters?: () => readonly string[]
}

export function registerPlayerHandlers(socket: TypedSocket, deps: PlayerDeps): void {
  bind(socket, "player:join", JoinPayload, async ({ code, name, character, accessory, playerId, resumeToken }) => {
    if (character !== undefined && !(deps.isValidCharacter?.(character) ?? isCharacterId(character)))
      throw new Error("UNKNOWN_CHARACTER")
    let bound: Player | null = null
    let queued: PendingJoin | null = null

    const updated = await deps.store.update(code, room => {
      const game = deps.resolveGame(room.gameId)
      if (!game) throw new Error("UNKNOWN_GAME")

      // Late joiners / role-less rebinds get the filler role once roles are out.
      const roleFor = (current: string | null) =>
        current ?? (room.assigned ? fillerRoleId(game) : null)

      if (playerId) {
        if (isModerator(room, playerId)) throw new Error("AUTHZ_MISMATCH")
        if (!validResumeToken(resumeKey(room), playerId, resumeToken)) throw new Error("AUTHZ_MISMATCH")
        const existing = room.players.find(p => p.id === playerId)
        if (existing) {
          bound = { ...existing, connected: true, role: roleFor(existing.role), accessory: characterAccessory(existing.character, existing.accessory) }
          return { ...room, players: room.players.map(p => p.id === playerId ? bound! : p) }
        }
        // Still queued from before the tab reloaded — keep the place in line
        // instead of asking the host a second time.
        const waiting = room.pending.find(r => r.id === playerId)
        if (waiting) { queued = waiting; return room }
        throw new Error("AUTHZ_MISMATCH")
      }

      const collision = room.players.find(p => p.name.toLowerCase() === name.toLowerCase())
      if (collision) throw new Error("NAME_TAKEN")
      // A name already waiting in the queue is just as taken as one in a seat.
      if (room.pending.some(r => r.name.toLowerCase() === name.toLowerCase())) throw new Error("NAME_TAKEN")

      // Whoever asks second for the same face is told now, not after they have
      // sat down or waited for the host.
      // Once every avatar is claimed, faces are shared rather than the door
      // closing: a big table must never be turned away for want of pictures.
      if (character) {
        const taken = takenCharacters(room)
        const cast = deps.selectableCharacters?.() ?? CHARACTERS.map(c => c.id)
        if (taken.includes(character) && cast.some(id => !taken.includes(id))) throw new Error("CHARACTER_TAKEN")
      }

      if (room.requireApproval) {
        const request: PendingJoin = { id: makeSecret(), name, requestedAt: Date.now(), character: character ?? "", accessory: characterAccessory(character ?? "", accessory) }
        queued = request
        return { ...room, pending: [...room.pending, request] }
      }

      const fresh: Player = { id: makeSecret(), name, role: roleFor(null), connected: true, character: character ?? "", accessory: characterAccessory(character ?? "", accessory) }
      bound = fresh
      return { ...room, players: [...room.players, fresh] }
    })

    if (queued) {
      const request: PendingJoin = queued
      const game = deps.resolveGame(updated.gameId)!
      await bindIdentity(socket, deps, code, request.id, true)
      // A private room of its own, so approve/reject reaches exactly this
      // person without ever putting them inside `room:` first.
      const adminProjection = projectRoomFor(updated, { kind: "admin", adminSecret: updated.adminSecret }, deps.resolveGame)
      deps.io.to(`admin:${code}`).emit("admin:room-updated", adminProjection)
      logger.info({ code, requestId: request.id }, "join requested")
      return { status: "pending" as const, requestId: request.id, code, theme: game.theme, resumeToken: playerResumeToken(resumeKey(updated), request.id) }
    }

    if (!bound) throw new Error("INVALID_INPUT")
    const me: Player = bound

    await bindIdentity(socket, deps, code, me.id)

    const game = deps.resolveGame(updated.gameId)!
    const roleData = resolveRoleData(game, updated, me.role)

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

    // Walked back into a game that is already running: put them straight back
    // into the live phase instead of the lobby they left.
    if (updated.phase !== IDLE_PHASE) {
      void sendPhaseTo(engineDeps(deps), code, me.id)
    }

    const myProjection = projectRoomFor(updated, { kind: "player", playerId: me.id }, deps.resolveGame)
    return {
      status: "joined" as const, room: myProjection, resumeToken: playerResumeToken(resumeKey(updated), me.id),
      player: { id: me.id, name: me.name, role: me.role, roleData, character: me.character, accessory: me.accessory ?? "" }
    }
  })

  bind(socket, "player:cancel-request", CancelRequestPayload, async ({ code, requestId }) => {
    // Only the socket holding the request may withdraw it.
    if (socket.data.pendingRequestId !== requestId || socket.data.roomCode !== code) throw new Error("AUTHZ_MISMATCH")
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
    if (code && pendingRequestId && !deps.io.sockets.adapter.rooms.get(`pending:${code}:${pendingRequestId}`)?.size) {
      try {
        const updated = await deps.store.update(code, room => ({
          ...room, pending: room.pending.filter(r => r.id !== pendingRequestId)
        }))
        const adminProjection = projectRoomFor(updated, { kind: "admin", adminSecret: updated.adminSecret }, deps.resolveGame)
        deps.io.to(`admin:${code}`).emit("admin:room-updated", adminProjection)
      } catch { /* room may have been deleted; ignore */ }
    }

    if (!code || !playerId) return
    if (deps.io.sockets.adapter.rooms.get(`p:${code}:${playerId}`)?.size) return
    try {
      const updated = await deps.store.update(code, room => ({
        ...room,
        players: room.players.map(p => p.id === playerId ? { ...p, connected: false } : p)
      }))
      const adminProjection = projectRoomFor(updated, { kind: "admin", adminSecret: updated.adminSecret }, deps.resolveGame)
      deps.io.to(`admin:${code}`).emit("admin:room-updated", adminProjection)
      // The phase may have been waiting on the phone that just went dark.
      await onPlayerLeft(engineDeps(deps), code)
    } catch { /* room may have been deleted; ignore */ }
  })
}
