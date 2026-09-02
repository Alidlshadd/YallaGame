// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

/** Minimal stand-in for the Screen Wake Lock API. */
function installWakeLockMock() {
  const sentinels: Array<{ released: boolean; release: () => Promise<void> }> = []
  const request = vi.fn(async () => {
    const sentinel = {
      released: false,
      release: vi.fn(async () => { sentinel.released = true }),
      addEventListener: () => {}
    }
    sentinels.push(sentinel)
    return sentinel
  })
  Object.defineProperty(navigator, "wakeLock", { value: { request }, configurable: true })
  return { request, sentinels }
}

async function freshModule() {
  vi.resetModules()
  return import("@client/services/wakeLock.js")
}

describe("wake lock", () => {
  let mock: ReturnType<typeof installWakeLockMock>

  beforeEach(() => {
    mock = installWakeLockMock()
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true })
  })

  afterEach(() => { vi.restoreAllMocks() })

  it("takes the lock once for several holders and releases it with the last one", async () => {
    const { holdWakeLock } = await freshModule()
    const first = holdWakeLock()
    const second = holdWakeLock()
    await vi.waitFor(() => expect(mock.sentinels).toHaveLength(1))

    first()
    expect(mock.sentinels[0]!.released).toBe(false)

    second()
    await vi.waitFor(() => expect(mock.sentinels[0]!.released).toBe(true))
  })

  it("releasing twice is harmless", async () => {
    const { holdWakeLock } = await freshModule()
    const release = holdWakeLock()
    await vi.waitFor(() => expect(mock.sentinels).toHaveLength(1))
    release()
    release()
    await vi.waitFor(() => expect(mock.sentinels[0]!.released).toBe(true))
  })

  it("syncWakeLock only takes the lock while a round is running", async () => {
    const { syncWakeLock } = await freshModule()
    let held: (() => void) | null = null

    held = syncWakeLock(false, held)
    expect(held).toBeNull()
    expect(mock.request).not.toHaveBeenCalled()

    held = syncWakeLock(true, held)
    expect(held).not.toBeNull()
    await vi.waitFor(() => expect(mock.request).toHaveBeenCalledTimes(1))

    // Staying in play must not stack more locks.
    held = syncWakeLock(true, held)
    expect(mock.request).toHaveBeenCalledTimes(1)

    held = syncWakeLock(false, held)
    expect(held).toBeNull()
    await vi.waitFor(() => expect(mock.sentinels[0]!.released).toBe(true))
  })

  it("does nothing at all where the API is missing", async () => {
    Object.defineProperty(navigator, "wakeLock", { value: undefined, configurable: true })
    const { holdWakeLock } = await freshModule()
    expect(() => holdWakeLock()()).not.toThrow()
  })
})
