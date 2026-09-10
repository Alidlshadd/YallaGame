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

  it("exposes the stored catalog while a slow refresh is still pending", async () => {
    localStorage.setItem("role-room:catalog", JSON.stringify(CATALOG))
    let respond!: (response: Response) => void
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(resolve => { respond = resolve })))
    const { loadCatalog, getGames } = await freshHome()
    const loading = loadCatalog()

    expect(getGames().map(g => g.id)).toEqual(["spy-game", "who-am-i"])
    respond(new Response(JSON.stringify(CATALOG.slice(0, 1))))
    await loading
    expect(getGames().map(g => g.id)).toEqual(["spy-game"])
  })

  it("ignores a corrupted or empty stored catalog", async () => {
    localStorage.setItem("role-room:catalog", "[]")
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch") }))
    vi.spyOn(console, "error").mockImplementation(() => {})
    const { loadCatalog, getGames } = await freshHome()

    await loadCatalog()

    expect(getGames()).toEqual([])
  })

  it("aborts a stalled refresh and preserves the cached catalog", async () => {
    vi.useFakeTimers()
    try {
      localStorage.setItem("role-room:catalog", JSON.stringify(CATALOG))
      const fetchMock = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
        init.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })
      }))
      vi.stubGlobal("fetch", fetchMock)
      const { loadCatalog, getGames } = await freshHome()
      const loading = loadCatalog()
      await vi.advanceTimersByTimeAsync(5000)
      await loading
      expect(fetchMock.mock.calls[0]![1].signal?.aborted).toBe(true)
      expect(getGames()).toEqual(CATALOG)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
