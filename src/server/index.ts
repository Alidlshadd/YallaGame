import express from "express"
import compression from "compression"
import http from "node:http"
import { Server } from "socket.io"
import helmet from "helmet"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { existsSync, mkdirSync } from "node:fs"
import { config } from "./config.js"
import { logger } from "./logger.js"
import { MemoryStore } from "./store/memory-store.js"
import { SqliteStore } from "./store/sqlite-store.js"
import type { RoomStore } from "./store/store.js"
import { registerHandlers } from "./sockets/index.js"
import { GAME_CATALOG, resolveGame } from "./games/catalog.js"
import { resolveEngine } from "./games/engines.js"
import { cancelAllTimers } from "./domain/scheduler.js"
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

  // Phones on mobile data pay for every byte: the main bundle is ~170 kB raw
  // and ~60 kB gzipped.
  app.use(compression())

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // The views set style attributes (per-world backdrops) and Vite
        // injects a style element, so inline styles have to stay allowed.
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        mediaSrc: ["'self'"],
        // Same origin over http(s) and the websocket the room runs on.
        connectSrc: ["'self'", "ws:", "wss:"],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        // Helmet adds this by default, which would rewrite every request to
        // https - fatal for a host running the room over plain http on the
        // living-room wifi.
        upgradeInsecureRequests: null
      }
    },
    // The app is served over plain http on a LAN during local play evenings;
    // HSTS there would pin a certificate the host does not have.
    hsts: config.NODE_ENV === "production" && Boolean(config.ALLOWED_ORIGIN)
  }))

  const store = makeStore()

  app.get("/healthz", async (_req, res) => {
    try { await store.countActiveRooms(); res.json({ ok: true }) }
    catch (err) { logger.error({ err }, "healthz failed"); res.status(503).json({ ok: false }) }
  })

  app.get("/api/games", (_req, res) => { res.json(GAME_CATALOG) })

  const staticDir = path.resolve(__dirname, "../../dist/client")
  const legacyDir = path.resolve(__dirname, "../../public")
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

  const server = http.createServer(app)
  const io = new Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>(server, {
    cors: { origin: config.ALLOWED_ORIGIN ?? true }
  })

  registerHandlers(io, {
    io, store, resolveGame, resolveEngine, config, rng: Math.random
  })

  setInterval(() => {
    void store.deleteOlderThan(Date.now() - config.ROOM_TTL_HOURS * 60 * 60 * 1000)
  }, 20 * 60 * 1000).unref()

  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, "server ready")
  })

  const shutdown = async () => {
    cancelAllTimers()
    await store.close()
    server.close(() => process.exit(0))
  }
  process.on("SIGINT",  () => void shutdown())
  process.on("SIGTERM", () => void shutdown())
}

main().catch(err => { logger.fatal({ err }, "startup failed"); process.exit(1) })
