/**
 * Short vibrations for the moments that matter on a phone: a role revealed,
 * a round ending, a wrong guess. Silently does nothing where the API is
 * missing (iOS Safari) or the user asked for reduced motion.
 */

import { prefersReducedMotion } from "./motion.js"

type Pattern = "tap" | "reveal" | "warn" | "end"

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 10,
  reveal: [0, 18, 40, 28],
  warn: [0, 30, 60, 30],
  end: [0, 45, 70, 45, 70, 90]
}

export function vibrate(pattern: Pattern): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return
  if (prefersReducedMotion()) return
  try { navigator.vibrate(PATTERNS[pattern]) } catch { /* blocked by the browser */ }
}
