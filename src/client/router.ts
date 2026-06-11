export type ViewId = "homeView" | "gameInfoView" | "joinView" | "playerRoomView" | "adminView" | "localPlayView"

export type ViewContext = Record<string, unknown>

export interface ViewModule {
  id: ViewId
  mount: (ctx: ViewContext) => () => void
}

const registry = new Map<ViewId, ViewModule>()
let currentUnmount: (() => void) | null = null
let currentId: ViewId | null = null

export function register(view: ViewModule): void { registry.set(view.id, view) }

export function setView(id: ViewId, ctx: ViewContext = {}): void {
  if (currentId === id) return
  if (currentUnmount) currentUnmount()

  for (const section of document.querySelectorAll<HTMLElement>("section.view")) {
    section.classList.toggle("active-view", section.id === id)
  }

  const view = registry.get(id)
  currentUnmount = view ? view.mount(ctx) : null
  currentId = id
}
