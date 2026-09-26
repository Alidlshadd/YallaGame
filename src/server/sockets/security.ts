import type { IncomingMessage } from "node:http"

/** CORS does not restrict WebSocket upgrades; validate the handshake itself. */
export function allowedSocketOrigin(req: IncomingMessage, allowedOrigin?: string): boolean {
  const origin = req.headers.origin
  if (origin === undefined) return req.headers["sec-fetch-site"] !== "cross-site"
  if (allowedOrigin) return origin === allowedOrigin
  try {
    const parsed = new URL(origin)
    return ["http:", "https:"].includes(parsed.protocol) && parsed.origin === origin && parsed.host === req.headers.host
  } catch { return false }
}

/** Fixed, bounded windows shared across sockets: reconnecting does not reset limits. */
export class AddressLimits {
  private readonly windows = new Map<string, { count: number; expires: number }>()
  constructor(private readonly maxKeys = 20_000) {}

  consume(key: string, limit: number, duration: number, now = Date.now()): boolean {
    let entry = this.windows.get(key)
    if (entry && entry.expires <= now) {
      this.windows.delete(key)
      entry = undefined
    }
    if (!entry) {
      if (this.windows.size >= this.maxKeys) {
        for (const [oldKey, old] of this.windows) if (old.expires <= now) this.windows.delete(oldKey)
        if (this.windows.size >= this.maxKeys) return false
      }
      entry = { count: 0, expires: now + duration }
      this.windows.set(key, entry)
    }
    if (entry.count >= limit) return false
    entry.count++
    return true
  }
}
