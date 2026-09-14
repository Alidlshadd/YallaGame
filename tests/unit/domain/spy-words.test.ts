import { describe, it, expect } from "vitest"
import { pickSpyWord } from "@server/domain/spyWords.js"
import { resolveRoleData } from "@server/domain/roles.js"
import type { Game, Room, Settings } from "@shared/types.js"

const spyGame: Game = {
  id: "spy-game", icon: "x", theme: "x", minPlayers: 3,
  defaultSettings: { spyCategories: ["objects"], spyCustomWords: "" },
  title: { ku: "", ar: "", en: "", tr: "" },
  subtitle: { ku: "", ar: "", en: "", tr: "" },
  rules: { ku: [], ar: [], en: [], tr: [] },
  settings: [],
  roles: [
    { id: "spy", icon: "s", countSetting: "spyCount", name: { ku: "", ar: "", en: "Spy", tr: "" }, desc: { ku: "", ar: "", en: "You are the Spy.", tr: "" } },
    { id: "normal", icon: "n", filler: true, name: { ku: "", ar: "", en: "Normal", tr: "" }, desc: { ku: "", ar: "", en: "You are a normal player.", tr: "" } }
  ]
}

function mkRoom(overrides: Partial<Room> = {}): Room {
  return {
    code: "ABCDE", gameId: "spy-game", adminSecret: "secret", assigned: true,
    settings: {}, players: [], createdAt: 0, updatedAt: 0, hostPlayerId: "h",
    isPublic: false, requireApproval: false, pending: [],
    phase: "idle", phaseSeq: 0, phaseEndsAt: null, round: 0,
    gameState: {}, scores: {},
    ...overrides
  }
}

describe("pickSpyWord", () => {
  const settings: Settings = { spyCategories: ["objects"], spyCustomWords: "" }

  it("picks a word from the selected categories", () => {
    const pick = pickSpyWord(settings, () => 0)
    expect(pick).not.toBeNull()
    expect(pick!.word.en.length).toBeGreaterThan(0)
    expect(pick!.categoryLabel).not.toBeNull()
  })

  it("also draws from custom words, tagged with no category", () => {
    const pick = pickSpyWord({ spyCategories: [], spyCustomWords: "Banana" }, () => 0)
    expect(pick).toEqual({ word: { en: "Banana", tr: "Banana", ar: "Banana", ku: "Banana" }, categoryLabel: null })
  })

  it("returns null when nothing is selected", () => {
    expect(pickSpyWord({ spyCategories: [], spyCustomWords: "" }, () => 0)).toBeNull()
  })

  it("ignores custom word fragments shorter than 2 characters", () => {
    const pick = pickSpyWord({ spyCategories: [], spyCustomWords: "a, bb, c" }, () => 0)
    expect(pick!.word.en).toBe("bb")
  })
})

describe("injectSpyWord / resolveRoleData", () => {
  it("appends the secret word to the normal role's description", () => {
    const room = mkRoom({ gameState: { spyWord: { word: { en: "Apple", tr: "", ar: "", ku: "" }, categoryLabel: null } } })
    const role = resolveRoleData(spyGame, room, "normal")
    expect(role!.desc.en).toBe("You are a normal player. Secret word: Apple")
  })

  it("appends the category hint to the spy role when the word came from a category", () => {
    const catLabel = { en: "Objects", tr: "", ar: "", ku: "" }
    const room = mkRoom({ gameState: { spyWord: { word: { en: "Apple", tr: "", ar: "", ku: "" }, categoryLabel: catLabel } } })
    const role = resolveRoleData(spyGame, room, "spy")
    expect(role!.desc.en).toBe("You are the Spy. Your hint — category: Objects")
  })

  it("leaves the spy role unchanged when the word was a custom one with no category", () => {
    const room = mkRoom({ gameState: { spyWord: { word: { en: "Apple", tr: "", ar: "", ku: "" }, categoryLabel: null } } })
    const role = resolveRoleData(spyGame, room, "spy")
    expect(role!.desc.en).toBe("You are the Spy.")
  })

  it("leaves roles untouched when no word has been picked yet", () => {
    const room = mkRoom({ gameState: {} })
    const role = resolveRoleData(spyGame, room, "normal")
    expect(role!.desc.en).toBe("You are a normal player.")
  })

  it("never touches non-spy games", () => {
    const otherGame: Game = { ...spyGame, id: "vampire-village" }
    const room = mkRoom({ gameId: "vampire-village", gameState: { spyWord: { word: { en: "Apple", tr: "", ar: "", ku: "" }, categoryLabel: null } } })
    const role = resolveRoleData(otherGame, room, "normal")
    expect(role!.desc.en).toBe("You are a normal player.")
  })

  it("returns null for a null roleId", () => {
    expect(resolveRoleData(spyGame, mkRoom(), null)).toBeNull()
  })
})
