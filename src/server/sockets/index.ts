import type { Server, Socket } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@shared/events.js"
import type { SocketData } from "@shared/types.js"
import { registerAdminHandlers, type AdminDeps } from "./admin-handlers.js"
import { registerPlayerHandlers, type PlayerDeps } from "./player-handlers.js"

export type SocketDeps = AdminDeps & PlayerDeps

export function registerHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>,
  deps: SocketDeps
): void {
  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>) => {
    registerAdminHandlers(socket, deps)
    registerPlayerHandlers(socket, deps)
  })
}
