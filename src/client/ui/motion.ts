export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function sceneDuration(): number {
  return prefersReducedMotion() ? 100 : 700
}

export function uiDuration(): number {
  return prefersReducedMotion() ? 50 : 150
}

export const SCENE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)"
export const UI_EASING = "cubic-bezier(0.4, 0, 0.2, 1)"
export const REVEAL_EASING = "cubic-bezier(0.6, 0, 0.3, 1)"

export interface MotionStep {
  at: number
  do: () => void
}

/**
 * Run a sequence of steps at specified time offsets.
 * Returns a function that cancels pending steps.
 */
export function orchestrate(steps: MotionStep[]): () => void {
  const handles: number[] = []
  for (const step of steps) {
    handles.push(window.setTimeout(step.do, step.at))
  }
  return () => { for (const h of handles) window.clearTimeout(h) }
}

/**
 * Animate an element with WAAPI, returning a Promise that resolves on finish.
 * Honors prefers-reduced-motion by collapsing duration.
 */
export function animate(
  el: Element,
  keyframes: Keyframe[],
  options: { duration: number; easing?: string; fill?: FillMode; delay?: number }
): Animation {
  const dur = prefersReducedMotion() ? Math.min(options.duration, 100) : options.duration
  return el.animate(keyframes, {
    duration: dur,
    easing: options.easing ?? UI_EASING,
    fill: options.fill ?? "forwards",
    delay: options.delay ?? 0
  })
}
