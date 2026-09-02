/**
 * Keeps the phone screen awake while a round is actually being played.
 *
 * Pass-and-play rounds are long stretches of nobody touching the glass — a
 * five minute spy discussion, a player room waiting for roles — and a phone
 * that sleeps mid-round makes people scramble to unlock it.
 */

interface WakeLockSentinelLike {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: "release", listener: () => void) => void
}

type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> }
}

let holders = 0
let sentinel: WakeLockSentinelLike | null = null
let requesting = false
let listening = false

async function acquire(): Promise<void> {
  const api = (navigator as WakeLockNavigator).wakeLock
  // `requesting` matters: two holders starting at once (a room view mounting
  // while a round begins) would otherwise take two locks and leak the first.
  if (!api || sentinel || requesting || holders === 0) return
  if (document.visibilityState !== "visible") return
  requesting = true
  try {
    const next = await api.request("screen")
    if (holders === 0) { void next.release().catch(() => {}); return }
    sentinel = next
    next.addEventListener("release", () => { sentinel = null })
  } catch {
    /* Denied (battery saver, unsupported browser) — the game still works. */
    sentinel = null
  } finally {
    requesting = false
  }
}

function release(): void {
  const held = sentinel
  sentinel = null
  void held?.release().catch(() => {})
}

function onVisibilityChange(): void {
  // The lock is dropped whenever the tab is hidden; take it again on return.
  if (document.visibilityState === "visible" && holders > 0) void acquire()
}

/** Hold the screen awake until the returned function is called. */
export function holdWakeLock(): () => void {
  holders += 1
  if (!listening) {
    listening = true
    document.addEventListener("visibilitychange", onVisibilityChange)
  }
  void acquire()

  let released = false
  return () => {
    if (released) return
    released = true
    holders = Math.max(0, holders - 1)
    if (holders === 0) release()
  }
}

/** Convenience for views that turn the lock on and off as a round starts and ends. */
export function syncWakeLock(active: boolean, current: (() => void) | null): (() => void) | null {
  if (active && !current) return holdWakeLock()
  if (!active && current) { current(); return null }
  return current
}
