import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { verifyServerBuild } from "./verify-server-build.mjs"

await verifyServerBuild()
const probe = createServer()
await new Promise(resolve => probe.listen(0, "127.0.0.1", resolve))
const port = probe.address().port
await new Promise(resolve => probe.close(resolve))
const temporary = await mkdtemp(path.join(tmpdir(), "yalla-smoke-"))
const child = spawn(process.execPath, ["dist/server/index.js"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    DB_PATH: ":memory:",
    UPLOAD_DIR: temporary,
    PORT: String(port),
    LOG_LEVEL: "fatal"
  },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true
})
let output = ""
child.stdout.on("data", data => {
  output += data
})
child.stderr.on("data", data => {
  output += data
})
try {
  let ready = false
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) throw new Error(`Smoke process exited: ${output}`)
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`)
      if (response.ok && (await response.json()).ok) {
        ready = true
        break
      }
    } catch {
      /* starting */
    }
    await new Promise(resolve => setTimeout(resolve, 125))
  }
  if (!ready) throw new Error(`Health smoke failed: ${output}`)
  for (const endpoint of ["/", "/api/games", "/admin/login"]) {
    const response = await fetch(`http://127.0.0.1:${port}${endpoint}`)
    if (!response.ok) throw new Error(`Smoke failed: ${endpoint} ${response.status}`)
  }
  const denied = await fetch(`http://127.0.0.1:${port}/api/admin/system`)
  if (denied.status !== 401) throw new Error("Admin API is not protected")
  console.log("Production smoke passed: entrypoint, health, catalog, static shell and admin protection")
} finally {
  if (child.exitCode === null) {
    child.kill()
    await new Promise(resolve => child.once("exit", resolve))
  }
  // The generated temporary path must remain inside the OS temporary directory.
  if (
    path.dirname(temporary) !== path.resolve(tmpdir()) ||
    !path.basename(temporary).startsWith("yalla-smoke-")
  )
    throw new Error("Unsafe temporary path")
  await rm(temporary, { recursive: true, force: true })
}
