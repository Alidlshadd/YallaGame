import type { Socket } from "socket.io"
import type { z } from "zod"
import type { ClientToServerEvents, ServerToClientEvents, AckResult } from "@shared/events.js"
import type { ErrorCode, SocketData } from "@shared/types.js"
import { checkRateLimit } from "./rate-limit.js"
import { logger } from "../logger.js"

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>

const ERROR_CODES = new Set<ErrorCode>([
  "INVALID_ADMIN","ROOM_NOT_FOUND","NAME_REQUIRED","NAME_TAKEN",
  "NEED_MORE_PLAYERS","TOO_MANY_SPECIAL_ROLES","INVALID_INPUT","RATE_LIMITED",
  "SERVER_BUSY","AUTHZ_MISMATCH","NO_FILLER_ROLE","UNKNOWN_GAME",
  "REQUEST_NOT_FOUND","JOIN_REJECTED","ROOM_FULL","CHARACTER_TAKEN",
  "UNKNOWN_CHARACTER","PHASE_STALE","GAME_NOT_RUNNING"
])

function toErrorCode(err: unknown): ErrorCode {
  if (err instanceof Error && ERROR_CODES.has(err.message as ErrorCode)) return err.message as ErrorCode
  if (err instanceof Error && err.message.startsWith("ROOM_NOT_FOUND")) return "ROOM_NOT_FOUND"
  logger.error({ err }, "handler threw an unrecognized error")
  return "INVALID_INPUT"
}

export function bind<E extends keyof ClientToServerEvents, Payload, Data>(
  socket: TypedSocket,
  event: E,
  schema: z.ZodType<Payload>,
  handler: (data: Payload, socket: TypedSocket) => Promise<Data>
): void {
  const socketAny = socket as unknown as {
    on: (
      e: string,
      cb: (payload: unknown, ack: (r: AckResult<Data>) => void) => void
    ) => void
  }
  socketAny.on(event as string, async (payload, ack) => {
    if (typeof ack !== "function") return
    if (!checkRateLimit(socket, event as string)) return ack({ ok: false, error: "RATE_LIMITED" })
    const parsed = schema.safeParse(payload)
    if (!parsed.success) return ack({ ok: false, error: "INVALID_INPUT" })
    try {
      const data = await handler(parsed.data, socket)
      ack({ ok: true, data })
    } catch (err) {
      ack({ ok: false, error: toErrorCode(err) })
    }
  })
}
