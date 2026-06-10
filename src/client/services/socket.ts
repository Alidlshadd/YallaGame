import { io, type Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents, AckResult } from "@shared/events.js"

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export const socket: TypedSocket = io({ reconnection: true, reconnectionAttempts: Infinity })

export function emit<E extends keyof ClientToServerEvents>(
  event: E,
  payload: Parameters<ClientToServerEvents[E]>[0]
): Promise<AckResult<unknown>> {
  return new Promise(resolve => {
    const emitAny = socket.emit as unknown as (
      e: string,
      p: unknown,
      cb: (r: AckResult<unknown>) => void
    ) => void
    emitAny(event as string, payload, r => resolve(r))
  })
}
