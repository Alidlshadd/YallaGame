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
 * `src/client/data/word-categories.ts`. This file preserves the original
 * `WhoAmICategory` shape (icon + difficulty non-optional in the view) and
 * the `pickWhoAmIWord` helper so the existing localPlay.ts consumers
 * don't have to change.
 *
 * Random Mix is computed dynamically from "all categories enabled for
 * Who Am I" — that way adding/removing a category in the shared file is
 * automatically reflected in the Random Mix pool.
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

const toWhoAmICategory = (c: WordCategory): WhoAmICategory => ({
  key: c.key,
  icon: c.icon ?? FALLBACK_ICON,
  difficulty: c.difficulty ?? FALLBACK_DIFFICULTY,
  label: c.label,
  words: c.words
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
