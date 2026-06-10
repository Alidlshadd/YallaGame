# Infrastructure and Code Quality Foundation — Design Spec

**Date:** 2026-06-10
**Scope:** Sub-project 1 of 4 in the broader "improve multigame-role-room-platform" initiative.
**Out of scope:** Real game flow (voting/phases/win conditions), additional games, visual/UX polish. These are tracked as future sub-projects.

## Goal

Transform the current single-file Node.js + Socket.IO prototype into a maintainable, testable, persistent, type-safe foundation — without rewriting the working UI or breaking existing socket event contracts. The end state is a project where adding the next sub-project (real game flow) is incremental rather than risky.

## Current State

- **Backend:** `server.js` (316 lines) — Express + Socket.IO, in-memory `Map<code, Room>`, hand-rolled room CRUD, role assignment logic mixed with socket handlers, no input validation, no tests.
- **Frontend:** `public/app.js` (687 lines, single IIFE), `public/games.js` (413 lines, game catalog), `public/index.html` (195 lines), `public/styles.css` (894 lines).
- **No persistence:** Server restart wipes every room.
- **No types:** Plain JS everywhere.
- **No tests, no CI, no build pipeline.**
- **No reconnect:** Page refresh drops the player from the room.
- **No input validation:** Socket payloads are trusted as-is.

## Non-Goals

- Replacing the vanilla DOM frontend with a framework (Vue/React/Svelte).
- Rewriting `styles.css` or `index.html` markup.
- Adding authentication beyond the existing admin-secret model.
- Adding new gameplay features (voting, phases, etc.).
  - Note: when sub-project 2 introduces phase timers, persistence of `phase_ends_at` (epoch ms) per room and a startup-recovery routine that re-arms `setTimeout` based on remaining time will be designed there. Out of scope here.
- Adding new games to the catalog.
- Multi-tenant/horizontally-scaled architecture (single-process is the target).

## Decisions Made During Brainstorming

| Question | Decision |
|---|---|
| Refactor scope | Moderate: TypeScript end-to-end, modular structure, but vanilla DOM frontend is preserved. |
| Persistence | SQLite via `better-sqlite3` with WAL mode. Single-file, zero service dependency. |
| Test scope | Vitest unit tests for domain + store; 1-2 Playwright E2E for the happy path and reconnect. |
| Deploy target | Deploy-agnostic. `DB_PATH` env var configures the SQLite file location; README documents per-host considerations. |
| Production safety | In `NODE_ENV=production`, missing `DB_PATH` is a fatal startup error — no silent fall-back to memory store. |

## Architecture

### Folder layout

```
multigame-role-room-platform/
├── package.json                  # single package, single tsconfig
├── tsconfig.json
├── tsconfig.server.json          # extends, outDir: dist/server
├── vite.config.ts                # client build → dist/client; root: "."
├── vitest.config.ts
├── playwright.config.ts
├── index.html                    # moved from public/; Vite root entry
├── .env.example                  # PORT, DB_PATH, NODE_ENV, ALLOWED_ORIGIN, ROOM_TTL_HOURS, MAX_*
├── src/
│   ├── server/
│   │   ├── index.ts              # bootstrap: express + http + io + DI wiring
│   │   ├── config.ts             # env parsing + Zod validation (fail-fast)
│   │   ├── logger.ts             # pino instance
│   │   ├── store/
│   │   │   ├── store.ts          # RoomStore interface
│   │   │   ├── sqlite-store.ts   # better-sqlite3 implementation
│   │   │   └── memory-store.ts   # test/dev only
│   │   ├── domain/
│   │   │   ├── roles.ts          # buildRolePool, assignRolesToPlayers (pure)
│   │   │   ├── settings.ts       # normalizeSettings (pure)
│   │   │   ├── codes.ts          # makeRoomCode, makeSecret (crypto.randomBytes)
│   │   │   └── visibility.ts     # projectRoomFor — per-viewer state projection
│   │   ├── sockets/
│   │   │   ├── index.ts          # registerHandlers(io, deps)
│   │   │   ├── admin-handlers.ts
│   │   │   ├── player-handlers.ts
│   │   │   ├── schemas.ts        # Zod payload schemas
│   │   │   ├── bind.ts           # typed handler binder w/ validation + ack
│   │   │   └── rate-limit.ts     # per-socket cooldown map
│   │   └── games/
│   │       └── catalog.ts        # game catalog as typed TS
│   ├── shared/
│   │   ├── types.ts              # Room, Player, Game, Role, Settings, PublicRoom, PlayerRoom
│   │   └── events.ts             # ClientToServerEvents, ServerToClientEvents, Ack<T>, ErrorCode
│   └── client/
│       ├── main.ts               # bootstrap, router
│       ├── router.ts             # setView(id) with mount/unmount
│       ├── views/
│       │   ├── home.ts
│       │   ├── gameInfo.ts
│       │   ├── join.ts
│       │   ├── playerRoom.ts
│       │   └── admin.ts
│       ├── services/
│       │   ├── socket.ts         # typed io() wrapper, emit returns Promise<Ack>
│       │   ├── session.ts        # localStorage: admin/player session
│       │   └── i18n.ts           # 4 languages, RTL/LTR, html lang/dir sync
│       ├── i18n/
│       │   ├── en.ts             # canonical
│       │   ├── ku.ts
│       │   ├── ar.ts
│       │   └── tr.ts
│       └── ui/
│           ├── toast.ts
│           └── dom.ts            # small helpers
├── public/                       # Vite publicDir — copied verbatim to dist/client at build
│   └── styles.css                # untouched (out of scope); served at /styles.css
├── tests/
│   ├── unit/                     # Vitest
│   │   ├── domain/
│   │   └── store/
│   └── e2e/                      # Playwright
│       ├── happy-path.spec.ts
│       └── reconnect.spec.ts
└── docs/superpowers/specs/2026-06-10-infrastructure-and-code-quality-design.md
```

### Module boundaries

Three layers, enforced by folder and imports:

1. **Domain (`src/server/domain/`):** Pure functions. No I/O, no socket awareness, no store awareness. Takes data in, returns data out. RNG is injected as a parameter for deterministic tests. Includes the per-viewer projection (`visibility.ts`) that every outbound payload carrying room state passes through.
2. **Store (`src/server/store/`):** Persistence behind a single `RoomStore` interface. Two implementations: SQLite (production/dev) and in-memory (tests). Server handlers depend only on the interface.
3. **Sockets (`src/server/sockets/`):** Thin glue. Parses payload via Zod, calls domain functions, persists via store, emits typed events, returns typed ack.

Client mirrors the same discipline:

- **Views (`src/client/views/`):** Each view owns one `<section>` in `index.html`. Exports `mount(ctx)` returning an `unmount` closure. Views do not render markup — markup lives in `index.html` already.
- **Services (`src/client/services/`):** Cross-cutting (socket, session, i18n). Stateless modules with explicit APIs.

### Shared types as single source of truth

`src/shared/` is imported by both `src/server/` and `src/client/`. Socket event names, payload shapes, and domain types live here. Both the server's `Server<ClientToServer, ServerToClient>` generics and the client's `Socket<...>` generics consume these — a contract mismatch becomes a compile error.

## Components

### Domain functions (`src/server/domain/`)

All pure, all immutable inputs, all return new values:

```ts
export function buildRolePool(
  game: Game,
  settings: Settings,
  playerCount: number
): RoleId[]

export function assignRolesToPlayers(
  players: Player[],
  pool: RoleId[],
  rng: () => number
): Player[]   // returns new array with role fields populated

export function normalizeSettings(
  game: Game,
  incoming: Partial<Settings>
): Settings

export function makeRoomCode(exists: (code: string) => boolean): string
export function makeSecret(): string
// Implementation: crypto.randomBytes(16).toString("base64url") — 128-bit entropy.
// Used for both playerId and adminSecret. Math.random / Date.now are NOT used for tokens.
```

The current `assignRoles` mutates `room.assigned` and each `player.role` in place. The new version returns a new player array; the socket handler stitches the result back into the room via `store.update(code, room => ({ ...room, players: newPlayers, assigned: true }))`. This eliminates a class of bugs and makes the store transaction the only place state changes.

### Per-viewer projection (`src/server/domain/visibility.ts`)

```ts
export type Viewer =
  | { kind: "admin"; adminSecret: string }
  | { kind: "player"; playerId: string }

export type VisibleRoom = {
  code: string
  gameId: string
  game: Game
  assigned: boolean
  settings: Settings
  // players with role visibility filtered per viewer
  players: Array<{
    id: string
    name: string
    connected: boolean
    role: RoleId | null   // null unless viewer is admin OR viewer is this player
  }>
}

// Admin viewer → all player roles included.
// Player viewer → only the viewer's own role is populated; every other entry has role=null.
// Throws AUTHZ_MISMATCH if the viewer's credentials don't match the room (defense in depth).
export function projectRoomFor(room: Room, viewer: Viewer): VisibleRoom
```

**Invariant:** every server→client payload carrying room state — `admin:room-updated`, `room:status`, and the `room` field in any ack — is produced by `projectRoomFor(room, viewer)`. The recipient cannot receive, at the wire level, role data they are not entitled to see. This is enforced at the emission boundary, not at the client; even an instrumented browser with DevTools open observes only the projected view. The previous ad-hoc split into `publicRoom`/`playerRoom` helpers is replaced by this single function — there is one rule, one code path, one place to test.

### Store interface (`src/server/store/store.ts`)

```ts
export interface RoomStore {
  create(room: Room): Promise<void>
  get(code: string): Promise<Room | null>
  update(code: string, updater: (room: Room) => Room): Promise<Room>
  delete(code: string): Promise<void>
  deleteOlderThan(cutoffMs: number): Promise<number>
}
```

`update` is the single mutation primitive. Implementations wrap it in a transaction (SQLite) or a per-key async mutex (memory). Handlers never read-then-write; they always go through `update`.

### Source of truth

v1: the store (SQLite or memory) is the single source of truth. Every socket handler reads via `store.get` or mutates via `store.update`; there is no in-process room cache. Rationale: the workload size (≤25 players/room, low ops/sec) is well within better-sqlite3's primary-key read latency (microseconds, synchronous). A cache would add invalidation complexity without a measured need.

If future profiling shows a real bottleneck, a write-through LRU cache can be inserted by wrapping the store (`CachedStore implements RoomStore`) — the `RoomStore` interface and the per-room mutation serialization invariant remain unchanged.

### SQLite schema

```sql
CREATE TABLE rooms (
  code           TEXT PRIMARY KEY,
  game_id        TEXT NOT NULL,
  admin_secret   TEXT NOT NULL,
  assigned       INTEGER NOT NULL DEFAULT 0,
  settings_json  TEXT NOT NULL,
  players_json   TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);
CREATE INDEX rooms_created_at_idx ON rooms(created_at);
```

Room state is small (max ~20 players), self-contained, and never queried relationally. Storing `settings` and `players` as JSON columns keeps schema flexible (adding a future field is a code change, not a migration). WAL mode is enabled at connection open.

### Socket events (`src/shared/events.ts`)

```ts
export interface ClientToServerEvents {
  "admin:create-room":     (p: { gameId: string },                                                  cb: Ack<{ code: string; adminSecret: string; room: PublicRoom }>) => void
  "admin:reconnect":       (p: { code: string; adminSecret: string },                              cb: Ack<{ room: PublicRoom }>) => void
  "admin:update-settings": (p: { code: string; adminSecret: string; settings: Partial<Settings> }, cb: Ack<{ room: PublicRoom }>) => void
  "admin:assign-roles":    (p: { code: string; adminSecret: string },                              cb: Ack<{ room: PublicRoom }>) => void
  "admin:clear-roles":     (p: { code: string; adminSecret: string },                              cb: Ack<{ room: PublicRoom }>) => void
  "player:join":           (p: { code: string; name: string; playerId?: string },                  cb: Ack<{ room: PlayerRoom; player: SelfPlayer }>) => void
}

export interface ServerToClientEvents {
  "admin:room-updated":    (room: PublicRoom) => void
  "room:status":           (room: PlayerRoom) => void
  "player:role-assigned":  (payload: { role: string; roleData: Role; name: string; code: string; game: Game }) => void
  "player:role-cleared":   () => void
}

export type Ack<T> =
  (r: { ok: true; data: T } | { ok: false; error: ErrorCode }) => void

export type ErrorCode =
  | "INVALID_ADMIN" | "ROOM_NOT_FOUND" | "NAME_REQUIRED" | "NAME_TAKEN"
  | "NEED_MORE_PLAYERS" | "TOO_MANY_SPECIAL_ROLES" | "INVALID_INPUT" | "RATE_LIMITED"
  | "ROOM_FULL" | "SERVER_BUSY"
```

Event names are unchanged from the current server, preserving wire compatibility. The ack shape is normalized to a discriminated union — current handlers return inconsistent shapes (`{ok:true, ...}` vs `{ok:true, room:...}`); the new shape is always `{ok:true, data:T}` or `{ok:false, error:ErrorCode}`. The `room` field in any ack and the `PublicRoom`/`PlayerRoom` payloads emitted on broadcast events are all of type `VisibleRoom`, produced by `projectRoomFor` — see Per-viewer projection above.

### Zod validation + handler binder (`src/server/sockets/`)

```ts
function bind<E extends keyof ClientToServerEvents>(
  socket: Socket,
  event: E,
  schema: z.ZodTypeAny,
  handler: (data: any, socket: Socket) => Promise<unknown>
) {
  socket.on(event, async (payload, cb) => {
    if (!checkRateLimit(socket, event)) return cb({ ok: false, error: "RATE_LIMITED" })
    const parsed = schema.safeParse(payload)
    if (!parsed.success) return cb({ ok: false, error: "INVALID_INPUT" })
    try { cb({ ok: true, data: await handler(parsed.data, socket) }) }
    catch (e) { cb({ ok: false, error: errCode(e) }) }
  })
}
```

This eliminates the hand-written try/catch + string-error-check pattern repeated in every current handler.

### Reconnect (server + client)

- **Server:** `player:join` accepts optional `playerId`. Behavior:
  - **`playerId` matches an existing player in the room:** re-bind the socket to that slot (regardless of `connected` flag), skip name-collision check. The stored `name` wins; the incoming `name` is ignored to prevent a reconnecting client from accidentally renaming itself.
  - **`playerId` provided but no match in the room:** treat as a fresh join (the room may have been recreated or the player aged out). Run normal collision check and create a new player.
  - **`playerId` absent:** existing flow — name collision rejected if the holder is still `connected`, otherwise treated as a fresh join.
- **Client:** `session.ts` stores `{ kind, code, adminSecret? | playerId?, name? }` in `localStorage` on successful join/create. On page load, `main.ts` calls `session.load()` and, if present, fires `admin:reconnect` or `player:join` automatically. On failure, session is cleared and the user lands on home view.

### Client services

- **`socket.ts`** — Wraps `io()` with typed generics. Exposes `emit<E>(event, payload): Promise<AckResult>` that wraps the callback in a promise and returns the discriminated union for `.ok`-narrowing.
- **`session.ts`** — Typed `localStorage` wrapper. One key (`role-room:session`).
- **`i18n.ts`** — Loads the current language object, walks all `[data-i18n]` elements, sets `html.lang` and `html.dir` (RTL for `ku`, `ar`; LTR for `en`, `tr`). Language choice persisted in `localStorage`.

### i18n type safety

```ts
// src/client/i18n/en.ts (canonical)
const en = {
  brand: "Role Room",
  selectGame: "Select a game",
  // ...
} as const
export type Translations = typeof en
export default en satisfies Translations

// src/client/i18n/tr.ts
import type { Translations } from "./en"
const tr: Translations = {
  brand: "Role Room",
  selectGame: "Oyun seç",
  // ...
}
export default tr
```

Missing keys in `tr`/`ku`/`ar` become compile errors.

### Build pipeline

- **Dev:** Two processes via `concurrently`. `tsx watch src/server/index.ts` (server with hot reload) and `vite` (client on port 5173 with HMR). Vite config proxies `/socket.io` and `/api/*` to `3000`. `index.html` lives at the project root (Vite root entry) and references `<script type="module" src="/src/client/main.ts">` plus `<link rel="stylesheet" href="/styles.css">`. The stylesheet is served verbatim from `public/styles.css` via Vite's `publicDir`.
- **Prod:** `tsc -p tsconfig.server.json` outputs `dist/server/`; `vite build` outputs `dist/client/` (bundled JS + hashed `index.html` + copied `styles.css`). Express serves `dist/client/` as static. Single port (3000), single process.

`package.json` scripts:

```
dev      → concurrently "tsx watch src/server/index.ts" "vite"
build    → tsc -p tsconfig.server.json && vite build
start    → node dist/server/index.js
test     → vitest run
test:e2e → playwright test
typecheck→ tsc --noEmit
lint     → eslint .
```

## Data Flow

### Room creation (admin)

```
Client (admin view)
  └─► socket.emit("admin:create-room", { gameId })
       └─► bind() validates payload (Zod)
            └─► rate-limit check
                 └─► domain.makeRoomCode(exists=store.get)
                      └─► domain.normalizeSettings(game, defaults)
                           └─► store.create(room)
                                └─► socket.join(`room:${code}`, `admin:${code}`)
                                     └─► ack({ ok:true, data:{ code, adminSecret, room } })
                                          └─► client: session.save({kind:"admin",...})
                                               └─► router.setView("adminView")
```

### Player join (with optional reconnect)

```
Client (join view)
  └─► socket.emit("player:join", { code, name, playerId? })
       └─► bind() validates
            └─► store.update(code, room => {
                  if (playerId match) → re-bind to existing slot
                  else if (name collision && connected) → throw NAME_TAKEN
                  else → push new player
                })
                 └─► io.to(`admin:${code}`).emit("admin:room-updated", publicRoom)
                      └─► io.to(`room:${code}`).emit("room:status", playerRoom)
                           └─► ack({ ok:true, data:{ room, player } })
                                └─► if (room.assigned && player.role)
                                     emit("player:role-assigned", ...) to this socket
```

### Per-room mutation serialization

All room mutations go through `store.update(code, updater)`. The invariant: no two updaters for the same room code run concurrently — never observe an intermediate state, never lose a write.

- **SQLite store:** `update` opens a `BEGIN IMMEDIATE` transaction, reads the row, runs `updater(room)`, writes the result, commits. `better-sqlite3` is synchronous, so the updater callback runs with no await window. Concurrent `update(SAME_CODE, ...)` calls from different sockets serialize on SQLite's writer lock.
- **Memory store:** a `Map<code, Promise<void>>` keeps a per-room chain. `update(code, fn)` awaits the previous chain link, then runs `fn` synchronously, then resolves the new link. No two updaters ever observe an intermediate room state for the same code.

**Handler discipline:** if a handler needs multiple logical mutations on one room, it does them inside a single `update` callback. Because the callback runs sync (memory) or sync-inside-tx (SQLite), no await window allows another event to interleave. Handlers do not interleave a `store.get` and a `store.update` — read-then-decide-then-write is always one `update` call.

**Failure mode prevented:** without this, two concurrent events on the same room (e.g., `update-settings` from admin while `assign-roles` is running) could each read the row, mutate locally, and write back — the second write would erase the first. With per-room serialization, the second update sees the first one's result and decides from there.

## Configuration

```ts
// src/server/config.ts
import { z } from "zod"

export const config = z.object({
  NODE_ENV:              z.enum(["development", "test", "production"]).default("development"),
  PORT:                  z.coerce.number().int().min(1).max(65535).default(3000),
  DB_PATH:               z.string().optional(),
  ALLOWED_ORIGIN:        z.string().optional(),
  ROOM_TTL_HOURS:        z.coerce.number().positive().default(8),
  LOG_LEVEL:             z.enum(["fatal","error","warn","info","debug","trace"]).default("info"),
  MAX_PLAYERS_PER_ROOM:  z.coerce.number().int().positive().default(25),
  MAX_ROOMS_PER_SOCKET:  z.coerce.number().int().positive().default(5),
  MAX_TOTAL_ROOMS:       z.coerce.number().int().positive().default(10_000),
}).superRefine((v, ctx) => {
  if (v.NODE_ENV === "production" && !v.DB_PATH) {
    ctx.addIssue({ code: "custom", path: ["DB_PATH"],
      message: "DB_PATH is required when NODE_ENV=production (no silent fallback to memory store)" })
  }
}).parse(process.env)
```

Process exits at startup with a clear error if production is misconfigured.

## Error Handling

- **Boundary validation:** Zod at every socket entry point. Invalid payload → `INVALID_INPUT` ack, handler never runs.
- **Domain errors:** Thrown as `Error` subclasses with `code` field; `errCode(e)` maps to `ErrorCode` union. Unknown errors → logged + generic `INVALID_INPUT` to client (never leak internals).
- **Store errors:** Bubble up; handler maps to `INVALID_INPUT` and logs at error level.
- **Client errors:** `emit()` ack promise rejects on transport error, view shows toast. Discriminated union forces explicit `r.ok` check before accessing `r.data`.
- **Server startup errors:** Config validation failures, DB open failures → `process.exit(1)` with logged reason.

## Testing Strategy

### Unit (Vitest)

| File | What it tests |
|---|---|
| `tests/unit/domain/roles.test.ts` | `buildRolePool` for each game in catalog (min players, special-role overflow, filler padding); `assignRolesToPlayers` (role count preserved, deterministic with seeded RNG, players unchanged except role field) |
| `tests/unit/domain/settings.test.ts` | `normalizeSettings` (number clamp to min/max, boolean coercion, missing keys fall to defaults, unknown keys ignored) |
| `tests/unit/domain/codes.test.ts` | `makeRoomCode` (length 5, charset, retries on collision via injected `exists`); `makeSecret` (returns 22-char base64url string, ≥120 bits entropy estimate via charset, unique across 10000 calls) |
| `tests/unit/domain/visibility.test.ts` | `projectRoomFor` — admin viewer sees all roles; player viewer sees only their own role with every other player's `role === null`; player viewer with no matching `playerId` throws `AUTHZ_MISMATCH`; admin viewer with wrong `adminSecret` throws `AUTHZ_MISMATCH`; projection does not mutate the input room |
| `tests/unit/store/contract.test.ts` | Shared contract suite run against both stores: CRUD round-trips, `update` is atomic, `deleteOlderThan` respects cutoff |
| `tests/unit/store/sqlite-store.test.ts` | SQLite-specific: WAL mode enabled, prepared statements, `:memory:` path works |

Target: >85% line coverage on `src/server/domain/` and `src/server/store/`. Handlers are not unit-tested (covered by E2E).

### E2E (Playwright)

| File | Scenario |
|---|---|
| `tests/e2e/happy-path.spec.ts` | 1 admin context + 4 player contexts. Admin creates Vampire Village room. Players join by code. Admin clicks Assign Roles. Each player sees only their own role; admin sees all roles; other players' roles are absent from each player's DOM. **In addition**, each player context attaches `page.on("websocket")` and inspects every inbound frame: no frame received by a player contains a role ID for any other player. This proves the projection invariant at the wire level, not just in the rendered DOM. |
| `tests/e2e/reconnect.spec.ts` | 1 admin + 2 player contexts (A and B) in one room. Admin assigns roles. A calls `page.reload()`; admin's player list shows A briefly disconnected, then reconnected on the same slot; A's own role is preserved across reload. B's session is uninterrupted, B's DOM never contains A's role at any point, and B's inbound WebSocket frames never carry A's role (asserted as in happy-path). A second sub-case reloads the admin context and confirms admin authority is preserved (same `adminSecret` in localStorage, room still editable). |

Playwright `webServer` config runs `npm run build && npm start`, so E2E exercises the real production bundle.

### CI

`.github/workflows/ci.yml`: single job on push/PR running `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npx playwright install --with-deps chromium`, `npm run test:e2e`. Target wall-clock: under 5 minutes.

## Security Hardening

- **Helmet** middleware on Express (default headers).
- **CORS:** `io({ cors: { origin: config.ALLOWED_ORIGIN ?? true } })`. Single-origin deploy defaults to permissive; cross-origin client requires explicit `ALLOWED_ORIGIN`.
- **Rate limit:** per-socket cooldown map. Defaults: `admin:create-room` 2000ms, `player:join` 500ms, `admin:update-settings` 200ms, others 100ms. Violation → `RATE_LIMITED` ack.
- **Input validation:** Zod on all socket payloads. `name` trimmed and length-clamped to 24. `code` matched against `^[A-Z0-9]{5}$`. `gameId` matched against catalog at handler level.
- **Token hygiene:** `playerId` and `adminSecret` are 128-bit tokens from `crypto.randomBytes(16).toString("base64url")` — practically unguessable. They live only in socket payloads and `localStorage`. Never echoed in URLs or server logs. Logger redacts `adminSecret` and `playerId` fields.
- **Role privacy invariant:** every server→client room payload is produced by `projectRoomFor(room, viewer)` (see Per-viewer projection). E2E asserts this both in the DOM and in raw inbound WebSocket frames — clients never receive role data for other players.
- **DOM rendering:** all dynamic strings (player names, role text in user-selected language) are inserted via `textContent` or DOM attribute setters; `innerHTML`, `insertAdjacentHTML`, and template-string HTML are forbidden in `src/client/`. ESLint rule (`no-restricted-properties` for `innerHTML`/`outerHTML`/`insertAdjacentHTML`) enforces this. Eliminates the XSS surface that would otherwise let a malicious player name compromise other players' sessions.
- **SQL injection:** `better-sqlite3` prepared statements throughout. No string concatenation in queries.

Explicitly out of scope: user accounts, audit log, GDPR/PII handling. This is an anonymous-session product.

### Resource limits

| Limit | Default | Env var | On violation |
|---|---|---|---|
| Players per room | 25 | `MAX_PLAYERS_PER_ROOM` | `player:join` → `ROOM_FULL` |
| Active rooms per socket | 5 | `MAX_ROOMS_PER_SOCKET` | `admin:create-room` → `RATE_LIMITED` |
| Total active rooms (server-wide) | 10 000 | `MAX_TOTAL_ROOMS` | `admin:create-room` → `SERVER_BUSY` |

`MAX_ROOMS_PER_SOCKET` is counted per socket (not per IP), keeping NAT/shared-IP fairness simple. Per-IP limits can be added later if abuse warrants it. Server-side counters: per-socket count lives on `socket.data.adminRooms` (incremented on `admin:create-room`, decremented when the socket disconnects or the room is deleted); the total-rooms counter is a single integer in the store layer (`store.countActiveRooms()` for SQLite, `Map.size` for memory).

### Threat model (v1)

- **Trusted:** the server process and the host running it.
- **Untrusted:** all clients. Any payload, any field, any timing is hostile until validated.
- **Authentication model:** none. Slots are guarded by 128-bit random tokens (`playerId`, `adminSecret`) stored in the client's `localStorage`. Anyone who possesses a token can use the slot it grants. This is the accepted v1 risk.
- **Token confidentiality boundary:** HTTPS in transit, `localStorage` at rest. No server-side mitigation against XSS — instead, XSS surface is eliminated by the DOM-rendering rule and the 24-char name length cap.
- **Explicit non-goals:** user accounts, audit log, GDPR/PII handling, anti-fraud, IP-based abuse mitigation. This is an anonymous-session product.
- **Future hooks:** if these constraints change (e.g., persistent accounts), HMAC-signed tokens or `httpOnly` cookies can be added without invalidating the projection or per-room serialization invariants.

## Observability

- **Logger:** `pino` instance. JSON output in production, pretty in dev. Levels: `info` for lifecycle (server up, room created/destroyed), `warn` for rate-limit hits and validation failures, `error` for handler exceptions, `debug` for socket connect/disconnect.
- **Health endpoint:** `GET /healthz` returns `{ ok: true }` after a `SELECT 1` against the store. 200 on success, 503 on store failure.
- **Metrics:** Not in scope. Prometheus/OTEL can be added when there's a deployment that warrants it.

## Migration Phases

Each phase ends with a green build and is committed independently. No phase leaves the repo in a broken state.

| Phase | Outcome |
|---|---|
| **0. Tooling** | TS, Vite, Vitest, Playwright, ESLint, Prettier installed and configured. `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts` committed. Existing JS untouched. `npm run typecheck` passes (empty TS). |
| **1. Shared contracts** | `src/shared/types.ts` and `src/shared/events.ts` written. Not yet consumed. |
| **2. Domain extraction** | `src/server/domain/*.ts` written as pure functions. Vitest unit tests pass. Server still uses old code paths. |
| **3. Store layer** | `RoomStore` interface + `MemoryStore` + `SqliteStore`. Contract tests pass on both. Server still uses old in-memory `Map`. |
| **4. Server TS migration** | `server.js` deleted. `src/server/index.ts` + `sockets/*.ts` live. Store injected, domain functions called, Zod active, rate limit active, config validated. App still works end-to-end manually. |
| **5. Client TS + Vite migration** | `app.js` and the frontend copy of `games.js` deleted. `src/client/` + Vite serving. `index.html` script tags repointed. Game catalog moves to `src/server/games/catalog.ts`; client receives it via a `/api/games` endpoint. Session + reconnect live. |
| **6. E2E + CI** | Playwright tests written and passing locally and in CI. GitHub Actions workflow merged. |
| **7. Hardening + polish** | Helmet, `/healthz`, `pino` logging, redaction, README updates for deploy, `.env.example` finalized. |

## Backward Compatibility

- **Socket event names:** Unchanged. Old client + new server would interoperate for the unchanged events (the new server is stricter about payload validity, so malformed legacy clients would receive `INVALID_INPUT`).
- **Room code format:** Unchanged (`[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}`).
- **Game catalog shape:** Unchanged. Moves location (frontend → backend, served via API) but keeps the same fields. Existing "how to add a new game" instructions in README remain valid after a path update.
- **No data migration needed:** Current state is in-memory and ephemeral — nothing to migrate from.

## Success Criteria

1. `npm run typecheck` passes with zero errors across server, client, and shared.
2. `npm test` passes; domain + store coverage ≥85% lines.
3. `npm run test:e2e` passes both scenarios against the production build.
4. CI passes on a clean clone.
5. Server restart preserves rooms when `DB_PATH` is set.
6. Page refresh preserves player role (reconnect via `playerId`) when session is in `localStorage`.
7. `NODE_ENV=production` without `DB_PATH` fails at startup with a clear error.
8. Manual smoke test: admin creates room, 4 players join from separate browsers, admin assigns roles, each player sees only their own role, languages switch correctly including RTL for `ku`/`ar`.
9. No regression in existing UI behavior — `styles.css` is byte-identical and `index.html` markup is preserved except for the `<script>` tag changes and the file moving from `public/index.html` to project root.
10. Per-viewer projection invariant: in happy-path and reconnect E2E, no player context receives an inbound WebSocket frame containing another player's role (asserted on raw frame payloads, not just DOM).
11. Resource limits enforced: a manual or automated probe that exceeds `MAX_PLAYERS_PER_ROOM`, `MAX_ROOMS_PER_SOCKET`, or `MAX_TOTAL_ROOMS` receives the documented `ROOM_FULL` / `RATE_LIMITED` / `SERVER_BUSY` error and does not affect the state of compliant clients.

## Open Questions

None at design time. Deployment target choice is deferred (deploy-agnostic spec); README will document the per-host considerations during Phase 7.
