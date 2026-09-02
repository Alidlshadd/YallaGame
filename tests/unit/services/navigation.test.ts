// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  __resetForTests,
  canGoBack,
  dismissLayer,
  initNavigation,
  layerCount,
  pushLayer,
  requestBack,
  resetLayers
} from "@client/services/navigation.js"

/** jsdom fires popstate asynchronously, like a real browser. */
function nextPop(): Promise<void> {
  return new Promise(resolve => {
    window.addEventListener("popstate", () => setTimeout(resolve, 0), { once: true })
  })
}

describe("navigation layer stack", () => {
  beforeEach(() => {
    __resetForTests()
    history.replaceState(null, "", "/")
    initNavigation()
  })

  it("starts with nothing to go back to", () => {
    expect(canGoBack()).toBe(false)
    expect(layerCount()).toBe(0)
  })

  it("labels the history entry with the layer depth", () => {
    pushLayer(() => {}, "one")
    expect(history.state).toEqual({ ygDepth: 1 })
    pushLayer(() => {}, "two")
    expect(history.state).toEqual({ ygDepth: 2 })
  })

  it("pops the top layer on a back press", async () => {
    const outer = vi.fn()
    const inner = vi.fn()
    pushLayer(outer, "outer")
    pushLayer(inner, "inner")

    const popped = nextPop()
    requestBack()
    await popped

    expect(inner).toHaveBeenCalledTimes(1)
    expect(outer).not.toHaveBeenCalled()
    expect(layerCount()).toBe(1)
  })

  it("lets a pop handler re-arm itself so the guard survives", async () => {
    const guard = vi.fn(() => { pushLayer(guard, "guard") })
    pushLayer(guard, "guard")

    const popped = nextPop()
    requestBack()
    await popped

    expect(guard).toHaveBeenCalledTimes(1)
    expect(layerCount()).toBe(1)
    expect(history.state).toEqual({ ygDepth: 1 })
  })

  it("Escape walks the stack like the hardware back button", async () => {
    const pop = vi.fn()
    pushLayer(pop, "modal")

    const popped = nextPop()
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    await popped

    expect(pop).toHaveBeenCalledTimes(1)
    expect(layerCount()).toBe(0)
  })

  it("ignores Escape when no layer is open", () => {
    const spy = vi.spyOn(history, "back")
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it("dismissLayer drops a layer the UI already closed, without calling it back", async () => {
    const pop = vi.fn()
    const handle = pushLayer(pop, "modal")

    const popped = nextPop()
    dismissLayer(handle)
    await popped

    expect(pop).not.toHaveBeenCalled()
    expect(layerCount()).toBe(0)
    expect(history.state).toEqual({ ygDepth: 0 })
  })

  it("dismissLayer is a no-op for a layer that already popped", async () => {
    const pop = vi.fn()
    const handle = pushLayer(pop, "modal")
    const popped = nextPop()
    requestBack()
    await popped

    const spy = vi.spyOn(history, "go")
    dismissLayer(handle)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it("resetLayers clears the stack and rewinds history", async () => {
    pushLayer(() => {}, "a")
    pushLayer(() => {}, "b")

    const popped = nextPop()
    resetLayers()
    await popped

    expect(layerCount()).toBe(0)
    expect(history.state).toEqual({ ygDepth: 0 })
  })

  it("repairs the depth label when the forward button lands on a stale entry", async () => {
    pushLayer(() => {}, "a")
    const popped = nextPop()
    requestBack()
    await popped
    expect(layerCount()).toBe(0)

    const forward = nextPop()
    history.forward()
    await forward

    // The entry claimed depth 1, but no layer exists any more: it gets relabelled.
    expect(history.state).toEqual({ ygDepth: 0 })
    expect(layerCount()).toBe(0)
  })
})
