import type Database from "better-sqlite3"
import type { Room } from "../../shared/types.js"
import type { RoomStore } from "../store/store.js"
import { hash } from "./auth.js"
import { logger } from "../logger.js"

export const roomReference = (room: Room): string => hash(`${room.code}:${room.createdAt}`).slice(0, 24)
export class Analytics {
  constructor(readonly db: Database.Database) {}
  private lastWarning = 0
  safe(fn: () => void): void {
    try {
      fn()
    } catch {
      if (Date.now() - this.lastWarning > 60_000) {
        this.lastWarning = Date.now()
        logger.warn("Analytics write unavailable; gameplay continues")
      }
    }
  }
  event(event: string, room: Room, name: string | null = null): void {
    this.db
      .prepare(
        `INSERT INTO analytics_events(event,game_id,room_ref,player_count,player_name,created_at) VALUES(?,?,?,?,?,?)`
      )
      .run(
        event,
        room.gameId,
        roomReference(room),
        room.players.filter(p => p.connected).length,
        name?.slice(0, 80) ?? null,
        Date.now()
      )
  }
  pageView(visitor: string, view: string): void {
    this.safe(() =>
      this.db.transaction(() => {
        const now = Date.now()
        this.db
          .prepare(
            `INSERT INTO analytics_visitors VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen`
          )
          .run(visitor, now, now)
        this.db
          .prepare(
            `INSERT INTO analytics_events(event,visitor_id,created_at,metadata) VALUES('page_view',?,?,?)`
          )
          .run(visitor, now, JSON.stringify({ view }))
      })()
    )
  }
  heartbeat(visitor: string): void {
    this.safe(() => {
      this.db.prepare("UPDATE analytics_visitors SET last_seen=? WHERE id=?").run(Date.now(), visitor)
    })
  }
  created(room: Room): void {
    this.safe(() =>
      this.db.transaction(() => {
        this.event("room_created", room)
        for (const p of room.players) this.event("player_joined", room, p.name)
      })()
    )
  }
  changed(before: Room, after: Room): void {
    this.safe(() =>
      this.db.transaction(() => {
        for (const p of after.players)
          if (!before.players.some(old => old.id === p.id)) this.event("player_joined", after, p.name)
        const started =
          (before.phase === "idle" && after.phase !== "idle") || (!before.assigned && after.assigned)
        if (started) {
          this.finish(before, "abandoned")
          const players = after.players.filter(p => p.connected).map(p => p.name.slice(0, 80))
          this.db
            .prepare(
              `INSERT INTO game_sessions(game_id,room_ref,players,player_count,started_at,status,room_created_at)
         VALUES(?,?,?,?,?,'running',?)`
            )
            .run(
              after.gameId,
              roomReference(after),
              JSON.stringify(players),
              players.length,
              Date.now(),
              after.createdAt
            )
          this.event("game_started", after)
        }
        // Manually stopped role games have no verifiable completion signal.
        if (after.phase !== before.phase && /game.over$/i.test(after.phase)) this.finish(after, "completed")
        else if ((before.phase !== "idle" && after.phase === "idle") || (before.assigned && !after.assigned))
          this.finish(after, "abandoned")
      })()
    )
  }
  finish(room: Room, status: "completed" | "abandoned"): void {
    const result = this.db
      .prepare("UPDATE game_sessions SET status=?,ended_at=? WHERE room_ref=? AND status='running'")
      .run(status, Date.now(), roomReference(room))
    if (result.changes && status === "completed") this.event("game_completed", room)
  }
  closed(room: Room): void {
    this.safe(() =>
      this.db.transaction(() => {
        this.finish(room, "abandoned")
        this.event("room_closed", room)
      })()
    )
  }
  expired(cutoff: number): void {
    this.safe(() =>
      this.db.transaction(() => {
        // Includes rooms with no started game, persisted independently of the room store.
        const rows = this.db
          .prepare(
            `SELECT e.room_ref,e.game_id,e.player_count FROM analytics_events e
       WHERE e.event='room_created' AND e.created_at<? AND NOT EXISTS
       (SELECT 1 FROM analytics_events c WHERE c.room_ref=e.room_ref AND c.event='room_closed')`
          )
          .all(cutoff) as Array<{ room_ref: string; game_id: string; player_count: number }>
        for (const row of rows)
          this.db
            .prepare(
              `INSERT INTO analytics_events(event,room_ref,game_id,player_count,created_at) VALUES('room_closed',?,?,?,?)`
            )
            .run(row.room_ref, row.game_id, row.player_count, Date.now())
        this.db
          .prepare(
            "UPDATE game_sessions SET status='abandoned',ended_at=? WHERE room_created_at<? AND status='running'"
          )
          .run(Date.now(), cutoff)
      })()
    )
  }
  retain(days: number): void {
    this.safe(() =>
      this.db.transaction(() => {
        const cutoff = Date.now() - days * 86400_000
        this.db.prepare("DELETE FROM analytics_events WHERE created_at<?").run(cutoff)
        this.db.prepare("DELETE FROM game_sessions WHERE started_at<? AND status<>'running'").run(cutoff)
        this.db.prepare("DELETE FROM analytics_visitors WHERE last_seen<?").run(cutoff)
        this.db
          .prepare("DELETE FROM admin_sessions WHERE expires_at<? OR last_seen<?")
          .run(Date.now(), Date.now() - 1800_000)
      })()
    )
  }
  dashboard(days: number): Record<string, unknown> {
    const now = Date.now(),
      today = new Date().setUTCHours(0, 0, 0, 0)
    const since = days ? today - (days - 1) * 86400_000 : 0
    const scalar = (sql: string, ...args: number[]): number =>
      (this.db.prepare(sql).get(...args) as { n: number }).n
    const visitors = (start: number) =>
      scalar(
        "SELECT COUNT(DISTINCT visitor_id) n FROM analytics_events WHERE event='page_view' AND created_at>=?",
        start
      )
    const events = (event: string, start: number) =>
      (
        this.db
          .prepare("SELECT COUNT(*) n FROM analytics_events WHERE event=? AND created_at>=?")
          .get(event, start) as { n: number }
      ).n
    const popularity = this.db
      .prepare(
        "SELECT game_id,COUNT(*) count FROM game_sessions WHERE started_at>=? GROUP BY game_id ORDER BY count DESC,game_id"
      )
      .all(since)
    const graphSince = today - ((days && days <= 90 ? days : 90) - 1) * 86400_000
    return {
      timezone: "UTC",
      retentionNote: "Totals cover retained data. Online = active within 90 seconds.",
      kpis: {
        visitorsToday: visitors(today),
        visitors7Days: visitors(today - 6 * 86400_000),
        visitorsTotal: scalar("SELECT COUNT(*) n FROM analytics_visitors"),
        online: scalar("SELECT COUNT(*) n FROM analytics_visitors WHERE last_seen>=?", now - 90_000),
        roomsToday: events("room_created", today),
        startedToday: events("game_started", today),
        completedToday: events("game_completed", today),
        gamesTotal: scalar("SELECT COUNT(*) n FROM game_sessions"),
        averagePlayers: scalar(
          "SELECT COALESCE(ROUND(AVG(player_count),1),0) n FROM game_sessions WHERE started_at>=?",
          since
        ),
        mostPopular: (popularity[0] as { game_id: string } | undefined)?.game_id ?? null,
        visitorsSelected: visitors(since)
      },
      popularity,
      visitors: this.db
        .prepare(
          `SELECT strftime('%Y-%m-%d',created_at/1000,'unixepoch') day,COUNT(DISTINCT visitor_id) count FROM analytics_events
       WHERE event='page_view' AND created_at>=? GROUP BY day ORDER BY day`
        )
        .all(graphSince),
      starts: this.db
        .prepare(
          `SELECT strftime('%Y-%m-%d',started_at/1000,'unixepoch') day,COUNT(*) count FROM game_sessions WHERE started_at>=? GROUP BY day ORDER BY day`
        )
        .all(graphSince),
      hours: this.db
        .prepare(
          `SELECT strftime('%H',created_at/1000,'unixepoch') hour,COUNT(*) count FROM analytics_events WHERE event='page_view' AND created_at>=? GROUP BY hour ORDER BY hour`
        )
        .all(since)
    }
  }
}

/** Observe successful writes, after the room transaction has committed. Never call analytics inside the game's updater. */
export class ObservedStore implements RoomStore {
  constructor(
    private readonly inner: RoomStore,
    private readonly analytics: Analytics
  ) {}
  async create(room: Room): Promise<void> {
    await this.inner.create(room)
    this.analytics.created(room)
  }
  get(code: string): Promise<Room | null> {
    return this.inner.get(code)
  }
  async update(code: string, updater: (room: Room) => Room): Promise<Room> {
    let before: Room | undefined
    const after = await this.inner.update(code, current => {
      before = structuredClone(current)
      return updater(current)
    })
    if (before) this.analytics.changed(before, after)
    return after
  }
  async delete(code: string): Promise<void> {
    const room = await this.inner.get(code)
    await this.inner.delete(code)
    if (room) this.analytics.closed(room)
  }
  async deleteOlderThan(cutoff: number): Promise<number> {
    const count = await this.inner.deleteOlderThan(cutoff)
    this.analytics.expired(cutoff)
    return count
  }
  countActiveRooms(): Promise<number> {
    return this.inner.countActiveRooms()
  }
  listPublic(limit: number): Promise<Room[]> {
    return this.inner.listPublic(limit)
  }
  close(): Promise<void> {
    return this.inner.close()
  }
  recordRoleRedeal(room: Room): void {
    this.analytics.changed({ ...room, assigned: false }, room)
  }
}
