import { describe, it, expect } from "vitest"
import {
  SPY_WORD_CATEGORIES,
  pickSpyWordWithCategory,
  pickSpyWord
} from "@client/domain/spy-data.js"
import { validateWordCategories } from "@client/data/word-categories.js"

describe("word category data", () => {
  it("passes the built-in validation (all 4 translations, unique keys, 500+ words)", () => {
    const report = validateWordCategories()
    expect(report.errors).toEqual([])
    expect(report.ok).toBe(true)
  })

  it("exposes at least 20 categories to the spy game", () => {
    expect(SPY_WORD_CATEGORIES.length).toBeGreaterThanOrEqual(20)
  })
})

describe("pickSpyWordWithCategory", () => {
  const firstCat = SPY_WORD_CATEGORIES[0]!

  it("returns a word with the label of the category it came from", () => {
    const pick = pickSpyWordWithCategory("en", [firstCat.id], "", () => 0)
    expect(firstCat.words.en).toContain(pick.word)
    expect(pick.categoryLabel).toEqual(firstCat.label)
  })

  it("returns null category for custom words", () => {
    const pick = pickSpyWordWithCategory("en", [], "zeppelin", () => 0)
    expect(pick.word).toBe("zeppelin")
    expect(pick.categoryLabel).toBeNull()
  })

  it("throws NO_SPY_WORDS when nothing is selected", () => {
    expect(() => pickSpyWordWithCategory("en", [], "", () => 0)).toThrow(/NO_SPY_WORDS/)
  })

  it("keeps pickSpyWord behaviour as a thin wrapper", () => {
    const word = pickSpyWord("en", [firstCat.id], "", () => 0)
    expect(word).toBe(firstCat.words.en?.[0])
  })
})
