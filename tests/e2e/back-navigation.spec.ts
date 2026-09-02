import { test, expect, type Page } from "@playwright/test"

/**
 * The phone back button. Players kept getting stranded on screens that had no
 * way out but a page reload, so every one of these paths is a regression guard.
 */

const activeView = (page: Page) => page.locator("section.view.active-view")

test("the world page returns home on a back press", async ({ page }) => {
  await page.goto("/")
  await page.locator(".shelf-card.game-card").first().click()
  await expect(activeView(page)).toHaveAttribute("id", "gameInfoView")

  await page.goBack()
  await expect(activeView(page)).toHaveAttribute("id", "homeView")
})

test("the create-room picker closes on a back press instead of leaving the page", async ({ page }) => {
  await page.goto("/")
  await page.click(".cta-create")
  await expect(page.locator("#createPickerOverlay")).toBeVisible()

  await page.goBack()
  await expect(page.locator("#createPickerOverlay")).toHaveCount(0)
  await expect(activeView(page)).toHaveAttribute("id", "homeView")
})

test("the create-room picker has a close button", async ({ page }) => {
  await page.goto("/")
  await page.click(".cta-create")
  await page.click("#createPickerOverlay .modal-close")
  await expect(page.locator("#createPickerOverlay")).toHaveCount(0)
})

test("local play walks back one setup step at a time", async ({ page }) => {
  await page.goto("/")
  await page.click(".cta-local")
  await expect(activeView(page)).toHaveAttribute("id", "localPlayView")
  // Step 1 of the wizard is the picker: the only way on is out of the view.
  await expect(page.locator("#localPlayBack")).toHaveText("Exit")

  await page.locator(".lp-game-card").first().click()
  await expect(page.locator("#localPlayBack")).toHaveText("Back")

  // Back steps to the picker, still inside Local Play…
  await page.goBack()
  await expect(activeView(page)).toHaveAttribute("id", "localPlayView")
  await expect(page.locator(".lp-game-grid")).toBeVisible()

  // …and only then leaves for the home stage.
  await page.goBack()
  await expect(activeView(page)).toHaveAttribute("id", "homeView")
})

test("a room asks before a back press abandons it", async ({ page }) => {
  await page.goto("/")
  await page.click(".cta-create")
  await page.locator(".create-picker-option").first().click()
  await page.locator(".gi-hero .gi-cta-primary").click()
  await expect(page.locator("#roomCodeText")).not.toHaveText("-----")

  await page.goBack()
  await expect(page.locator("#confirmOverlay")).toBeVisible()

  // Staying keeps both the room and the ability to press back again.
  await page.click(".confirm-cancel")
  await expect(page.locator("#confirmOverlay")).toHaveCount(0)
  await expect(activeView(page)).toHaveAttribute("id", "adminView")

  await page.goBack()
  await expect(page.locator("#confirmOverlay")).toBeVisible()
  await page.click(".confirm-ok")
  await expect(activeView(page)).toHaveAttribute("id", "homeView")
})

test("a player is asked before a back press drops them out of a room", async ({ browser }) => {
  const adminCtx = await browser.newContext()
  const admin = await adminCtx.newPage()
  await admin.goto("/")
  await admin.click(".cta-create")
  await admin.locator(".create-picker-option").first().click()
  await admin.locator(".gi-hero .gi-cta-primary").click()
  await expect(admin.locator("#roomCodeText")).not.toHaveText("-----")
  const code = await admin.locator("#roomCodeText").innerText()

  const playerCtx = await browser.newContext()
  const player = await playerCtx.newPage()
  await player.goto("/")
  await player.click(".cta-join")
  await player.fill("#joinCodeInput", code)
  await player.fill("#playerNameInput", "Ada")
  await player.click("#joinBtn")
  await expect(player.locator("#playerWelcome")).toHaveText("Ada")

  await player.goBack()
  await expect(player.locator("#confirmOverlay")).toBeVisible()
  await player.click(".confirm-cancel")
  await expect(activeView(player)).toHaveAttribute("id", "playerRoomView")

  await player.goBack()
  await expect(player.locator("#confirmOverlay")).toBeVisible()
  await player.click(".confirm-ok")
  await expect(activeView(player)).toHaveAttribute("id", "homeView")

  await adminCtx.close()
  await playerCtx.close()
})
