// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { prefersReducedMotion, sceneDuration } from "@client/ui/motion.js"

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
