import { describe, it, expect } from "vitest"
import { CHARACTERS, CHARACTER_IDS, isCharacterId, findCharacter } from "@shared/characters.js"
import type { LangCode } from "@shared/types.js"

const LANGS: LangCode[] = ["en", "tr", "ar", "ku"]

describe("the character roster", () => {
  it("has no duplicate ids", () => {
    expect(new Set(CHARACTER_IDS).size).toBe(CHARACTER_IDS.length)
  })

  it("uses ids that are safe as filenames and as wire values", () => {
    for (const id of CHARACTER_IDS) expect(id).toMatch(/^[a-z][a-z0-9-]{0,30}$/)
  })

  it("is named in every language the app ships", () => {
    for (const c of CHARACTERS) {
      for (const lang of LANGS) expect(c.name[lang].trim()).not.toBe("")
    }
  })

  it("accepts a real id and rejects anything else", () => {
    expect(isCharacterId("owl")).toBe(true)
    expect(isCharacterId("")).toBe(false)
    expect(isCharacterId("Owl")).toBe(false)
    expect(isCharacterId("../../etc/passwd")).toBe(false)
    expect(isCharacterId("vampire")).toBe(false)
  })

  it("finds a character by id and nothing by a bad one", () => {
    expect(findCharacter("wolf")?.name.en).toBe("Wolf")
    expect(findCharacter("nobody")).toBeUndefined()
  })

  /**
   * Every online game here is a hidden-role game. An avatar that looked like a
   * role would read as a tell across the table, so the roster stays clear of
   * the role vocabulary on purpose.
   */
  it("names no character after a game role", () => {
    const roleWords = ["vampire", "mafia", "doctor", "detective", "spy", "villager", "citizen", "medic"]
    for (const id of CHARACTER_IDS) expect(roleWords).not.toContain(id)
  })
})
