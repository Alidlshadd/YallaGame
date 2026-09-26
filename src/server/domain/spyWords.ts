import type { GameState, LocalizedText, Role, Settings } from "@shared/types.js"
import { getCategoriesForGame, rememberRecentWord, withoutRecentWords } from "../../shared/word-categories.js"

export const SPY_GAME_ID = "spy-game"

const WORD_LABEL: LocalizedText = {
  en: "Secret word", tr: "Gizli kelime", ar: "الكلمة السرية", ku: "وشەی نهێنی"
}
const HINT_LABEL: LocalizedText = {
  en: "Your hint — category", tr: "İpucun — kategori", ar: "تلميحك — الفئة", ku: "ئاماژەکەت — پۆل"
}

interface SpyWordPick {
  word: LocalizedText
  categoryLabel: LocalizedText | null
}

function parseCustomWords(input: string): string[] {
  return input
    .split(/[\n,;]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2)
}

/**
 * Picks one word (with its category, if any) from the room's configured spy
 * settings, skipping the words in `recent` (English text). Null when nothing
 * is selectable.
 */
export function pickSpyWord(settings: Settings, rng: () => number, recent: readonly string[] = []): SpyWordPick | null {
  const categoryIds = new Set(Array.isArray(settings["spyCategories"]) ? settings["spyCategories"] as string[] : [])
  const customWordsRaw = typeof settings["spyCustomWords"] === "string" ? settings["spyCustomWords"] : ""

  // The same word can live in two categories (e.g. "Spoon" in Objects and
  // Kitchen Items) — keep one copy so it isn't twice as likely to come up.
  const pool: SpyWordPick[] = []
  const seen = new Set<string>()
  const add = (pick: SpyWordPick): void => {
    if (seen.has(pick.word.en)) return
    seen.add(pick.word.en)
    pool.push(pick)
  }
  for (const category of getCategoriesForGame("spy-game")) {
    if (!categoryIds.has(category.key)) continue
    for (const w of category.words) {
      add({ word: { en: w.en, tr: w.tr, ar: w.ar, ku: w.ku }, categoryLabel: category.label })
    }
  }
  for (const custom of parseCustomWords(customWordsRaw)) {
    add({ word: { en: custom, tr: custom, ar: custom, ku: custom }, categoryLabel: null })
  }

  if (pool.length === 0) return null
  const candidates = withoutRecentWords(pool, recent, p => p.word.en)
  return candidates[Math.floor(rng() * candidates.length)]!
}

/** Recently dealt words (English text), oldest first. Untrusted: the room row round-trips through JSON. */
export function readRecentSpyWords(gameState: GameState): string[] {
  const raw = gameState["spyRecent"]
  return Array.isArray(raw) ? raw.filter((w): w is string => typeof w === "string") : []
}

/** Game-state patch for a fresh deal: the new word plus the updated repeat-avoidance history. */
export function dealSpyWord(settings: Settings, gameState: GameState, rng: () => number): GameState {
  const recent = readRecentSpyWords(gameState)
  const spyWord = pickSpyWord(settings, rng, recent)
  return {
    ...gameState,
    spyWord,
    spyRecent: spyWord ? rememberRecentWord(recent, spyWord.word.en) : recent
  }
}

/** The room row comes back through JSON, so nothing in `gameState` is trusted as typed. */
function readSpyWordPick(gameState: GameState): SpyWordPick | null {
  const raw = gameState["spyWord"] as Partial<SpyWordPick> | undefined
  if (!raw || typeof raw.word !== "object" || raw.word === null) return null
  return { word: raw.word as LocalizedText, categoryLabel: (raw.categoryLabel as LocalizedText | null) ?? null }
}

function withSuffix(desc: LocalizedText, label: LocalizedText, value: LocalizedText): LocalizedText {
  return {
    en: `${desc.en} ${label.en}: ${value.en}`,
    tr: `${desc.tr} ${label.tr}: ${value.tr}`,
    ar: `${desc.ar} ${label.ar}: ${value.ar}`,
    ku: `${desc.ku} ${label.ku}: ${value.ku}`
  }
}

/**
 * The Spy Game hands out the same "normal" / "spy" roles to every table, but
 * only the server knows the word this round: normal players get it appended
 * to their role description, and the spy gets the word's category as a hint
 * (when one applies — a purely custom word carries no hint).
 */
export function injectSpyWord(role: Role, gameState: GameState): Role {
  const pick = readSpyWordPick(gameState)
  if (!pick) return role
  if (role.id === "spy") {
    if (!pick.categoryLabel) return role
    return { ...role, desc: withSuffix(role.desc, HINT_LABEL, pick.categoryLabel) }
  }
  return { ...role, desc: withSuffix(role.desc, WORD_LABEL, pick.word) }
}
