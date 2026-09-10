// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { prefersReducedMotion, sceneDuration, scrollReveal } from "@client/ui/motion.js"

describe("motion helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn((q: string) => ({
      matches: q === "(prefers-reduced-motion: reduce)" ? false : false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {}
    })))
  })

  it("prefersReducedMotion returns false when media query doesn't match", () => {
    expect(prefersReducedMotion()).toBe(false)
  })

  it("prefersReducedMotion returns true when media query matches", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: true, media: "", addEventListener: () => {}, removeEventListener: () => {}
    })))
    expect(prefersReducedMotion()).toBe(true)
  })

  it("sceneDuration returns the full duration when motion is allowed", () => {
    expect(sceneDuration()).toBe(700)
  })

  it("sceneDuration returns reduced duration when motion is reduced", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: true, media: "", addEventListener: () => {}, removeEventListener: () => {}
    })))
    expect(sceneDuration()).toBe(100)
  })
})

describe("scrollReveal", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false, media: "", addEventListener: () => {}, removeEventListener: () => {}
    })))
  })

  it("reveals every target right away when there is no IntersectionObserver", () => {
    // jsdom does not implement IntersectionObserver, so this is the plain
    // fallback path with nothing stubbed.
    const target = document.createElement("div")
    const stop = scrollReveal([target], { hiddenClass: "hide", visibleClass: "show" })

    expect(target.classList.contains("hide")).toBe(true)
    expect(target.classList.contains("show")).toBe(true)
    expect(() => stop()).not.toThrow()
  })

  it("reveals a target once it intersects, and disconnects on cleanup", () => {
    let deliver: ((entries: Array<{ target: Element; isIntersecting: boolean }>) => void) | null = null
    const observed: Element[] = []
    const unobserved: Element[] = []
    let disconnected = false

    vi.stubGlobal("IntersectionObserver", class {
      constructor(cb: (entries: Array<{ target: Element; isIntersecting: boolean }>) => void) { deliver = cb }
      observe(el: Element) { observed.push(el) }
      unobserve(el: Element) { unobserved.push(el) }
      disconnect() { disconnected = true }
    })

    const target = document.createElement("div")
    const stop = scrollReveal([target], { hiddenClass: "hide", visibleClass: "show" })

    expect(target.classList.contains("hide")).toBe(true)
    expect(target.classList.contains("show")).toBe(false)
    expect(observed).toEqual([target])

    deliver!([{ target, isIntersecting: true }])
    expect(target.classList.contains("show")).toBe(true)
    expect(unobserved).toEqual([target])

    stop()
    expect(disconnected).toBe(true)
  })
})
