import { test, expect } from "@playwright/test"
import { io, type Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents, AckResult, CreateRoomData } from "../../src/shared/events.js"
import { createRoom, joinAs } from "./helpers.js"

test("players can review or dismiss once per game, with thanks after saving and no repeat after reload", async ({ browser, baseURL }) => {
  test.setTimeout(90_000)
  const hostContext = await browser.newContext()
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const otherContext = await browser.newContext()
  const host = await hostContext.newPage(), mobile = await mobileContext.newPage(), other = await otherContext.newPage()
  const bot: Socket<ServerToClientEvents, ClientToServerEvents> = io(baseURL!, { forceNew: true })
  const secondHost: Socket<ServerToClientEvents, ClientToServerEvents> = io(baseURL!, { forceNew: true })
  const errors: string[] = []
  for (const page of [host, mobile, other]) page.on("pageerror", error => errors.push(error.message))
  try {
    const code = await createRoom(host, { theme: "vampire-village" })
    await mobile.addInitScript(() => localStorage.setItem("role-room:lang", "tr"))
    await joinAs(mobile, code, "Ada", "ruby")
    await joinAs(other, code, "Bea", "pebble")
    const joined = await bot.timeout(5000).emitWithAck("player:join", { code, name: "Cem" })
    expect(joined.ok).toBe(true)
    await host.click("#assignRolesBtn")
    await expect(host.locator("#rolesStatus")).toHaveText("✓")
    await expect(mobile.locator("#gameFeedbackOverlay")).toHaveCount(0)
    await host.click("#finishGameBtn")
    await expect(mobile.locator("#gameFeedbackOverlay")).toBeVisible()
    await expect(other.locator("#gameFeedbackOverlay")).toBeVisible()
    await expect(host.locator("#gameFeedbackOverlay")).toHaveCount(0)
    await expect(mobile.locator(".feedback-star")).toHaveCount(5)
    await expect(mobile.locator(".feedback-submit")).toBeDisabled()
    await mobile.getByRole("radio", { name: "5 / 5", exact: true }).click()
    await mobile.locator("#gameFeedbackComment").fill("Oyun çok güzel. Ses ayarı eklenebilir.")
    await expect(mobile.locator(".feedback-star").first()).toHaveCSS("color", "rgb(255, 198, 92)")
    await mobile.screenshot({ path: "test-results/feedback-mobile.png" })
    const saved = mobile.waitForResponse(response => response.url().endsWith("/api/feedback") && response.request().method() === "POST")
    await mobile.locator(".feedback-submit").click()
    expect((await saved).ok()).toBe(true)
    await expect(mobile.locator(".feedback-thanks")).toBeVisible()
    await expect(mobile.locator("#gameFeedbackTitle")).toHaveText("Teşekkürler!")
    await expect(mobile.locator(".feedback-check")).toHaveCSS("opacity", "1")
    await mobile.screenshot({ path: "test-results/feedback-thanks.png" })
    await other.locator(".feedback-close").click()
    await expect(other.locator("#gameFeedbackOverlay")).toHaveCount(0)
    await expect(mobile.locator("#gameFeedbackOverlay")).toHaveCount(0, { timeout: 5000 })
    await mobile.reload(); await other.reload()
    await expect(mobile.locator("#playerWelcome")).toContainText("Ada")
    await expect(other.locator("#playerWelcome")).toContainText("Bea")
    await host.click("#assignRolesBtn")
    await expect(host.locator("#rolesStatus")).toHaveText("✓")
    await host.click("#finishGameBtn")
    await expect(host.locator("#finishGameBtn")).toBeHidden()
    for (const page of [mobile, other]) await expect(page.locator("#gameFeedbackOverlay")).toHaveCount(0)

    const created: AckResult<CreateRoomData> = await secondHost.timeout(5000).emitWithAck("admin:create-room", {
      gameId: "spy-game", hostName: "Host", hostCharacter: "ace", isPublic: false, requireApproval: false
    })
    if (!created.ok) throw new Error(created.error)
    const next = created.data
    for (const [page, name, character] of [[mobile, "Ada", "ruby"], [other, "Bea", "pebble"]] as const) {
      await page.goto(`/?join=${next.code}`)
      await page.fill("#joinSetupName", name)
      await page.locator(`#joinSetupCharacters [data-character="${character}"]`).click()
      await page.click("#joinSetupSubmit")
      await expect(page.locator("#playerWelcome")).toContainText(name)
    }
    expect((await secondHost.timeout(5000).emitWithAck("admin:assign-roles", { code: next.code, adminSecret: next.adminSecret })).ok).toBe(true)
    expect((await secondHost.timeout(5000).emitWithAck("admin:clear-roles", { code: next.code, adminSecret: next.adminSecret, finished: true })).ok).toBe(true)
    for (const page of [mobile, other]) {
      await expect(page.locator("#gameFeedbackOverlay")).toBeVisible()
      await page.locator(".feedback-close").click()
    }
    expect(errors).toEqual([])
  } finally {
    bot.disconnect(); secondHost.disconnect()
    await hostContext.close(); await mobileContext.close(); await otherContext.close()
  }
})
