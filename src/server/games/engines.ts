import type { GameEngine } from "../domain/engine.js"
import { mostLikelyToEngine } from "./most-likely-to.js"

/**
 * Games the server runs turn by turn.
 *
 * The role-distribution games in `catalog.ts` are not in here and do not need
 * to be: they hand out roles and let the table run the evening itself, so their
 * rooms stay on `IDLE_PHASE` forever. A game only appears here once the server
 * has to keep time, collect answers, or hold something secret between phases.
 */
const ENGINES: readonly GameEngine[] = [mostLikelyToEngine]

const byId = new Map(ENGINES.map(e => [e.gameId, e]))

export function resolveEngine(gameId: string): GameEngine | undefined {
  return byId.get(gameId)
}

/** True for a game the host can press Start on. */
export function isTurnBased(gameId: string): boolean {
  return byId.has(gameId)
}
