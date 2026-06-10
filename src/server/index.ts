import express from "express"
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
  app.use(helmet({ contentSecurityPolicy: false }))

  const store = makeStore()

  app.get("/healthz", async (_req, res) => {
    try { await store.countActiveRooms(); res.json({ ok: true }) }
    catch (err) { logger.error({ err }, "healthz failed"); res.status(503).json({ ok: false }) }
  })

  app.get("/api/games", (_req, res) => { res.json(GAME_CATALOG) })

  const staticDir = path.resolve(__dirname, "../../dist/client")
  const legacyDir = path.resolve(__dirname, "../../public")
  app.use(express.static(existsSync(staticDir) ? staticDir : legacyDir))

  const server = http.createServer(app)
  const io = new Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>(server, {
    cors: { origin: config.ALLOWED_ORIGIN ?? true }
  })

  registerHandlers(io, {
    io, store, resolveGame, config, rng: Math.random
  })

  setInterval(() => {
    void store.deleteOlderThan(Date.now() - config.ROOM_TTL_HOURS * 60 * 60 * 1000)
  }, 20 * 60 * 1000).unref()

  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, "server ready")
  })

  const shutdown = async () => { await store.close(); server.close(() => process.exit(0)) }
  process.on("SIGINT",  () => void shutdown())
  process.on("SIGTERM", () => void shutdown())
}

main().catch(err => { logger.fatal({ err }, "startup failed"); process.exit(1) })
