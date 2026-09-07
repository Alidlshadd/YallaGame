import { test, expect } from "@playwright/test"
import { createRoom, joinAs, submitJoin } from "./helpers.js"

const activeView = (page: import("@playwright/test").Page) =>
  page.locator("section.view.active-view")

test("a public room shows up in the browser with its host and game; a private one does not", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createRoom(host, { hostName: "Zeynep", isPublic: true })

  const privateCtx = await browser.newContext()
  const privateHost = await privateCtx.newPage()
  const privateCode = await createRoom(privateHost, { hostName: "Gizli", isPublic: false })

  const playerCtx = await browser.newContext()
  const player = await playerCtx.newPage()
  await player.goto("/")
  await player.click(".cta-join")

  const row = player.locator(".lobby-row", { hasText: code })
  await expect(row).toBeVisible()
  await expect(row).toContainText("Zeynep")
  // The host counts as a player, so an untouched room already reads as 1.
  await expect(row.locator(".lobby-count")).toContainText("1")

  await expect(player.locator(".lobby-row", { hasText: privateCode })).toHaveCount(0)

  await hostCtx.close(); await privateCtx.close(); await playerCtx.close()
})

test("joining straight from a room browser row seats the player", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createRoom(host, { hostName: "Zeynep", isPublic: true })

  const playerCtx = await browser.newContext()
  const player = await playerCtx.newPage()
  await player.goto("/")
  await player.click(".cta-join")
  await player.fill("#playerNameInput", "Ada")
  await player.locator(".lobby-row", { hasText: code }).locator(".lobby-join").click()

  await expect(player.locator("#playerWelcome")).toHaveText("Ada")
  await expect(host.locator("#adminPlayersList")).toContainText("Ada")

  await hostCtx.close(); await playerCtx.close()
})

test("a nameless join is refused before it reaches the server", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createRoom(host, { isPublic: true })

  const playerCtx = await browser.newContext()
  const player = await playerCtx.newPage()
  await player.goto("/")
  await player.click(".cta-join")
  await player.fill("#joinCodeInput", code)
  // Whitespace is not a name: the field trims before it decides.
  await player.fill("#playerNameInput", "   ")
  await player.click("#joinBtn")

  await expect(player.locator("#joinMessage")).toBeVisible()
  await expect(activeView(player)).toHaveAttribute("id", "joinView")

  await hostCtx.close(); await playerCtx.close()
})

test("a room cannot be created without a host name", async ({ page }) => {
  await page.goto("/")
  await page.click(".cta-create")
  await page.locator(".create-picker-option").first().click()
  await page.locator(".gi-hero .gi-cta-primary").click()

  await expect(page.locator("#hostSetupOverlay")).toBeVisible()
  await page.fill("#hostNameInput", "  ")
  await page.locator(".host-setup-actions .btn-primary").click()

  await expect(page.locator(".host-setup-error")).toBeVisible()
  await expect(page.locator("#hostSetupOverlay")).toBeVisible()
})

test("the host accepts a join request; the player waits until they do", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createRoom(host, { hostName: "Zeynep", isPublic: true, requireApproval: true })

  const playerCtx = await browser.newContext()
  const player = await playerCtx.newPage()
  await submitJoin(player, code, "Ada")

  await expect(activeView(player)).toHaveAttribute("id", "pendingView")
  await expect(player.locator("#pendingRoomCode")).toHaveText(code)
  // Nothing about the seat exists yet, so the room must not list them.
  await expect(host.locator("#adminPlayersList")).not.toContainText("Ada")

  const request = host.locator(".request-row", { hasText: "Ada" })
  await expect(request).toBeVisible()
  await request.locator(".btn-primary").click()

  await expect(player.locator("#playerWelcome")).toHaveText("Ada")
  await expect(host.locator("#adminPlayersList")).toContainText("Ada")
  await expect(host.locator(".request-row")).toHaveCount(0)

  await hostCtx.close(); await playerCtx.close()
})

test("a rejected player is sent back to the browser and never enters the room", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createRoom(host, { hostName: "Zeynep", isPublic: true, requireApproval: true })

  const playerCtx = await browser.newContext()
  const player = await playerCtx.newPage()
  await submitJoin(player, code, "Ada")
  await expect(activeView(player)).toHaveAttribute("id", "pendingView")

  await host.locator(".request-row", { hasText: "Ada" }).locator(".btn-ghost").click()

  await expect(activeView(player)).toHaveAttribute("id", "joinView")
  await expect(host.locator("#adminPlayersList")).not.toContainText("Ada")

  await hostCtx.close(); await playerCtx.close()
})

test("withdrawing a request clears it from the host's queue", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createRoom(host, { hostName: "Zeynep", isPublic: true, requireApproval: true })

  const playerCtx = await browser.newContext()
  const player = await playerCtx.newPage()
  await submitJoin(player, code, "Ada")
  await expect(host.locator(".request-row", { hasText: "Ada" })).toBeVisible()

  await player.click("#cancelRequestBtn")

  await expect(activeView(player)).toHaveAttribute("id", "joinView")
  await expect(host.locator(".request-row")).toHaveCount(0)

  await hostCtx.close(); await playerCtx.close()
})

test("turning approval off lets everyone already queued straight in", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createRoom(host, { hostName: "Zeynep", isPublic: true, requireApproval: true })

  const playerCtx = await browser.newContext()
  const player = await playerCtx.newPage()
  await submitJoin(player, code, "Ada")
  await expect(activeView(player)).toHaveAttribute("id", "pendingView")

  await host.locator("#roomApprovalToggle").uncheck()

  await expect(player.locator("#playerWelcome")).toHaveText("Ada")
  await expect(host.locator("#adminPlayersList")).toContainText("Ada")
  // With approval off the queue panel has nothing to say.
  await expect(host.locator("#joinRequestsPanel")).toBeHidden()

  await hostCtx.close(); await playerCtx.close()
})

test("closing a room drops it out of the browser immediately", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createRoom(host, { hostName: "Zeynep", isPublic: true })

  const playerCtx = await browser.newContext()
  const player = await playerCtx.newPage()
  await player.goto("/")
  await player.click(".cta-join")
  await expect(player.locator(".lobby-row", { hasText: code })).toBeVisible()

  await host.click("#adminLeaveBtn")
  await host.click(".confirm-ok")
  await expect(activeView(host)).toHaveAttribute("id", "homeView")

  await player.click("#refreshRoomsBtn")
  await expect(player.locator(".lobby-row", { hasText: code })).toHaveCount(0)

  await hostCtx.close(); await playerCtx.close()
})

test("the host holds a seat and is dealt a role like everyone else", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createRoom(host, { hostName: "Zeynep" })

  await expect(host.locator("#adminPlayersList")).toContainText("Zeynep")
  // The host's own row carries the badge and no kick button.
  const hostRow = host.locator(".player-row.is-host")
  await expect(hostRow).toContainText("Zeynep")
  await expect(hostRow.locator(".kick-btn")).toBeHidden()

  const contexts = []
  for (const name of ["Ada", "Bea"]) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await joinAs(page, code, name)
    contexts.push(ctx)
  }

  await host.click("#assignRolesBtn")
  await expect(host.locator("#rolesStatus")).toHaveText("✓")
  // Three seats, and the host's is one of them, so their row shows a real role.
  await expect(hostRow.locator(".player-role")).not.toHaveText("—")

  for (const ctx of contexts) await ctx.close()
  await hostCtx.close()
})
