export type ViewId = "homeView" | "gameInfoView" | "joinView" | "playerRoomView" | "adminView" | "localPlayView"

export type ViewContext = Record<string, unknown>

export interface ViewModule {
  id: ViewId
  mount: (ctx: ViewContext) => () => void
}

const registry = new Map<ViewId, ViewModule>()
const lazyRegistry = new Map<ViewId, () => Promise<ViewModule>>()
let currentUnmount: (() => void) | null = null
let currentId: ViewId | null = null
let viewChangeSeq = 0

export function register(view: ViewModule): void { registry.set(view.id, view) }

export function registerLazy(id: ViewId, loader: () => Promise<ViewModule>): void {
  lazyRegistry.set(id, loader)
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

export async function setView(id: ViewId, ctx: ViewContext = {}): Promise<void> {
  if (currentId === id) return
  const seq = ++viewChangeSeq
  if (currentUnmount) currentUnmount()
  currentUnmount = null

  const view = await resolveView(id)
  if (seq !== viewChangeSeq) return
  currentId = id
  for (const section of document.querySelectorAll<HTMLElement>("section.view")) {
    section.classList.toggle("active-view", section.id === id)
  }
  currentUnmount = view ? view.mount(ctx) : null
}

export async function refreshCurrentView(ctx: ViewContext = {}): Promise<void> {
  if (!currentId) return
  const seq = ++viewChangeSeq
  if (currentUnmount) currentUnmount()
  currentUnmount = null

  const view = await resolveView(currentId)
  if (seq !== viewChangeSeq || !currentId) return
  currentUnmount = view ? view.mount(ctx) : null
}
