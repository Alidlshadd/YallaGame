import { test, expect, type Page, type BrowserContext } from "@playwright/test"
import { createRoom, joinAs } from "./helpers.js"

/**
 * One evening of Most Likely To, played on three phones.
 *
 * Every player gets their own browser context: one shared context would share
 * the session storage the room code and player id live in, and the second
 * "phone" would quietly take over the first one's seat.
 */

interface Phone { ctx: BrowserContext; page: Page; name: string }

/** The reading clock is 5s and voting is 20s; give the phases room to land. */
const PHASE_TIMEOUT = 15_000

test("most likely to: a round of secret votes opens together", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const hostPage = await hostCtx.newPage()

  const code = await createRoom(hostPage, { theme: "most-likely-to", hostName: "Host", hostCharacter: "ace" })

  const phones: Phone[] = []
  for (const [name, character] of [["Ada", "ruby"], ["Bea", "pebble"]] as const) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await joinAs(page, code, name, character)
    phones.push({ ctx, page, name })
  }

  // A turn-based world is started, not dealt.
  await expect(hostPage.locator("#assignRolesBtn")).toBeHidden()
  await expect(hostPage.locator("#startGameBtn")).toBeVisible()
  await hostPage.click("#startGameBtn")

  const everyone = [hostPage, ...phones.map(p => p.page)]

  // QUESTION_DISPLAY — the same question reaches every phone.
  for (const page of everyone) {
    await expect(page.locator("#gameStage .mlt-question")).toBeVisible({ timeout: PHASE_TIMEOUT })
  }
  const question = await hostPage.locator(".mlt-question").innerText()
  expect(question.length).toBeGreaterThan(0)
  for (const page of everyone) {
    await expect(page.locator(".mlt-question")).toHaveText(question)
  }

  // VOTING — buttons for everybody but yourself.
  for (const page of everyone) {
    await expect(page.locator(".mlt-target").first()).toBeVisible({ timeout: PHASE_TIMEOUT })
    await expect(page.locator(".mlt-target")).toHaveCount(2)
  }
  await expect(phones[0]!.page.locator(".mlt-target", { hasText: "Ada" })).toHaveCount(0)

  // Two of the three point at Ada, the host points at Bea.
  await hostPage.locator(".mlt-target", { hasText: "Bea" }).click()
  await phones[0]!.page.locator(".mlt-target", { hasText: "Bea" }).click()
  await phones[1]!.page.locator(".mlt-target", { hasText: "Ada" }).click()

  // A cast vote locks the round for that phone.
  await expect(hostPage.locator(".mlt-target.chosen")).toHaveCount(1)
  await expect(hostPage.locator(".mlt-target").first()).toBeDisabled()

  // ROUND_RESULT — the votes open for everybody at once.
  for (const page of everyone) {
    await expect(page.locator(".mlt-bars")).toBeVisible({ timeout: PHASE_TIMEOUT })
    await expect(page.locator(".mlt-bar")).toHaveCount(3)
    // Bea took two of the three votes; the bars are ordered by count.
    await expect(page.locator(".mlt-bar").first()).toContainText("Bea")
    await expect(page.locator(".mlt-bar.winner")).toHaveCount(1)
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
  await expect(phones[0]!.page.locator("#playerRoleCard")).toBeVisible()

  for (const phone of phones) await phone.ctx.close()
  await hostCtx.close()
})

test("most likely to: a room of one cannot start", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const hostPage = await hostCtx.newPage()

  await createRoom(hostPage, { theme: "most-likely-to", hostName: "Solo", hostCharacter: "ace" })
  await hostPage.click("#startGameBtn")

  // The server refuses below minPlayers, so no stage is ever drawn.
  await expect(hostPage.locator("#toast")).not.toHaveClass(/hidden/)
  await expect(hostPage.locator("#gameStage")).toBeHidden()

  await hostCtx.close()
})

test("most likely to: a phone that reloads mid-round comes back to the round", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const hostPage = await hostCtx.newPage()
  const code = await createRoom(hostPage, { theme: "most-likely-to", hostName: "Host", hostCharacter: "ace" })

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await joinAs(page, code, "Ada", "ruby")

  await hostPage.click("#startGameBtn")
  await expect(page.locator(".mlt-target").first()).toBeVisible({ timeout: PHASE_TIMEOUT })

  // The phone locked, the tab was restored, the socket reconnected: the round
  // is still running and the screen has to be the round, not the lobby.
  await page.reload()
  await expect(page.locator("#gameStage .mlt-question")).toBeVisible({ timeout: PHASE_TIMEOUT })

  await ctx.close()
  await hostCtx.close()
})
