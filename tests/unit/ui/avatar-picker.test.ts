// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { buildCharacterPicker } from "@client/ui/characterPicker.js"
import { buildAvatar } from "@client/ui/avatar.js"
import { AccessoryId, CreateRoomPayload, JoinPayload } from "@server/sockets/schemas.js"
import { CHARACTERS } from "@shared/characters.js"
import { ACCESSORIES, characterAccessory } from "@shared/accessories.js"

beforeEach(() => { document.body.replaceChildren(); localStorage.clear() })
function click(selector: string): void { document.querySelector<HTMLButtonElement>(selector)!.click() }

describe("avatar customization", () => {
  it("restores a combination without calling back before construction finishes", () => {
    localStorage.setItem("role-room:last-character", "ruby")
    localStorage.setItem("role-room:last-accessory", "crown")
    const changed = vi.fn()
    const picker = buildCharacterPicker("en", [], changed)
    document.body.append(picker.element)
    expect(changed).not.toHaveBeenCalled()
    expect(picker.value()).toBe("ruby")
    expect(picker.accessory()).toBe("crown")
    expect(document.querySelectorAll(".char-tile[data-character]")).toHaveLength(21)
    expect(document.querySelector(".avatar-preview .avatar")?.getAttribute("data-accessory")).toBe("crown")
  })
  it("keeps the character when adding/removing accessories and changing tabs", () => {
    const picker = buildCharacterPicker("en", [], vi.fn())
    document.body.append(picker.element)
    click('[data-character="wisp"]')
    click('[role="tab"][id$="accessories-tab"]')
    click('.accessory-tile[data-accessory="heart-glasses"]')
    expect(picker.value()).toBe("wisp")
    expect(picker.accessory()).toBe("heart-glasses")
    expect(document.querySelector(".avatar-preview .avatar-accessory")).not.toBeNull()
    click('.accessory-tile[data-accessory=""]')
    expect(picker.accessory()).toBe("")
    expect(picker.value()).toBe("wisp")
    expect(document.querySelector(".avatar-preview .avatar-accessory")).toBeNull()
  })
  it("clears accessories for Ali and enables them again for another character", () => {
    localStorage.setItem("role-room:last-accessory", "crown")
    const picker = buildCharacterPicker("en", [], vi.fn())
    document.body.append(picker.element)
    click('[data-character="ali"]')
    expect(picker.accessory()).toBe("")
    expect(localStorage.getItem("role-room:last-accessory")).toBe("")
    const tab = document.querySelector<HTMLButtonElement>('[id$="accessories-tab"]')!
    expect(tab.disabled).toBe(true)
    click('[id$="characters-tab"]')
    document.querySelector('[role="tablist"]')!.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }))
    expect(document.querySelector<HTMLElement>('[id$="accessories"]')!.hidden).toBe(true)
    expect(document.querySelector(".avatar-preview img")?.getAttribute("src")).toBe("/assets/characters/ali.png")
    click('[data-character="ruby"]')
    expect(tab.disabled).toBe(false)
    click('.accessory-tile[data-accessory="crown"]')
    expect(picker.accessory()).toBe("crown")
  })
  it("keeps restored and random Ali selections accessory-free", () => {
    localStorage.setItem("role-room:last-character", "ali")
    localStorage.setItem("role-room:last-accessory", "crown")
    const picker = buildCharacterPicker("en", CHARACTERS.filter(c => c.id !== "ali").map(c => c.id), vi.fn())
    document.body.append(picker.element)
    expect(picker.value()).toBe("ali")
    expect(picker.accessory()).toBe("")
    click(".avatar-surprise")
    expect(picker.value()).toBe("ali")
    expect(picker.accessory()).toBe("")
    expect(document.querySelector(".avatar-preview .avatar-accessory")).toBeNull()
  })
  it("strips Ali accessories from rendering and stored player styles", () => {
    for (const accessory of ACCESSORIES) {
      expect(characterAccessory("ali", accessory.id)).toBe("")
      const avatar = buildAvatar("ali", "Ada", "en", { accessory: accessory.id })
      expect(avatar.dataset.accessory).toBe("")
      expect(avatar.getAttribute("aria-label")).toBe("Ali")
      expect(avatar.querySelector(".avatar-accessory")).toBeNull()
      expect(characterAccessory("ruby", accessory.id)).toBe(accessory.id)
    }
  })
  it("drops a newly claimed face but preserves the accessory and excludes claimed random picks", () => {
    const changed = vi.fn()
    const picker = buildCharacterPicker("en", [], changed)
    document.body.append(picker.element)
    click('[data-character="ace"]')
    click('.accessory-tile[data-accessory="crown"]')
    picker.setTaken(["ace"])
    expect(picker.value()).toBe("")
    expect(picker.accessory()).toBe("crown")
    expect(changed).toHaveBeenLastCalledWith("")
    picker.setTaken(CHARACTERS.filter(c => c.id !== "mochi").map(c => c.id))
    click(".avatar-surprise")
    expect(picker.value()).toBe("mochi")
    picker.setTaken(CHARACTERS.map(c => c.id))
    expect(document.querySelector<HTMLButtonElement>(".avatar-surprise")?.disabled).toBe(true)
  })
  it("renders all combinations with unique SVG ids and recovers from unavailable art", () => {
    for (const character of CHARACTERS) for (const accessory of ACCESSORIES) {
      document.body.append(buildAvatar(character.id, "Ada", "en", { accessory: accessory.id }))
    }
    expect(document.querySelectorAll(".avatar-accessory")).toHaveLength(240)
    const ids = [...document.querySelectorAll("[id]")].map(el => el.id)
    expect(new Set(ids).size).toBe(ids.length)
    const avatar = buildAvatar("ace", "Ada", "en")
    avatar.querySelector("img")!.dispatchEvent(new Event("error"))
    expect(avatar.textContent).toBe("A")
  })
  it("ignores corrupt remembered choices", () => {
    localStorage.setItem("role-room:last-character", "nobody")
    localStorage.setItem("role-room:last-accessory", "<script>")
    const picker = buildCharacterPicker("en", [], vi.fn())
    expect(picker.value()).toBe("")
    expect(picker.accessory()).toBe("")
  })
  it("previews every accessory on the current character and refreshes when it changes", () => {
    const picker = buildCharacterPicker("en", [], vi.fn())
    document.body.append(picker.element)
    click('[data-character="ruby"]')
    for (const tile of document.querySelectorAll(".accessory-tile")) {
      expect(tile.querySelector(".avatar")?.getAttribute("data-avatar")).toBe("ruby")
      expect(tile.querySelector(".avatar")?.getAttribute("data-accessory")).toBe(tile.getAttribute("data-accessory"))
    }
    click('[data-character="blinky"]')
    expect(document.querySelector('.accessory-tile[data-accessory="round-glasses"] .avatar')?.getAttribute("data-avatar")).toBe("blinky")
    expect(document.querySelectorAll('.accessory-tile[data-accessory="round-glasses"] .accessory-lens')).toHaveLength(1)
  })
  it("fits one lens to the cyclops and removes wearables if the portrait cannot load", () => {
    for (const accessory of ["round-glasses", "heart-glasses", "star-glasses", "snorkel"]) {
      expect(buildAvatar("blinky", "Ada", "en", { accessory }).querySelectorAll(".accessory-lens")).toHaveLength(1)
      expect(buildAvatar("ruby", "Ada", "en", { accessory }).querySelectorAll(".accessory-lens")).toHaveLength(2)
    }
    const avatar = buildAvatar("ruby", "Ada", "en", { accessory: "crown" })
    avatar.querySelector("img")!.dispatchEvent(new Event("error"))
    expect(avatar.querySelector(".avatar-accessory")).toBeNull()
    expect(avatar.textContent).toBe("A")
  })
})

describe("accessory input validation", () => {
  it("allows removal and supported accessories while rejecting arbitrary input", () => {
    for (const id of ["", ...ACCESSORIES.map(a => a.id)]) expect(AccessoryId.safeParse(id).success).toBe(true)
    for (const id of ["unknown", "../../secret", "<svg>", null, 1]) expect(AccessoryId.safeParse(id).success).toBe(false)
  })
  it("supports old clients that send no accessory", () => {
    expect(JoinPayload.parse({ code: "ABCDE", name: "Ada" }).accessory).toBeUndefined()
    expect(CreateRoomPayload.parse({ gameId: "mafia", hostName: "Host", hostCharacter: "ace", isPublic: false, requireApproval: false }).hostAccessory).toBeUndefined()
  })
})
