import { test, expect, type BrowserContext, type Page } from "@playwright/test"
import { createRoom, joinAs } from "./helpers"

async function table(browser: { newContext(): Promise<BrowserContext> }, code: string) {
  const contexts: BrowserContext[] = []
  const pages: Page[] = []
  for (const [name, character] of [["Ada", "ruby"], ["Bea", "pebble"]] as const) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await joinAs(page, code, name, character)
    contexts.push(ctx)
    pages.push(page)
  }
  return { contexts, pages }
}

test("spy game: the host opens an online vote and the result names voters when asked", async ({ browser }) => {
  test.setTimeout(60_000)
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createRoom(host, { hostName: "Zeynep", theme: "spy-game" })
  const { contexts, pages } = await table(browser, code)

  // No vote before the deal.
  await expect(host.locator("#startGameBtn")).toBeHidden()
  await host.locator("#setting-spyShowVoters").setChecked(true)
  await host.click("#assignRolesBtn")
  await expect(host.locator("#startGameBtn")).toBeVisible()
  await expect(host.locator("#startGameBtn")).toHaveText("Start the Vote")
  // Role cards are left open on purpose: the vote must close them itself.
  await expect(pages[0]!.locator(".reveal-overlay")).toBeVisible()
  await host.locator(".reveal-close").click()
  await host.click("#startGameBtn")

  for (const page of [host, ...pages]) {
    await expect(page.locator(".mlt-question")).toHaveText("Who is the spy?")
    // Two others to point at; nobody gets a button for themselves.
    await expect(page.locator(".mlt-target")).toHaveCount(2)
    await page.locator(".mlt-target").first().click()
    await expect(page.locator(".mlt-target").first()).toBeDisabled()
  }

  for (const page of [host, ...pages]) {
    await expect(page.locator(".mlt-verdict")).toBeVisible({ timeout: 10_000 })
    await expect(page.locator(".mlt-bar-voters").first()).toContainText("Voted by")
    await expect(page.locator(".mlt-stage, .mlt")).toContainText("Spies")
  }

  await host.getByRole("button", { name: "Back to the Room" }).click()
  await expect(host.locator("#gameStage")).toBeHidden()

  for (const ctx of contexts) await ctx.close()
  await hostCtx.close()
})

test("the host hands the room to a player and sits down as an ordinary one", async ({ browser }) => {
  test.setTimeout(60_000)
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createRoom(host, { hostName: "Zeynep", theme: "spy-game" })
  const { contexts, pages } = await table(browser, code)
  const ada = pages[0]!

  const adaRow = host.locator(".player-row", { hasText: "Ada" })
  await adaRow.locator(".host-btn").click()
  await host.locator(".confirm-ok").click()

  await expect(ada.locator("#adminView.active-view")).toBeVisible()
  await expect(ada.locator("#roomCodeText")).toHaveText(code)
  await expect(host.locator("#playerRoomView.active-view")).toBeVisible()
  await expect(host.locator("#playerWelcome")).toContainText("Zeynep")

  // Both sides keep their new seats across a reload.
  await ada.reload()
  await expect(ada.locator("#adminView.active-view")).toBeVisible()
  await host.reload()
  await expect(host.locator("#playerRoomView.active-view")).toBeVisible()

  // The new host runs the room: the deal reaches the former host as a player.
  await ada.click("#assignRolesBtn")
  await expect(ada.locator("#rolesStatus")).toHaveText("✓")

  for (const ctx of contexts) await ctx.close()
  await hostCtx.close()
})
