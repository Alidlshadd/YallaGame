// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { buildCharacterPicker } from "@client/ui/characterPicker.js"
import { buildAvatar } from "@client/ui/avatar.js"
import { AccessoryId, CreateRoomPayload, JoinPayload } from "@server/sockets/schemas.js"
import { CHARACTERS } from "@shared/characters.js"
import { ACCESSORIES } from "@shared/accessories.js"

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
    expect(document.querySelectorAll(".char-tile[data-character]")).toHaveLength(20)
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
