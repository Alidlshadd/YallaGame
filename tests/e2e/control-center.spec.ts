import { test, expect, type Page } from "@playwright/test"
import { spawn, type ChildProcess } from "node:child_process"
import { randomBytes } from "node:crypto"
import { createServer } from "node:net"
import { mkdtemp, rm, mkdir, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import sharp from "sharp"
import { openControlDatabase } from "../../src/server/control/database.js"
import { hashPassword } from "../../src/server/control/auth.js"
import { io } from "socket.io-client"

test.describe.configure({ mode: "serial" })
let child: ChildProcess, directory: string, base: string, password: string
test.beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "yalla-admin-e2e-"))
  const filename = path.join(directory, "test.db"),
    db = openControlDatabase(filename, true)
  password = randomBytes(24).toString("base64url")
  db.prepare("INSERT INTO admin_users(username,password_hash,created_at,updated_at) VALUES(?,?,?,?)").run(
    "e2e-admin",
    await hashPassword(password),
    Date.now(),
    Date.now()
  )
  db.close()
  const listener = createServer()
  await new Promise<void>(resolve => listener.listen(0, "127.0.0.1", resolve))
  const port = (listener.address() as { port: number }).port
  await new Promise<void>(resolve => listener.close(() => resolve()))
  base = `http://localhost:${port}`
  child = spawn(process.execPath, ["dist/server/index.js"], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      DB_PATH: filename,
      PORT: String(port),
      UPLOAD_DIR: path.join(directory, "uploads"),
      LOG_LEVEL: "fatal",
      ALLOWED_ORIGIN: base
    },
    windowsHide: true,
    stdio: "pipe"
  })
  let output = ""
  child.stderr?.on("data", data => {
    output += data
  })
  let healthy = false
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) throw new Error(`Admin test server failed: ${output}`)
    try {
      if ((await fetch(base + "/health")).ok) {
        healthy = true
        break
      }
    } catch {
      /* startup */
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  expect(healthy).toBe(true)
})
test.afterAll(async () => {
  if (child && child.exitCode === null) {
    child.kill()
    await new Promise(resolve => child.once("exit", resolve))
  }
  if (directory) {
    expect(path.dirname(directory)).toBe(path.resolve(tmpdir()))
    await rm(directory, { recursive: true, force: true })
  }
})
async function login(page: Page) {
  await page.goto(base + "/admin/login")
  await page.getByLabel("Username", { exact: true }).fill("e2e-admin")
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page.getByRole("heading", { name: "Workspace overview" })).toBeVisible()
}
test("protects routes, renders desktop/mobile/RTL and signs out", async ({ page }) => {
  await page.goto(base + "/admin/settings/system")
  await expect(page).toHaveURL(base + "/admin/login")
  await login(page)
  await expect(page.locator(".kpi")).toHaveCount(10)
  await mkdir("test-results", { recursive: true })
  await page.screenshot({ path: "test-results/admin-desktop.png", fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole("button", { name: "Open navigation" }).click()
  await page.getByRole("dialog").getByRole("link", { name: "System", exact: false }).click()
  await expect(page.getByRole("heading", { name: "System status" })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: "test-results/admin-mobile.png", fullPage: true })
  await page.evaluate(() => {
    document.documentElement.dir = "rtl"
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.goto(base + "/admin/logout")
  await page.getByRole("button", { name: "Sign out", exact: true }).click()
  await expect(page).toHaveURL(base + "/admin/login")
  expect((await page.request.get(base + "/api/admin/system")).status()).toBe(401)
})
test("saves safe branding, previews/uploads/resets game images and enforces disabled games in Socket.IO", async ({
  page
}) => {
  await login(page)
  await page.goto(base + "/admin/settings/branding")
  await page.getByLabel("Site name", { exact: true }).fill("Yalla Test Brand")
  await page.getByLabel("Short description", { exact: true }).fill('Safe <script>alert("x")</script> copy')
  await page.getByRole("button", { name: "Save brand identity" }).click()
  await page.getByRole("button", { name: "Confirm change" }).click()
  await expect(page.getByRole("status")).toContainText("Brand identity saved")
  await page.goto(base + "/")
  await expect(page).toHaveTitle("Yalla Test Brand")
  await expect(page.locator(".brand-text strong")).toHaveText("Yalla Test Brand")
  await page.goto(base + "/admin/games")
  const card = page
    .locator(".game-card")
    .filter({ has: page.getByRole("heading", { name: "Spy Game", exact: true }) })
  const image = await sharp({ create: { width: 120, height: 180, channels: 3, background: "#8060b0" } })
    .png()
    .toBuffer()
  await card
    .getByLabel("Upload Cover image", { exact: true })
    .setInputFiles({ name: "art.png", mimeType: "image/png", buffer: image })
  await expect(card.getByAltText("Cover image preview")).toHaveAttribute("src", /^blob:/)
  await card.getByRole("button", { name: "Save game", exact: true }).click()
  await expect(page.getByRole("status")).toContainText("saved")
  const publicConfig = await (await page.request.get(base + "/api/public-config")).json()
  const url = publicConfig.games["spy-game"].assets.cover as string
  expect(url).toMatch(/^\/uploads\/[a-f0-9]+\.webp$/)
  expect((await readFile(path.join(directory, "uploads", path.basename(url)))).length).toBeGreaterThan(0)
  await card.getByLabel("Visible & available").uncheck()
  await card.getByRole("button", { name: "Save game", exact: true }).click()
  await page.getByRole("button", { name: "Confirm change" }).click()
  await expect
    .poll(async () =>
      ((await (await page.request.get(base + "/api/games")).json()) as Array<{ id: string }>).some(
        game => game.id === "spy-game"
      )
    )
    .toBe(false)
  const socket = io(base, { transports: ["websocket"], forceNew: true })
  try {
    await new Promise<void>((resolve, reject) => {
      socket.on("connect", resolve)
      socket.on("connect_error", reject)
    })
    const result = await socket
      .timeout(5000)
      .emitWithAck("admin:create-room", {
        gameId: "spy-game",
        hostName: "Host",
        hostCharacter: "ace",
        isPublic: false,
        requireApproval: false
      })
    expect(result).toEqual({ ok: false, error: "UNKNOWN_GAME" })
  } finally {
    socket.close()
  }
  await card.getByLabel("Visible & available").check()
  await card.locator(".image-editor").first().getByRole("button", { name: "Restore default" }).click()
  await page.getByRole("button", { name: "Confirm change" }).click()
  await card.getByRole("button", { name: "Save game", exact: true }).click()
  await expect
    .poll(
      async () =>
        (await (await page.request.get(base + "/api/public-config")).json()).games["spy-game"].assets.cover
    )
    .toBe(null)
  // A reset retains the old file for grace-period cleanup.
  expect((await page.request.get(base + url)).status()).toBe(200)
})
test("never puts authenticated admin HTML into the public service-worker cache", async ({ page }) => {
  await page.goto(base + "/")
  await page.evaluate(() => navigator.serviceWorker.ready)
  await login(page)
  await page.reload()
  await expect(page.getByRole("heading", { name: "Workspace overview" })).toBeVisible()
  const cached = await page.evaluate(async () => {
    const matches = []
    for (const name of await caches.keys())
      for (const request of await (await caches.open(name)).keys()) {
        const response = await (await caches.open(name)).match(request)
        if (response?.headers.get("content-type")?.includes("text/html")) matches.push(await response.text())
      }
    return matches
  })
  expect(cached.every(html => !html.includes("control-root"))).toBe(true)
})
