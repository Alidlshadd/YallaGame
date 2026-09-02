import { test, expect, type Page } from "@playwright/test"

/**
 * Chromium keeps failing navigations for a beat after the network is switched
 * off - the tab is still tearing down its live connections, and the request
 * never reaches the service worker. A phone walking into a dead spot has that
 * beat and far more, so retrying here tests the product rather than the switch.
 */
async function gotoOffline(page: Page, url: string): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try { await page.goto(url); return } catch {
      await page.waitForTimeout(400)
    }
  }
  await page.goto(url)
}

/**
 * Phone reality check: one visit with signal, then none at all. Local Play
 * needs no server, so it has to keep working — that is what the service
 * worker and the stored game catalog are for.
 */
test("Local Play works with the network cut after one visit", async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto("/")
  await expect(page.locator(".cta-local")).toBeVisible()
  // Offline-ready means two things: the worker precached the build, and it has
  // claimed this page. A worker that is merely "active" has not taken over yet,
  // so a navigation would still hit the dead network.
  await page.waitForFunction(async () => {
    if (!navigator.serviceWorker.controller) return false
    const cache = await caches.open("yalla-assets-v1")
    const keys = await cache.keys()
    return keys.some(request => /localPlay.*\.js$/.test(new URL(request.url).pathname))
  }, undefined, { timeout: 20_000 })

  await context.setOffline(true)
  await gotoOffline(page, "/")

  // A cold start with no network still reaches the game picker…
  await page.click(".cta-local")
  await expect(page.locator("section.view.active-view")).toHaveAttribute("id", "localPlayView")
  await expect(page.locator(".lp-game-card")).not.toHaveCount(0)

  // …and a game can actually be set up.
  await page.locator(".lp-game-card").first().click()
  await expect(page.locator("#localPlayContent")).toContainText(/Player Names|Choose a Category|Setup/i)

  await context.setOffline(false)
  await context.close()
})

test("the home screen is installable as an app", async ({ page }) => {
  await page.goto("/")
  const manifestHref = await page.locator("link[rel=manifest]").getAttribute("href")
  expect(manifestHref).toBe("/manifest.webmanifest")

  const manifest = await page.evaluate(async () => (await fetch("/manifest.webmanifest")).json())
  expect(manifest.name).toBe("Yalla Game")
  expect(manifest.display).toBe("standalone")
  // Android needs a 192px+ icon to offer installation, plus a maskable one so
  // the launcher does not crop the mark.
  const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes)
  expect(sizes).toContain("192x192")
  expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === "maskable")).toBe(true)

  for (const icon of manifest.icons as Array<{ src: string }>) {
    const response = await page.request.get(icon.src)
    expect(response.status(), icon.src).toBe(200)
  }
})
