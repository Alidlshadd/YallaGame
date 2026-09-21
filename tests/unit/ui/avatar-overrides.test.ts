// @vitest-environment jsdom
// Admin overrides (renamed/reimaged built-ins, fully custom avatars) flow
// through the same public-config fetch already used for branding/games. See
// docs/superpowers/specs/2026-09-21-admin-avatar-management-design.md.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { buildAvatar, characterImagePath, characterName } from "@client/ui/avatar.js"
import { buildCharacterPicker } from "@client/ui/characterPicker.js"
import { loadPublicConfiguration } from "@client/services/publicConfig.js"
import { CHARACTERS } from "@shared/characters.js"

async function withAvatars(avatars: unknown[], run: () => void | Promise<void>): Promise<void> {
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ branding: {}, games: {}, avatars }), { status: 200 })
  )
  try {
    await loadPublicConfiguration()
    await run()
  } finally {
    // Reset the module-level cache so later tests see the bundled defaults again.
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ branding: {}, games: {}, avatars: [] }), { status: 200 })
    )
    await loadPublicConfiguration()
    fetchSpy.mockRestore()
  }
}

beforeEach(() => { document.body.replaceChildren() })
afterEach(() => { vi.restoreAllMocks() })

describe("admin avatar overrides", () => {
  it("prefers an override name/image for a built-in, falling back when absent", async () => {
    await withAvatars(
      [{ id: "ace", name: { en: "Renamed", tr: "Renamed", ar: "Renamed", ku: "Renamed" }, image: "/uploads/x.webp", sortOrder: 0 }],
      () => {
        expect(characterName("ace", "en")).toBe("Renamed")
        expect(characterImagePath("ace")).toBe("/uploads/x.webp")
        // A built-in with no override still resolves through the bundled data.
        expect(characterName("ruby", "en")).toBe("Ruby")
      }
    )
  })
  it("hides a disabled built-in from the pickable list without breaking id lookups", async () => {
    const withoutAce = CHARACTERS.filter(c => c.id !== "ace").map((c, sortOrder) => ({
      id: c.id,
      name: c.name,
      image: null,
      sortOrder
    }))
    await withAvatars(withoutAce, () => {
      const picker = buildCharacterPicker("en", [], vi.fn())
      document.body.append(picker.element)
      expect(document.querySelector('[data-character="ace"]')).toBeNull()
      expect(document.querySelectorAll("[data-character]")).toHaveLength(withoutAce.length)
    })
  })
  it("renders a fully custom avatar (not in the bundled CHARACTERS list) as a plain image", async () => {
    await withAvatars(
      [
        ...CHARACTERS.map((c, sortOrder) => ({ id: c.id, name: c.name, image: null, sortOrder })),
        { id: "custom-robo", name: { en: "Robo", tr: "Robo", ar: "روبو", ku: "ڕۆبۆ" }, image: "/uploads/robo.webp", sortOrder: 999 }
      ],
      () => {
        expect(characterName("custom-robo", "en")).toBe("Robo")
        expect(characterImagePath("custom-robo")).toBe("/uploads/robo.webp")
        const avatar = buildAvatar("custom-robo", "Player", "en")
        expect(avatar.classList.contains("avatar--monogram")).toBe(false)
        expect(avatar.querySelector("img")?.getAttribute("src")).toBe("/uploads/robo.webp")
        expect(avatar.querySelector("img.avatar-atlas")).toBeNull()
        const picker = buildCharacterPicker("en", [], vi.fn())
        document.body.append(picker.element)
        expect(document.querySelector('[data-character="custom-robo"]')).not.toBeNull()
      }
    )
  })
  it("falls back to the bundled CHARACTERS list when public config has no avatars", () => {
    expect(characterName("ace", "en")).toBe("Ace")
    expect(characterImagePath("ace")).toBe("/assets/characters/avatar-atlas.webp")
  })
})
