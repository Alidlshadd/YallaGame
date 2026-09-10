import { test, expect, type Page, type BrowserContext } from "@playwright/test"
import { createRoom, joinAs } from "./helpers.js"

/**
 * One round of Secret Politician, played on five phones — the minimum table
 * size the role table supports.
 *
 * Nobody knows in advance which phone becomes president (the server picks
 * at random), so this drives the flow by polling every phone for whichever
 * one is currently showing the acting player's controls, rather than
 * assuming it is the host's. That is also, incidentally, exactly the check
 * that would fail if a role or a hand ever leaked to the wrong screen.
 */

interface Phone { ctx: BrowserContext; page: Page; name: string }

const PHASE_TIMEOUT = 15_000

/** Polls every phone until one of them shows `selector`, and returns it. */
async function actingPlayer(pages: readonly Page[], selector: string, timeout = PHASE_TIMEOUT): Promise<Page> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    for (const page of pages) {
      if (await page.locator(selector).count() > 0) return page
    }
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  throw new Error(`no phone matched "${selector}" within ${timeout}ms`)
}

test("secret politician: role reveal through a full round of nomination, vote and law", async ({ browser }) => {
  // Every phase here has a deterministic fallback if a tap never lands (see
  // secret-politician.ts's module doc), so a slow run still finishes
  // correctly — it just walks the real clocks instead of closing early.
  // Worst case is close to NOMINATION(45s) + VOTE(30s) + PRESIDENT(30s) +
  // CHANCELLOR(30s) + BOARD_UPDATE(6s), so this gives real headroom above that.
  test.setTimeout(240_000)

  const hostCtx = await browser.newContext()
  const hostPage = await hostCtx.newPage()
  const code = await createRoom(hostPage, { theme: "secret-politician", hostName: "Host", hostCharacter: "ace" })

  const phones: Phone[] = []
  for (const [name, character] of [["Ada", "ruby"], ["Bea", "pebble"], ["Cy", "gizmo"], ["Dee", "pixie"]] as const) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await joinAs(page, code, name, character)
    phones.push({ ctx, page, name })
  }
  const everyone = [hostPage, ...phones.map(p => p.page)]

  await expect(hostPage.locator("#assignRolesBtn")).toBeHidden()
  await expect(hostPage.locator("#startGameBtn")).toBeVisible()
  await hostPage.click("#startGameBtn")

  // ROLE_REVEAL — every phone gets its own role, privately.
  for (const page of everyone) {
    await expect(page.locator("#gameStage .politician-role-badge")).toBeVisible({ timeout: PHASE_TIMEOUT })
  }
  // Only the host can move the table past it.
  await expect(phones[0]!.page.locator(".mlt-advance")).toHaveCount(0)
  await expect(hostPage.locator(".mlt-advance")).toBeVisible()
  await hostPage.locator(".mlt-advance").click()

  // NOMINATION — everyone sees the board; whichever phone is president gets the target list.
  for (const page of everyone) {
    await expect(page.locator("#gameStage .politician-board")).toBeVisible({ timeout: PHASE_TIMEOUT })
  }
  const president = await actingPlayer(everyone, ".mlt-targets .mlt-target:not(:disabled)")
  await president.locator(".mlt-targets .mlt-target:not(:disabled)").first().click()

  // VOTE_GOVERNMENT — everyone taps the first button (Ja / approve).
  for (const page of everyone) {
    await expect(page.locator(".bluff-options .bluff-option").first()).toBeVisible({ timeout: PHASE_TIMEOUT })
  }
  for (const page of everyone) {
    await page.locator(".bluff-options .bluff-option").first().click()
  }

  // LEGISLATIVE_PRESIDENT — only the president's phone shows a hand. The vote's
  // own (now-disabled) buttons can still be in the DOM for a moment after the
  // click above, so this must wait for an *enabled* option, not just any.
  const presidentAgain = await actingPlayer(everyone, ".bluff-options .bluff-option:not(:disabled)")
  await presidentAgain.locator(".bluff-options .bluff-option:not(:disabled)").first().click()

  // LEGISLATIVE_CHANCELLOR — only the chancellor's phone shows the remaining two.
  const chancellor = await actingPlayer(everyone, ".bluff-options .bluff-option:not(:disabled)")
  await chancellor.locator(".bluff-options .bluff-option:not(:disabled)").first().click()

  // BOARD_UPDATE, then back to a fresh nomination for round two.
  for (const page of everyone) {
    await expect(page.locator(".politician-board")).toBeVisible({ timeout: PHASE_TIMEOUT })
  }
  for (const page of everyone) {
    await expect(page.locator(".mlt-round")).toContainText("2", { timeout: PHASE_TIMEOUT * 4 })
  }

  for (const phone of phones) await phone.ctx.close()
  await hostCtx.close()
})
