// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { backTargetForStep } from "@client/views/localPlay.js"
import type { Game } from "@shared/types.js"

const football = { id: "football-player-guess" } as unknown as Game
const spy = { id: "spy-game" } as unknown as Game

describe("local play back targets", () => {
  it("walks the spy flow backwards one screen at a time", () => {
    expect(backTargetForStep("vote", spy, true)).toEqual({ kind: "step", step: "discussion" })
    expect(backTargetForStep("discussion", spy, true)).toEqual({ kind: "step", step: "starter" })
    expect(backTargetForStep("settings", spy, true)).toEqual({ kind: "step", step: "names" })
    expect(backTargetForStep("names", spy, true)).toEqual({ kind: "step", step: "game" })
  })

  it("asks before a step that would deal the roles again", () => {
    expect(backTargetForStep("reveal", spy, true)).toEqual({
      kind: "step", step: "settings", resetsRound: true
    })
    expect(backTargetForStep("footballTurn", football, true)).toEqual({
      kind: "step", step: "settings", resetsRound: true
    })
  })

  it("asks before abandoning a round that is already under way", () => {
    expect(backTargetForStep("starter", spy, true)).toEqual({ kind: "exit", confirm: true })
    expect(backTargetForStep("adminReview", spy, true)).toEqual({ kind: "exit", confirm: true })
  })

  it("leaves the view without a question from finished screens", () => {
    for (const step of ["game", "result", "done", "footballSummary"] as const) {
      expect(backTargetForStep(step, spy, true)).toEqual({ kind: "exit" })
    }
  })

  it("skips the picker when the flow was opened from a world page", () => {
    expect(backTargetForStep("names", spy, false)).toEqual({ kind: "exit" })
    expect(backTargetForStep("whoSetup", spy, false)).toEqual({ kind: "exit" })
    expect(backTargetForStep("settings", football, false)).toEqual({ kind: "exit" })
  })

  it("sends football setup back to the picker, not to a name list it never showed", () => {
    expect(backTargetForStep("settings", football, true)).toEqual({ kind: "step", step: "game" })
  })

  it("returns every Who Am I round screen to its setup", () => {
    for (const step of ["whoCountdown", "whoRound", "whoTimeUp"] as const) {
      expect(backTargetForStep(step, spy, true)).toEqual({ kind: "step", step: "whoSetup" })
    }
  })
})
