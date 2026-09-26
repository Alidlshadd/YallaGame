import type { LangCode, LocalizedText } from "@shared/types.js"
import {
  type WordCategory,
  getCategoriesForGame,
  withoutRecentWords
} from "@shared/word-categories.js"

/**
 * Spy Game word-category facade. The actual data now lives in
 * `src/client/data/word-categories.ts` as LocalizedWord[]. This file
 * keeps the original `SpyWordCategory` shape (which uses `id` instead
 * of `key` and stores parallel arrays of strings per language) so the
 * existing localPlay.ts consumers don't have to change.
 */

export interface SpyWordCategory {
  id: string
  label: LocalizedText
  words: Partial<Record<LangCode, string[]>>
}

const LANGS: readonly LangCode[] = ["en", "tr", "ar", "ku"]

const flattenWords = (cat: WordCategory): Partial<Record<LangCode, string[]>> => {
  const out: Partial<Record<LangCode, string[]>> = {}
  for (const lang of LANGS) {
    out[lang] = cat.words.map(w => (w[lang] && w[lang].length > 0 ? w[lang] : w.en))
  }
  return out
}

const toSpyCategory = (c: WordCategory): SpyWordCategory => ({
  id: c.key,
  label: c.label,
  words: flattenWords(c)
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

export interface SpyWordPick {
  word: string
  /** Label of the category the word came from; null for custom words. */
  categoryLabel: LocalizedText | null
}

/** `recent` holds previously dealt words (in `lang`); they're skipped while enough others remain. */
export function pickSpyWordWithCategory(
  lang: LangCode,
  categoryIds: readonly string[],
  customWordsText: string,
  rng: () => number = Math.random,
  recent: readonly string[] = []
): SpyWordPick {
  const selected = new Set(categoryIds)
  // A word shared by two categories keeps a single entry so it isn't drawn twice as often.
  const pool: SpyWordPick[] = []
  const seen = new Set<string>()
  const add = (pick: SpyWordPick): void => {
    if (seen.has(pick.word)) return
    seen.add(pick.word)
    pool.push(pick)
  }
  for (const category of SPY_WORD_CATEGORIES) {
    if (!selected.has(category.id)) continue
    for (const word of category.words[lang] ?? category.words.en ?? []) {
      add({ word, categoryLabel: category.label })
    }
  }
  for (const word of parseCustomSpyWords(customWordsText)) {
    add({ word, categoryLabel: null })
  }
  if (pool.length === 0) throw new Error("NO_SPY_WORDS")
  const candidates = withoutRecentWords(pool, recent, p => p.word)
  return candidates[Math.floor(rng() * candidates.length)]!
}

export function pickSpyWord(
  lang: LangCode,
  categoryIds: readonly string[],
  customWordsText: string,
  rng: () => number = Math.random
): string {
  return pickSpyWordWithCategory(lang, categoryIds, customWordsText, rng).word
}
