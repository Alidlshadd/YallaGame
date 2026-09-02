// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Game } from "@shared/types.js"

const CATALOG: Game[] = [
  { id: "spy-game", theme: "spy-game" } as unknown as Game,
  { id: "who-am-i", theme: "who-am-i" } as unknown as Game
]

async function freshHome() {
  vi.resetModules()
  return import("@client/views/home.js")
}

describe("game catalog offline fallback", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it("keeps the catalog on the device after a successful load", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(CATALOG), { status: 200 })))
    const { loadCatalog, getGames } = await freshHome()

    await loadCatalog()

    expect(getGames()).toHaveLength(2)
    expect(JSON.parse(localStorage.getItem("role-room:catalog")!)).toHaveLength(2)
  })

  it("serves the stored catalog when the request fails, so Local Play still works offline", async () => {
    localStorage.setItem("role-room:catalog", JSON.stringify(CATALOG))
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch") }))
    const { loadCatalog, getGames } = await freshHome()

    await loadCatalog()

    expect(getGames().map(g => g.id)).toEqual(["spy-game", "who-am-i"])
  })

  it("reports the failure when nothing was ever stored", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch") }))
    vi.spyOn(console, "error").mockImplementation(() => {})
    const { loadCatalog, getGames } = await freshHome()

    await loadCatalog()

    expect(getGames()).toEqual([])
  })

  it("ignores a corrupted or empty stored catalog", async () => {
    localStorage.setItem("role-room:catalog", "[]")
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch") }))
    vi.spyOn(console, "error").mockImplementation(() => {})
    const { loadCatalog, getGames } = await freshHome()

    await loadCatalog()

    expect(getGames()).toEqual([])
  })
})
