import { afterEach, describe, expect, it } from "vitest"
import express from "express"
import { createServer, type Server } from "node:http"
import { publicApiLimit, safeHttpError, securityHeaders } from "../../../src/server/security/http.js"

describe("HTTP security policy", () => {
  let server: Server | undefined
  afterEach(async () => {
    server?.closeAllConnections()
    if (server) await new Promise<void>(resolve => server!.close(() => resolve()))
  })
  async function start(production = true, origin = "https://games.example.com") {
    const app = express()
    app.use(securityHeaders(production, origin))
    app.get("/", (_req, res) => res.send("OK"))
    app.get("/files/:id", () => { throw new Error("SQLITE_ERROR secret.db SELECT password_hash") })
    app.use("/api", publicApiLimit(), (_req, res) => res.json({ ok: true }))
    app.use(safeHttpError)
    server = createServer(app)
    await new Promise<void>(resolve => server!.listen(0, "127.0.0.1", resolve))
    return `http://127.0.0.1:${(server.address() as { port: number }).port}`
  }
  it("restricts scripts, frames, WebSocket destinations and browser permissions", async () => {
    const response = await fetch(await start())
    const csp = response.headers.get("content-security-policy")!
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("script-src-attr 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("connect-src 'self' https://games.example.com wss://games.example.com")
    expect(csp).toContain("upgrade-insecure-requests")
    expect(response.headers.get("strict-transport-security")).toBe("max-age=31536000")
    expect(response.headers.get("x-content-type-options")).toBe("nosniff")
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN")
    expect(response.headers.get("referrer-policy")).toBe("no-referrer")
    expect(response.headers.get("permissions-policy")).toContain("camera=()")
    expect(response.headers.get("permissions-policy")).toContain("screen-wake-lock=(self)")
    expect(response.headers.has("x-powered-by")).toBe(false)
  })
  it("does not force HTTPS on a local HTTP origin", async () => {
    const response = await fetch(await start(true, "http://localhost:3000"))
    expect(response.headers.has("strict-transport-security")).toBe(false)
    expect(response.headers.get("content-security-policy")).not.toContain("upgrade-insecure-requests")
  })
  it("hides internal errors and handles malformed encoded paths", async () => {
    const base = await start()
    const error = await fetch(base + "/files/missing")
    expect(error.status).toBe(500)
    expect(await error.text()).not.toMatch(/SQLITE|secret.db|password_hash|stack/)
    expect(error.headers.get("cache-control")).toBe("no-store")
    const malformed = await fetch(base + "/files/%E0%A4%A")
    expect(malformed.status).toBe(400)
    expect(await malformed.text()).not.toMatch(/URIError|decode_param|node_modules/)
  })
  it("limits public API requests even when the URL and forged forwarding header change", async () => {
    const base = await start()
    for (let i = 0; i < 600; i++) {
      const response = await fetch(`${base}/api/games?q=${i}`, { headers: { "X-Forwarded-For": `192.0.2.${i % 255}` } })
      expect(response.status).toBe(200)
      await response.arrayBuffer()
    }
    const response = await fetch(base + "/api/public-config")
    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("60")
  })
})
