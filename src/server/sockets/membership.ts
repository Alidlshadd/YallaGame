import type { Socket } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "../../shared/events.js"
import type { SocketData } from "../../shared/types.js"
import type { PlayerDeps } from "./player-handlers.js"
import { projectRoomFor } from "../domain/visibility.js"
import { onPlayerLeft } from "../domain/engine.js"
import { engineDeps } from "./game-handlers.js"

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>

export async function revokeRoomSubscriptions(deps: PlayerDeps, code: string): Promise<void> {
  for (const peer of deps.io.sockets.sockets.values()) {
    for (const channel of peer.rooms) {
      if (channel === `room:${code}` || channel === `admin:${code}` || channel.startsWith(`p:${code}:`) || channel.startsWith(`pending:${code}:`)) await peer.leave(channel)
    }
    if (peer.data.roomCode === code) {
      delete peer.data.roomCode
      delete peer.data.playerId
      delete peer.data.adminSecret
      delete peer.data.pendingRequestId
    }
  }
}

/** A connection may subscribe to only its current identity, never abandoned seats. */
export async function bindIdentity(socket: TypedSocket, deps: PlayerDeps, code: string, playerId: string, pending = false): Promise<void> {
  const oldCode = socket.data.roomCode
  const oldId = socket.data.playerId
  const oldPending = socket.data.pendingRequestId
  for (const room of socket.rooms) if (room !== socket.id) await socket.leave(room)
  delete socket.data.adminSecret
  delete socket.data.pendingRequestId
  socket.data.roomCode = code
  socket.data.playerId = playerId
  if (pending) {
    socket.data.pendingRequestId = playerId
    await socket.join(`pending:${code}:${playerId}`)
  } else {
    await socket.join([`room:${code}`, `p:${code}:${playerId}`])
  }
  if (oldCode && (oldCode !== code || oldId !== playerId) && await deps.store.get(oldCode)) {
    const hasOther = oldId && (deps.io.sockets.adapter.rooms.get(`p:${oldCode}:${oldId}`)?.size ?? 0) > 0
    const hasPending = oldPending && (deps.io.sockets.adapter.rooms.get(`pending:${oldCode}:${oldPending}`)?.size ?? 0) > 0
    const updated = await deps.store.update(oldCode, room => ({
      ...room,
      players: room.players.map(p => p.id === oldId && !hasOther ? { ...p, connected: false } : p),
      pending: room.pending.filter(p => p.id !== oldPending || hasPending)
    }))
    deps.io.to(`admin:${oldCode}`).emit("admin:room-updated", projectRoomFor(updated, { kind: "admin", adminSecret: updated.adminSecret }, deps.resolveGame))
    await onPlayerLeft(engineDeps(deps), oldCode)
  }
}
