/**
 * Ensures a single .atmosphere element exists at the top of <body>.
 * Theme CSS attaches decorative layers via .atmosphere::before / ::after.
 * Per-game extra layers are injected as data-children inside.
 */

const CONTAINER_ID = "atmosphere"

export function ensureAtmosphere(): HTMLDivElement {
  let el = document.getElementById(CONTAINER_ID) as HTMLDivElement | null
  if (el) return el
  el = document.createElement("div")
  el.id = CONTAINER_ID
  el.className = "atmosphere"
  el.setAttribute("aria-hidden", "true")
  document.body.prepend(el)
  return el
}

/**
 * Clear all atmosphere child decorations. Pseudo-element layers
 * (::before / ::after) persist because they are CSS-driven.
 */
export function clearAtmosphereChildren(): void {
  const el = document.getElementById(CONTAINER_ID)
  if (el) while (el.firstChild) el.removeChild(el.firstChild)
}

/**
 * Detect low-end devices to reduce atmosphere intensity.
 * Heuristic: ≤4GB RAM OR ≤4 CPU cores.
 */
export function isLowEnd(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const mem = nav.deviceMemory ?? 8
  const cores = nav.hardwareConcurrency ?? 8
  return mem <= 4 || cores <= 4
}

/**
 * Apply the low-end attribute on the atmosphere container so theme CSS
 * can dial decorative layer opacity / count via [data-perf="low"].
 */
export function applyPerformanceProfile(): void {
  const el = ensureAtmosphere()
  if (isLowEnd()) el.setAttribute("data-perf", "low")
  else el.removeAttribute("data-perf")
}
