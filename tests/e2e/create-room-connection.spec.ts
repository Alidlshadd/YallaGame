import { test, expect } from "@playwright/test"

test("offline creation times out visibly, keeps the avatar and can be retried", async ({ page, context }) => {
  test.setTimeout(45_000)
  await page.goto("/")
  await page.click(".cta-create")
  await page.locator(".create-picker-option").first().click()
  await page.locator(".gi-hero .gi-cta-primary").click()
  await page.fill("#hostNameInput", "Reconnect Host")
  await page.locator('[data-character="morinji"]').click()
  await context.setOffline(true)
  const create = page.locator(".host-setup-actions .btn-primary")
  await create.click()
  await expect(create).toBeDisabled()
  await expect(create).toHaveText("Creating room…")
  await expect(page.locator("#hostSetupOverlay")).toBeVisible()
  await expect(page.locator(".host-setup-error")).toHaveText(
    "The server did not respond. Check your connection and try again.", { timeout: 12_000 }
  )
  await expect(create).toBeEnabled()
  await expect(page.locator("#hostNameInput")).toHaveValue("Reconnect Host")
  await expect(page.locator("html")).toHaveAttribute("data-character-theme", "morinji")
  await context.setOffline(false)
  await create.click()
  await expect(page.locator("#adminView.active-view")).toBeVisible({ timeout: 15_000 })
  await expect(page.locator("#roomCodeText")).toHaveText(/^[A-Z0-9]{5}$/)
  await expect(page.locator("html")).toHaveAttribute("data-character-theme", "morinji")
})
