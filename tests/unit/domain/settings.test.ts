import { describe, it, expect } from "vitest"
import { normalizeSettings } from "@server/domain/settings.js"
import type { Game } from "@shared/types.js"

const game: Game = {
  id: "test", icon: "x", theme: "x", minPlayers: 3,
  defaultSettings: { count: 2, hard: false },
  title: { ku: "", ar: "", en: "", tr: "" },
  subtitle: { ku: "", ar: "", en: "", tr: "" },
  rules: { ku: [], ar: [], en: [], tr: [] },
  roles: [],
  settings: [
    { type: "number", key: "count", min: 1, max: 5, label: { ku: "", ar: "", en: "", tr: "" } },
    { type: "boolean", key: "hard", label: { ku: "", ar: "", en: "", tr: "" } }
  ]
}

describe("normalizeSettings", () => {
  it("clamps number values to [min, max]", () => {
    expect(normalizeSettings(game, { count: 99 }).count).toBe(5)
    expect(normalizeSettings(game, { count: -5 }).count).toBe(1)
    expect(normalizeSettings(game, { count: 3  }).count).toBe(3)
  })

  it("falls back to defaultSettings when key absent", () => {
    expect(normalizeSettings(game, {}).count).toBe(2)
    expect(normalizeSettings(game, {}).hard).toBe(false)
  })

  it("coerces boolean values", () => {
    expect(normalizeSettings(game, { hard: true }).hard).toBe(true)
    expect(normalizeSettings(game, { hard: 0 as unknown as boolean }).hard).toBe(false)
  })

  it("ignores unknown keys (not in game.settings)", () => {
    const result = normalizeSettings(game, { rogue: 42 } as Record<string, number>)
    expect(result).not.toHaveProperty("rogue")
  })

  it("returns a new object — does not mutate input", () => {
    const incoming = { count: 4 }
    const result = normalizeSettings(game, incoming)
    expect(result).not.toBe(incoming)
    expect(incoming).toEqual({ count: 4 })
  })
})
