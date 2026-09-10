import { test, expect, type Page, type BrowserContext } from "@playwright/test"
import { createRoom, joinAs } from "./helpers.js"

/**
 * One round of Bluff Trivia, played on three phones.
 *
 * Every player gets their own browser context — see most-likely-to.spec.ts
 * for why a shared context does not work here. Every phone acts as soon as
 * its screen allows, so each phase closes early (engine.ts's grace period)
 * rather than the test sitting through the full 30s / 25s clocks.
 */

interface Phone { ctx: BrowserContext; page: Page; name: string }

/** The reading clock is 4s; give the early-closing phases room to land too. */
const PHASE_TIMEOUT = 15_000

test("bluff trivia: a round of lies, guesses and a reveal", async ({ browser }) => {
  test.setTimeout(60_000)

  const hostCtx = await browser.newContext()
  const hostPage = await hostCtx.newPage()

  const code = await createRoom(hostPage, { theme: "bluff-trivia", hostName: "Host", hostCharacter: "ace" })

  const phones: Phone[] = []
  for (const [name, character] of [["Ada", "ruby"], ["Bea", "pebble"]] as const) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await joinAs(page, code, name, character)
    phones.push({ ctx, page, name })
  }

  await expect(hostPage.locator("#assignRolesBtn")).toBeHidden()
  await expect(hostPage.locator("#startGameBtn")).toBeVisible()
  await hostPage.click("#startGameBtn")

  const everyone = [hostPage, ...phones.map(p => p.page)]

  // QUESTION_INPUT — the same question reaches every phone, no options yet.
  for (const page of everyone) {
    await expect(page.locator("#gameStage .mlt-question")).toBeVisible({ timeout: PHASE_TIMEOUT })
  }
  const question = await hostPage.locator(".mlt-question").innerText()
  expect(question.length).toBeGreaterThan(0)
  for (const page of everyone) {
    await expect(page.locator(".mlt-question")).toHaveText(question)
  }

  // SUBMIT_LIES — everyone writes one, and it closes early once all three have.
  const draftingPlayer = phones[0]!.page
  await draftingPlayer.locator(".bluff-lie-input").waitFor({ timeout: PHASE_TIMEOUT })
  await draftingPlayer.locator(".bluff-lie-input").fill("Keep this unfinished answer")
  await draftingPlayer.locator(".bluff-lie-input").evaluate(input => {
    input.setAttribute("data-draft-node", "original")
    ;(input as HTMLTextAreaElement).setSelectionRange(5, 9)
  })
  for (const [page, lie] of [[hostPage, "A whole submarine sandwich"], [phones[0]!.page, "Forty gallons of paint"], [phones[1]!.page, "A retired circus lion"]] as const) {
    await expect(page.locator(".bluff-lie-input")).toBeVisible({ timeout: PHASE_TIMEOUT })
    await page.locator(".bluff-lie-input").fill(lie)
    await page.locator(".bluff-submit").click()
    if (page === hostPage) {
      await expect(draftingPlayer.locator(".mlt-counter")).toContainText("1 / 3")
      await expect(draftingPlayer.locator(".bluff-lie-input")).toHaveValue("Keep this unfinished answer")
      await expect(draftingPlayer.locator(".bluff-lie-input")).toHaveAttribute("data-draft-node", "original")
      expect(await draftingPlayer.locator(".bluff-lie-input").evaluate(input => {
        const field = input as HTMLTextAreaElement
        return [field === document.activeElement, field.selectionStart, field.selectionEnd]
      })).toEqual([true, 5, 9])
    }
  }
  for (const page of everyone) {
    await expect(page.locator(".bluff-lie-input")).toBeDisabled()
  }

  // GUESSING_PHASE — the pool includes the real answer plus every distinct lie.
  for (const page of everyone) {
    await expect(page.locator(".bluff-option").first()).toBeVisible({ timeout: PHASE_TIMEOUT })
  }
  const hostOptionCount = await hostPage.locator(".bluff-option").count()
  expect(hostOptionCount).toBeGreaterThanOrEqual(4)
  for (const page of everyone) {
    await expect(page.locator(".bluff-option")).toHaveCount(hostOptionCount)
  }

  // Your own lie is shown — the reveal names its author later — but sealed
  // from selection, not hidden from the screen.
  const hostOwnOption = hostPage.locator(".bluff-option", { hasText: "A whole submarine sandwich" })
  await expect(hostOwnOption).toBeVisible()
  await expect(hostOwnOption).toBeDisabled()

  // Everyone guesses the first option that is not their own — closing the
  // phase early once the last guess lands.
  for (const page of everyone) {
    await page.locator(".bluff-option:not(:disabled)").first().click()
  }
  for (const page of everyone) {
    await expect(page.locator(".bluff-option.chosen")).toHaveCount(1)
  }

  // SCORE_REVEAL — every option opens, the real answer among them, and a
  // scoreboard everyone can read.
  for (const page of everyone) {
    await expect(page.locator(".bluff-reveal-list")).toBeVisible({ timeout: PHASE_TIMEOUT })
    await expect(page.locator(".bluff-reveal-row")).toHaveCount(hostOptionCount)
    await expect(page.locator(".bluff-scoreboard .bluff-score-row")).toHaveCount(3)
  }

  // Only the host moves the room on.
  await expect(phones[0]!.page.locator(".mlt-advance")).toHaveCount(0)
  await expect(hostPage.locator(".mlt-advance")).toBeVisible()
  await hostPage.locator(".mlt-advance").click()

  for (const page of everyone) {
    await expect(page.locator(".mlt-round")).toContainText("2", { timeout: PHASE_TIMEOUT })
  }

  // Ending the game hands every phone back to the room it was sitting in.
  await hostPage.locator(".mlt-end").click()
  for (const page of everyone) {
    await expect(page.locator("#gameStage")).toBeHidden({ timeout: PHASE_TIMEOUT })
  }
  await expect(hostPage.locator("#startGameBtn")).toBeVisible()

  for (const phone of phones) await phone.ctx.close()
  await hostCtx.close()
})
