import { canGoBack, dismissLayer, layerCount, pushLayer, requestBack, resetLayers } from "./services/navigation.js"

export type ViewId = "homeView" | "gameInfoView" | "joinView" | "joinSetupView" | "pendingView" | "playerRoomView" | "adminView" | "localPlayView"

export type ViewContext = Record<string, unknown>

export interface ViewModule {
  id: ViewId
  mount: (ctx: ViewContext) => () => void
}

export type NavMode =
  /** Normal forward navigation: the current view becomes a back target. */
  | "push"
  /** Start a new stack — nothing to go back to (boot, or leaving a room). */
  | "root"
  /** Swap the current view without adding a back target. */
  | "replace"

export interface SetViewOptions {
  mode?: NavMode
}

interface StackEntry {
  id: ViewId
  ctx: ViewContext
  scrollY: number
}

const registry = new Map<ViewId, ViewModule>()
const lazyRegistry = new Map<ViewId, () => Promise<ViewModule>>()
const viewStack: StackEntry[] = []

let currentUnmount: (() => void) | null = null
let currentId: ViewId | null = null
let currentCtx: ViewContext = {}
let viewChangeSeq = 0

/**
 * A view can claim the back gesture for its own internal steps (the local-play
 * wizard walks back one step at a time) or guard it (a room asks before it is
 * abandoned). Returning true means "handled, stay on this view".
 */
export type ViewBackHandler = () => boolean
let viewBackHandler: ViewBackHandler | null = null

export function register(view: ViewModule): void { registry.set(view.id, view) }

export function registerLazy(id: ViewId, loader: () => Promise<ViewModule>): void {
  lazyRegistry.set(id, loader)
}

/** Views call this in mount() to take over the back gesture; the router clears it on unmount. */
export function setViewBackHandler(handler: ViewBackHandler | null): void {
  viewBackHandler = handler
  // A view reached directly (reconnect on boot, an invite link) has nothing
  // stacked under it. Claim one history entry anyway so the hardware back
  // button reaches the handler instead of closing the tab.
  if (handler && layerCount() === 0) pushLayer(popView, "view-guard")
}

async function resolveView(id: ViewId): Promise<ViewModule | null> {
  const eagerView = registry.get(id)
  if (eagerView) return eagerView

  const loader = lazyRegistry.get(id)
  if (!loader) return null

  const view = await loader()
  registry.set(view.id, view)
  lazyRegistry.delete(view.id)
  return view
}

function currentScroll(): number {
  const active = document.querySelector<HTMLElement>("section.view.active-view")
  return active && active.scrollTop > 0 ? active.scrollTop : window.scrollY
}

function restoreScroll(top: number): void {
  const active = document.querySelector<HTMLElement>("section.view.active-view")
  if (active && active.scrollHeight > active.clientHeight) active.scrollTop = top
  else window.scrollTo({ top, behavior: "auto" })
}

/**
 * Pop handler for one pushed view. The view on screen gets first refusal — a
 * multi-step wizard consumes the press and keeps its layer alive — otherwise we
 * fall back to whatever was underneath.
 */
function popView(): void {
  const handler = viewBackHandler
  if (handler) {
    // Re-arm the layer *before* asking, so anything the handler opens (a
    // confirmation dialog, say) stacks above this guard rather than under it —
    // otherwise the next back press could never reach the dialog.
    const guard = pushLayer(popView, "view-guard")
    if (handler()) return
    dismissLayer(guard)
  }
  const previous = viewStack.pop()
  if (!previous) {
    void mountView("homeView", {}, 0)
    return
  }
  void mountView(previous.id, previous.ctx, previous.scrollY)
}

async function mountView(id: ViewId, ctx: ViewContext, scrollY = 0): Promise<void> {
  const seq = ++viewChangeSeq
  if (currentUnmount) currentUnmount()
  currentUnmount = null
  viewBackHandler = null

  const view = await resolveView(id)
  if (seq !== viewChangeSeq) return
  currentId = id
  currentCtx = ctx
  for (const section of document.querySelectorAll<HTMLElement>("section.view")) {
    section.classList.toggle("active-view", section.id === id)
  }
  currentUnmount = view ? view.mount(ctx) : null
  restoreScroll(scrollY)
}

export async function setView(id: ViewId, ctx: ViewContext = {}, opts: SetViewOptions = {}): Promise<void> {
  const mode = opts.mode ?? "push"
  if (currentId === id && mode !== "root") return

  if (mode === "root") {
    viewStack.length = 0
    resetLayers()
  } else if (mode === "push" && currentId) {
    viewStack.push({ id: currentId, ctx: currentCtx, scrollY: currentScroll() })
    pushLayer(popView, `view:${currentId}`)
  }

  await mountView(id, ctx)
}

/**
 * One step back: hands the press to the layer stack (which reaches the view's
 * own back handler) and falls back to home when there is nothing stacked —
 * for instance after a reload that dropped straight into a deep view.
 */
export function goBack(): void {
  if (canGoBack()) {
    requestBack()
    return
  }
  if (viewBackHandler?.()) return
  if (currentId === "homeView") return
  void setView("homeView", {}, { mode: "root" })
}

export async function refreshCurrentView(ctx?: ViewContext): Promise<void> {
  if (!currentId) return
  const seq = ++viewChangeSeq
  if (currentUnmount) currentUnmount()
  currentUnmount = null
  viewBackHandler = null

  // Keep the context the view was mounted with. Dropping it used to blank out
  // the admin and player rooms on a language switch, because their room data
  // lives in that context.
  const nextCtx = ctx ?? currentCtx
  const view = await resolveView(currentId)
  if (seq !== viewChangeSeq || !currentId) return
  currentCtx = nextCtx
  currentUnmount = view ? view.mount(nextCtx) : null
}

export function currentViewId(): ViewId | null { return currentId }
