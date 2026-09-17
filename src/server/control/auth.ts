import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import type { Request, Response, RequestHandler } from "express"
import type Database from "better-sqlite3"
import { audit } from "./database.js"

export const hash = (value: string): string => createHash("sha256").update(value).digest("hex")
export const token = (): string => randomBytes(32).toString("hex")
const derive = (password: string, salt: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key)
    )
  })
export async function hashPassword(password: string): Promise<string> {
  if (password.length < 14 || password.length > 128)
    throw new Error("Password must contain 14–128 characters")
  const salt = randomBytes(16).toString("hex")
  return `scrypt$${salt}$${(await derive(password, salt)).toString("hex")}`
}
export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [, salt, digest] = encoded.split("$")
  if (!salt || !digest || password.length > 128) return false
  const key = await derive(password, salt)
  const expected = Buffer.from(digest, "hex")
  return key.length === expected.length && timingSafeEqual(key, expected)
}
export function cookies(req: Request): Record<string, string> {
  return Object.fromEntries(
    (req.headers.cookie ?? "").split(";").map(part => {
      const i = part.indexOf("=")
      return [part.slice(0, i).trim(), part.slice(i + 1)]
    })
  )
}
export interface AdminSession {
  admin_id: number
  username: string
  token_hash: string
  csrf_hash: string
}
export function createAuth(db: Database.Database, secure: boolean, origin?: string) {
  const cookieName = secure ? "__Host-yalla-admin" : "yalla-admin"
  const options = { httpOnly: true, secure, sameSite: "strict" as const, path: "/" }
  const session = (req: Request): AdminSession | undefined => {
    const raw = cookies(req)[cookieName]
    if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return
    const row = db
      .prepare(
        `SELECT s.*,u.username FROM admin_sessions s JOIN admin_users u ON u.id=s.admin_id
     WHERE token_hash=? AND expires_at>? AND last_seen>? AND u.enabled=1`
      )
      .get(hash(raw), Date.now(), Date.now() - 30 * 60_000) as AdminSession | undefined
    if (row)
      db.prepare("UPDATE admin_sessions SET last_seen=? WHERE token_hash=?").run(Date.now(), row.token_hash)
    return row
  }
  const requireAdmin: RequestHandler = (req, res, next) => {
    const current = session(req)
    if (!current) {
      res.status(401).json({ error: "Authentication required" })
      return
    }
    res.locals.admin = current
    next()
  }
  const sameOrigin = (req: Request): boolean => {
    const actual = req.get("origin")
    const expected = origin ?? `${req.protocol}://${req.get("host")}`
    return actual === expected && req.get("sec-fetch-site") !== "cross-site"
  }
  const csrf: RequestHandler = (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      next()
      return
    }
    const current = res.locals.admin as AdminSession
    if (!sameOrigin(req) || hash(req.get("x-csrf-token") ?? "") !== current.csrf_hash) {
      res.status(403).json({ error: "CSRF verification failed" })
      return
    }
    next()
  }
  const issue = (res: Response, admin: number): string => {
    const raw = token(),
      csrfToken = hash(`csrf:${raw}`),
      now = Date.now()
    db.prepare("INSERT INTO admin_sessions VALUES(?,?,?,?,?,?)").run(
      hash(raw),
      admin,
      hash(csrfToken),
      now,
      now + 8 * 3600_000,
      now
    )
    res.cookie(cookieName, raw, { ...options, maxAge: 8 * 3600_000 })
    return csrfToken
  }
  const logout = (req: Request, res: Response): void => {
    const current = res.locals.admin as AdminSession
    db.transaction(() => {
      db.prepare("DELETE FROM admin_sessions WHERE token_hash=?").run(current.token_hash)
      audit(db, current.admin_id, "logout", "session")
    })()
    res.clearCookie(cookieName, options)
    res.json({ ok: true })
  }
  const csrfFor = (req: Request): string => hash(`csrf:${cookies(req)[cookieName] ?? ""}`)
  return { session, requireAdmin, csrf, issue, logout, sameOrigin, cookieName, csrfFor }
}

/** Persistent limits survive process restart; keys contain only salted hashes, never IPs. */
export function consumeLimit(db: Database.Database, key: string, limit: number, windowMs: number): boolean {
  return db
    .transaction(() => {
      const now = Date.now()
      db.prepare("DELETE FROM admin_login_limits WHERE expires_at<=?").run(now)
      db.prepare(
        `INSERT INTO admin_login_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1`
      ).run(key, now + windowMs)
      const row = db.prepare("SELECT attempts FROM admin_login_limits WHERE key=?").get(key) as {
        attempts: number
      }
      return row.attempts <= limit
    })
    .immediate()
}
