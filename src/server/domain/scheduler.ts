/**
 * One pending phase deadline per room.
 *
 * Deliberately in memory and deliberately not the source of truth: the room's
 * `phaseEndsAt` is. A timer that never fires — because the process restarted,
 * or the machine slept — costs nothing, since the next event into that room
 * notices the deadline has passed and forces the transition (see `catchUp`).
 */

type Timer = ReturnType<typeof setTimeout>

const timers = new Map<string, Timer>()

/** Replaces whatever was pending for this room. */
export function scheduleAt(code: string, ms: number, fn: () => void): void {
  cancelTimer(code)
  const timer = setTimeout(() => {
    timers.delete(code)
    fn()
  }, Math.max(0, ms))
  // A room's countdown must never be the reason the process stays alive; it
  // also keeps the test runner from hanging on a room nobody closed.
  timer.unref?.()
  timers.set(code, timer)
}

export function cancelTimer(code: string): void {
  const timer = timers.get(code)
  if (timer === undefined) return
  clearTimeout(timer)
  timers.delete(code)
}

/** True while this process is holding a deadline for the room. */
export function hasTimer(code: string): boolean {
  return timers.has(code)
}

/** Shutdown and tests. */
export function cancelAllTimers(): void {
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
}
