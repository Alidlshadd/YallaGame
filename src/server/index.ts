import express from "express"
import compression from "compression"
import http from "node:http"
import { Server } from "socket.io"
import { publicApiLimit, safeHttpError, securityHeaders } from "./security/http.js"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { existsSync, mkdirSync } from "node:fs"
import { config } from "./config.js"
import { logger } from "./logger.js"
import { MemoryStore } from "./store/memory-store.js"
import { SqliteStore } from "./store/sqlite-store.js"
import type { RoomStore } from "./store/store.js"
import { registerHandlers } from "./sockets/index.js"
import { AddressLimits, allowedSocketOrigin } from "./sockets/security.js"
import { resolveGame } from "./games/catalog.js"
import { resolveEngine } from "./games/engines.js"
import { cancelAllTimers } from "./domain/scheduler.js"
import { openControlDatabase } from "./control/database.js"
import { Analytics, ObservedStore } from "./control/analytics.js"
import { mountControl } from "./control/routes.js"
import { brandedHtml, effectiveAvatarCatalog, effectiveCatalog, isSelectableCharacterId, persistentUploads, publicConfiguration } from "./control/content.js"
import { readFileSync } from "node:fs"
import type { ClientToServerEvents, ServerToClientEvents } from "@shared/events.js"
import type { SocketData } from "@shared/types.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function makeStore(): RoomStore {
  if (config.DB_PATH) {
    if (config.DB_PATH !== ":memory:") {
      const dir = path.dirname(path.resolve(config.DB_PATH))
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    }
    return new SqliteStore(config.DB_PATH)
  }
  if (config.NODE_ENV === "production") {
    throw new Error("DB_PATH is required in production")
  }
  logger.warn("DB_PATH unset — using MemoryStore (test/dev only)")
  return new MemoryStore()
}

async function main() {
  const app = express()
  if (process.env.TRUST_PROXY) app.set("trust proxy", process.env.TRUST_PROXY.split(","))
  app.disable("x-powered-by")

  // Phones on mobile data pay for every byte: the main bundle is ~170 kB raw
  // and ~60 kB gzipped.
  app.use(compression())

  app.use(securityHeaders(config.NODE_ENV === "production", config.ALLOWED_ORIGIN))
  app.use(["/api/games", "/api/public-config"], publicApiLimit())

  if (config.NODE_ENV === "production" && config.DB_PATH !== ":memory:" &&
      (!path.isAbsolute(config.DB_PATH!) || !process.env.UPLOAD_DIR || !path.isAbsolute(process.env.UPLOAD_DIR))) {
    throw new Error("Production requires absolute DB_PATH and UPLOAD_DIR outside release/build directories")
  }
  const controlDb = openControlDatabase(config.DB_PATH ?? "data/rooms.db", config.NODE_ENV !== "production" || config.DB_PATH === ":memory:")
  const analytics = new Analytics(controlDb)
  const store = new ObservedStore(makeStore(), analytics)
  const uploadDirectory = persistentUploads(process.env.UPLOAD_DIR ?? "data/uploads")
  mkdirSync(uploadDirectory, { recursive: true })
  const staticDir = path.resolve(__dirname, "../../dist/client")
  const legacyDir = path.resolve(__dirname, "../../public")
  const version = (JSON.parse(readFileSync(path.resolve(__dirname,"../../package.json"),"utf8")) as {version:string}).version
  const control = mountControl(app, { db:controlDb, analytics, secure:config.NODE_ENV === "production", uploads:uploadDirectory,
    clientDir:config.NODE_ENV === "production" ? staticDir : process.cwd(), version, ...(config.ALLOWED_ORIGIN ? {origin:config.ALLOWED_ORIGIN} : {}) })

  app.get(["/health", "/healthz"], async (_req, res) => {
    res.set("Cache-Control","no-store")
    try { control.health(); await store.countActiveRooms(); res.json({ ok: true }) }
    catch (err) { logger.error({ err }, "healthz failed"); res.status(503).json({ ok: false }) }
  })

  app.get("/api/games", (_req, res) => { res.set("Cache-Control","no-store").json(effectiveCatalog(controlDb)) })

  app.get("/control.html", (_req,res) => { res.redirect(303,"/admin") })
  if (existsSync(path.join(staticDir,"index.html"))) {
    const publicShell = readFileSync(path.join(staticDir,"index.html"),"utf8")
    app.get(["/","/index.html"],(_req,res) => {
      res.set("Cache-Control","no-cache").type("html").send(brandedHtml(publicShell,publicConfiguration(controlDb).branding,config.ALLOWED_ORIGIN ?? ""))
    })
  }
  app.use(express.static(existsSync(staticDir) ? staticDir : legacyDir, {
    setHeaders(res, filePath) {
      // Build output carries a content hash, so it can be kept forever.
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
        return
      }
      // Everything else (the shell, the worker, the icons) must be revalidated
      // or a phone would keep running last week's build.
      res.setHeader("Cache-Control", "no-cache")
    }
  }))

  app.use(safeHttpError)
  const server = http.createServer({ headersTimeout: 15_000, requestTimeout: 30_000, maxHeaderSize: 16 * 1024 }, app)
  const socketLimits = new AddressLimits()
  const io = new Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>(server, {
    cors: { origin: config.ALLOWED_ORIGIN ?? false },
    maxHttpBufferSize: 16 * 1024,
    allowRequest: (req, done) => {
      // Resolve addresses with the same explicit trust-proxy policy as Express.
      const address = app.get("trust proxy fn") as (ip: string, hop: number) => boolean
      const peer = req.socket.remoteAddress ?? "unknown"
      const forwarded = req.headers["x-forwarded-for"]
      const chain = typeof forwarded === "string" ? forwarded.split(",").map(value => value.trim()).reverse() : []
      let ip = peer
      for (let i = 0; i < chain.length && address(ip, i); i++) ip = chain[i]!
      const accepted = allowedSocketOrigin(req, config.ALLOWED_ORIGIN) && socketLimits.consume(`connect:${ip}`, 180, 60_000)
      if (accepted) (req as typeof req & { clientAddress: string }).clientAddress = ip
      done(null, accepted)
    }
  })
  const connectedAddresses = new Map<string, number>()
  io.on("connection", socket => {
    const ip = (socket.request as typeof socket.request & { clientAddress?: string }).clientAddress ?? socket.handshake.address
    const count = connectedAddresses.get(ip) ?? 0
    if (count >= 240 || io.engine.clientsCount > 10_000) {
      socket.disconnect(true)
      return
    }
    connectedAddresses.set(ip, count + 1)
    socket.once("disconnect", () => {
      const remaining = (connectedAddresses.get(ip) ?? 1) - 1
      if (remaining > 0) connectedAddresses.set(ip, remaining)
      else connectedAddresses.delete(ip)
    })
    socket.use(([event], next) => {
      if (!socketLimits.consume(`events:${ip}`, 6000, 60_000) ||
          (event === "admin:create-room" && !socketLimits.consume(`rooms:${ip}`, 60, 600_000))) {
        socket.disconnect(true)
        return
      }
      next()
    })
  })

  registerHandlers(io, {
    io, store, resolveGame, resolveEngine, config, rng: Math.random,
    canCreateGame: id => (controlDb.prepare("SELECT enabled FROM game_asset_overrides WHERE game_id=?").get(id) as {enabled:number} | undefined)?.enabled !== 0,
    isValidCharacter: id => isSelectableCharacterId(controlDb, id),
    selectableCharacters: () => effectiveAvatarCatalog(controlDb).map(a => a.id)
  })

  setInterval(() => {
    void store.deleteOlderThan(Date.now() - config.ROOM_TTL_HOURS * 60 * 60 * 1000)
  }, 20 * 60 * 1000).unref()
  const retentionDays = Number(process.env.ANALYTICS_RETENTION_DAYS ?? 365)
  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) throw new Error("Invalid ANALYTICS_RETENTION_DAYS")
  analytics.retain(retentionDays)
  setInterval(() => analytics.retain(retentionDays), 3600_000).unref()

  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, "server ready")
  })

  const shutdown = async () => {
    cancelAllTimers()
    io.close(() => {
      void store.close().then(() => { controlDb.close(); process.exit(0) })
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.on("SIGINT",  () => void shutdown())
  process.on("SIGTERM", () => void shutdown())
}

main().catch(err => { logger.fatal({ err }, "startup failed"); process.exit(1) })
