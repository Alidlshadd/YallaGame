import { test, expect, type Page } from "@playwright/test"

async function joinAs(page: Page, code: string, name: string): Promise<void> {
  await page.goto("/")
  await page.click("#showJoinBtn")
  await page.fill("#joinCodeInput", code)
  await page.fill("#playerNameInput", name)
  await page.click("#joinBtn")
  await expect(page.locator("#playerWelcome")).toHaveText(name)
}

test("reconnect: A reloads while B stays — A re-binds, B unaffected, no privacy leak", async ({ browser }) => {
  const adminCtx = await browser.newContext()
  const admin = await adminCtx.newPage()
  await admin.goto("/")
  await admin.locator(".game-card").first().click()
  await admin.click("#createSelectedRoomBtn")
  await expect(admin.locator("#roomCodeText")).not.toHaveText("-----")
  const code = await admin.locator("#roomCodeText").innerText()

  const ctxA = await browser.newContext(); const pageA = await ctxA.newPage(); await joinAs(pageA, code, "Ada")
  const ctxB = await browser.newContext(); const pageB = await ctxB.newPage(); await joinAs(pageB, code, "Bea")
  const ctxC = await browser.newContext(); const pageC = await ctxC.newPage(); await joinAs(pageC, code, "Cem")

  await admin.click("#assignRolesBtn")
  await expect(admin.locator("#rolesStatus")).toHaveText("✓")

  const roleABefore = await pageA.locator("#playerRoleCard h3").innerText()

  await pageA.reload()
  await expect(pageA.locator("#playerWelcome")).toHaveText("Ada")
  await expect(pageA.locator("#playerRoleCard h3")).toHaveText(roleABefore)

  await expect(pageB.locator("body")).not.toContainText(roleABefore)

  await admin.reload()
  await expect(admin.locator("#roomCodeText")).toHaveText(code)

  await ctxA.close(); await ctxB.close(); await ctxC.close(); await adminCtx.close()
})
