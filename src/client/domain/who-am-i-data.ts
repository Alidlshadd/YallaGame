import type { LangCode, LocalizedText } from "@shared/types.js"
import {
  type WordCategory,
  type CategoryDifficulty,
  type SupportedGame,
  getCategoriesForGame,
  resolveCategoryLabel,
  RANDOM_MIX_KEY
} from "../data/word-categories.js"

/**
 * Who Am I facade. The actual data now lives in
 * `src/client/data/word-categories.ts` as LocalizedWord[]. This file
 * preserves the legacy `WhoAmICategory` shape (icon + difficulty
 * non-optional, words as parallel arrays per language) so the
 * existing localPlay.ts consumers don't have to change.
 */

export { RANDOM_MIX_KEY, resolveCategoryLabel }
export type { SupportedGame }

export interface WhoAmICategory {
  key: string
  icon: string
  difficulty: CategoryDifficulty
  label: LocalizedText
  words: Partial<Record<LangCode, string[]>>
}

const FALLBACK_ICON = "❓"
const FALLBACK_DIFFICULTY: CategoryDifficulty = "medium"
const LANGS: readonly LangCode[] = ["en", "tr", "ar", "ku"]

const flattenWords = (cat: WordCategory): Partial<Record<LangCode, string[]>> => {
  const out: Partial<Record<LangCode, string[]>> = {}
  for (const lang of LANGS) {
    out[lang] = cat.words.map(w => (w[lang] && w[lang].length > 0 ? w[lang] : w.en))
  }
  return out
}

const toWhoAmICategory = (c: WordCategory): WhoAmICategory => ({
  key: c.key,
  icon: c.icon ?? FALLBACK_ICON,
  difficulty: c.difficulty ?? FALLBACK_DIFFICULTY,
  label: c.label,
  words: flattenWords(c)
})

export const WHO_AM_I_CATEGORIES: readonly WhoAmICategory[] =
  getCategoriesForGame("who-am-i").map(toWhoAmICategory)

function wordsFor(category: WhoAmICategory, lang: LangCode): readonly string[] {
  return category.words[lang] ?? category.words.en ?? []
}

export function pickWhoAmIWord(
  categoryKey: string,
  lang: LangCode,
  exclude: readonly string[] = [],
  rng: () => number = Math.random
): { word: string; categoryKey: string } {
  const excluded = new Set(exclude)
  const pool: Array<{ word: string; categoryKey: string }> = []

  if (categoryKey === RANDOM_MIX_KEY) {
    for (const cat of WHO_AM_I_CATEGORIES) {
      for (const word of wordsFor(cat, lang)) {
        pool.push({ word, categoryKey: cat.key })
      }
    }
  } else {
    const cat = WHO_AM_I_CATEGORIES.find(c => c.key === categoryKey)
    if (!cat) throw new Error("WHO_AM_I_UNKNOWN_CATEGORY")
    for (const word of wordsFor(cat, lang)) {
      pool.push({ word, categoryKey: cat.key })
    }
  }

  const fresh = pool.filter(p => !excluded.has(p.word))
  const choices = fresh.length > 0 ? fresh : pool
  if (choices.length === 0) throw new Error("WHO_AM_I_NO_WORDS")
  return choices[Math.floor(rng() * choices.length)]!
}
