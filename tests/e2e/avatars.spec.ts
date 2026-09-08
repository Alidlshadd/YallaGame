import { test, expect } from "@playwright/test"
import { createRoom, openDoorstep } from "./helpers.js"
import { io, type Socket } from "socket.io-client"
import { setTimeout as delay } from "node:timers/promises"
import type { ClientToServerEvents, ServerToClientEvents } from "../../src/shared/events.js"

test("server removes accessories from Ali for hosts and direct or queued joins", async ({ baseURL }) => {
  const host: Socket<ServerToClientEvents, ClientToServerEvents> = io(baseURL!, { forceNew: true })
  const player: Socket<ServerToClientEvents, ClientToServerEvents> = io(baseURL!, { forceNew: true })
  try {
    const created = await host.timeout(5000).emitWithAck("admin:create-room", {
      gameId: "mafia-classic", hostName: "Ali Host", hostCharacter: "ali", hostAccessory: "crown", isPublic: false, requireApproval: false
    })
    if (!created.ok) throw new Error(created.error)
    expect(created.data.room.players[0]).toMatchObject({ character: "ali", accessory: "" })
    for (const requireApproval of [false, true]) {
      // Respect the server's two-second room creation cooldown.
      await delay(2100)
      const room = await host.timeout(5000).emitWithAck("admin:create-room", {
        gameId: "mafia-classic", hostName: "Host", hostCharacter: "ace", isPublic: false, requireApproval
      })
      if (!room.ok) throw new Error(room.error)
      const { code, adminSecret } = room.data
      const joined = await player.timeout(5000).emitWithAck("player:join", { code, name: "Ali Player", character: "ali", accessory: "crown" })
      if (!joined.ok) throw new Error(joined.error)
      expect(joined.data.status).toBe(requireApproval ? "pending" : "joined")
      if (joined.data.status === "joined") {
        expect(joined.data.player).toMatchObject({ character: "ali", accessory: "" })
      } else {
        const approved = await host.timeout(5000).emitWithAck("admin:approve-join", { code, adminSecret, requestId: joined.data.requestId })
        if (!approved.ok) throw new Error(approved.error)
        expect(approved.data.room.players).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Ali Player", character: "ali", accessory: "" })]))
      }
    }
  } finally {
    host.disconnect(); player.disconnect()
  }
})

test("accessories survive host creation, approval and player reconnection", async ({ browser }) => {
  const hostContext = await browser.newContext()
  const playerContext = await browser.newContext()
  const host = await hostContext.newPage()
  const player = await playerContext.newPage()
  const errors: string[] = []
  host.on("pageerror", e => errors.push(e.message))
  player.on("pageerror", e => errors.push(e.message))
  await host.addInitScript(() => localStorage.setItem("role-room:last-accessory", "crown"))
  const code = await createRoom(host, { requireApproval: true })
  await expect(host.locator('.player-row [data-avatar="ace"]')).toHaveAttribute("data-accessory", "crown")
  await openDoorstep(player, code)
  await player.fill("#joinSetupName", "Mira")
  await player.locator('[data-character="wisp"]').click()
  await player.getByRole("tab", { name: "Accessories" }).click()
  await player.locator('.accessory-tile[data-accessory="heart-glasses"]').click()
  await expect(player.locator(".avatar-preview .avatar")).toHaveAttribute("data-avatar", "wisp")
  await expect(player.locator(".avatar-preview .avatar")).toHaveAttribute("data-accessory", "heart-glasses")
  await player.click("#joinSetupSubmit")
  await expect(player.locator("#pendingAvatar .avatar")).toHaveAttribute("data-accessory", "heart-glasses")
  const request = host.locator(".request-row", { hasText: "Mira" })
  await expect(request.locator(".avatar")).toHaveAttribute("data-accessory", "heart-glasses")
  await request.locator(".btn-primary").click()
  await expect(player.locator("#playerWelcome .avatar")).toHaveAttribute("data-accessory", "heart-glasses")
  await expect(host.locator('.player-row [data-avatar="wisp"]')).toHaveAttribute("data-accessory", "heart-glasses")
  await player.reload()
  await expect(player.locator("#playerWelcome .avatar")).toHaveAttribute("data-avatar", "wisp")
  await expect(player.locator("#playerWelcome .avatar")).toHaveAttribute("data-accessory", "heart-glasses")
  expect(errors).toEqual([])
  await hostContext.close(); await playerContext.close()
})

test("mobile avatar studio has 22 faces, removable accessories and usable tabs", async ({ browser }) => {
  const hostContext = await browser.newContext()
  const host = await hostContext.newPage()
  const code = await createRoom(host)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 })
  const page = await context.newPage()
  await page.addInitScript(() => localStorage.setItem("role-room:lang", "tr"))
  await openDoorstep(page, code)
  await page.fill("#joinSetupName", "Deniz")
  await expect(page.locator(".char-tile[data-character]")).toHaveCount(22)
  await page.locator('[data-character="ruby"]').click()
  await expect(page.locator('.avatar-preview img')).toHaveJSProperty("naturalWidth", 1024)
  await page.screenshot({ path: ".playwright-mcp/avatars-mobile-characters.png" })
  await page.getByRole("tab", { name: "Aksesuarlar" }).click()
  await expect(page.locator(".accessory-tile")).toHaveCount(13)
  await page.locator('.accessory-tile[data-accessory="crown"]').click()
  await page.screenshot({ path: ".playwright-mcp/avatars-mobile-accessories.png" })
  await expect(page.locator("#joinSetupSubmit")).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.locator('.accessory-tile[data-accessory=""]').click()
  await expect(page.locator(".avatar-preview .avatar-accessory")).toHaveCount(0)
  await page.locator(".avatar-surprise").click()
  await expect(page.locator(".avatar-preview .avatar")).not.toHaveAttribute("data-avatar", "ace")
  await page.getByRole("tab", { name: "Karakterler" }).click()
  await page.locator('[data-character="mochi"]').click()
  await page.getByRole("tab", { name: "Aksesuarlar" }).click()
  await page.locator('.accessory-tile[data-accessory="bow-tie"]').click()
  await page.click("#joinSetupSubmit")
  await expect(page.locator("#playerWelcome .avatar")).toHaveAttribute("data-accessory", "bow-tie")
  await hostContext.close(); await context.close()
})

test("Ali clears accessories and survives approval and reload", async ({ browser }) => {
  const hostContext = await browser.newContext()
  const playerContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const host = await hostContext.newPage()
  const player = await playerContext.newPage()
  const code = await createRoom(host, { requireApproval: true })
  await player.addInitScript(() => localStorage.setItem("role-room:last-accessory", "crown"))
  await openDoorstep(player, code)
  await player.fill("#joinSetupName", "Ali Player")
  await player.locator('[data-character="ali"]').click()
  await expect(player.getByRole("tab", { name: "Accessories" })).toBeDisabled()
  const preview = player.locator(".avatar-preview .avatar")
  await expect(preview).toHaveAttribute("data-accessory", "")
  await expect(preview.locator("img")).toHaveJSProperty("naturalWidth", 1254)
  await player.locator(".avatar-picker").screenshot({ path: ".playwright-mcp/avatars-ali-mobile.png" })
  await player.click("#joinSetupSubmit")
  await expect(player.locator("#pendingAvatar .avatar")).toHaveAttribute("data-accessory", "")
  const request = host.locator(".request-row", { hasText: "Ali Player" })
  await expect(request.locator(".avatar")).toHaveAttribute("data-avatar", "ali")
  await request.locator(".btn-primary").click()
  await expect(player.locator("#playerWelcome .avatar")).toHaveAttribute("data-accessory", "")
  await player.reload()
  await expect(player.locator("#playerWelcome .avatar")).toHaveAttribute("data-avatar", "ali")
  await expect(player.locator("#playerWelcome .avatar")).toHaveAttribute("data-accessory", "")
  await hostContext.close(); await playerContext.close()
})

test("desktop host studio and Arabic mobile layout fit their viewports", async ({ page }) => {
  await page.goto("/")
  await page.click(".cta-create")
  await page.locator(".create-picker-option").first().click()
  await page.locator(".gi-hero .gi-cta-primary").click()
  await page.fill("#hostNameInput", "Yalla")
  await page.locator('[data-character="pebble"]').click()
  await page.getByRole("tab", { name: "Accessories" }).click()
  await page.locator('.accessory-tile[data-accessory="headphones"]').click()
  await page.locator(".avatar-picker").screenshot({ path: ".playwright-mcp/avatars-desktop.png" })
  await page.setViewportSize({ width: 360, height: 640 })
  await page.evaluate(() => localStorage.setItem("role-room:lang", "ar"))
  await page.reload()
  await page.click(".cta-create")
  await page.locator(".create-picker-option").first().click()
  await page.locator(".gi-hero .gi-cta-primary").click()
  await page.getByRole("tab", { name: "الإكسسوارات" }).click()
  await page.locator('.accessory-tile[data-accessory="propeller"]').click()
  await page.screenshot({ path: ".playwright-mcp/avatars-arabic.png" })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
  await page.locator(".host-setup-actions .btn-primary").scrollIntoViewIfNeeded()
  await expect(page.locator(".host-setup-actions .btn-primary")).toBeInViewport()
})
