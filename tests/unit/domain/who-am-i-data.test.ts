import { describe, it, expect } from "vitest"
import { WHO_AM_I_CATEGORIES, RANDOM_MIX_KEY, pickWhoAmIWord } from "@client/domain/who-am-i-data.js"
import { getCategoriesForGame, rememberRecentWord } from "@shared/word-categories.js"

describe("Who Am I word data", () => {
  it("offers every Spy Game category too", () => {
    const whoKeys = new Set(WHO_AM_I_CATEGORIES.map(c => c.key))
    for (const cat of getCategoriesForGame("spy-game")) expect(whoKeys.has(cat.key)).toBe(true)
  })

  it("includes the Famous People and World Icons categories", () => {
    const keys = WHO_AM_I_CATEGORIES.map(c => c.key)
    expect(keys).toContain("famous-people")
    expect(keys).toContain("world-icons")
  })
})

describe("pickWhoAmIWord", () => {
  it("does not repeat a word within 60 consecutive picks of one category", () => {
    let recent: string[] = []
    for (let i = 0; i < 60; i++) {
      const { word } = pickWhoAmIWord("world-icons", "ku", recent)
      expect(recent).not.toContain(word)
      recent = rememberRecentWord(recent, word)
    }
  })

  it("still returns a word once every word has been used", () => {
    const all = WHO_AM_I_CATEGORIES.find(c => c.key === "famous-people")!.words.en!
    expect(() => pickWhoAmIWord("famous-people", "en", all)).not.toThrow()
  })

  it("draws from every category in Random Mix", () => {
    const { categoryKey } = pickWhoAmIWord(RANDOM_MIX_KEY, "en", [], () => 0.999)
    expect(WHO_AM_I_CATEGORIES.some(c => c.key === categoryKey)).toBe(true)
  })

  it("rejects unknown categories", () => {
    expect(() => pickWhoAmIWord("nope", "en")).toThrow(/WHO_AM_I_UNKNOWN_CATEGORY/)
  })
})
