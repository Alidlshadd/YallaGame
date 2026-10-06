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
const PHASE_TIMEOUT = 30_000

test.setTimeout(60_000)

test("most likely to: the host chooses the bank-question count and replay keeps question history", async ({ browser }) => {
  test.setTimeout(100_000)
  const contexts = await Promise.all([browser.newContext(), browser.newContext()])
  try {
    const [host, player] = await Promise.all(contexts.map(ctx => ctx.newPage())) as [Page, Page]
    const code = await createRoom(host, { theme: "most-likely-to", hostName: "Host", hostCharacter: "ace" })
    await joinAs(player, code, "Ada", "ruby")
    const seen = new Set<string>()
    for (const count of [1, 2]) {
      await expect(host.locator("#setting-roundCount")).toBeVisible()
      await host.locator("#setting-roundCount").fill(String(count))
      await host.locator("#setting-votingSeconds").fill("10")
      // Start applies the host's selection without a separate Save click.
      await host.locator("#startGameBtn").click()
      for (let round = 1; round <= count; round++) {
        await expect(host.locator(".mlt-round")).toContainText(String(round))
        await expect(host.locator(".mlt-question")).toBeVisible()
        const question = await host.locator(".mlt-question").innerText()
        expect(seen.has(question)).toBe(false)
        seen.add(question)
        for (const page of [host, player]) {
          await expect(page.locator(".mlt-question")).toHaveText(question)
          await expect(page.locator(".mlt-target").first()).toBeVisible({ timeout: PHASE_TIMEOUT })
          await page.locator(".mlt-target").first().click()
        }
        await expect(host.locator(".mlt-bars")).toBeVisible({ timeout: PHASE_TIMEOUT })
        await host.locator(".mlt-advance").click()
      }
      await expect(host.locator(".mlt-target")).toHaveCount(0)
      await expect(host.locator(".mlt-bars")).toBeVisible()
      await expect(host.locator(".mlt-advance")).toHaveText("Back to the Room")
      // Feedback appears once per game type on each browser, including reloads.
      if (count === 1) {
        for (const page of [host, player]) {
          await expect(page.locator("#gameFeedbackOverlay")).toBeVisible()
          await page.locator(".feedback-close").click()
        }
      }
      await host.locator(".mlt-advance").click()
      await expect(host.locator("#gameStage")).toBeHidden()
      await host.reload()
      await expect(host.locator("#setting-roundCount")).toHaveValue(String(count))
    }
    expect(seen.size).toBe(3)
  } finally {
    await Promise.all(contexts.map(ctx => ctx.close()))
  }
})

test("most likely to: everyone can write or pass and questions play in player order", async ({ browser }) => {
  test.setTimeout(120_000)
  const contexts = await Promise.all([browser.newContext(), browser.newContext(), browser.newContext()])
  try {
    const [host, ada, bea] = await Promise.all(contexts.map(ctx => ctx.newPage())) as [Page, Page, Page]
    const everyone = [host, ada, bea]
    const code = await createRoom(host, { theme: "most-likely-to", hostName: "Host", hostCharacter: "ace" })
    await joinAs(ada, code, "Ada", "ruby")
    await joinAs(bea, code, "Bea", "pebble")
    await host.locator("#setting-customQuestionsEnabled").setChecked(true)
    await host.locator("#setting-customQuestionSeconds").fill("60")
    await host.locator("#setting-votingSeconds").fill("10")
    await host.click("#saveSettingsBtn")
    await host.click("#startGameBtn")

    const finishVoting = async (): Promise<void> => {
      for (const page of everyone) {
        await expect(page.locator(".mlt-target").first()).toBeVisible({ timeout: PHASE_TIMEOUT })
        await page.locator(".mlt-target").first().click()
      }
      for (const page of everyone) await expect(page.locator(".mlt-bars")).toBeVisible({ timeout: PHASE_TIMEOUT })
      await host.locator(".mlt-advance").click()
    }

    await finishVoting()
    for (const page of everyone) {
      await expect(page.locator(".mlt-custom-choices")).toBeVisible()
      await page.locator(".mlt-custom-choices .btn-primary").click()
    }

    await host.locator(".mlt-custom-form textarea").fill("Host question, written slowly")
    await ada.locator(".mlt-custom-form textarea").fill("Ada question, sent first")
    await ada.locator(".mlt-custom-form .btn-primary").click()
    await expect(ada.locator(".mlt-custom-form")).toHaveCount(0)
    await ada.reload()
    await expect(ada.locator("#gameStage .mlt-hint")).toBeVisible()
    await expect(ada.locator(".mlt-custom-choices")).toHaveCount(0)

    // Another player's submission and reconnect must preserve the open draft.
    await expect(host.locator(".mlt-custom-form textarea")).toBeVisible()
    await expect(host.locator(".mlt-custom-form textarea")).toHaveValue("Host question, written slowly")
    // A player may still pass after opening the writing form.
    await bea.locator(".mlt-custom-form .btn-ghost").click()
    await expect(bea.locator(".mlt-custom-form")).toHaveCount(0)
    await host.locator(".mlt-custom-form .btn-primary").click()

    for (const question of ["Host question, written slowly", "Ada question, sent first"]) {
      for (const page of everyone) {
        await expect(page.locator(".mlt-question")).toHaveText(question, { timeout: PHASE_TIMEOUT })
      }
      await finishVoting()
    }
    // Custom questions are extra: the second bank question still has to play.
    for (const page of everyone) await expect(page.locator(".mlt-question")).not.toHaveText("Ada question, sent first")
    await finishVoting()
    // The next writing window opens after that bank question.
    for (const page of everyone) await expect(page.locator(".mlt-custom-choices")).toBeVisible()
    await host.locator(".mlt-end").click()
  } finally {
    await Promise.all(contexts.map(ctx => ctx.close()))
  }
})

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

  // Everyone votes; the host can still change their choice afterwards.
  await hostPage.locator(".mlt-target", { hasText: "Bea" }).click()
  await phones[0]!.page.locator(".mlt-target", { hasText: "Bea" }).click()
  await phones[1]!.page.locator(".mlt-target", { hasText: "Ada" }).click()

  // Changing a vote moves the highlight and keeps the count at three voters.
  await expect(hostPage.locator(".mlt-target.chosen")).toHaveCount(1)
  await expect(hostPage.locator(".mlt-target", { hasText: "Ada" })).toBeEnabled()
  await hostPage.locator(".mlt-target", { hasText: "Ada" }).click()
  await expect(hostPage.locator(".mlt-target.chosen")).toHaveText("Ada")
  await expect(hostPage.locator(".mlt-target", { hasText: "Bea" })).toBeEnabled()
  await expect(hostPage.locator(".mlt-counter")).toContainText("3 / 3")
  await hostPage.reload()
  await expect(hostPage.locator(".mlt-target.chosen")).toHaveText("Ada")
  await expect(hostPage.locator(".mlt-target", { hasText: "Bea" })).toBeEnabled()

  // ROUND_RESULT — the votes open for everybody at once.
  for (const page of everyone) {
    await expect(page.locator(".mlt-bars")).toBeVisible({ timeout: PHASE_TIMEOUT })
    await expect(page.locator(".mlt-bar")).toHaveCount(3)
    // The host's replacement gives Ada two votes; the old vote is gone.
    await expect(page.locator(".mlt-bar").first()).toContainText("Ada")
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

test("most likely to: the host can open the names up, and they stay shut until the reveal", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const hostPage = await hostCtx.newPage()
  const code = await createRoom(hostPage, { theme: "most-likely-to", hostName: "Host", hostCharacter: "ace" })

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await joinAs(page, code, "Ada", "ruby")

  // The setting is a plain room setting, so it is chosen before the game runs.
  await hostPage.locator("#setting-showVoters").setChecked(true)
  await hostPage.click("#saveSettingsBtn")
  await expect(hostPage.locator("#setting-showVoters")).toBeChecked()

  await hostPage.click("#startGameBtn")
  await expect(page.locator(".mlt-target").first()).toBeVisible({ timeout: PHASE_TIMEOUT })

  // Still being cast: nothing on screen says who has pointed where.
  await page.locator(".mlt-target", { hasText: "Host" }).click()
  await expect(page.locator(".mlt-bar-voters")).toHaveCount(0)

  await hostPage.locator(".mlt-target", { hasText: "Ada" }).click()

  // Opened: every row that took a vote names who cast it.
  for (const p of [hostPage, page]) {
    await expect(p.locator(".mlt-bars")).toBeVisible({ timeout: PHASE_TIMEOUT })
    // Matched on the name cell: a plain hasText also hits the row whose voter
    // line happens to mention the same person.
    await expect(p.locator('.mlt-bar:has(.mlt-bar-name:text-is("Host")) .mlt-bar-voters')).toContainText("Ada")
    await expect(p.locator('.mlt-bar:has(.mlt-bar-name:text-is("Ada")) .mlt-bar-voters')).toContainText("Host")
  }

  await ctx.close()
  await hostCtx.close()
})

test("most likely to: with the setting off the reveal never names a voter", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const hostPage = await hostCtx.newPage()
  const code = await createRoom(hostPage, { theme: "most-likely-to", hostName: "Host", hostCharacter: "ace" })

  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await joinAs(page, code, "Ada", "ruby")

  await expect(hostPage.locator("#setting-showVoters")).not.toBeChecked()
  await hostPage.click("#startGameBtn")

  await expect(page.locator(".mlt-target").first()).toBeVisible({ timeout: PHASE_TIMEOUT })
  await page.locator(".mlt-target", { hasText: "Host" }).click()
  await hostPage.locator(".mlt-target", { hasText: "Ada" }).click()

  for (const p of [hostPage, page]) {
    await expect(p.locator(".mlt-bars")).toBeVisible({ timeout: PHASE_TIMEOUT })
    await expect(p.locator(".mlt-bar-voters")).toHaveCount(0)
  }

  await ctx.close()
  await hostCtx.close()
})
