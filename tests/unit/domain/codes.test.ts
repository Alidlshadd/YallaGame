import { describe, it, expect } from "vitest"
import { makeRoomCode, makeSecret, ROOM_CODE_ALPHABET, ROOM_CODE_LEN } from "@server/domain/codes.js"

describe("makeRoomCode", () => {
  it(`returns ${5}-character codes from the documented alphabet`, () => {
    for (let i = 0; i < 200; i++) {
      const code = makeRoomCode(() => false)
      expect(code.length).toBe(ROOM_CODE_LEN)
      for (const ch of code) expect(ROOM_CODE_ALPHABET).toContain(ch)
    }
  })

  it("retries when the supplied `exists` reports a collision", () => {
    let calls = 0
    const code = makeRoomCode(() => { calls++; return calls < 3 })
    expect(code.length).toBe(ROOM_CODE_LEN)
    expect(calls).toBeGreaterThanOrEqual(3)
  })

  it("does not produce visually ambiguous characters (no 0, O, 1, I)", () => {
    for (const ch of ROOM_CODE_ALPHABET) {
      expect(["0", "O", "1", "I"]).not.toContain(ch)
    }
  })
})

describe("makeSecret", () => {
  it("returns 22-character base64url strings", () => {
    const s = makeSecret()
    expect(s).toMatch(/^[A-Za-z0-9_-]{22}$/)
  })

  it("produces unique values across 10000 calls", () => {
    const seen = new Set<string>()
    for (let i = 0; i < 10_000; i++) seen.add(makeSecret())
    expect(seen.size).toBe(10_000)
  })
})
