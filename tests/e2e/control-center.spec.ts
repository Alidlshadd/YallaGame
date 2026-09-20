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
import type { ClientToServerEvents, ServerToClientEvents } from "../../src/shared/events.js"
import type { Socket } from "socket.io-client"

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
  await page.getByLabel("Username or email", { exact: true }).fill("e2e-admin")
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
  await page.screenshot({ path: "test-results/admin-desktop.png", fullPage: true, animations: "disabled" })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole("button", { name: "Open navigation" }).click()
  await page.getByRole("dialog").getByRole("link", { name: "System", exact: false }).click()
  await expect(page.getByRole("heading", { name: "System status" })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: "test-results/admin-mobile.png", fullPage: true, animations: "disabled" })
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
    const result = await socket.timeout(5000).emitWithAck("admin:create-room", {
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

test("all four languages and both themes cover every admin route, retain preferences and fit RTL mobile", async ({
  page
}) => {
  test.setTimeout(120_000)
  const errors: string[] = []
  page.on("pageerror", error => errors.push(error.message))
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text())
  })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await login(page)
  const locales = [
    {
      code: "en",
      dir: "ltr",
      titles: [
        "Workspace overview",
        "Analytics",
        "Game history",
        "Players",
        "Game library",
        "Brand identity",
        "System status",
        "Audit log",
        "Sign out"
      ]
    },
    {
      code: "tr",
      dir: "ltr",
      titles: [
        "Çalışma alanına genel bakış",
        "Analitik",
        "Oyun geçmişi",
        "Oyuncular",
        "Oyun kütüphanesi",
        "Marka kimliği",
        "Sistem durumu",
        "Denetim kaydı",
        "Çıkış yap"
      ]
    },
    {
      code: "ar",
      dir: "rtl",
      titles: [
        "نظرة عامة على مساحة العمل",
        "التحليلات",
        "سجل الألعاب",
        "اللاعبون",
        "مكتبة الألعاب",
        "هوية العلامة",
        "حالة النظام",
        "سجل التدقيق",
        "تسجيل الخروج"
      ]
    },
    {
      code: "ku",
      dir: "rtl",
      titles: [
        "پوختەی شوێنی کار",
        "شیکاری",
        "مێژووی یاری",
        "یاریزانان",
        "کتێبخانەی یاری",
        "ناسنامەی براند",
        "دۆخی سیستەم",
        "تۆماری پشکنین",
        "چوونە دەرەوە"
      ]
    }
  ]
  const paths = [
    "/admin",
    "/admin/analytics",
    "/admin/games/history",
    "/admin/players",
    "/admin/games",
    "/admin/settings/branding",
    "/admin/settings/system",
    "/admin/audit-logs",
    "/admin/logout"
  ]
  const games = (await (await page.request.get(base + "/api/admin/games")).json()).catalog as Array<{
    id: string
    title: Record<string, string>
  }>
  // Generate a real first-party visit through the existing endpoint, never fixture dashboard values.
  expect(
    (
      await page.request.post(base + "/api/analytics", {
        headers: { Origin: base },
        data: { view: "homeView" }
      })
    ).status()
  ).toBe(204)
  const host: Socket<ServerToClientEvents, ClientToServerEvents> = io(base, {
    transports: ["websocket"],
    forceNew: true
  })
  const guests: Socket<ServerToClientEvents, ClientToServerEvents>[] = []
  try {
    const created = await host.timeout(5000).emitWithAck("admin:create-room", {
      gameId: "spy-game",
      hostName: "Aurora Host",
      hostCharacter: "ace",
      isPublic: false,
      requireApproval: false
    })
    if (!created.ok) throw new Error(created.error)
    const { code, adminSecret } = created.data
    for (const [name, character] of [
      ["Aurora Ada", "ruby"],
      ["Aurora Cem", "gizmo"]
    ]) {
      const guest: Socket<ServerToClientEvents, ClientToServerEvents> = io(base, {
        transports: ["websocket"],
        forceNew: true
      })
      guests.push(guest)
      const joined = await guest
        .timeout(5000)
        .emitWithAck("player:join", { code, name: name!, character: character! })
      expect(joined.ok).toBe(true)
    }
    expect((await host.timeout(5000).emitWithAck("admin:assign-roles", { code, adminSecret })).ok).toBe(true)
    expect((await host.timeout(5000).emitWithAck("admin:close-room", { code, adminSecret })).ok).toBe(true)
  } finally {
    host.disconnect()
    guests.forEach(guest => guest.disconnect())
  }
  await page.goto(base + "/admin")
  const data = await (await page.request.get(base + "/api/admin/dashboard?days=7")).json()
  await expect(page.locator(".kpi").first().locator(".kpi-value")).toHaveAttribute(
    "aria-label",
    String(data.kpis.visitorsToday)
  )
  expect(data.kpis.visitorsToday).toBeGreaterThan(0)
  expect(data.kpis.startedToday).toBeGreaterThan(0)
  for (const locale of locales) {
    const documentId = await page.evaluate(() => {
      const id = crypto.randomUUID()
      document.body.dataset.testDocument = id
      return id
    })
    await page.locator(".language-select").selectOption(locale.code)
    expect(await page.evaluate(() => document.body.dataset.testDocument)).toBe(documentId)
    for (const theme of ["dark", "light"]) {
      if ((await page.locator("html").getAttribute("data-theme")) !== theme)
        await page.locator(".theme-toggle").click()
      for (const [index, route] of paths.entries()) {
        await page.goto(base + route)
        await expect(page.locator("html")).toHaveAttribute("lang", locale.code)
        await expect(page.locator("html")).toHaveAttribute("dir", locale.dir)
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
        await expect(page.locator("h1")).toHaveText(locale.titles[index]!)
        await expect(page.locator(".sidebar nav a")).toHaveCount(8)
        if (index < 8) await expect(page.locator(".sidebar nav a[aria-current='page']")).toHaveCount(1)
        if (route === "/admin") {
          await expect(page.locator(".kpi")).toHaveCount(10)
          await expect(page.getByRole("meter").first()).toBeVisible()
          await expect
            .poll(() =>
              page
                .locator(".kpi-value")
                .evaluateAll(values =>
                  values.every(
                    value =>
                      !value.hasAttribute("aria-label") ||
                      value.textContent === value.getAttribute("aria-label")
                  )
                )
            )
            .toBe(true)
          await page.screenshot({
            path: `test-results/aurora-${locale.code}-${theme}.png`,
            fullPage: true,
            animations: "disabled"
          })
          // A theme switch must reach surfaces, fields, charts and text, not just the page.
          const colors = await page.evaluate(() => ({
            surface: getComputedStyle(document.querySelector(".kpi")!).backgroundColor,
            text: getComputedStyle(document.querySelector(".kpi-value")!).color,
            field: getComputedStyle(document.querySelector("select")!).backgroundColor
          }))
          expect(colors.surface).not.toBe(colors.text)
          expect(colors.field).toBe(colors.surface)
          const ratios = await page.evaluate(() => {
            const style = getComputedStyle(document.documentElement)
            const luminance = (token: string) => {
              const hex = style.getPropertyValue(token).trim().slice(1)
              const rgb = (hex.length === 3 ? [...hex].map(c => c + c).join("") : hex)
                .match(/../g)!
                .map(c => parseInt(c, 16) / 255)
                .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
              return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722
            }
            return [
              ["--text", "--surface"],
              ["--muted", "--surface"],
              ["--muted", "--elevated"],
              ["--text", "--page"],
              ["--accent", "--accent-soft"],
              ["--accent-ink", "--accent"],
              ["--success", "--success-soft"],
              ["--danger", "--surface"],
              ["--warning", "--page"]
            ].map(([fg, bg]) => {
              const a = luminance(fg!),
                b = luminance(bg!)
              return { fg, bg, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
            })
          })
          for (const pair of ratios)
            expect(pair.ratio, `${theme}: ${pair.fg}/${pair.bg}`).toBeGreaterThanOrEqual(4.5)
        }
        if (route === "/admin/games/history" || route === "/admin/players")
          await expect(page.locator("tbody tr").first()).toBeVisible()
        if (route === "/admin/games") {
          for (const game of games)
            await expect(
              page.getByRole("heading", { name: game.title[locale.code] || game.title.en!, exact: true })
            ).toBeVisible()
        }
        if (route === "/admin/settings/branding") {
          await expect(page.locator(".brand-sample")).toHaveCount(2)
          await page.screenshot({
            path: `test-results/aurora-brand-${locale.code}-${theme}.png`,
            animations: "disabled"
          })
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
      await page.goto(base + "/admin/login")
      await expect(page.locator(".login-panel")).toBeVisible()
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
      await page.screenshot({
        path: `test-results/aurora-login-${locale.code}-${theme}.png`,
        animations: "disabled"
      })
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(base + "/admin")
    await expect(page.locator(".kpi")).toHaveCount(10)
    await page.locator(".menu-toggle").click()
    const drawer = page.getByRole("dialog")
    await expect(drawer).toBeVisible()
    await drawer.evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)))
    const rect = await drawer.boundingBox()
    if (locale.dir === "rtl") expect(Math.round(rect!.x + rect!.width)).toBe(390)
    else expect(Math.round(rect!.x)).toBe(0)
    await page.keyboard.press("Escape")
    await expect(drawer).not.toBeVisible()
    await expect(page.locator(".menu-toggle")).toBeFocused()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({
      path: `test-results/aurora-mobile-${locale.code}.png`,
      fullPage: true,
      animations: "disabled"
    })
    await page.reload()
    await expect(page.locator("html")).toHaveAttribute("lang", locale.code)
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
    for (const width of [320, 768]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const [route, ready] of [
        ["/admin", ".kpi"],
        ["/admin/games", ".game-card"],
        ["/admin/settings/branding", ".brand-sample"],
        ["/admin/settings/system", ".system-card"],
        ["/admin/login", ".login-panel"]
      ]) {
        await page.goto(base + route)
        await expect(page.locator(ready!).first()).toBeVisible()
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${locale.code} ${route} ${width}px`
        ).toBe(true)
        // Detect clipped controls too: overflow:hidden must not hide a language/theme button.
        const controlsFit = await page.locator(".preferences").evaluate(el => {
          const rect = el.getBoundingClientRect()
          return rect.left >= 0 && rect.right <= innerWidth
        })
        expect(controlsFit, `${locale.code} preferences at ${width}px`).toBe(true)
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
  }
  expect(errors).toEqual([])
})

test("live translation preserves unsaved fields, previews, safe text, modal focus and localized errors", async ({
  page
}) => {
  await login(page)
  await page.goto(base + "/admin/settings/branding")
  const name = page.getByLabel("Site name", { exact: true })
  await name.fill("Aurora <script>safe</script>")
  await expect(page.locator(".brand-sample h3")).toHaveText([
    "Aurora <script>safe</script>",
    "Aurora <script>safe</script>"
  ])
  await page.locator(".language-select").selectOption("tr")
  await expect(page.getByLabel("Site adı", { exact: true })).toHaveValue("Aurora <script>safe</script>")
  await expect(page.locator(".save-status")).toHaveText("Kaydedilmemiş değişiklikler")
  await page.getByRole("button", { name: "Marka kimliğini kaydet" }).click()
  await expect(page.getByRole("button", { name: "İptal", exact: true })).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(page.getByRole("button", { name: "Değişikliği onayla" })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "İptal", exact: true })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).not.toBeVisible()
  await expect(page.getByRole("button", { name: "Marka kimliğini kaydet" })).toBeFocused()
  await page.getByLabel("Site adı", { exact: true }).fill("Yalla Test Brand")
  await page.getByRole("button", { name: "Marka kimliğini kaydet" }).click()
  await page.getByRole("button", { name: "Değişikliği onayla" }).click()
  await expect(page.getByRole("status")).toHaveText("Marka kimliği kaydedildi")
  await expect(page.locator(".sidebar-brand strong")).toHaveText("Yalla Test Brand")
  await page.locator(".language-select").selectOption("en")
  await page.goto(base + "/admin/games")
  const card = page.locator(".game-card").first()
  const image = await sharp({ create: { width: 80, height: 80, channels: 3, background: "#123456" } })
    .png()
    .toBuffer()
  await card
    .locator('input[type="file"]')
    .first()
    .setInputFiles({ name: "preview.png", mimeType: "image/png", buffer: image })
  const preview = await card.locator(".image-editor img").first().getAttribute("src")
  await page.locator(".language-select").selectOption("ku")
  await expect(card.locator(".image-editor img").first()).toHaveAttribute("src", preview!)
  await expect(card.locator(".save-status")).toHaveText("گۆڕانکاریی پاشەکەوت نەکراو")
  await page.locator(".language-select").selectOption("en")
  await card.getByRole("button", { name: "Save game", exact: true }).click()
  await expect(page.getByRole("status")).toContainText("saved")
  // Rejected input remains local and never reaches the upload endpoint.
  let uploads = 0
  page.on("request", request => {
    if (request.url().endsWith("/api/admin/uploads")) uploads++
  })
  await card
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "unsafe.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')
    })
  await expect(page.getByRole("alert")).toHaveText("Use JPEG, PNG or WebP up to 5 MiB")
  expect(uploads).toBe(0)
  // Restore the test asset through the existing confirmation and save contract.
  await card.locator(".image-editor").first().getByRole("button", { name: "Restore default" }).click()
  await page.getByRole("button", { name: "Confirm change" }).click()
  await card.getByRole("button", { name: "Save game", exact: true }).click()
  await expect(card.locator(".save-status")).toHaveText("All changes saved")
  await page.goto(base + "/admin/games/history")
  await page.getByLabel("From", { exact: true }).fill("2026-09-20")
  await page.getByLabel("To", { exact: true }).fill("2026-09-19")
  await page.getByRole("button", { name: "Apply filters" }).click()
  await expect(page.getByRole("alert")).toContainText("end date")
  await page.locator(".language-select").selectOption("ar")
  await expect(page.getByRole("alert")).toHaveText("يجب ألا يسبق تاريخ النهاية تاريخ البداية.")
})

test("system preferences, reduced motion, filter requests and safe server-error fallbacks", async ({
  page,
  browser
}) => {
  const context = await browser.newContext({ colorScheme: "dark", reducedMotion: "reduce" })
  const firstUse = await context.newPage()
  try {
    await firstUse.goto(base + "/admin/login")
    await expect(firstUse.locator("html")).toHaveAttribute("data-theme", "dark")
    await firstUse.locator(".theme-toggle").click()
    await firstUse.reload()
    await expect(firstUse.locator("html")).toHaveAttribute("data-theme", "light")
    await firstUse.locator('input[name="password"]').fill("not-a-secret-test-value")
    await firstUse.getByRole("button", { name: "Show password" }).click()
    await expect(firstUse.locator('input[name="password"]')).toHaveAttribute("type", "text")
    await firstUse.getByRole("button", { name: "Hide password" }).click()
    await expect(firstUse.locator('input[name="password"]')).toHaveAttribute("type", "password")
    expect(await firstUse.evaluate(() => Object.values(localStorage).join(" "))).not.toContain("not-a-secret")
    const running = await firstUse.evaluate(
      () => document.getAnimations().filter(animation => animation.playState === "running").length
    )
    expect(running).toBe(0)
  } finally {
    await context.close()
  }
  await page.emulateMedia({ reducedMotion: "reduce" })
  await login(page)
  await page.getByLabel("Date range").selectOption("30")
  await expect(page.locator(".dashboard-content")).toHaveAttribute("aria-busy", "false")
  expect(
    await page.evaluate(
      () => document.getAnimations().filter(animation => animation.playState === "running").length
    )
  ).toBe(0)
  await page.goto(base + "/admin/audit-logs")
  await page.getByLabel("Search", { exact: true }).fill("login")
  const filtered = page.waitForResponse(
    response => response.url().includes("/api/admin/audit-logs?") && response.url().includes("q=login")
  )
  await page.getByRole("button", { name: "Apply filters" }).click()
  expect((await filtered).status()).toBe(200)
  await expect(page.locator("tbody tr").first()).toBeVisible()
  await page.locator(".metadata summary").first().click()
  await expect(page.locator(".metadata[open] pre").first()).toBeVisible()
  // Deliberately failing transport exercises the safe fallback; it is never displayed as analytics data.
  await page.route("**/api/admin/dashboard?*", route =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "C:/private/secret.db internal stack trace" })
    })
  )
  await page.goto(base + "/admin")
  await expect(page.locator(".form-error")).toHaveText("We couldn’t complete the request. Please try again.")
  await expect(page.locator("body")).not.toContainText("secret.db")
  await page.locator(".language-select").selectOption("tr")
  await expect(page.locator(".form-error")).toHaveText("İstek tamamlanamadı. Lütfen yeniden deneyin.")
})
