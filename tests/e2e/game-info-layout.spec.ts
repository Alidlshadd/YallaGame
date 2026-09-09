import { test, expect } from "@playwright/test"
import { GAME_CATALOG } from "../../src/server/games/catalog.js"

const languages = ["en", "ar", "ku", "tr"] as const
const sizes = [{ name: "desktop", width: 1440, height: 1000 }, { name: "mobile", width: 390, height: 844 }]

for (const size of sizes) {
  for (const game of GAME_CATALOG) {
    test(`${game.id}: fixed ${size.name} layout through all four languages`, async ({ page }, testInfo) => {
      test.setTimeout(90_000)
      await page.setViewportSize(size)
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto("/", { waitUntil: "domcontentloaded" })
      await page.locator(`.shelf-card[data-game="${game.id}"]`).click()
      let reference: unknown
      const measurements = []
      for (const lang of languages) {
        await page.locator(`.lang-switch [data-lang="${lang}"]`).click()
        await expect(page.locator(".gi-title")).toHaveText(game.title[lang])
        await expect(page.locator("html")).toHaveAttribute("dir", lang === "ar" || lang === "ku" ? "rtl" : "ltr")
        await page.evaluate(async () => {
          await document.fonts.ready
          await Promise.all([...document.querySelectorAll<HTMLImageElement>("#gameInfoContent img")].map(img => img.decode()))
          window.scrollTo(0, 0)
        })
        const state = await page.locator("#gameInfoContent").evaluate(root => {
          const rect = (selector: string) => root.querySelector(selector)!.getBoundingClientRect()
          const grid = rect(".gi-hero-grid")
          const poster = rect(".gi-poster-frame")
          const copy = rect(".gi-hero-copy")
          const img = root.querySelector<HTMLImageElement>(".gi-poster-image")!
          const imageStyle = getComputedStyle(img)
          const frameStyle = getComputedStyle(img.parentElement!)
          const titleStyle = getComputedStyle(root.querySelector(".gi-title")!)
          const rounded = (n: number) => Math.round(n * 10) / 10
          const overflow = [...root.querySelectorAll<HTMLElement>("h1, h2, h3, p, .gi-cta, .gi-tag, .gi-stat, .gi-role, .gi-category")]
            .filter(el => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2)
            .map(el => ({ class: el.className, text: el.textContent?.slice(0, 70), width: el.clientWidth, scroll: el.scrollWidth }))
          const reversedRows = [...root.querySelectorAll(".gi-actions, .gi-tags, .gi-stats, .gi-steps, .gi-roles, .gi-categories")]
            .filter(row => getComputedStyle(row).direction !== "ltr").map(row => row.className)
          for (const row of document.querySelectorAll(".gi-actions, .gi-tags, .gi-stats, .gi-steps, .gi-roles, .gi-categories, .main-nav, .lang-switch")) {
            const items = [...row.children].filter(child => child.getBoundingClientRect().width > 0)
            const physicalOrder = items.map((child, index) => ({ index, rect: child.getBoundingClientRect() }))
              .sort((a, b) => Math.abs(a.rect.top - b.rect.top) > 10 ? a.rect.top - b.rect.top : a.rect.left - b.rect.left)
            if (physicalOrder.some((item, index) => item.index !== index)) reversedRows.push(row.className)
          }
          const reversedIcons = [...root.querySelectorAll(".gi-cta")].filter(button => {
            const icon = button.querySelector(".gi-cta-icon")
            const label = icon?.nextElementSibling
            return icon && label && icon.getBoundingClientRect().left > label.getBoundingClientRect().left
          }).map(button => button.textContent)
          return {
            image: {
              x: rounded(poster.x - grid.x), y: rounded(poster.y - grid.y),
              width: rounded(poster.width), height: rounded(poster.height),
              src: img.currentSrc, fit: imageStyle.objectFit, crop: imageStyle.objectPosition,
              radius: frameStyle.borderRadius, padding: frameStyle.padding,
              imageWidth: rounded(img.getBoundingClientRect().width), imageHeight: rounded(img.getBoundingClientRect().height)
            },
            posterLeft: poster.right <= copy.left,
            posterAbove: poster.bottom <= copy.top,
            direction: titleStyle.direction, alignment: titleStyle.textAlign,
            overflow, reversedRows, reversedIcons,
            pageOverflow: document.documentElement.scrollWidth > innerWidth
          }
        })
        measurements.push({ lang, ...state })
        expect(state.direction).toBe(lang === "ar" || lang === "ku" ? "rtl" : "ltr")
        expect(state.alignment).toBe(lang === "ar" || lang === "ku" ? "right" : "left")
        expect(size.name === "desktop" ? state.posterLeft : state.posterAbove).toBe(true)
        expect(state.overflow, `${game.id}/${lang}/${size.name}: clipped content`).toEqual([])
        expect(state.reversedRows).toEqual([])
        expect(state.reversedIcons).toEqual([])
        expect(state.pageOverflow).toBe(false)
        if (reference) expect(state.image, `image geometry changed in ${lang}`).toEqual(reference)
        else reference = state.image
        await page.locator(".gi-hero").screenshot({
          path: `.playwright-mcp/game-info-layout/${game.id}-${size.name}-${lang}.png`, animations: "disabled"
        })
        if (game.id === "mafia-classic" && (lang === "en" || lang === "ar")) {
          await page.screenshot({ path: `.playwright-mcp/game-info-layout/mafia-${size.name}-${lang}-full.png`, fullPage: true, animations: "disabled" })
        }
        const categories = page.locator(".gi-cta-choose-cats")
        if (await categories.count()) {
          await categories.click()
          await expect(page.locator(".gi-setup-panel")).toBeVisible()
          const modalProblems = await page.locator(".gi-setup-panel").evaluate(panel =>
            [...panel.querySelectorAll<HTMLElement>(".gi-category-title, .gi-cta")]
              .filter(el => el.scrollWidth > el.clientWidth + 2).map(el => el.textContent)
          )
          expect(modalProblems).toEqual([])
          await expect(page.locator(".gi-setup-footer .gi-cta span").last()).toHaveCSS("direction", lang === "ar" || lang === "ku" ? "rtl" : "ltr")
          await page.keyboard.press("Escape")
          await expect(page.locator("#categorySetupOverlay")).toHaveCount(0)
        }
      }
      await testInfo.attach("layout-measurements", { body: JSON.stringify(measurements, null, 2), contentType: "application/json" })
    })
  }
}
