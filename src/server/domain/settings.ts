import type { Game, Settings } from "@shared/types.js"
import { getCategoriesForGame, type SupportedGame } from "@shared/word-categories.js"

const MAX_CUSTOM_TEXT_LENGTH = 500

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function normalizeSettings(game: Game, incoming: Partial<Record<string, unknown>>): Settings {
  const out: Settings = {}

  for (const def of game.settings) {
    const raw = incoming[def.key] ?? game.defaultSettings[def.key]

    if (def.type === "number") {
      const n = Number(raw ?? def.min)
      out[def.key] = clamp(Number.isFinite(n) ? n : def.min, def.min, def.max)
    } else if (def.type === "boolean") {
      out[def.key] = Boolean(raw)
    } else if (def.type === "categories") {
      const validKeys = new Set(getCategoriesForGame(def.game as SupportedGame).map(c => c.key))
      const asArray = (v: unknown): string[] => Array.isArray(v) ? v.filter((k): k is string => typeof k === "string" && validKeys.has(k)) : []
      const chosen = asArray(raw)
      out[def.key] = chosen.length > 0 ? chosen : asArray(game.defaultSettings[def.key])
    } else {
      out[def.key] = typeof raw === "string" ? raw.slice(0, MAX_CUSTOM_TEXT_LENGTH) : ""
    }
  }

  return out
}
