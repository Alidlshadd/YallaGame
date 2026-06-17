import type { LangCode, LocalizedText } from "@shared/types.js"
import {
  type WordCategory,
  getCategoriesForGame
} from "../data/word-categories.js"

/**
 * Spy Game word-category facade. The actual data now lives in
 * `src/client/data/word-categories.ts`. This file keeps the original
 * `SpyWordCategory` shape (which uses `id` instead of `key`) and the
 * `getSpyWords` / `pickSpyWord` / `parseCustomSpyWords` helpers so the
 * existing localPlay.ts consumers don't have to change.
 */

export interface SpyWordCategory {
  id: string
  label: LocalizedText
  words: Partial<Record<LangCode, string[]>>
}

const toSpyCategory = (c: WordCategory): SpyWordCategory => ({
  id: c.key,
  label: c.label,
  words: c.words
})

export const SPY_WORD_CATEGORIES: readonly SpyWordCategory[] =
  getCategoriesForGame("spy-game").map(toSpyCategory)

export function parseCustomSpyWords(input: string): string[] {
  return input
    .split(/[\n,;]+/)
    .map(word => word.trim())
    .filter(word => word.length >= 2)
}

export function getSpyWords(
  lang: LangCode,
  categoryIds: readonly string[],
  customWords: readonly string[]
): string[] {
  const selected = new Set(categoryIds)
  const words = SPY_WORD_CATEGORIES.flatMap(category => {
    if (!selected.has(category.id)) return []
    return category.words[lang] ?? category.words.en ?? []
  })
  return [...words, ...customWords]
}

export function pickSpyWord(
  lang: LangCode,
  categoryIds: readonly string[],
  customWordsText: string,
  rng: () => number = Math.random
): string {
  const words = getSpyWords(lang, categoryIds, parseCustomSpyWords(customWordsText))
  if (words.length === 0) throw new Error("NO_SPY_WORDS")
  return words[Math.floor(rng() * words.length)]!
}
