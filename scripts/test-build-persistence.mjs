import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import assert from "node:assert/strict"
import Database from "better-sqlite3"
import sharp from "sharp"
import { randomBytes } from "node:crypto"
import { openControlDatabase } from "../dist/server/control/database.js"

const dir = await mkdtemp(path.join(tmpdir(), "yalla-build-test-"))
const uploads = path.join(dir, "uploads"),
  filename = path.join(dir, "control.db")
await mkdir(uploads)
const id = randomBytes(32).toString("hex") + ".webp"
const bytes = await sharp({ create: { width: 32, height: 32, channels: 3, background: "purple" } })
  .webp()
  .toBuffer()
await writeFile(path.join(uploads, id), bytes)
const db = openControlDatabase(filename, true)
db.prepare("INSERT INTO admin_uploads(id,created_at,bytes,width,height) VALUES(?,?,?,?,?)").run(
  id,
  Date.now(),
  bytes.length,
  32,
  32
)
db.prepare("INSERT INTO game_asset_overrides(game_id,cover,updated_at) VALUES('spy-game',?,?)").run(
  id,
  Date.now()
)
db.close()
let server
try {
  if (!process.env.npm_execpath) throw new Error("Run with npm run test:build-persistence")
  const build = spawn(process.execPath, [process.env.npm_execpath, "run", "build"], {
    stdio: "inherit",
    windowsHide: true
  })
  const result = await new Promise(resolve => build.once("exit", resolve))
  assert.equal(result, 0)
  assert.deepEqual(await readFile(path.join(uploads, id)), bytes)
  const check = new Database(filename, { readonly: true })
  assert.equal(check.prepare("SELECT cover FROM game_asset_overrides").get().cover, id)
  check.close()
  const probe = createServer()
  await new Promise(resolve => probe.listen(0, "127.0.0.1", resolve))
  const port = probe.address().port
  await new Promise(resolve => probe.close(resolve))
  server = spawn(process.execPath, ["dist/server/index.js"], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      DB_PATH: filename,
      UPLOAD_DIR: uploads,
      PORT: String(port),
      LOG_LEVEL: "fatal"
    },
    stdio: "inherit",
    windowsHide: true
  })
  let healthy = false
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) {
        healthy = true
        break
      }
    } catch {
      /* startup */
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.equal(healthy, true)
  const config = await (await fetch(`http://127.0.0.1:${port}/api/public-config`)).json()
  assert.equal(config.games["spy-game"].assets.cover, `/uploads/${id}`)
  assert.deepEqual(
    Buffer.from(await (await fetch(`http://127.0.0.1:${port}/uploads/${id}`)).arrayBuffer()),
    bytes
  )
  console.log(
    "Build persistence passed: override row, image bytes, public config and serving survive a production rebuild"
  )
} finally {
  if (server && server.exitCode === null) {
    server.kill()
    await new Promise(resolve => server.once("exit", resolve))
  }
  assert.equal(path.dirname(dir), path.resolve(tmpdir()))
  await rm(dir, { recursive: true, force: true })
}
