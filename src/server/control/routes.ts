import express from "express"
import type { Express, Request, RequestHandler, Response } from "express"
import type Database from "better-sqlite3"
import { z } from "zod"
import { statfs } from "node:fs/promises"
import { readFileSync } from "node:fs"
import path from "node:path"
import { createAuth, consumeLimit, cookies, hash, token, verifyPassword, type AdminSession } from "./auth.js"
import { audit } from "./database.js"
import { Analytics } from "./analytics.js"
import {
  assertAsset,
  assetSlots,
  brandAssets,
  brandTexts,
  publicConfiguration,
  saveUpload,
  uploadId,
  MAX_UPLOAD
} from "./content.js"
import { GAME_CATALOG, resolveGame } from "../games/catalog.js"

const wrap =
  (handler: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    void handler(req, res).catch(next)
  }
const idSchema = z.string().regex(uploadId).nullable()
export function mountControl(
  app: Express,
  options: {
    db: Database.Database
    analytics: Analytics
    secure: boolean
    origin?: string
    uploads: string
    clientDir: string
    version: string
  }
) {
  const { db, analytics, secure, origin, uploads, clientDir, version } = options
  const auth = createAuth(db, secure, origin)
  let lastHealthCheck: number | null = null
  const health = (): boolean => {
    db.prepare("SELECT version FROM admin_schema ORDER BY version DESC LIMIT 1").get()
    lastHealthCheck = Date.now()
    return true
  }
  // Anonymous identifiers and rate-limit salt are persisted, never exposed via public config.
  db.prepare("INSERT OR IGNORE INTO site_settings VALUES('internal:rateSalt',?,?)").run(token(), Date.now())
  const salt = (
    db.prepare("SELECT value FROM site_settings WHERE key='internal:rateSalt'").get() as { value: string }
  ).value
  const limited = (req: Request, label: string, max: number, ms: number) =>
    consumeLimit(db, hash(`${salt}:${label}:${req.ip}`), max, ms)
  const noStore: RequestHandler = (_req, res, next) => {
    res.set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" })
    next()
  }
  app.use(["/admin", "/api/admin", "/api/auth"], noStore)
  app.get("/api/public-config", (_req, res) => {
    res.set("Cache-Control", "no-store").json(publicConfiguration(db))
  })
  app.get("/uploads/:id", (req, res) => {
    if (!uploadId.test(req.params.id!)) {
      res.sendStatus(404)
      return
    }
    res.set({ "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=31536000, immutable" })
    res.sendFile(path.join(uploads, req.params.id!))
  })
  app.post("/api/analytics", express.json({ limit: "1kb" }), (req, res) => {
    if (!auth.sameOrigin(req) || !limited(req, "analytics", 180, 60_000)) {
      res.sendStatus(429)
      return
    }
    const parsed = z
      .object({
        view: z.enum([
          "homeView",
          "gameInfoView",
          "joinView",
          "joinSetupView",
          "pendingView",
          "playerRoomView",
          "adminView",
          "localPlayView"
        ]),
        heartbeat: z.boolean().optional()
      })
      .safeParse(req.body)
    if (!parsed.success) {
      res.sendStatus(400)
      return
    }
    let visitor = cookies(req)["yalla-visitor"]
    if (!visitor || !/^[a-f0-9]{64}$/.test(visitor)) {
      visitor = token()
      res.cookie("yalla-visitor", visitor, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 365 * 86400_000
      })
    }
    if (parsed.data.heartbeat) analytics.heartbeat(hash(visitor))
    else analytics.pageView(hash(visitor), parsed.data.view)
    res.sendStatus(204)
  })
  // Login CSRF uses an expiring, HttpOnly pre-auth cookie and a matching header.
  app.get("/api/auth/csrf", (req, res) => {
    if (!limited(req, "csrf", 60, 60_000)) {
      res.sendStatus(429)
      return
    }
    const value = token()
    res.cookie("yalla-login-csrf", value, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/",
      maxAge: 600_000
    })
    res.json({ csrf: value })
  })
  let activeHashes = 0
  const dummy = `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`
  app.post(
    "/api/auth/login",
    express.json({ limit: "2kb" }),
    wrap(async (req, res) => {
      const candidate = z
        .object({ username: z.string().trim().min(1).max(64), password: z.string().min(1).max(128) })
        .safeParse(req.body)
      const csrf = cookies(req)["yalla-login-csrf"]
      if (
        !auth.sameOrigin(req) ||
        !csrf ||
        !/^[a-f0-9]{64}$/.test(csrf) ||
        hash(csrf) !== hash(req.get("x-csrf-token") ?? "")
      ) {
        res.status(403).json({ error: "CSRF verification failed" })
        return
      }
      const account = candidate.success ? candidate.data.username.toLowerCase() : "invalid"
      const ipAllowed = limited(req, "login", 10, 900_000)
      const accountAllowed = ipAllowed && consumeLimit(db, hash(`${salt}:account:${account}`), 8, 900_000)
      if (!ipAllowed || !accountAllowed || activeHashes >= 2) {
        audit(db, null, "login_failed", "authentication", { reason: "rate_limited" })
        res
          .set("Retry-After", "900")
          .status(429)
          .json({ error: "Too many attempts. Try again in 15 minutes." })
        return
      }
      if (!candidate.success) {
        audit(db, null, "login_failed", "authentication", { reason: "invalid_input" })
        res.status(400).json({ error: "Invalid credentials" })
        return
      }
      const row = db
        .prepare("SELECT id,password_hash,enabled FROM admin_users WHERE username=?")
        .get(account) as { id: number; password_hash: string; enabled: number } | undefined
      activeHashes++
      let valid = false
      try {
        valid = await verifyPassword(candidate.data.password, row?.password_hash ?? dummy)
      } finally {
        activeHashes--
      }
      if (!row || !valid || row.enabled !== 1) {
        audit(db, row?.id ?? null, "login_failed", "authentication", { reason: "invalid_credentials" })
        res.status(401).json({ error: "Invalid credentials" })
        return
      }
      // Password or enabled flag may change while asynchronous hashing is in flight.
      const current = db
        .prepare("SELECT 1 FROM admin_users WHERE id=? AND password_hash=? AND enabled=1")
        .get(row.id, row.password_hash)
      if (!current) {
        res.status(401).json({ error: "Invalid credentials" })
        return
      }
      let csrfToken = ""
      db.transaction(() => {
        const old = auth.session(req)
        if (old) db.prepare("DELETE FROM admin_sessions WHERE token_hash=?").run(old.token_hash)
        audit(db, row.id, "login", "session")
        csrfToken = auth.issue(res, row.id)
        db.prepare("DELETE FROM admin_login_limits WHERE key=?").run(hash(`${salt}:account:${account}`))
      })()
      res.clearCookie("yalla-login-csrf", { httpOnly: true, secure, sameSite: "strict", path: "/" })
      res.json({ csrf: csrfToken })
    })
  )
  const api = express.Router()
  app.use("/api/admin", api)
  api.use(auth.requireAdmin, auth.csrf)
  api.get("/session", (req, res) => {
    const admin = res.locals.admin as AdminSession
    const csrf = auth.csrfFor(req)
    res.json({ username: admin.username, csrf })
  })
  api.post("/logout", auth.logout)
  app.post("/admin/logout", auth.requireAdmin, auth.csrf, auth.logout)
  api.get("/dashboard", (req, res) => {
    const days = Number(req.query.days ?? 7)
    if (![0, 1, 7, 30, 90].includes(days)) {
      res.sendStatus(400)
      return
    }
    res.json(analytics.dashboard(days))
  })
  api.get(["/history", "/players", "/audit-logs"], (req, res) => {
    const parsed = z
      .object({
        page: z.coerce.number().int().min(1).max(100000).default(1),
        q: z.string().max(80).default(""),
        game: z.string().max(80).default(""),
        from: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        to: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
      })
      .safeParse(req.query)
    if (!parsed.success) {
      res.sendStatus(400)
      return
    }
    const { page, q, game, from, to } = parsed.data
    const start = from ? Date.parse(from) : 0,
      end = to ? Date.parse(to) + 86400_000 : Date.now() + 1
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
      res.sendStatus(400)
      return
    }
    const search = `%${q.replace(/[\\%_]/g, "\\$&")}%`
    let table: string, where: string, columns: string, order: string, args: (string | number)[]
    if (req.path === "/audit-logs") {
      table = "admin_audit_logs a LEFT JOIN admin_users u ON u.id=a.admin_id"
      columns = "a.id,u.username,a.action,a.target,a.created_at,a.metadata"
      order = "a.id DESC"
      where =
        "a.created_at>=? AND a.created_at<? AND (a.action LIKE ? ESCAPE '\\' OR a.target LIKE ? ESCAPE '\\')"
      args = [start, end, search, search]
    } else if (req.path === "/players") {
      table = "analytics_events"
      columns = "id,player_name,game_id,room_ref,created_at"
      order = "id DESC"
      where =
        "event='player_joined' AND created_at>=? AND created_at<? AND player_name LIKE ? ESCAPE '\\' AND (?='' OR game_id=?)"
      args = [start, end, search, game, game]
    } else {
      table = "game_sessions"
      columns = "id,game_id,room_ref,players,player_count,started_at,ended_at,status"
      order = "started_at DESC,id DESC"
      where =
        "started_at>=? AND started_at<? AND (players LIKE ? ESCAPE '\\' OR room_ref LIKE ? ESCAPE '\\') AND (?='' OR game_id=?)"
      args = [start, end, search, search, game, game]
    }
    const total = (db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE ${where}`).get(...args) as { n: number })
      .n
    res.json({
      page,
      pageSize: 25,
      total,
      rows: db
        .prepare(`SELECT ${columns} FROM ${table} WHERE ${where} ORDER BY ${order} LIMIT 25 OFFSET ?`)
        .all(...args, (page - 1) * 25)
    })
  })
  api.get("/games", (_req, res) => {
    res.json({ catalog: GAME_CATALOG, ...publicConfiguration(db) })
  })
  api.post(
    "/uploads",
    (req, res, next) => {
      if (!limited(req, "uploads", 20, 60_000)) {
        res.sendStatus(429)
        return
      }
      next()
    },
    express.raw({
      type: ["image/jpeg", "image/png", "image/webp", "application/octet-stream"],
      limit: MAX_UPLOAD
    }),
    wrap(async (req, res) => {
      if (!Buffer.isBuffer(req.body)) {
        res.status(400).json({ error: "Send JPEG, PNG or WebP image bytes" })
        return
      }
      try {
        const id = await saveUpload(db, uploads, req.body, (res.locals.admin as AdminSession).admin_id)
        res.status(201).json({ id, url: `/uploads/${id}` })
      } catch {
        res
          .status(400)
          .json({
            error: "Invalid image. Use static JPEG/PNG/WebP, at most 5 MiB, 4096 × 4096 and 16 megapixels."
          })
      }
    })
  )
  api.use(express.json({ limit: "16kb" }))
  api.put("/games/:id", (req, res) => {
    const id = req.params.id!
    const parsed = z
      .object({
        enabled: z.boolean(),
        order: z.number().int().min(-10000).max(10000),
        assets: z.object({ cover: idSchema, detail: idSchema, cta: idSchema, section: idSchema })
      })
      .strict()
      .safeParse(req.body)
    if (!resolveGame(id) || !parsed.success) {
      res.status(400).json({ error: "Invalid game settings" })
      return
    }
    const { enabled, order, assets } = parsed.data
    try {
      for (const slot of assetSlots) assertAsset(db, assets[slot])
    } catch {
      res.status(400).json({ error: "Unknown upload" })
      return
    }
    db.transaction(() => {
      for (const slot of assetSlots) assertAsset(db, assets[slot])
      const previous = db.prepare("SELECT * FROM game_asset_overrides WHERE game_id=?").get(id) as
        | Record<string, unknown>
        | undefined
      db.prepare(
        `INSERT INTO game_asset_overrides VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(game_id) DO UPDATE SET enabled=excluded.enabled,sort_order=excluded.sort_order,cover=excluded.cover,detail=excluded.detail,cta=excluded.cta,section=excluded.section,updated_at=excluded.updated_at`
      ).run(id, enabled ? 1 : 0, order, assets.cover, assets.detail, assets.cta, assets.section, Date.now())
      const admin = (res.locals.admin as AdminSession).admin_id
      if ((previous?.enabled ?? 1) !== Number(enabled))
        audit(db, admin, "game_status_changed", id, { enabled })
      for (const slot of assetSlots)
        if ((previous?.[slot] ?? null) !== assets[slot])
          audit(db, admin, "game_image_changed", id, { slot, asset: assets[slot] })
      audit(db, admin, "game_settings_changed", id, { order })
    })()
    res.json({ ok: true })
  })
  api.get("/branding", (_req, res) => {
    res.json(publicConfiguration(db).branding)
  })
  api.put("/branding", (req, res) => {
    const parsed = z
      .object({
        siteName: z.string().trim().max(80),
        description: z.string().trim().max(300),
        footer: z.string().trim().max(300),
        logo: idSchema,
        darkLogo: idSchema,
        favicon: idSchema,
        ogImage: idSchema
      })
      .strict()
      .safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid branding settings" })
      return
    }
    try {
      for (const key of brandAssets) assertAsset(db, parsed.data[key])
    } catch {
      res.status(400).json({ error: "Unknown upload" })
      return
    }
    db.transaction(() => {
      for (const key of brandAssets) assertAsset(db, parsed.data[key])
      for (const key of [...brandTexts, ...brandAssets]) {
        const value = parsed.data[key]
        if (!value) db.prepare("DELETE FROM site_settings WHERE key=?").run(key)
        else
          db.prepare(
            "INSERT INTO site_settings VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at"
          ).run(key, value, Date.now())
        audit(
          db,
          (res.locals.admin as AdminSession).admin_id,
          (brandAssets as readonly string[]).includes(key) ? "logo_changed" : "system_setting_changed",
          key
        )
      }
    })()
    res.json({ ok: true })
  })
  api.get(
    "/system",
    wrap(async (_req, res) => {
      const disk = await statfs(uploads).catch(() => null)
      let database = "ok"
      try {
        health()
      } catch {
        database = "unavailable"
      }
      res.json({
        version,
        node: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        database,
        lastHealthCheck,
        disk: disk ? { totalBytes: disk.blocks * disk.bsize, availableBytes: disk.bavail * disk.bsize } : null
      })
    })
  )
  api.use((_req, res) => {
    res.status(404).json({ error: "Unknown admin endpoint" })
  })
  const pages = [
    "/admin",
    "/admin/analytics",
    "/admin/games",
    "/admin/games/history",
    "/admin/players",
    "/admin/settings/branding",
    "/admin/settings/system",
    "/admin/audit-logs",
    "/admin/logout"
  ]
  const shell = (_req: Request, res: Response) => {
    const filename = path.join(clientDir, "control.html")
    res.type("html").send(readFileSync(filename, "utf8"))
  }
  app.get("/admin/login", shell)
  app.get(pages, (req, res) => {
    if (!auth.session(req)) {
      res.redirect(303, "/admin/login")
      return
    }
    shell(req, res)
  })
  app.use("/admin", (_req, res) => {
    res.sendStatus(404)
  })
  // Express 4 needs an explicit async boundary; never include stack traces or request bodies.
  app.use(
    ["/api/admin", "/api/auth", "/api/analytics"],
    (
      error: { status?: number; type?: string },
      _req: Request,
      res: Response,
      _next: express.NextFunction
    ) => {
      const status = error.type === "entity.too.large" ? 413 : error.status === 400 ? 400 : 503
      res
        .status(status)
        .json({
          error:
            status === 413
              ? "Request too large"
              : status === 400
                ? "Invalid request"
                : "Service temporarily unavailable"
        })
    }
  )
  return { health }
}
