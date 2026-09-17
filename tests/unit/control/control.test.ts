import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import express from "express"
import { createServer, type Server } from "node:http"
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import sharp from "sharp"
import type Database from "better-sqlite3"
import { ADMIN_SCHEMA, openControlDatabase } from "../../../src/server/control/database.js"
import { hash, hashPassword, verifyPassword, createAuth } from "../../../src/server/control/auth.js"
import { Analytics, ObservedStore } from "../../../src/server/control/analytics.js"
import {
  brandedHtml,
  cleanupUploads,
  effectiveCatalog,
  persistentUploads,
  publicConfiguration,
  saveUpload,
  validateImage
} from "../../../src/server/control/content.js"
import { mountControl } from "../../../src/server/control/routes.js"
import { MemoryStore } from "../../../src/server/store/memory-store.js"
import type { Room } from "../../../src/shared/types.js"

let passwordHash: string
beforeAll(async () => {
  passwordHash = await hashPassword("testing-only-long-password")
})
describe("Control center security and persistence", () => {
  let db: Database.Database, server: Server, base: string, directory: string, analytics: Analytics
  let cookie = "",
    csrf = ""
  beforeEach(async () => {
    db = openControlDatabase(":memory:", true)
    analytics = new Analytics(db)
    db.prepare("INSERT INTO admin_users VALUES(1,'operator',?,1,1,1)").run(passwordHash)
    directory = await mkdtemp(path.join(tmpdir(), "yalla-control-test-"))
    await writeFile(path.join(directory, "control.html"), "<h1>Control Center</h1>")
    const app = express()
    mountControl(app, {
      db,
      analytics,
      secure: false,
      uploads: directory,
      clientDir: directory,
      version: "test"
    })
    server = createServer(app)
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve))
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}`
    cookie = ""
    csrf = ""
  })
  afterEach(async () => {
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
    db.close()
    expect(path.dirname(directory)).toBe(path.resolve(tmpdir()))
    await rm(directory, { recursive: true, force: true })
  })
  async function login(password = "testing-only-long-password") {
    const pre = await fetch(base + "/api/auth/csrf")
    csrf = ((await pre.json()) as { csrf: string }).csrf
    const preCookie = pre.headers.get("set-cookie")!.split(";")[0]!
    const result = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: { Origin: base, Cookie: preCookie, "Content-Type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify({ username: "operator", password })
    })
    if (result.ok) {
      cookie = result.headers.get("set-cookie")!.split(";")[0]!
      csrf = ((await result.clone().json()) as { csrf: string }).csrf
    }
    return result
  }
  function request(url: string, method = "GET", body?: unknown, token = csrf) {
    return fetch(base + url, {
      method,
      redirect: "manual",
      headers: { Origin: base, Cookie: cookie, "x-csrf-token": token, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    })
  }
  it("denies every admin API and redirects all private pages without a session", async () => {
    for (const endpoint of [
      "/session",
      "/dashboard",
      "/games",
      "/history",
      "/players",
      "/branding",
      "/system",
      "/audit-logs",
      "/unknown"
    ]) {
      expect((await request("/api/admin" + endpoint)).status).toBe(401)
    }
    for (const endpoint of [
      "/admin",
      "/admin/analytics",
      "/admin/games/history",
      "/admin/players",
      "/admin/games",
      "/admin/settings/branding",
      "/admin/settings/system",
      "/admin/audit-logs",
      "/admin/logout"
    ]) {
      const response = await request(endpoint)
      expect(response.status).toBe(303)
      expect(response.headers.get("location")).toBe("/admin/login")
    }
  })
  it("hashes passwords and rejects a wrong password", async () => {
    expect(passwordHash).not.toContain("testing-only-long-password")
    expect(await verifyPassword("wrong", passwordHash)).toBe(false)
    expect(await verifyPassword("testing-only-long-password", passwordHash)).toBe(true)
  })
  it("stores hashed sessions, enforces CSRF, logs out and invalidates the token", async () => {
    const response = await login()
    expect(response.status).toBe(200)
    expect(response.headers.get("set-cookie")).toContain("HttpOnly")
    expect(response.headers.get("set-cookie")).toContain("SameSite=Strict")
    const session = db.prepare("SELECT * FROM admin_sessions").get() as {
      token_hash: string
      csrf_hash: string
    }
    expect(session.token_hash).toBe(hash(cookie.split("=")[1]!))
    expect(session.csrf_hash).toBe(hash(csrf))
    expect((await request("/admin")).status).toBe(200)
    expect((await request("/api/admin/logout", "POST", {}, "")).status).toBe(403)
    expect((await request("/api/admin/logout", "POST")).status).toBe(200)
    expect((await request("/api/admin/system")).status).toBe(401)
    const logs = db.prepare("SELECT action,metadata FROM admin_audit_logs").all()
    expect(JSON.stringify(logs)).not.toContain(csrf)
    expect(logs).toHaveLength(2)
  })
  it("enforces absolute and idle expiry, disabled accounts and cross-origin mutations", async () => {
    await login()
    const cross = await fetch(base + "/api/admin/logout", {
      method: "POST",
      headers: { Cookie: cookie, Origin: "https://attacker.invalid", "x-csrf-token": csrf }
    })
    expect(cross.status).toBe(403)
    db.prepare("UPDATE admin_sessions SET last_seen=0").run()
    expect((await request("/api/admin/system")).status).toBe(401)
    await login()
    db.prepare("UPDATE admin_sessions SET expires_at=0").run()
    expect((await request("/api/admin/system")).status).toBe(401)
    await login()
    db.prepare("UPDATE admin_users SET enabled=0").run()
    expect((await request("/api/admin/system")).status).toBe(401)
  })
  it("requires pre-auth CSRF and rate limits repeated failed logins", async () => {
    expect(
      (await request("/api/auth/login", "POST", { username: "operator", password: "wrong" })).status
    ).toBe(403)
    for (let i = 0; i < 8; i++) expect((await login("wrong")).status).toBe(401)
    expect((await login("wrong")).status).toBe(429)
    expect(db.prepare("SELECT count(*) n FROM admin_audit_logs WHERE action='login_failed'").get()).toEqual({
      n: 9
    })
    expect(JSON.stringify(db.prepare("SELECT * FROM admin_login_limits").all())).not.toContain("127.0.0.1")
  }, 15000)
  it("uses Secure production session cookies", async () => {
    const auth = createAuth(db, true)
    let name = "",
      settings: Record<string, unknown> = {}
    auth.issue(
      {
        cookie: (n: string, _v: string, s: Record<string, unknown>) => {
          name = n
          settings = s
        }
      } as unknown as express.Response,
      1
    )
    expect(name).toBe("__Host-yalla-admin")
    expect(settings.secure).toBe(true)
    expect(settings.path).toBe("/")
  })
  it("records anonymous unique visitors once but counts repeat page views", async () => {
    const first = await request("/api/analytics", "POST", { view: "homeView" })
    expect(first.status).toBe(204)
    cookie = first.headers.get("set-cookie")!.split(";")[0]!
    expect((await request("/api/analytics", "POST", { view: "gameInfoView" })).status).toBe(204)
    expect(db.prepare("SELECT count(*) n FROM analytics_visitors").get()).toEqual({ n: 1 })
    expect(db.prepare("SELECT count(*) n FROM analytics_events WHERE event='page_view'").get()).toEqual({
      n: 2
    })
    expect(JSON.stringify(db.prepare("SELECT * FROM analytics_events").all())).not.toContain("127.0.0.1")
    expect(JSON.stringify(db.prepare("SELECT * FROM analytics_visitors").all())).not.toContain(
      cookie.split("=")[1]
    )
  })
  it("migrates idempotently, preserving existing room data", () => {
    db.exec("CREATE TABLE rooms(code TEXT); INSERT INTO rooms VALUES('ABCDE')")
    db.exec(ADMIN_SCHEMA)
    db.exec(ADMIN_SCHEMA)
    expect(db.prepare("SELECT * FROM rooms").all()).toEqual([{ code: "ABCDE" }])
    expect(db.pragma("foreign_key_check")).toEqual([])
  })
  it("rejects forged, scripted, oversized and excessive-dimension images; reencodes safe images", async () => {
    await expect(validateImage(Buffer.from("<svg><script>alert(1)</script></svg>"))).rejects.toThrow()
    await expect(validateImage(Buffer.from("not a png"))).rejects.toThrow()
    await expect(validateImage(Buffer.alloc(5 * 1024 * 1024 + 1))).rejects.toThrow()
    const huge = await sharp({ create: { width: 4097, height: 1, channels: 3, background: "red" } })
      .png()
      .toBuffer()
    await expect(validateImage(huge)).rejects.toThrow()
    const png = await sharp({ create: { width: 40, height: 30, channels: 3, background: "red" } })
      .png()
      .toBuffer()
    const result = await validateImage(png)
    expect((await sharp(result.data).metadata()).format).toBe("webp")
    await login()
    const send = (body: Buffer) =>
      fetch(base + "/api/admin/uploads", {
        method: "POST",
        headers: { Origin: base, Cookie: cookie, "x-csrf-token": csrf, "Content-Type": "image/png" },
        body: new Uint8Array(body)
      })
    expect((await send(Buffer.from("fake"))).status).toBe(400)
    expect((await send(Buffer.alloc(5 * 1024 * 1024 + 1))).status).toBe(413)
    const uploaded = await send(png)
    expect(uploaded.status).toBe(201)
    const asset = (await uploaded.json()) as { id: string; url: string }
    expect(asset.id).toMatch(/^[a-f0-9]{64}\.webp$/)
    expect((await readFile(path.join(directory, asset.id))).length).toBeGreaterThan(0)
    expect((await request("/uploads/..%2Fprivate.db")).status).toBe(404)
  })
  it("applies and resets overrides, validates uploads, hides private settings and delays cleanup", async () => {
    expect(publicConfiguration(db).branding).toEqual({})
    expect(effectiveCatalog(db).length).toBeGreaterThan(0)
    expect(() => persistentUploads("dist/client/uploads")).toThrow()
    const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: "red" } })
      .png()
      .toBuffer()
    const id = await saveUpload(db, directory, png, 1)
    await login()
    const assets = { cover: id, detail: null, cta: null, section: null }
    expect(
      (await request("/api/admin/games/spy-game", "PUT", { enabled: false, order: 2, assets })).status
    ).toBe(200)
    expect(effectiveCatalog(db).some(g => g.id === "spy-game")).toBe(false)
    expect(
      (
        await request("/api/admin/games/spy-game", "PUT", {
          enabled: true,
          order: 2,
          assets: { ...assets, cover: "../bad" }
        })
      ).status
    ).toBe(400)
    expect(
      (
        await request("/api/admin/branding", "PUT", {
          siteName: "My site",
          description: "",
          footer: "",
          logo: id,
          darkLogo: null,
          favicon: null,
          ogImage: null
        })
      ).status
    ).toBe(200)
    expect(publicConfiguration(db).branding.logo).toBe(`/uploads/${id}`)
    expect(publicConfiguration(db).branding["internal:rateSalt"]).toBeUndefined()
    await cleanupUploads(db, directory, false)
    expect(db.prepare("SELECT retired_at FROM admin_uploads WHERE id=?").get(id)).toEqual({
      retired_at: null
    })
    db.prepare("DELETE FROM game_asset_overrides").run()
    db.prepare("DELETE FROM site_settings WHERE key='logo'").run()
    await cleanupUploads(db, directory, false)
    expect(await cleanupUploads(db, directory, true)).toEqual([])
    db.prepare("UPDATE admin_uploads SET retired_at=?").run(Date.now() - 8 * 86400_000)
    expect(await cleanupUploads(db, directory, false)).toEqual([id])
    await expect(readFile(path.join(directory, id))).rejects.toThrow()
  })
  it("tracks joins, starts, completions and abandoned games without leaking game secrets", async () => {
    const store = new ObservedStore(new MemoryStore(), analytics),
      now = Date.now()
    const room: Room = {
      code: "ABCDE",
      gameId: "spy-game",
      adminSecret: "do-not-log",
      assigned: false,
      settings: {},
      players: [{ id: "private-player-token", name: "Host", role: null, connected: true, character: "owl" }],
      createdAt: now,
      updatedAt: now,
      hostPlayerId: "private-player-token",
      isPublic: false,
      requireApproval: false,
      pending: [],
      phase: "idle",
      phaseSeq: 0,
      phaseEndsAt: null,
      round: 0,
      gameState: {},
      scores: {}
    }
    await store.create(room)
    await store.update(room.code, r => ({
      ...r,
      players: [...r.players, { id: "p2", name: "Guest", role: null, connected: true, character: "fox" }]
    }))
    await store.update(room.code, r => ({ ...r, phase: "PLAY" }))
    await store.update(room.code, r => ({ ...r, phase: "GAME_OVER" }))
    await store.update(room.code, r => ({ ...r, phase: "GAME_OVER" }))
    await store.update(room.code, r => ({ ...r, phase: "idle" }))
    await store.update(room.code, r => ({ ...r, assigned: true }))
    await store.delete(room.code)
    const rows = db.prepare("SELECT status FROM game_sessions ORDER BY id").all()
    expect(rows).toEqual([{ status: "completed" }, { status: "abandoned" }])
    expect(db.prepare("SELECT count(*) n FROM analytics_events WHERE event='game_completed'").get()).toEqual({
      n: 1
    })
    const serialized = JSON.stringify(db.prepare("SELECT * FROM analytics_events").all())
    expect(serialized).not.toContain("do-not-log")
    expect(serialized).not.toContain("private-player-token")
    const stats = analytics.dashboard(7)
    expect(stats.popularity).toEqual([{ game_id: "spy-game", count: 2 }])
    await login()
    expect(
      ((await (await request("/api/admin/history?q=Guest&game=spy-game&page=1")).json()) as { total: number })
        .total
    ).toBe(2)
  })
  it("analytics database failures do not prevent room writes", async () => {
    const store = new ObservedStore(new MemoryStore(), analytics)
    db.exec("DROP TABLE analytics_events")
    const room = { code: "ABCDE", gameId: "spy-game", players: [], createdAt: Date.now() } as unknown as Room
    await expect(store.create(room)).resolves.toBeUndefined()
    expect(await store.get("ABCDE")).toBeTruthy()
  })
  it("escapes branding in server-rendered metadata and preserves defaults", () => {
    const shell =
      '<head><title>Yalla Game</title><meta name="description" content="Original"><link rel="icon" href="/default.png"></head>'
    expect(brandedHtml(shell, {})).toContain("<title>Yalla Game</title>")
    const result = brandedHtml(
      shell,
      { siteName: "<script>test</script>", description: '" onload="attack', ogImage: "/uploads/safe.webp" },
      "https://example.test"
    )
    expect(result).not.toContain("<script>")
    expect(result).toContain("&lt;script&gt;")
    expect(result).toContain("https://example.test/uploads/safe.webp")
  })
  it("retention removes expired analytics and preserves current records", () => {
    analytics.pageView("old-visitor", "homeView")
    db.prepare("UPDATE analytics_visitors SET first_seen=1,last_seen=1").run()
    db.prepare("UPDATE analytics_events SET created_at=1").run()
    analytics.pageView("new-visitor", "homeView")
    analytics.retain(30)
    expect(db.prepare("SELECT id FROM analytics_visitors").all()).toEqual([{ id: "new-visitor" }])
    expect(db.prepare("SELECT COUNT(*) n FROM analytics_events").get()).toEqual({ n: 1 })
  })
  it("session CSRF tokens remain stable across multiple tabs", async () => {
    await login()
    expect(((await (await request("/api/admin/session")).json()) as { csrf: string }).csrf).toBe(csrf)
    expect(((await (await request("/api/admin/session")).json()) as { csrf: string }).csrf).toBe(csrf)
    expect((await request("/api/admin/logout", "POST")).status).toBe(200)
  })
})
