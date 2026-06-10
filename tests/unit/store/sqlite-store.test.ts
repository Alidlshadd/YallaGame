import { describe, it, expect } from "vitest"
import { SqliteStore } from "@server/store/sqlite-store.js"
import { mkdtempSync, rmSync } from "node:fs"
import path from "node:path"
import os from "node:os"

describe("SqliteStore — engine specifics", () => {
  it("enables WAL mode on file-backed databases", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "rooms-"))
    const dbPath = path.join(dir, "rooms.db")
    const store = new SqliteStore(dbPath)
    try {
      // @ts-expect-error — reach into the private db for assertion only
      const mode = store.db.pragma("journal_mode", { simple: true })
      expect(mode).toBe("wal")
    } finally {
      void store.close()
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("survives reopen — schema is idempotent", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "rooms-"))
    const dbPath = path.join(dir, "rooms.db")
    const a = new SqliteStore(dbPath); void a.close()
    expect(() => { const b = new SqliteStore(dbPath); void b.close() }).not.toThrow()
    rmSync(dir, { recursive: true, force: true })
  })
})
