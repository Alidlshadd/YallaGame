import { describe, it, expect } from "vitest"
import Database from "better-sqlite3"
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

  /**
   * The release that added the room browser shipped an index over `is_public`
   * inside the CREATE TABLE block, which runs before the migration that adds
   * that column. Opening a live database therefore threw "no such column" and
   * killed the server on start, while every test — all of which start from an
   * empty file — passed. Hence: open a database written the old way.
   */
  describe("upgrading a database written by an earlier release", () => {
    const PRE_BROWSER_SCHEMA = `
CREATE TABLE IF NOT EXISTS rooms (
  code           TEXT PRIMARY KEY,
  game_id        TEXT NOT NULL,
  admin_secret   TEXT NOT NULL,
  assigned       INTEGER NOT NULL DEFAULT 0,
  settings_json  TEXT NOT NULL,
  players_json   TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rooms_created_at_idx ON rooms(created_at);
`

    function writeOldDatabase(): { dir: string; dbPath: string } {
      const dir = mkdtempSync(path.join(os.tmpdir(), "rooms-old-"))
      const dbPath = path.join(dir, "rooms.db")
      const db = new Database(dbPath)
      db.exec(PRE_BROWSER_SCHEMA)
      db.prepare(`INSERT INTO rooms VALUES (?,?,?,?,?,?,?,?)`)
        .run("ABCDE", "vampire-village", "secret", 0, "{}", '[{"id":"p1","name":"Ada","role":null,"connected":true}]', 1000, 1000)
      db.close()
      return { dir, dbPath }
    }

    it("opens without throwing", () => {
      const { dir, dbPath } = writeOldDatabase()
      try {
        expect(() => { const s = new SqliteStore(dbPath); void s.close() }).not.toThrow()
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    })

    it("keeps the rooms that were already there, with sane defaults", async () => {
      const { dir, dbPath } = writeOldDatabase()
      const store = new SqliteStore(dbPath)
      try {
        const room = await store.get("ABCDE")
        expect(room?.code).toBe("ABCDE")
        expect(room?.players).toHaveLength(1)
        // A room from before the feature existed is private and open to all.
        expect(room?.isPublic).toBe(false)
        expect(room?.requireApproval).toBe(false)
        expect(room?.pending).toEqual([])
        expect(room?.hostPlayerId).toBe("")
        // The pre-existing room must not surface in the public browser.
        expect(await store.listPublic(10)).toEqual([])
      } finally {
        await store.close()
        rmSync(dir, { recursive: true, force: true })
      }
    })

    it("is still writable after the upgrade", async () => {
      const { dir, dbPath } = writeOldDatabase()
      const store = new SqliteStore(dbPath)
      try {
        const updated = await store.update("ABCDE", r => ({ ...r, isPublic: true, hostPlayerId: "p1" }))
        expect(updated.isPublic).toBe(true)
        expect((await store.listPublic(10)).map(r => r.code)).toEqual(["ABCDE"])
      } finally {
        await store.close()
        rmSync(dir, { recursive: true, force: true })
      }
    })
  })
})
