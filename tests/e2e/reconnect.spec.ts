import { test, expect } from "@playwright/test"
import { createRoom, joinAs } from "./helpers.js"

test("reconnect: A reloads while B stays — A re-binds, B unaffected, no privacy leak", async ({ browser }) => {
  const adminCtx = await browser.newContext()
  const admin = await adminCtx.newPage()
  const code = await createRoom(admin)

  const ctxA = await browser.newContext(); const pageA = await ctxA.newPage(); await joinAs(pageA, code, "Ada", "ruby")
  const ctxB = await browser.newContext(); const pageB = await ctxB.newPage(); await joinAs(pageB, code, "Bea", "pebble")
  const ctxC = await browser.newContext(); const pageC = await ctxC.newPage(); await joinAs(pageC, code, "Cem", "gizmo")

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
