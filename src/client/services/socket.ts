import { io, type Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents, AckResult } from "@shared/events.js"

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export const socket: TypedSocket = io({ reconnection: true, reconnectionAttempts: Infinity })

export function emit<E extends keyof ClientToServerEvents>(
  event: E,
  payload: Parameters<ClientToServerEvents[E]>[0]
): Promise<AckResult<unknown>> {
  return new Promise(resolve => {
    type EmitFn = (e: string, p: unknown, cb: (r: AckResult<unknown>) => void) => void
    const emitAny = (socket.emit as unknown as EmitFn).bind(socket)
    emitAny(event as string, payload, r => resolve(r))
  })
}
