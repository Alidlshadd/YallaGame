import { io, type Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents, AckResult, PhaseEvent } from "@shared/events.js"

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export const socket: TypedSocket = io({ reconnection: true, reconnectionAttempts: Infinity })

/**
 * The last phase the server sent, held from the moment this module loads.
 *
 * A player walking back into a running game is told the phase as part of
 * joining, which happens while the room view is still being fetched — so the
 * screen that wants it is not listening yet. Keeping the last one here means
 * it is waiting when the screen mounts instead of lost.
 */
let latestPhase: PhaseEvent | null = null
socket.on("game:phase", payload => { latestPhase = payload })

/** Only ever trusted for the room the caller is actually sitting in. */
export function lastPhase(code: string): PhaseEvent | null {
  return latestPhase !== null && latestPhase.code === code ? latestPhase : null
}

// A dead WebSocket can otherwise look connected until the heartbeat expires.
// Release it when the browser goes offline and reconnect as soon as it is back.
if (typeof window !== "undefined") {
  window.addEventListener("offline", () => socket.disconnect())
  window.addEventListener("online", () => socket.connect())
}

export function emit<E extends keyof ClientToServerEvents>(
  event: E,
  payload: Parameters<ClientToServerEvents[E]>[0]
): Promise<AckResult<unknown>> {
  return new Promise(resolve => {
    type EmitFn = (e: string, p: unknown, cb: (err: Error | null, r: AckResult<unknown>) => void) => void
    // Socket.IO also removes timed-out packets from its offline send buffer,
    // so reconnecting cannot unexpectedly submit an expired room request.
    const emitAny = (socket.timeout(10_000).emit as unknown as EmitFn).bind(socket)
    emitAny(event as string, payload, (err, r) => resolve(err ? { ok: false, error: "REQUEST_TIMEOUT" } : r))
  })
}
