import { describe, expect, it } from "vitest"
import { Schema } from "../../../src/server/config.js"

describe("production origin policy", () => {
  const production = { NODE_ENV: "production", DB_PATH: "/var/lib/yalla/rooms.db" }
  it("requires an exact HTTPS public origin", () => {
    expect(Schema.safeParse({ ...production, ALLOWED_ORIGIN: "https://games.example.com" }).success).toBe(true)
    for (const origin of [undefined, "", "*", "null", "http://games.example.com", "https://games.example.com/", "https://games.example.com/path", "https://user:password@games.example.com", "http://localhost.evil.test"]) {
      expect(() => Schema.parse({ ...production, ALLOWED_ORIGIN: origin })).toThrow()
    }
  })
  it("permits an explicit HTTP loopback origin for local production validation", () => {
    for (const origin of ["http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000"]) {
      expect(Schema.safeParse({ ...production, ALLOWED_ORIGIN: origin }).success).toBe(true)
    }
  })
})
