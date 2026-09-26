import helmet from "helmet"
import type { ErrorRequestHandler, RequestHandler } from "express"
import { AddressLimits } from "../sockets/security.js"

export function securityHeaders(production: boolean, origin?: string): RequestHandler[] {
  const https = production && origin?.startsWith("https://") === true
  const connections = origin
    ? ["'self'", origin, origin.replace(/^http/, "ws")]
    : ["'self'", "ws:", "wss:"] // LAN/dev have no fixed host; public prod requires one.
  return [helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        imgSrc: ["'self'", "data:", "blob:"],
        mediaSrc: ["'self'"],
        connectSrc: connections,
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        frameAncestors: ["'none'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: https ? [] : null
      }
    },
    referrerPolicy: { policy: "no-referrer" },
    // Do not pin HTTP development or loopback test origins to HTTPS.
    hsts: https ? { maxAge: 31536000, includeSubDomains: false } : false
  }), (_req, res, next) => {
    res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), screen-wake-lock=(self)")
    next()
  }]
}

export function publicApiLimit(): RequestHandler {
  const limits = new AddressLimits()
  return (req, res, next) => {
    if (!limits.consume(req.ip ?? req.socket.remoteAddress ?? "unknown", 600, 60_000)) {
      res.set({ "Retry-After": "60", "Cache-Control": "no-store" }).status(429).json({ error: "Too many requests" })
      return
    }
    next()
  }
}

/** Keep filesystem paths, SQL errors and stack traces off every HTTP response. */
export const safeHttpError: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) { next(error); return }
  const candidate = error as { status?: number }
  const status = [400, 403, 404, 413, 415, 429].includes(candidate?.status ?? 0) ? candidate.status! : 500
  res.set("Cache-Control", "no-store").status(status).json({ error: status === 500 ? "Service temporarily unavailable" : "Invalid request" })
}
