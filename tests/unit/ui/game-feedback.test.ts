// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Game } from "@shared/types.js"

vi.mock("@client/services/navigation.js", () => ({ pushLayer: vi.fn(() => ({ id: 1 })), dismissLayer: vi.fn() }))
vi.mock("@client/services/i18n.js", () => ({ getLang: () => "en" }))
const game = (id: string): Pick<Game, "id" | "title"> => ({ id, title: { en: id, tr: id, ku: id, ar: id } })
const click = (selector: string) => document.querySelector<HTMLButtonElement>(selector)!.click()
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve() }

beforeEach(() => { vi.resetModules(); localStorage.clear(); document.body.replaceChildren(); vi.useFakeTimers() })
afterEach(() => {
  document.querySelector<HTMLButtonElement>(".feedback-close")?.click()
  vi.unstubAllGlobals(); vi.useRealTimers()
})

describe("optional game feedback", () => {
  it("remembers X dismissal across repeated games and reloads but asks for another game", async () => {
    let { offerGameFeedback } = await import("@client/ui/gameFeedback.js")
    offerGameFeedback(game("vampire-village"))
    expect(document.querySelectorAll(".feedback-star")).toHaveLength(5)
    click(".feedback-close")
    for (let i = 0; i < 10; i++) offerGameFeedback(game("vampire-village"))
    expect(document.querySelector("#gameFeedbackOverlay")).toBeNull()
    vi.resetModules()
    ;({ offerGameFeedback } = await import("@client/ui/gameFeedback.js"))
    offerGameFeedback(game("vampire-village"))
    expect(document.querySelector("#gameFeedbackOverlay")).toBeNull()
    offerGameFeedback(game("spy-game"))
    expect(document.querySelector("#gameFeedbackOverlay")).not.toBeNull()
  })

  it("requires a rating, allows an empty comment and only thanks after a successful save", async () => {
    let finish!: (value: unknown) => void
    const fetch = vi.fn((_url: string, _init: RequestInit) => new Promise(resolve => { finish = resolve }))
    vi.stubGlobal("fetch", fetch)
    const { offerGameFeedback } = await import("@client/ui/gameFeedback.js")
    offerGameFeedback(game("vampire-village"))
    expect(document.querySelector<HTMLButtonElement>(".feedback-submit")!.disabled).toBe(true)
    click('.feedback-star[aria-label="3 / 5"]')
    click(".feedback-submit")
    expect(JSON.parse(fetch.mock.calls[0]![1].body as string)).toEqual({ gameId: "vampire-village", rating: 3, comment: "" })
    expect(document.querySelector(".feedback-thanks")).toBeNull()
    finish({ ok: true, json: async () => ({ saved: true }) })
    await settle()
    expect(document.querySelector(".feedback-thanks")).not.toBeNull()
    expect(document.querySelector("#gameFeedbackTitle")!.textContent).toBe("Thank you!")
    vi.advanceTimersByTime(3200)
    expect(document.querySelector("#gameFeedbackOverlay")).toBeNull()
    offerGameFeedback(game("vampire-village"))
    expect(document.querySelector("#gameFeedbackOverlay")).toBeNull()
  })

  it("preserves input after a failed send and retries without showing false success", async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ ok: true, json: async () => ({ saved: true }) })
    vi.stubGlobal("fetch", fetch)
    const { offerGameFeedback } = await import("@client/ui/gameFeedback.js")
    offerGameFeedback(game("spy-game"))
    click('.feedback-star[aria-label="1 / 5"]')
    document.querySelector<HTMLTextAreaElement>("textarea")!.value = "The sound stopped."
    click(".feedback-submit"); await settle()
    expect(document.querySelector(".feedback-thanks")).toBeNull()
    expect(document.querySelector(".feedback-error")!.textContent).toContain("try again")
    expect(document.querySelector<HTMLTextAreaElement>("textarea")!.value).toBe("The sound stopped.")
    click(".feedback-submit"); await settle()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(document.querySelector(".feedback-thanks")).not.toBeNull()
  })
})
