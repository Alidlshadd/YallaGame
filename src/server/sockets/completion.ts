import type { Server } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "../../shared/events.js"
import type { Room, SocketData } from "../../shared/types.js"
import { playingPlayers } from "../../shared/room-players.js"

export function emitGameFinished(
  io: Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>, room: Room
): void {
  for (const player of playingPlayers(room)) {
    if (player.connected) io.to(`p:${room.code}:${player.id}`).emit("game:finished", { code: room.code, gameId: room.gameId })
  }
}
