// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"

describe("theme loader", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme")
    vi.resetModules()
  })

  it("applyTheme sets data-theme on <html>", async () => {
    const { applyTheme } = await import("@client/themes/loader.js")
    await applyTheme("vampire-village")
    expect(document.documentElement.getAttribute("data-theme")).toBe("vampire-village")
  })

  it("clearTheme removes data-theme attribute", async () => {
    const { applyTheme, clearTheme } = await import("@client/themes/loader.js")
    await applyTheme("mafia-classic")
    clearTheme()
    expect(document.documentElement.getAttribute("data-theme")).toBeNull()
  })

  it("applyTheme rejects unknown names", async () => {
    const { applyTheme } = await import("@client/themes/loader.js")
    await expect(applyTheme("nonexistent")).rejects.toThrow(/UNKNOWN_THEME/)
  })
})
