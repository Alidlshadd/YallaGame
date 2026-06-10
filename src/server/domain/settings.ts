import type { Game, Settings } from "@shared/types.js"

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
    } else {
      out[def.key] = Boolean(raw)
    }
  }

  return out
}
