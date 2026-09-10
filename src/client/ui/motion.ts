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

export interface ScrollRevealOptions {
  /** Added to every target up front, so CSS can hide it before it is seen. */
  hiddenClass: string
  /** Added once a target crosses the threshold; it is then never re-hidden. */
  visibleClass: string
  threshold?: number
  rootMargin?: string
}

/**
 * Reveal elements one at a time as they scroll into view, instead of all at
 * once with the page. Falls back to revealing everything immediately when
 * the visitor prefers reduced motion or the browser has no
 * IntersectionObserver. Returns a cleanup function — call it when the view
 * that owns these targets is torn down.
 */
export function scrollReveal(targets: HTMLElement[], options: ScrollRevealOptions): () => void {
  const { hiddenClass, visibleClass, threshold = 0.16, rootMargin = "0px 0px -8% 0px" } = options
  targets.forEach(target => target.classList.add(hiddenClass))

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    targets.forEach(target => target.classList.add(visibleClass))
    return () => { /* nothing to disconnect */ }
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add(visibleClass)
      observer.unobserve(entry.target)
    }
  }, { threshold, rootMargin })
  targets.forEach(target => observer.observe(target))
  return () => observer.disconnect()
}
