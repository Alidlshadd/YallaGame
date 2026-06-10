import Database from "better-sqlite3"
import type { Database as DB, Statement } from "better-sqlite3"
import type { Room } from "@shared/types.js"
import { RoomNotFoundError, type RoomStore } from "./store.js"

const SCHEMA = `
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

interface RoomRow {
  code: string
  game_id: string
  admin_secret: string
  assigned: number
  settings_json: string
  players_json: string
  created_at: number
  updated_at: number
}

function rowToRoom(row: RoomRow): Room {
  return {
    code: row.code,
    gameId: row.game_id,
    adminSecret: row.admin_secret,
    assigned: row.assigned === 1,
    settings: JSON.parse(row.settings_json),
    players: JSON.parse(row.players_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export class SqliteStore implements RoomStore {
  private readonly db: DB
  private readonly stmtInsert: Statement
  private readonly stmtGet:    Statement
  private readonly stmtUpdate: Statement
  private readonly stmtDelete: Statement
  private readonly stmtDeleteOld: Statement
  private readonly stmtCount:  Statement

  constructor(path: string) {
    this.db = new Database(path)
    if (path !== ":memory:") this.db.pragma("journal_mode = WAL")
    this.db.pragma("foreign_keys = ON")
    this.db.exec(SCHEMA)

    this.stmtInsert = this.db.prepare(`
      INSERT INTO rooms (code, game_id, admin_secret, assigned, settings_json, players_json, created_at, updated_at)
      VALUES (@code, @gameId, @adminSecret, @assigned, @settings, @players, @createdAt, @updatedAt)
    `)
    this.stmtGet = this.db.prepare(`SELECT * FROM rooms WHERE code = ?`)
    this.stmtUpdate = this.db.prepare(`
      UPDATE rooms
         SET game_id = @gameId, admin_secret = @adminSecret, assigned = @assigned,
             settings_json = @settings, players_json = @players, updated_at = @updatedAt
       WHERE code = @code
    `)
    this.stmtDelete = this.db.prepare(`DELETE FROM rooms WHERE code = ?`)
    this.stmtDeleteOld = this.db.prepare(`DELETE FROM rooms WHERE created_at < ?`)
    this.stmtCount = this.db.prepare(`SELECT COUNT(*) AS n FROM rooms`)
  }

  async create(room: Room): Promise<void> {
    this.stmtInsert.run({
      code: room.code, gameId: room.gameId, adminSecret: room.adminSecret,
      assigned: room.assigned ? 1 : 0,
      settings: JSON.stringify(room.settings),
      players: JSON.stringify(room.players),
      createdAt: room.createdAt, updatedAt: room.updatedAt
    })
  }

  async get(code: string): Promise<Room | null> {
    const row = this.stmtGet.get(code) as RoomRow | undefined
    return row ? rowToRoom(row) : null
  }

  async update(code: string, updater: (room: Room) => Room): Promise<Room> {
    const tx = this.db.transaction((c: string): Room => {
      const row = this.stmtGet.get(c) as RoomRow | undefined
      if (!row) throw new RoomNotFoundError(c)
      const current = rowToRoom(row)
      const updated = updater(current)
      updated.updatedAt = Date.now()
      this.stmtUpdate.run({
        code: c, gameId: updated.gameId, adminSecret: updated.adminSecret,
        assigned: updated.assigned ? 1 : 0,
        settings: JSON.stringify(updated.settings),
        players: JSON.stringify(updated.players),
        updatedAt: updated.updatedAt
      })
      return updated
    }).immediate
    return tx(code)
  }

  async delete(code: string): Promise<void> {
    this.stmtDelete.run(code)
  }

  async deleteOlderThan(cutoffMs: number): Promise<number> {
    const result = this.stmtDeleteOld.run(cutoffMs)
    return result.changes
  }

  async countActiveRooms(): Promise<number> {
    const row = this.stmtCount.get() as { n: number }
    return row.n
  }

  async close(): Promise<void> {
    this.db.close()
  }
}
