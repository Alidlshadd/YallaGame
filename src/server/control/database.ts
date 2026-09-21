import Database from "better-sqlite3"
import { chmodSync, existsSync, mkdirSync } from "node:fs"
import path from "node:path"

export const ADMIN_SCHEMA = `
CREATE TABLE IF NOT EXISTS admin_schema (version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS admin_users (
 id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
 password_hash TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash TEXT PRIMARY KEY, admin_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
 csrf_hash TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, last_seen INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS admin_sessions_user ON admin_sessions(admin_id);
CREATE TABLE IF NOT EXISTS admin_login_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS analytics_visitors (id TEXT PRIMARY KEY, first_seen INTEGER NOT NULL, last_seen INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS visitors_last ON analytics_visitors(last_seen);
CREATE TABLE IF NOT EXISTS analytics_events (
 id INTEGER PRIMARY KEY, event TEXT NOT NULL CHECK(event IN ('page_view','room_created','player_joined','game_started','game_completed','room_closed')),
 visitor_id TEXT REFERENCES analytics_visitors(id) ON DELETE SET NULL,
 game_id TEXT, room_ref TEXT, player_count INTEGER, player_name TEXT,
 created_at INTEGER NOT NULL, metadata TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS events_type_time ON analytics_events(event,created_at);
CREATE INDEX IF NOT EXISTS events_time ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS events_visitor_time ON analytics_events(visitor_id,created_at);
CREATE INDEX IF NOT EXISTS events_game_time ON analytics_events(game_id,created_at);
CREATE INDEX IF NOT EXISTS events_room_type ON analytics_events(room_ref,event);
CREATE TABLE IF NOT EXISTS game_sessions (
 id INTEGER PRIMARY KEY, game_id TEXT NOT NULL, room_ref TEXT NOT NULL,
 players TEXT NOT NULL, player_count INTEGER NOT NULL, started_at INTEGER NOT NULL,
 ended_at INTEGER, status TEXT NOT NULL CHECK(status IN ('running','completed','abandoned')),
 room_created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS session_running ON game_sessions(room_ref) WHERE status='running';
CREATE INDEX IF NOT EXISTS sessions_time ON game_sessions(started_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS sessions_game_time ON game_sessions(game_id,started_at DESC);
CREATE TABLE IF NOT EXISTS admin_uploads (
 id TEXT PRIMARY KEY, created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
 created_at INTEGER NOT NULL, bytes INTEGER NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL,
 retired_at INTEGER
);
CREATE TABLE IF NOT EXISTS game_asset_overrides (
 game_id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)), sort_order INTEGER NOT NULL DEFAULT 0,
 cover TEXT REFERENCES admin_uploads(id), detail TEXT REFERENCES admin_uploads(id),
 cta TEXT REFERENCES admin_uploads(id), section TEXT REFERENCES admin_uploads(id), updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS avatar_overrides (
 id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)), sort_order INTEGER NOT NULL DEFAULT 0,
 name_en TEXT, name_tr TEXT, name_ar TEXT, name_ku TEXT,
 image TEXT REFERENCES admin_uploads(id), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS admin_audit_logs (
 id INTEGER PRIMARY KEY, admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
 action TEXT NOT NULL, target TEXT NOT NULL, created_at INTEGER NOT NULL, metadata TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS audit_time ON admin_audit_logs(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS audit_admin ON admin_audit_logs(admin_id,created_at);
INSERT OR IGNORE INTO admin_schema(version) VALUES(1);
`

export function openControlDatabase(filename: string, migrate = false): Database.Database {
  const isNew = filename !== ":memory:" && !existsSync(filename)
  if (filename !== ":memory:") mkdirSync(path.dirname(path.resolve(filename)), { recursive: true, mode: 0o700 })
  const db = new Database(filename, { timeout: 250 })
  if (isNew) chmodSync(filename,0o600)
  db.pragma("foreign_keys = ON")
  if (filename !== ":memory:") db.pragma("journal_mode = WAL")
  if (migrate) db.transaction(() => db.exec(ADMIN_SCHEMA)).immediate()
  const ready = db.prepare("SELECT 1 FROM sqlite_master WHERE name='admin_schema'").get()
  if (!ready) {
    db.close()
    throw new Error("Admin migration required. Run npm run admin:cli -- migrate after backup.")
  }
  return db
}

export function audit(
  db: Database.Database,
  admin: number | null,
  action: string,
  target: string,
  metadata: Record<string, string | number | boolean | null> = {}
): void {
  db.prepare(
    "INSERT INTO admin_audit_logs(admin_id,action,target,created_at,metadata) VALUES(?,?,?,?,?)"
  ).run(admin, action, target, Date.now(), JSON.stringify(metadata))
}
