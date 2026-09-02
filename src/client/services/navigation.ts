/**
 * Back-navigation layer stack.
 *
 * Every dismissible thing the user can be "inside" — a pushed view, an open
 * modal, a reveal card, a step of the local-play wizard — registers a layer
 * here and gets exactly one browser history entry. The phone's hardware /
 * gesture back button, the Escape key and every in-app back button all walk
 * this same stack, so no screen is a dead end that can only be escaped by
 * reloading the page.
 *
 * Invariant: `layers.length` always equals the `ygDepth` stored on the current
 * history entry. Anything that breaks that (forward button, a restored entry
 * from a previous page load) is repaired with replaceState instead of trusted.
 */

export interface LayerHandle {
  readonly id: number
}

interface Layer {
  id: number
  name: string
  pop: () => void
}

const layers: Layer[] = []
let nextId = 1
let installed = false
/* Set while we move the history cursor ourselves; the resulting popstate is
   bookkeeping, not a user-initiated back press. */
let suppressNextPop = false
/* Programmatic history.go() is asynchronous, so two of them issued in the same
   tick would move the cursor twice as far as either intended — far enough to
   leave the app entirely. Moves are therefore queued: one in flight at a time,
   and any entry we would push meanwhile waits until the cursor settles. */
let movesInFlight = 0
let movesQueued = 0
let deferredPushes = 0

function depthState(): { ygDepth: number } {
  return { ygDepth: layers.length }
}

function syncCurrentEntry(): void {
  try {
    history.replaceState(depthState(), "")
  } catch {
    /* replaceState can throw in exotic sandboxes — navigation still works,
       we just lose the depth label on this entry. */
  }
}

function cursorBusy(): boolean {
  return movesInFlight > 0 || movesQueued > 0
}

function issueQueuedMove(): void {
  movesInFlight = movesQueued
  movesQueued = 0
  if (movesInFlight > 0) {
    suppressNextPop = true
    history.go(-movesInFlight)
  }
}

/** Rewind the history cursor by `count` entries we own, one move at a time. */
function moveBack(count: number): void {
  if (count <= 0) return
  movesQueued += count
  if (movesInFlight === 0) issueQueuedMove()
}

function pushEntry(): void {
  if (cursorBusy()) {
    // Pushing now would land on the pre-rewind entry and scramble the order.
    deferredPushes += 1
    return
  }
  try {
    history.pushState(depthState(), "")
  } catch {
    /* If pushState is unavailable the layer still works through in-app
       buttons; only the hardware back button loses this step. */
  }
}

function flushDeferredPushes(): void {
  while (deferredPushes > 0) {
    deferredPushes -= 1
    try {
      history.pushState(depthState(), "")
    } catch {
      deferredPushes = 0
      return
    }
  }
}

function onPopState(event: PopStateEvent): void {
  if (suppressNextPop) {
    suppressNextPop = false
    movesInFlight = 0
    if (movesQueued > 0) { issueQueuedMove(); return }
    flushDeferredPushes()
    syncCurrentEntry()
    return
  }

  const state = event.state as { ygDepth?: unknown } | null
  const target = typeof state?.ygDepth === "number" ? state.ygDepth : 0

  if (target >= layers.length) {
    // Forward button, or an entry we can no longer reconstruct. Relabel it with
    // the depth we actually have so the stack stays trustworthy.
    syncCurrentEntry()
    return
  }

  // Pop a single layer per back press. A pop handler is allowed to push a fresh
  // layer (a guard that asks "leave the room?" keeps itself alive), which is why
  // the entry is relabelled afterwards rather than before.
  const layer = layers.pop()
  layer?.pop()
  syncCurrentEntry()
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape" || event.defaultPrevented) return
  if (layers.length === 0) return
  event.preventDefault()
  requestBack()
}

export function initNavigation(): void {
  if (installed) return
  installed = true
  syncCurrentEntry()
  window.addEventListener("popstate", onPopState)
  document.addEventListener("keydown", onKeyDown)
}

/** Register a dismissible layer and claim a history entry for it. */
export function pushLayer(pop: () => void, name = "layer"): LayerHandle {
  const layer: Layer = { id: nextId++, name, pop }
  layers.push(layer)
  pushEntry()
  return { id: layer.id }
}

/**
 * Drop a layer that the UI already dismissed on its own (a modal's own close
 * button, for instance). No-op when the layer was popped by a back press.
 */
export function dismissLayer(handle: LayerHandle | null | undefined): void {
  if (!handle) return
  const index = layers.findIndex(l => l.id === handle.id)
  if (index === -1) return
  const removed = layers.length - index
  layers.splice(index, removed)
  moveBack(removed)
}

/** Ask for one step back — the same path the hardware back button takes. */
export function requestBack(): void {
  if (layers.length === 0) return
  history.back()
}

/** Drop every layer (used when a flow restarts at the root of the app). */
export function resetLayers(): void {
  const depth = layers.length
  layers.length = 0
  if (depth > 0) moveBack(depth)
  else syncCurrentEntry()
}

export function canGoBack(): boolean {
  return layers.length > 0
}

export function layerCount(): number {
  return layers.length
}

/** Test seam — resets module state without touching history. */
export function __resetForTests(): void {
  layers.length = 0
  nextId = 1
  installed = false
  suppressNextPop = false
  movesInFlight = 0
  movesQueued = 0
  deferredPushes = 0
}
