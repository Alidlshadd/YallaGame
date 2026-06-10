# Infrastructure & Code Quality Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the current single-file Node.js + Socket.IO multigame role-room platform onto a TypeScript + Vite + better-sqlite3 foundation with modular server/client, tests, and CI — without rewriting the working UI markup or breaking socket wire compatibility.

**Architecture:** Three server layers (pure `domain/` → `RoomStore` interface → thin Socket.IO handlers). Vite-bundled vanilla DOM client with typed socket wrapper, session/i18n services, and per-section view modules. `src/shared/` provides single-source-of-truth types for both sides. SQLite is the only source of truth in v1; every room mutation flows through `store.update` (per-room serialization). Every outbound room payload passes through `projectRoomFor` (per-viewer projection).

**Tech Stack:** Node.js ≥18, TypeScript 5, Vite 5, Vitest 1, Playwright 1, better-sqlite3 11, Socket.IO 4, Express 4, Zod 3, pino 9, Helmet 7.

**Reference spec:** `docs/superpowers/specs/2026-06-10-infrastructure-and-code-quality-design.md`

**Git note:** Per user instruction, this iteration runs without git commits. Each task ends with a **Checkpoint** marker describing the state at that point; treat the marker as the logical commit boundary. Engineers may stage commits later if they choose.

---

## File Structure

```
multigame-role-room-platform/
├── package.json                          # modified: add scripts + deps
├── tsconfig.json                         # NEW: root TS config
├── tsconfig.server.json                  # NEW: server build config
├── vite.config.ts                        # NEW
├── vitest.config.ts                      # NEW
├── playwright.config.ts                  # NEW
├── .eslintrc.cjs                         # NEW
├── .prettierrc                           # NEW
├── .env.example                          # NEW
├── index.html                            # MOVED from public/index.html (Phase 5)
├── src/
│   ├── shared/
│   │   ├── types.ts                      # Game, Role, Settings, Player, Room, VisibleRoom, ErrorCode
│   │   └── events.ts                     # ClientToServerEvents, ServerToClientEvents, Ack
│   ├── server/
│   │   ├── index.ts                      # bootstrap, DI, listen
│   │   ├── config.ts                     # env → Zod → typed config
│   │   ├── logger.ts                     # pino instance + redaction
│   │   ├── store/
│   │   │   ├── store.ts                  # RoomStore interface + shared types
│   │   │   ├── memory-store.ts           # in-memory implementation (test/dev)
│   │   │   └── sqlite-store.ts           # better-sqlite3 implementation
│   │   ├── domain/
│   │   │   ├── codes.ts                  # makeRoomCode, makeSecret
│   │   │   ├── settings.ts               # normalizeSettings
│   │   │   ├── roles.ts                  # buildRolePool, assignRolesToPlayers
│   │   │   └── visibility.ts             # projectRoomFor
│   │   ├── sockets/
│   │   │   ├── index.ts                  # registerHandlers(io, deps)
│   │   │   ├── bind.ts                   # typed binder w/ Zod + ack + rate-limit
│   │   │   ├── rate-limit.ts             # per-socket cooldown
│   │   │   ├── schemas.ts                # Zod payload schemas
│   │   │   ├── admin-handlers.ts
│   │   │   └── player-handlers.ts
│   │   └── games/
│   │       └── catalog.ts                # typed catalog (Vampire/Mafia/Spy)
│   └── client/
│       ├── main.ts                       # bootstrap, router, auto-reconnect
│       ├── router.ts                     # setView with mount/unmount
│       ├── views/
│       │   ├── home.ts
│       │   ├── gameInfo.ts
│       │   ├── join.ts
│       │   ├── playerRoom.ts
│       │   └── admin.ts
│       ├── services/
│       │   ├── socket.ts                 # typed io wrapper, emit() → Promise<Ack>
│       │   ├── session.ts                # localStorage session
│       │   └── i18n.ts                   # 4 languages + RTL/LTR
│       ├── i18n/
│       │   ├── en.ts                     # canonical
│       │   ├── tr.ts
│       │   ├── ar.ts
│       │   └── ku.ts
│       └── ui/
│           ├── toast.ts
│           └── dom.ts                    # textContent helpers (no innerHTML)
├── public/                               # Vite publicDir
│   └── styles.css                        # unchanged
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   │   ├── codes.test.ts
│   │   │   ├── settings.test.ts
│   │   │   ├── roles.test.ts
│   │   │   └── visibility.test.ts
│   │   └── store/
│   │       ├── contract.test.ts
│   │       └── sqlite-store.test.ts
│   └── e2e/
│       ├── happy-path.spec.ts
│       └── reconnect.spec.ts
├── .github/workflows/ci.yml              # NEW
├── server.js                             # DELETE in Phase 4
└── public/{app.js,games.js,index.html}   # MOVE/DELETE in Phase 5
```

---

# Phase 0 — Tooling

Set up TS, Vite, Vitest, Playwright, ESLint, Prettier. Existing JS untouched. After this phase `npm run typecheck` passes on an empty TS surface and the existing app still runs via `npm start`.

---

### Task 0.1 — Install dev dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

Run:
```bash
npm install --save zod@^3.23.0 pino@^9.0.0 pino-pretty@^11.0.0 helmet@^7.1.0 better-sqlite3@^11.0.0
```

- [ ] **Step 2: Install dev deps (TS + build)**

Run:
```bash
npm install --save-dev typescript@^5.4.0 @types/node@^20.0.0 @types/better-sqlite3@^7.6.0 @types/express@^4.17.0 tsx@^4.7.0 vite@^5.2.0 concurrently@^8.2.0
```

- [ ] **Step 3: Install dev deps (test + lint)**

Run:
```bash
npm install --save-dev vitest@^1.5.0 @vitest/coverage-v8@^1.5.0 @playwright/test@^1.43.0 eslint@^8.57.0 @typescript-eslint/parser@^7.0.0 @typescript-eslint/eslint-plugin@^7.0.0 prettier@^3.2.0
```

- [ ] **Step 4: Verify package.json**

Read `package.json`. Confirm all packages above appear under `dependencies` or `devDependencies`. Expected: no errors during install.

**Checkpoint:** all deps installed; `node_modules/` populated; `package-lock.json` updated.

---

### Task 0.2 — Add scripts and engines

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Replace the `scripts` block**

Edit `package.json`. Replace the current `scripts` object with:

```json
"scripts": {
  "dev": "concurrently -n server,client -c blue,magenta \"tsx watch src/server/index.ts\" \"vite\"",
  "build": "tsc -p tsconfig.server.json && vite build",
  "start": "node dist/server/index.js",
  "start:legacy": "node server.js",
  "typecheck": "tsc --noEmit -p tsconfig.json",
  "lint": "eslint . --ext .ts,.cjs",
  "format": "prettier --write .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

Note: `start:legacy` runs the existing `server.js` until Phase 4 deletes it; once deleted, drop this script.

- [ ] **Step 2: Bump version and add type:module**

In `package.json`:
- Change `"version"` from `"3.0.0"` to `"4.0.0"`.
- Add `"type": "module"` at the top level.
- Keep `"main": "server.js"` for now (Phase 4 changes it to `dist/server/index.js`).

- [ ] **Step 3: Verify legacy still works**

Run: `npm run start:legacy`
Expected: stdout `Multigame Role Room running on http://localhost:3000`. Stop with Ctrl+C.

**Checkpoint:** scripts in place; legacy server unaffected (Phase 4 will delete it).

---

### Task 0.3 — TypeScript config

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.server.json`

- [ ] **Step 1: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@server/*": ["src/server/*"],
      "@client/*": ["src/client/*"]
    }
  },
  "include": ["src", "tests"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Write `tsconfig.server.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist/server",
    "rootDir": "src",
    "lib": ["ES2022"],
    "noEmit": false,
    "sourceMap": true,
    "declaration": false
  },
  "include": ["src/server", "src/shared"]
}
```

- [ ] **Step 3: Run typecheck on empty surface**

Run: `npm run typecheck`
Expected: exits 0 with no output (no `.ts` files yet).

**Checkpoint:** TS configs in place; typecheck green on empty source tree.

---

### Task 0.4 — Vite, Vitest, Playwright configs

**Files:**
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Write `vite.config.ts`**

```ts
import { defineConfig } from "vite"
import path from "node:path"

export default defineConfig({
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
      "@client": path.resolve(__dirname, "src/client")
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/socket.io": { target: "http://localhost:3000", ws: true },
      "/api":       { target: "http://localhost:3000" }
    }
  }
})
```

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
      "@server": path.resolve(__dirname, "src/server"),
      "@client": path.resolve(__dirname, "src/client")
    }
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/server/domain/**", "src/server/store/**"],
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 }
    }
  }
})
```

- [ ] **Step 3: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run build && npm start",
    url: "http://localhost:3000",
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
    env: { NODE_ENV: "production", DB_PATH: ":memory:" }
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
})
```

- [ ] **Step 4: Run vitest to verify config**

Run: `npx vitest run`
Expected: exits 0 with "No test files found". Config is valid.

**Checkpoint:** all build/test configs valid and discoverable.

---

### Task 0.5 — ESLint, Prettier, `.env.example`

**Files:**
- Create: `.eslintrc.cjs`
- Create: `.prettierrc`
- Create: `.env.example`

- [ ] **Step 1: Write `.eslintrc.cjs`**

```js
/* eslint-env node */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["dist", "node_modules", "public/styles.css", "server.js", "public/app.js", "public/games.js"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
  },
  overrides: [
    {
      files: ["src/client/**/*.ts"],
      rules: {
        "no-restricted-properties": ["error",
          { object: "Element.prototype",     property: "innerHTML",          message: "Use textContent or createElement — see spec Security Hardening" },
          { object: "Element.prototype",     property: "outerHTML",          message: "Use textContent or createElement" },
          { object: "Element.prototype",     property: "insertAdjacentHTML", message: "Use textContent or createElement" }
        ]
      }
    }
  ]
}
```

- [ ] **Step 2: Write `.prettierrc`**

```json
{
  "semi": false,
  "singleQuote": false,
  "printWidth": 110,
  "trailingComma": "none",
  "arrowParens": "avoid"
}
```

- [ ] **Step 3: Write `.env.example`**

```
# Required in production
DB_PATH=./data/rooms.db

# Optional
NODE_ENV=development
PORT=3000
ALLOWED_ORIGIN=
ROOM_TTL_HOURS=8
LOG_LEVEL=info
MAX_PLAYERS_PER_ROOM=25
MAX_ROOMS_PER_SOCKET=5
MAX_TOTAL_ROOMS=10000
```

- [ ] **Step 4: Run lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0. No files matched (lint ignores everything for now), typecheck green.

**Checkpoint:** Phase 0 complete. Tooling in place, existing app untouched, all configs valid.

---

# Phase 1 — Shared contracts

Write the cross-cutting types both server and client will use. Nothing consumes them yet.

---

### Task 1.1 — Shared domain types

**Files:**
- Create: `src/shared/types.ts`

- [ ] **Step 1: Write the file**

```ts
export type LangCode = "ku" | "ar" | "en" | "tr"
export type LocalizedText = Record<LangCode, string>
export type LocalizedList = Record<LangCode, string[]>

export type RoleId = string
export type GameId = string

export interface SettingNumber {
  type: "number"
  key: string
  min: number
  max: number
  label: LocalizedText
}
export interface SettingBoolean {
  type: "boolean"
  key: string
  label: LocalizedText
}
export type SettingDef = SettingNumber | SettingBoolean

export interface Role {
  id: RoleId
  icon: string
  countSetting?: string
  enabledSetting?: string
  filler?: boolean
  name: LocalizedText
  desc: LocalizedText
}

export interface Game {
  id: GameId
  icon: string
  theme: string
  minPlayers: number
  defaultSettings: Settings
  title: LocalizedText
  subtitle: LocalizedText
  rules: LocalizedList
  roles: Role[]
  settings: SettingDef[]
}

export type Settings = Record<string, number | boolean>

export interface Player {
  id: string
  name: string
  role: RoleId | null
  connected: boolean
}

export interface Room {
  code: string
  gameId: GameId
  adminSecret: string
  assigned: boolean
  settings: Settings
  players: Player[]
  createdAt: number
  updatedAt: number
}

export type Viewer =
  | { kind: "admin"; adminSecret: string }
  | { kind: "player"; playerId: string }

export interface VisiblePlayer {
  id: string
  name: string
  connected: boolean
  role: RoleId | null
}

export interface VisibleRoom {
  code: string
  gameId: GameId
  game: Game
  assigned: boolean
  settings: Settings
  players: VisiblePlayer[]
}

export interface SelfPlayer {
  id: string
  name: string
  role: RoleId | null
  roleData: Role | null
}

export type ErrorCode =
  | "INVALID_ADMIN"
  | "ROOM_NOT_FOUND"
  | "NAME_REQUIRED"
  | "NAME_TAKEN"
  | "NEED_MORE_PLAYERS"
  | "TOO_MANY_SPECIAL_ROLES"
  | "INVALID_INPUT"
  | "RATE_LIMITED"
  | "ROOM_FULL"
  | "SERVER_BUSY"
  | "AUTHZ_MISMATCH"
  | "NO_FILLER_ROLE"
  | "UNKNOWN_GAME"
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** shared domain types ready.

---

### Task 1.2 — Shared socket event types

**Files:**
- Create: `src/shared/events.ts`

- [ ] **Step 1: Write the file**

```ts
import type { VisibleRoom, SelfPlayer, Settings, Role, Game, ErrorCode } from "./types.js"

export type Ack<T> = (r: AckResult<T>) => void
export type AckResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorCode }

export interface CreateRoomData    { code: string; adminSecret: string; room: VisibleRoom }
export interface AdminRoomData     { room: VisibleRoom }
export interface PlayerJoinData    { room: VisibleRoom; player: SelfPlayer }
export interface RoleAssignedPayload {
  role: string
  roleData: Role
  name: string
  code: string
  game: Game
}

export interface ClientToServerEvents {
  "admin:create-room":     (p: { gameId: string },                                                   cb: Ack<CreateRoomData>) => void
  "admin:reconnect":       (p: { code: string; adminSecret: string },                               cb: Ack<AdminRoomData>)  => void
  "admin:update-settings": (p: { code: string; adminSecret: string; settings: Partial<Settings> },  cb: Ack<AdminRoomData>)  => void
  "admin:assign-roles":    (p: { code: string; adminSecret: string },                               cb: Ack<AdminRoomData>)  => void
  "admin:clear-roles":     (p: { code: string; adminSecret: string },                               cb: Ack<AdminRoomData>)  => void
  "player:join":           (p: { code: string; name: string; playerId?: string },                   cb: Ack<PlayerJoinData>) => void
}

export interface ServerToClientEvents {
  "admin:room-updated":   (room: VisibleRoom) => void
  "room:status":          (room: VisibleRoom) => void
  "player:role-assigned": (payload: RoleAssignedPayload) => void
  "player:role-cleared":  () => void
}

export interface InterServerEvents {}
export interface SocketData {
  roomCode?: string
  playerId?: string
  adminSecret?: string
  adminRoomCount?: number
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** event contracts published. Phase 1 complete.

---

# Phase 2 — Domain extraction (TDD)

Pure functions, no I/O. Each task: failing test first, then implementation.

---

### Task 2.1 — Vitest sanity test

**Files:**
- Create: `tests/unit/sanity.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest"

describe("sanity", () => {
  it("vitest is wired up", () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 2: Run**

Run: `npm test -- sanity`
Expected: 1 passed.

- [ ] **Step 3: Delete**

Delete `tests/unit/sanity.test.ts`. (Confirms framework works; leaving it would just be noise.)

**Checkpoint:** Vitest verified.

---

### Task 2.2 — `domain/codes.ts` — test

**Files:**
- Create: `tests/unit/domain/codes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run — expect fail**

Run: `npm test -- codes`
Expected: fails with `Cannot find module '@server/domain/codes.js'`.

**Checkpoint:** failing test in place.

---

### Task 2.3 — `domain/codes.ts` — implement

**Files:**
- Create: `src/server/domain/codes.ts`

- [ ] **Step 1: Write the implementation**

```ts
import { randomBytes, randomInt } from "node:crypto"

export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export const ROOM_CODE_LEN = 5

export function makeRoomCode(exists: (code: string) => boolean): string {
  for (let attempt = 0; attempt < 1000; attempt++) {
    let code = ""
    for (let i = 0; i < ROOM_CODE_LEN; i++) {
      code += ROOM_CODE_ALPHABET[randomInt(0, ROOM_CODE_ALPHABET.length)]
    }
    if (!exists(code)) return code
  }
  throw new Error("makeRoomCode: exhausted 1000 retries — alphabet/length too small for current room count")
}

export function makeSecret(): string {
  return randomBytes(16).toString("base64url")
}
```

- [ ] **Step 2: Run — expect pass**

Run: `npm test -- codes`
Expected: 5 passed (3 makeRoomCode + 2 makeSecret).

**Checkpoint:** `codes.ts` green.

---

### Task 2.4 — `domain/settings.ts` — test

**Files:**
- Create: `tests/unit/domain/settings.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest"
import { normalizeSettings } from "@server/domain/settings.js"
import type { Game } from "@shared/types.js"

const game: Game = {
  id: "test", icon: "x", theme: "x", minPlayers: 3,
  defaultSettings: { count: 2, hard: false },
  title: { ku: "", ar: "", en: "", tr: "" },
  subtitle: { ku: "", ar: "", en: "", tr: "" },
  rules: { ku: [], ar: [], en: [], tr: [] },
  roles: [],
  settings: [
    { type: "number", key: "count", min: 1, max: 5, label: { ku: "", ar: "", en: "", tr: "" } },
    { type: "boolean", key: "hard", label: { ku: "", ar: "", en: "", tr: "" } }
  ]
}

describe("normalizeSettings", () => {
  it("clamps number values to [min, max]", () => {
    expect(normalizeSettings(game, { count: 99 }).count).toBe(5)
    expect(normalizeSettings(game, { count: -5 }).count).toBe(1)
    expect(normalizeSettings(game, { count: 3  }).count).toBe(3)
  })

  it("falls back to defaultSettings when key absent", () => {
    expect(normalizeSettings(game, {}).count).toBe(2)
    expect(normalizeSettings(game, {}).hard).toBe(false)
  })

  it("coerces boolean values", () => {
    expect(normalizeSettings(game, { hard: true }).hard).toBe(true)
    expect(normalizeSettings(game, { hard: 0 as unknown as boolean }).hard).toBe(false)
  })

  it("ignores unknown keys (not in game.settings)", () => {
    const result = normalizeSettings(game, { rogue: 42 } as Record<string, number>)
    expect(result).not.toHaveProperty("rogue")
  })

  it("returns a new object — does not mutate input", () => {
    const incoming = { count: 4 }
    const result = normalizeSettings(game, incoming)
    expect(result).not.toBe(incoming)
    expect(incoming).toEqual({ count: 4 })
  })
})
```

- [ ] **Step 2: Run — expect fail**

Run: `npm test -- settings`
Expected: module-not-found error.

**Checkpoint:** failing test in place.

---

### Task 2.5 — `domain/settings.ts` — implement

**Files:**
- Create: `src/server/domain/settings.ts`

- [ ] **Step 1: Write the implementation**

```ts
import type { Game, Settings } from "@shared/types.js"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function normalizeSettings(game: Game, incoming: Partial<Record<string, unknown>>): Settings {
  const out: Settings = {}

  for (const def of game.settings) {
    const raw = incoming[def.key] ?? game.defaultSettings[def.key]

    if (def.type === "number") {
      const n = Number(raw ?? def.min)
      out[def.key] = clamp(Number.isFinite(n) ? n : def.min, def.min, def.max)
    } else {
      out[def.key] = Boolean(raw)
    }
  }

  return out
}
```

- [ ] **Step 2: Run — expect pass**

Run: `npm test -- settings`
Expected: 5 passed.

**Checkpoint:** `settings.ts` green.

---

### Task 2.6 — `domain/roles.ts` — test

**Files:**
- Create: `tests/unit/domain/roles.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest"
import { buildRolePool, assignRolesToPlayers } from "@server/domain/roles.js"
import type { Game, Player } from "@shared/types.js"

const game: Game = {
  id: "g", icon: "x", theme: "x", minPlayers: 3,
  defaultSettings: { vampires: 1 },
  title: { ku: "", ar: "", en: "", tr: "" },
  subtitle: { ku: "", ar: "", en: "", tr: "" },
  rules: { ku: [], ar: [], en: [], tr: [] },
  settings: [{ type: "number", key: "vampires", min: 1, max: 3, label: { ku: "", ar: "", en: "", tr: "" } }],
  roles: [
    { id: "vampire", icon: "v", countSetting: "vampires", name: { ku: "", ar: "", en: "", tr: "" }, desc: { ku: "", ar: "", en: "", tr: "" } },
    { id: "villager", icon: "u", filler: true,            name: { ku: "", ar: "", en: "", tr: "" }, desc: { ku: "", ar: "", en: "", tr: "" } }
  ]
}

function mkPlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, role: null, connected: true }))
}

describe("buildRolePool", () => {
  it("adds countSetting roles N times and fills the rest with the filler", () => {
    const pool = buildRolePool(game, { vampires: 2 }, 6)
    expect(pool.filter(r => r === "vampire")).toHaveLength(2)
    expect(pool.filter(r => r === "villager")).toHaveLength(4)
    expect(pool).toHaveLength(6)
  })

  it("throws NO_FILLER_ROLE when no filler is defined", () => {
    const noFiller: Game = { ...game, roles: game.roles.filter(r => !r.filler) }
    expect(() => buildRolePool(noFiller, { vampires: 1 }, 5)).toThrow(/NO_FILLER_ROLE/)
  })

  it("throws TOO_MANY_SPECIAL_ROLES when count exceeds player count", () => {
    expect(() => buildRolePool(game, { vampires: 3 }, 2)).toThrow(/TOO_MANY_SPECIAL_ROLES/)
  })
})

describe("assignRolesToPlayers", () => {
  it("returns a new array with each player given a role from the pool", () => {
    const players = mkPlayers(4)
    const pool = ["vampire", "villager", "villager", "villager"]
    const out = assignRolesToPlayers(players, pool, () => 0.5)
    expect(out).toHaveLength(4)
    const counts = out.reduce<Record<string, number>>((acc, p) => { acc[p.role!] = (acc[p.role!] ?? 0) + 1; return acc }, {})
    expect(counts).toEqual({ vampire: 1, villager: 3 })
  })

  it("does not mutate input players", () => {
    const players = mkPlayers(3)
    const snapshot = JSON.stringify(players)
    assignRolesToPlayers(players, ["villager", "villager", "villager"], () => 0)
    expect(JSON.stringify(players)).toBe(snapshot)
  })

  it("is deterministic given a seeded rng", () => {
    const players = mkPlayers(5)
    const pool = ["vampire", "villager", "villager", "villager", "villager"]
    let seed = 1
    const rng = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
    const a = assignRolesToPlayers(players, pool, rng).map(p => p.role)
    seed = 1
    const b = assignRolesToPlayers(players, pool, rng).map(p => p.role)
    expect(a).toEqual(b)
  })

  it("throws when pool length and players length disagree", () => {
    expect(() => assignRolesToPlayers(mkPlayers(3), ["villager"], () => 0)).toThrow(/POOL_LENGTH_MISMATCH/)
  })
})
```

- [ ] **Step 2: Run — expect fail**

Run: `npm test -- roles`
Expected: module-not-found error.

**Checkpoint:** failing test in place.

---

### Task 2.7 — `domain/roles.ts` — implement

**Files:**
- Create: `src/server/domain/roles.ts`

- [ ] **Step 1: Write the implementation**

```ts
import type { Game, Player, RoleId, Settings } from "@shared/types.js"

export function buildRolePool(game: Game, settings: Settings, playerCount: number): RoleId[] {
  const filler = game.roles.find(r => r.filler)
  if (!filler) throw new Error("NO_FILLER_ROLE")

  const pool: RoleId[] = []
  for (const role of game.roles) {
    if (role.filler) continue
    if (role.countSetting) {
      const count = Number(settings[role.countSetting] ?? 0)
      for (let i = 0; i < count; i++) pool.push(role.id)
    }
    if (role.enabledSetting && settings[role.enabledSetting]) pool.push(role.id)
  }

  if (pool.length > playerCount) throw new Error("TOO_MANY_SPECIAL_ROLES")
  while (pool.length < playerCount) pool.push(filler.id)
  return pool
}

function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export function assignRolesToPlayers(
  players: readonly Player[],
  pool: readonly RoleId[],
  rng: () => number
): Player[] {
  if (pool.length !== players.length) throw new Error("POOL_LENGTH_MISMATCH")
  const shuffled = shuffle(pool, rng)
  return players.map((p, i) => ({ ...p, role: shuffled[i]! }))
}
```

- [ ] **Step 2: Run — expect pass**

Run: `npm test -- roles`
Expected: 7 passed.

**Checkpoint:** `roles.ts` green.

---

### Task 2.8 — `domain/visibility.ts` — test

**Files:**
- Create: `tests/unit/domain/visibility.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest"
import { projectRoomFor } from "@server/domain/visibility.js"
import type { Room, Game, Viewer } from "@shared/types.js"

const game: Game = {
  id: "g", icon: "x", theme: "x", minPlayers: 3,
  defaultSettings: {},
  title: { ku: "", ar: "", en: "", tr: "" },
  subtitle: { ku: "", ar: "", en: "", tr: "" },
  rules: { ku: [], ar: [], en: [], tr: [] },
  settings: [],
  roles: [
    { id: "vampire",  icon: "v", name: { ku: "", ar: "", en: "", tr: "" }, desc: { ku: "", ar: "", en: "", tr: "" } },
    { id: "villager", icon: "u", filler: true, name: { ku: "", ar: "", en: "", tr: "" }, desc: { ku: "", ar: "", en: "", tr: "" } }
  ]
}

const room: Room = {
  code: "ABCDE", gameId: "g", adminSecret: "admin-secret",
  assigned: true, settings: {},
  players: [
    { id: "p1", name: "A", role: "vampire",  connected: true },
    { id: "p2", name: "B", role: "villager", connected: true },
    { id: "p3", name: "C", role: "villager", connected: false }
  ],
  createdAt: 0, updatedAt: 0
}

const games = new Map([[game.id, game]])
const resolveGame = (id: string) => games.get(id)!

describe("projectRoomFor", () => {
  it("admin viewer sees every player's role", () => {
    const v: Viewer = { kind: "admin", adminSecret: "admin-secret" }
    const out = projectRoomFor(room, v, resolveGame)
    expect(out.players.map(p => p.role)).toEqual(["vampire", "villager", "villager"])
  })

  it("player viewer sees only their own role; others null", () => {
    const v: Viewer = { kind: "player", playerId: "p2" }
    const out = projectRoomFor(room, v, resolveGame)
    const byId = Object.fromEntries(out.players.map(p => [p.id, p.role]))
    expect(byId).toEqual({ p1: null, p2: "villager", p3: null })
  })

  it("throws AUTHZ_MISMATCH on bad adminSecret", () => {
    expect(() => projectRoomFor(room, { kind: "admin", adminSecret: "wrong" }, resolveGame)).toThrow(/AUTHZ_MISMATCH/)
  })

  it("throws AUTHZ_MISMATCH when playerId is not in the room", () => {
    expect(() => projectRoomFor(room, { kind: "player", playerId: "nobody" }, resolveGame)).toThrow(/AUTHZ_MISMATCH/)
  })

  it("does not mutate the input room", () => {
    const snapshot = JSON.stringify(room)
    projectRoomFor(room, { kind: "admin", adminSecret: "admin-secret" }, resolveGame)
    expect(JSON.stringify(room)).toBe(snapshot)
  })

  it("throws UNKNOWN_GAME when resolveGame returns null/undefined", () => {
    const v: Viewer = { kind: "admin", adminSecret: "admin-secret" }
    expect(() => projectRoomFor(room, v, () => undefined as any)).toThrow(/UNKNOWN_GAME/)
  })
})
```

- [ ] **Step 2: Run — expect fail**

Run: `npm test -- visibility`
Expected: module-not-found error.

**Checkpoint:** failing test in place.

---

### Task 2.9 — `domain/visibility.ts` — implement

**Files:**
- Create: `src/server/domain/visibility.ts`

- [ ] **Step 1: Write the implementation**

```ts
import type { Game, GameId, Room, VisibleRoom, Viewer } from "@shared/types.js"

export type GameResolver = (id: GameId) => Game | undefined

export function projectRoomFor(room: Room, viewer: Viewer, resolveGame: GameResolver): VisibleRoom {
  const game = resolveGame(room.gameId)
  if (!game) throw new Error("UNKNOWN_GAME")

  if (viewer.kind === "admin") {
    if (viewer.adminSecret !== room.adminSecret) throw new Error("AUTHZ_MISMATCH")
    return {
      code: room.code, gameId: room.gameId, game, assigned: room.assigned, settings: room.settings,
      players: room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected, role: p.role }))
    }
  }

  const me = room.players.find(p => p.id === viewer.playerId)
  if (!me) throw new Error("AUTHZ_MISMATCH")

  return {
    code: room.code, gameId: room.gameId, game, assigned: room.assigned, settings: room.settings,
    players: room.players.map(p => ({
      id: p.id, name: p.name, connected: p.connected,
      role: p.id === viewer.playerId ? p.role : null
    }))
  }
}
```

- [ ] **Step 2: Run — expect pass**

Run: `npm test -- visibility`
Expected: 6 passed.

- [ ] **Step 3: Full domain run**

Run: `npm test`
Expected: 23 passed (5+5+7+6).

**Checkpoint:** Phase 2 complete — all domain modules green, no I/O dependencies.

---

# Phase 3 — Store layer (TDD)

`RoomStore` interface + two implementations. Contract tests run against both.

---

### Task 3.1 — `RoomStore` interface

**Files:**
- Create: `src/server/store/store.ts`

- [ ] **Step 1: Write the file**

```ts
import type { Room } from "@shared/types.js"

export interface RoomStore {
  create(room: Room): Promise<void>
  get(code: string): Promise<Room | null>
  update(code: string, updater: (room: Room) => Room): Promise<Room>
  delete(code: string): Promise<void>
  deleteOlderThan(cutoffMs: number): Promise<number>
  countActiveRooms(): Promise<number>
  close(): Promise<void>
}

export class RoomNotFoundError extends Error {
  constructor(public readonly code: string) { super(`ROOM_NOT_FOUND: ${code}`) }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** interface published.

---

### Task 3.2 — `MemoryStore` — implement first (drives the contract)

**Files:**
- Create: `src/server/store/memory-store.ts`

- [ ] **Step 1: Write the implementation**

```ts
import type { Room } from "@shared/types.js"
import { RoomNotFoundError, type RoomStore } from "./store.js"

export class MemoryStore implements RoomStore {
  private readonly rooms = new Map<string, Room>()
  private readonly chains = new Map<string, Promise<unknown>>()

  async create(room: Room): Promise<void> {
    if (this.rooms.has(room.code)) throw new Error("ROOM_EXISTS")
    this.rooms.set(room.code, structuredClone(room))
  }

  async get(code: string): Promise<Room | null> {
    const r = this.rooms.get(code)
    return r ? structuredClone(r) : null
  }

  async update(code: string, updater: (room: Room) => Room): Promise<Room> {
    const prev = this.chains.get(code) ?? Promise.resolve()
    const next = prev.then(() => {
      const current = this.rooms.get(code)
      if (!current) throw new RoomNotFoundError(code)
      const updated = updater(structuredClone(current))
      updated.updatedAt = Date.now()
      this.rooms.set(code, structuredClone(updated))
      return updated
    }).finally(() => {
      if (this.chains.get(code) === next) this.chains.delete(code)
    })
    this.chains.set(code, next)
    return next as Promise<Room>
  }

  async delete(code: string): Promise<void> {
    this.rooms.delete(code)
  }

  async deleteOlderThan(cutoffMs: number): Promise<number> {
    let n = 0
    for (const [code, room] of this.rooms) {
      if (room.createdAt < cutoffMs) { this.rooms.delete(code); n++ }
    }
    return n
  }

  async countActiveRooms(): Promise<number> {
    return this.rooms.size
  }

  async close(): Promise<void> { /* nothing to close */ }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** memory store written; not yet tested.

---

### Task 3.3 — Shared store contract test

**Files:**
- Create: `tests/unit/store/contract.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import type { RoomStore } from "@server/store/store.js"
import type { Room } from "@shared/types.js"
import { MemoryStore } from "@server/store/memory-store.js"
import { SqliteStore } from "@server/store/sqlite-store.js"

function mkRoom(code: string, createdAt = Date.now()): Room {
  return {
    code, gameId: "g", adminSecret: "a", assigned: false,
    settings: {}, players: [], createdAt, updatedAt: createdAt
  }
}

const factories: Array<{ name: string; make: () => RoomStore }> = [
  { name: "MemoryStore",  make: () => new MemoryStore() },
  { name: "SqliteStore",  make: () => new SqliteStore(":memory:") }
]

for (const { name, make } of factories) {
  describe(`RoomStore contract: ${name}`, () => {
    let store: RoomStore
    beforeEach(() => { store = make() })
    afterEach(async () => { await store.close() })

    it("create then get round-trips", async () => {
      const r = mkRoom("AAAAA")
      await store.create(r)
      const got = await store.get("AAAAA")
      expect(got?.code).toBe("AAAAA")
    })

    it("get returns null for missing code", async () => {
      expect(await store.get("ZZZZZ")).toBeNull()
    })

    it("update applies the updater function and persists", async () => {
      await store.create(mkRoom("BBBBB"))
      const result = await store.update("BBBBB", r => ({ ...r, assigned: true }))
      expect(result.assigned).toBe(true)
      expect((await store.get("BBBBB"))?.assigned).toBe(true)
    })

    it("update updatesAt timestamp on success", async () => {
      await store.create(mkRoom("CCCCC", 1))
      const result = await store.update("CCCCC", r => r)
      expect(result.updatedAt).toBeGreaterThan(1)
    })

    it("update throws when room is missing", async () => {
      await expect(store.update("MISSY", r => r)).rejects.toThrow(/ROOM_NOT_FOUND/)
    })

    it("concurrent updates on the same code serialize without losing writes", async () => {
      await store.create(mkRoom("DDDDD"))
      const inc = (n: number) => store.update("DDDDD", r => ({ ...r, settings: { ...r.settings, c: (Number(r.settings.c) || 0) + n } }))
      await Promise.all([inc(1), inc(1), inc(1), inc(1), inc(1)])
      const final = await store.get("DDDDD")
      expect(final?.settings.c).toBe(5)
    })

    it("delete removes the room", async () => {
      await store.create(mkRoom("EEEEE"))
      await store.delete("EEEEE")
      expect(await store.get("EEEEE")).toBeNull()
    })

    it("deleteOlderThan respects cutoff", async () => {
      await store.create(mkRoom("OLD11", 100))
      await store.create(mkRoom("OLD22", 200))
      await store.create(mkRoom("NEW33", 5000))
      const removed = await store.deleteOlderThan(500)
      expect(removed).toBe(2)
      expect(await store.get("OLD11")).toBeNull()
      expect(await store.get("OLD22")).toBeNull()
      expect(await store.get("NEW33")).not.toBeNull()
    })

    it("countActiveRooms reflects create/delete", async () => {
      expect(await store.countActiveRooms()).toBe(0)
      await store.create(mkRoom("F1111"))
      await store.create(mkRoom("F2222"))
      expect(await store.countActiveRooms()).toBe(2)
      await store.delete("F1111")
      expect(await store.countActiveRooms()).toBe(1)
    })
  })
}
```

- [ ] **Step 2: Run — Memory side passes, SQLite side fails (module missing)**

Run: `npm test -- contract`
Expected: MemoryStore: 9 passed; SqliteStore: 9 failed (or test file fails to import). Either way you see the missing module.

**Checkpoint:** contract test wired up; memory side green; sqlite next.

---

### Task 3.4 — `SqliteStore` — implement

**Files:**
- Create: `src/server/store/sqlite-store.ts`

- [ ] **Step 1: Write the implementation**

```ts
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
```

- [ ] **Step 2: Run contract tests**

Run: `npm test -- contract`
Expected: both stores green — 18 passed total.

**Checkpoint:** both stores satisfy the contract.

---

### Task 3.5 — SQLite-specific assertions

**Files:**
- Create: `tests/unit/store/sqlite-store.test.ts`

- [ ] **Step 1: Write the test**

```ts
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
    let a = new SqliteStore(dbPath); void a.close()
    expect(() => { const b = new SqliteStore(dbPath); void b.close() }).not.toThrow()
    rmSync(dir, { recursive: true, force: true })
  })
})
```

- [ ] **Step 2: Run**

Run: `npm test -- sqlite-store`
Expected: 2 passed.

- [ ] **Step 3: Full unit run + coverage**

Run: `npm test -- --coverage`
Expected: all tests pass; coverage report shows ≥85% for `src/server/domain/` and `src/server/store/`.

**Checkpoint:** Phase 3 complete — store layer green, coverage targets met.

---

# Phase 4 — Server TypeScript migration

Delete `server.js`; replace with `src/server/index.ts` + handlers + config + games catalog. App must still work end-to-end manually after this phase.

---

### Task 4.1 — Games catalog (TS port)

**Files:**
- Create: `src/server/games/catalog.ts`

- [ ] **Step 1: Read the existing catalog**

Read `public/games.js` to capture the three games (Vampire Village, Classic Mafia, Spy Game) — their settings, role lists, and i18n text. Port the data exactly; only the surrounding code changes.

- [ ] **Step 2: Write `catalog.ts`**

Translate the existing `GAME_CATALOG` array into typed TS form:

```ts
import type { Game } from "@shared/types.js"

export const GAME_CATALOG: readonly Game[] = [
  // PORT every entry from public/games.js verbatim, typed against Game.
  // Each object: { id, icon, theme, minPlayers, defaultSettings, title, subtitle, rules, roles, settings }.
  // Do not rename ids, do not drop locales.
] as const

const byId = new Map(GAME_CATALOG.map(g => [g.id, g]))
export function resolveGame(id: string): Game | undefined { return byId.get(id) }
export function defaultGame(): Game { return GAME_CATALOG[0]! }
```

Fill the `GAME_CATALOG` body with the three games copied 1:1 from `public/games.js`. Every role with `filler: true` must remain so. Every `countSetting` / `enabledSetting` key must match its `settings` entry.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: exits 0. If anything fails, the spec for `Game` and `Role` is authoritative — fix the data.

**Checkpoint:** catalog ported.

---

### Task 4.2 — Logger

**Files:**
- Create: `src/server/logger.ts`

- [ ] **Step 1: Write the file**

```ts
import { pino } from "pino"

const isProd = process.env.NODE_ENV === "production"

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: { paths: ["adminSecret", "*.adminSecret", "playerId", "*.playerId"], remove: false, censor: "[REDACTED]" },
  ...(isProd ? {} : { transport: { target: "pino-pretty", options: { colorize: true } } })
})
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** logger ready.

---

### Task 4.3 — Config

**Files:**
- Create: `src/server/config.ts`

- [ ] **Step 1: Write the file**

```ts
import { z } from "zod"

const Schema = z.object({
  NODE_ENV:              z.enum(["development", "test", "production"]).default("development"),
  PORT:                  z.coerce.number().int().min(1).max(65535).default(3000),
  DB_PATH:               z.string().optional(),
  ALLOWED_ORIGIN:        z.string().optional(),
  ROOM_TTL_HOURS:        z.coerce.number().positive().default(8),
  LOG_LEVEL:             z.enum(["fatal","error","warn","info","debug","trace"]).default("info"),
  MAX_PLAYERS_PER_ROOM:  z.coerce.number().int().positive().default(25),
  MAX_ROOMS_PER_SOCKET:  z.coerce.number().int().positive().default(5),
  MAX_TOTAL_ROOMS:       z.coerce.number().int().positive().default(10_000)
}).superRefine((v, ctx) => {
  if (v.NODE_ENV === "production" && !v.DB_PATH) {
    ctx.addIssue({
      code: "custom", path: ["DB_PATH"],
      message: "DB_PATH is required when NODE_ENV=production (no silent fallback to memory store)"
    })
  }
})

export const config = Schema.parse(process.env)
export type Config = z.infer<typeof Schema>
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** config ready.

---

### Task 4.4 — Zod payload schemas

**Files:**
- Create: `src/server/sockets/schemas.ts`

- [ ] **Step 1: Write the file**

```ts
import { z } from "zod"

export const RoomCode = z.string().regex(/^[A-Z2-9]{5}$/, "invalid room code")

export const CreateRoomPayload    = z.object({ gameId: z.string().min(1).max(64) })
export const ReconnectPayload     = z.object({ code: RoomCode, adminSecret: z.string().min(1).max(64) })
export const UpdateSettingsPayload = z.object({
  code: RoomCode,
  adminSecret: z.string().min(1).max(64),
  settings: z.record(z.string(), z.union([z.number(), z.boolean(), z.string()]))
})
export const AssignRolesPayload   = ReconnectPayload
export const ClearRolesPayload    = ReconnectPayload
export const JoinPayload          = z.object({
  code: RoomCode,
  name: z.string().trim().min(1).max(24),
  playerId: z.string().min(1).max(64).optional()
})
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** schemas ready.

---

### Task 4.5 — Rate limiter

**Files:**
- Create: `src/server/sockets/rate-limit.ts`

- [ ] **Step 1: Write the file**

```ts
const COOLDOWNS_MS: Record<string, number> = {
  "admin:create-room":     2000,
  "player:join":           500,
  "admin:update-settings": 200,
  "admin:assign-roles":    200,
  "admin:clear-roles":     200,
  "admin:reconnect":       200
}

type Bag = Map<string, number>

export function checkRateLimit(socket: { data: { rateBag?: Bag } }, event: string): boolean {
  if (!socket.data.rateBag) socket.data.rateBag = new Map()
  const now = Date.now()
  const cooldown = COOLDOWNS_MS[event] ?? 100
  const last = socket.data.rateBag.get(event) ?? 0
  if (now - last < cooldown) return false
  socket.data.rateBag.set(event, now)
  return true
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** rate limiter ready.

---

### Task 4.6 — Typed handler binder

**Files:**
- Create: `src/server/sockets/bind.ts`

- [ ] **Step 1: Write the file**

```ts
import type { Socket } from "socket.io"
import type { z } from "zod"
import type { ClientToServerEvents, ServerToClientEvents, AckResult } from "@shared/events.js"
import type { ErrorCode, SocketData } from "@shared/types.js"
import { checkRateLimit } from "./rate-limit.js"
import { logger } from "../logger.js"

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>

const ERROR_CODES = new Set<ErrorCode>([
  "INVALID_ADMIN","ROOM_NOT_FOUND","NAME_REQUIRED","NAME_TAKEN",
  "NEED_MORE_PLAYERS","TOO_MANY_SPECIAL_ROLES","INVALID_INPUT","RATE_LIMITED",
  "ROOM_FULL","SERVER_BUSY","AUTHZ_MISMATCH","NO_FILLER_ROLE","UNKNOWN_GAME"
])

function toErrorCode(err: unknown): ErrorCode {
  if (err instanceof Error && ERROR_CODES.has(err.message as ErrorCode)) return err.message as ErrorCode
  if (err instanceof Error && err.message.startsWith("ROOM_NOT_FOUND")) return "ROOM_NOT_FOUND"
  logger.error({ err }, "handler threw an unrecognized error")
  return "INVALID_INPUT"
}

export function bind<E extends keyof ClientToServerEvents, Payload, Data>(
  socket: TypedSocket,
  event: E,
  schema: z.ZodType<Payload>,
  handler: (data: Payload, socket: TypedSocket) => Promise<Data>
): void {
  socket.on(event as string, async (payload: unknown, ack: (r: AckResult<Data>) => void) => {
    if (typeof ack !== "function") return
    if (!checkRateLimit(socket, event as string)) return ack({ ok: false, error: "RATE_LIMITED" })
    const parsed = schema.safeParse(payload)
    if (!parsed.success) return ack({ ok: false, error: "INVALID_INPUT" })
    try {
      const data = await handler(parsed.data, socket)
      ack({ ok: true, data })
    } catch (err) {
      ack({ ok: false, error: toErrorCode(err) })
    }
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** binder ready.

---

### Task 4.7 — Admin handlers

**Files:**
- Create: `src/server/sockets/admin-handlers.ts`

- [ ] **Step 1: Write the file**

```ts
import type { Server, Socket } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@shared/events.js"
import type { Room, SocketData } from "@shared/types.js"
import type { RoomStore } from "../store/store.js"
import type { GameResolver } from "../domain/visibility.js"
import { bind } from "./bind.js"
import { projectRoomFor } from "../domain/visibility.js"
import { normalizeSettings } from "../domain/settings.js"
import { buildRolePool, assignRolesToPlayers } from "../domain/roles.js"
import { makeRoomCode, makeSecret } from "../domain/codes.js"
import { CreateRoomPayload, ReconnectPayload, UpdateSettingsPayload, AssignRolesPayload, ClearRolesPayload } from "./schemas.js"
import { logger } from "../logger.js"
import type { Config } from "../config.js"

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>

export interface AdminDeps {
  io: TypedServer
  store: RoomStore
  resolveGame: GameResolver
  config: Config
  rng: () => number
}

async function broadcastRoom(deps: AdminDeps, room: Room): Promise<void> {
  const adminProjection = projectRoomFor(room, { kind: "admin", adminSecret: room.adminSecret }, deps.resolveGame)
  deps.io.to(`admin:${room.code}`).emit("admin:room-updated", adminProjection)

  for (const p of room.players) {
    const projection = projectRoomFor(room, { kind: "player", playerId: p.id }, deps.resolveGame)
    // emit to the specific player socket via room (their socket joins `room:${code}:${playerId}` on join)
    deps.io.to(`p:${room.code}:${p.id}`).emit("room:status", projection)
  }
}

export function registerAdminHandlers(socket: TypedSocket, deps: AdminDeps): void {
  bind(socket, "admin:create-room", CreateRoomPayload, async ({ gameId }) => {
    const game = deps.resolveGame(gameId)
    if (!game) throw new Error("UNKNOWN_GAME")

    const totalRooms = await deps.store.countActiveRooms()
    if (totalRooms >= deps.config.MAX_TOTAL_ROOMS) throw new Error("SERVER_BUSY")

    const adminRoomCount = socket.data.adminRoomCount ?? 0
    if (adminRoomCount >= deps.config.MAX_ROOMS_PER_SOCKET) throw new Error("RATE_LIMITED")

    const code = makeRoomCode(c => deps.store.get(c).then(r => r !== null) as unknown as boolean)
    // ^ makeRoomCode is sync; we cannot await inside. Use a probe loop instead:
    let finalCode = code
    for (let i = 0; i < 5; i++) {
      if (!(await deps.store.get(finalCode))) break
      finalCode = makeRoomCode(() => false)
    }

    const adminSecret = makeSecret()
    const now = Date.now()
    const room: Room = {
      code: finalCode, gameId: game.id, adminSecret,
      assigned: false,
      settings: normalizeSettings(game, game.defaultSettings),
      players: [], createdAt: now, updatedAt: now
    }
    await deps.store.create(room)

    socket.data.adminSecret = adminSecret
    socket.data.roomCode = finalCode
    socket.data.adminRoomCount = adminRoomCount + 1
    socket.join(`room:${finalCode}`)
    socket.join(`admin:${finalCode}`)

    logger.info({ code: finalCode, gameId }, "room created")
    const projection = projectRoomFor(room, { kind: "admin", adminSecret }, deps.resolveGame)
    return { code: finalCode, adminSecret, room: projection }
  })

  bind(socket, "admin:reconnect", ReconnectPayload, async ({ code, adminSecret }) => {
    const room = await deps.store.get(code)
    if (!room || room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
    socket.data.adminSecret = adminSecret
    socket.data.roomCode = code
    socket.join(`room:${code}`)
    socket.join(`admin:${code}`)
    return { room: projectRoomFor(room, { kind: "admin", adminSecret }, deps.resolveGame) }
  })

  bind(socket, "admin:update-settings", UpdateSettingsPayload, async ({ code, adminSecret, settings }) => {
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      const game = deps.resolveGame(room.gameId)
      if (!game) throw new Error("UNKNOWN_GAME")
      return {
        ...room,
        settings: normalizeSettings(game, settings as Record<string, unknown>),
        assigned: false,
        players: room.players.map(p => ({ ...p, role: null }))
      }
    })
    await broadcastRoom(deps, updated)
    for (const p of updated.players) deps.io.to(`p:${code}:${p.id}`).emit("player:role-cleared")
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })

  bind(socket, "admin:assign-roles", AssignRolesPayload, async ({ code, adminSecret }) => {
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      const game = deps.resolveGame(room.gameId)
      if (!game) throw new Error("UNKNOWN_GAME")
      if (room.players.length < game.minPlayers) throw new Error("NEED_MORE_PLAYERS")
      const pool = buildRolePool(game, room.settings, room.players.length)
      const players = assignRolesToPlayers(room.players, pool, deps.rng)
      return { ...room, players, assigned: true }
    })
    const game = deps.resolveGame(updated.gameId)!
    await broadcastRoom(deps, updated)
    for (const p of updated.players) {
      const role = game.roles.find(r => r.id === p.role)!
      deps.io.to(`p:${code}:${p.id}`).emit("player:role-assigned", {
        role: p.role!, roleData: role, name: p.name, code, game
      })
    }
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })

  bind(socket, "admin:clear-roles", ClearRolesPayload, async ({ code, adminSecret }) => {
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      return { ...room, assigned: false, players: room.players.map(p => ({ ...p, role: null })) }
    })
    await broadcastRoom(deps, updated)
    for (const p of updated.players) deps.io.to(`p:${code}:${p.id}`).emit("player:role-cleared")
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** admin handlers compile.

---

### Task 4.8 — Player handlers

**Files:**
- Create: `src/server/sockets/player-handlers.ts`

- [ ] **Step 1: Write the file**

```ts
import type { Server, Socket } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@shared/events.js"
import type { Player, SocketData } from "@shared/types.js"
import type { RoomStore } from "../store/store.js"
import type { GameResolver } from "../domain/visibility.js"
import { bind } from "./bind.js"
import { projectRoomFor } from "../domain/visibility.js"
import { makeSecret } from "../domain/codes.js"
import { JoinPayload } from "./schemas.js"
import type { Config } from "../config.js"

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>

export interface PlayerDeps {
  io: TypedServer
  store: RoomStore
  resolveGame: GameResolver
  config: Config
}

export function registerPlayerHandlers(socket: TypedSocket, deps: PlayerDeps): void {
  bind(socket, "player:join", JoinPayload, async ({ code, name, playerId }) => {
    let bound: Player | null = null

    const updated = await deps.store.update(code, room => {
      const game = deps.resolveGame(room.gameId)
      if (!game) throw new Error("UNKNOWN_GAME")

      if (playerId) {
        const existing = room.players.find(p => p.id === playerId)
        if (existing) {
          bound = { ...existing, connected: true }
          return { ...room, players: room.players.map(p => p.id === playerId ? bound! : p) }
        }
      }

      const collision = room.players.find(p => p.name.toLowerCase() === name.toLowerCase())
      if (collision && collision.connected) throw new Error("NAME_TAKEN")
      if (collision && !collision.connected) {
        bound = { ...collision, connected: true }
        return { ...room, players: room.players.map(p => p.id === collision.id ? bound! : p) }
      }

      if (room.players.length >= deps.config.MAX_PLAYERS_PER_ROOM) throw new Error("ROOM_FULL")

      const fresh: Player = { id: makeSecret(), name, role: null, connected: true }
      bound = fresh
      return { ...room, players: [...room.players, fresh] }
    })

    if (!bound) throw new Error("INVALID_INPUT")
    const me: Player = bound

    socket.data.roomCode = code
    socket.data.playerId = me.id
    socket.join(`room:${code}`)
    socket.join(`p:${code}:${me.id}`)

    const game = deps.resolveGame(updated.gameId)!
    const roleData = me.role ? (game.roles.find(r => r.id === me.role) ?? null) : null

    const adminProjection = projectRoomFor(updated, { kind: "admin", adminSecret: updated.adminSecret }, deps.resolveGame)
    deps.io.to(`admin:${code}`).emit("admin:room-updated", adminProjection)
    for (const p of updated.players) {
      const projection = projectRoomFor(updated, { kind: "player", playerId: p.id }, deps.resolveGame)
      deps.io.to(`p:${code}:${p.id}`).emit("room:status", projection)
    }

    if (updated.assigned && me.role) {
      deps.io.to(`p:${code}:${me.id}`).emit("player:role-assigned", {
        role: me.role, roleData: roleData!, name: me.name, code, game
      })
    }

    const myProjection = projectRoomFor(updated, { kind: "player", playerId: me.id }, deps.resolveGame)
    return { room: myProjection, player: { id: me.id, name: me.name, role: me.role, roleData } }
  })

  socket.on("disconnect", async () => {
    const code = socket.data.roomCode
    const playerId = socket.data.playerId
    if (!code || !playerId) return
    try {
      const updated = await deps.store.update(code, room => ({
        ...room,
        players: room.players.map(p => p.id === playerId ? { ...p, connected: false } : p)
      }))
      const adminProjection = projectRoomFor(updated, { kind: "admin", adminSecret: updated.adminSecret }, deps.resolveGame)
      deps.io.to(`admin:${code}`).emit("admin:room-updated", adminProjection)
    } catch { /* room may have been deleted; ignore */ }
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** player handlers compile.

---

### Task 4.9 — Sockets bootstrap

**Files:**
- Create: `src/server/sockets/index.ts`

- [ ] **Step 1: Write the file**

```ts
import type { Server, Socket } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@shared/events.js"
import type { SocketData } from "@shared/types.js"
import { registerAdminHandlers, type AdminDeps } from "./admin-handlers.js"
import { registerPlayerHandlers, type PlayerDeps } from "./player-handlers.js"

export interface SocketDeps extends AdminDeps, PlayerDeps {}

export function registerHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>,
  deps: SocketDeps
): void {
  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>) => {
    registerAdminHandlers(socket, deps)
    registerPlayerHandlers(socket, deps)
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** sockets bundled.

---

### Task 4.10 — Server bootstrap + delete legacy

**Files:**
- Create: `src/server/index.ts`
- Delete: `server.js`
- Modify: `package.json`

- [ ] **Step 1: Write `src/server/index.ts`**

```ts
import express from "express"
import http from "node:http"
import { Server } from "socket.io"
import helmet from "helmet"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "./config.js"
import { logger } from "./logger.js"
import { MemoryStore } from "./store/memory-store.js"
import { SqliteStore } from "./store/sqlite-store.js"
import type { RoomStore } from "./store/store.js"
import { registerHandlers } from "./sockets/index.js"
import { GAME_CATALOG, resolveGame } from "./games/catalog.js"
import type { ClientToServerEvents, ServerToClientEvents } from "@shared/events.js"
import type { SocketData } from "@shared/types.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function makeStore(): RoomStore {
  if (config.DB_PATH) return new SqliteStore(config.DB_PATH)
  if (config.NODE_ENV === "production") {
    // config.ts already enforces this, but defense in depth:
    throw new Error("DB_PATH is required in production")
  }
  logger.warn("DB_PATH unset — using MemoryStore (test/dev only)")
  return new MemoryStore()
}

async function main() {
  const app = express()
  app.use(helmet({ contentSecurityPolicy: false }))

  const store = makeStore()

  app.get("/healthz", async (_req, res) => {
    try { await store.countActiveRooms(); res.json({ ok: true }) }
    catch (err) { logger.error({ err }, "healthz failed"); res.status(503).json({ ok: false }) }
  })

  app.get("/api/games", (_req, res) => { res.json(GAME_CATALOG) })

  // Static: in production serve the Vite build; until Phase 5 wires Vite, serve the legacy `public/`
  const staticDir = path.resolve(__dirname, "../../dist/client")
  const legacyDir = path.resolve(__dirname, "../../public")
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { existsSync } = await import("node:fs")
  app.use(express.static(existsSync(staticDir) ? staticDir : legacyDir))

  const server = http.createServer(app)
  const io = new Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>(server, {
    cors: { origin: config.ALLOWED_ORIGIN ?? true }
  })

  registerHandlers(io, {
    io, store, resolveGame, config, rng: Math.random
  })

  setInterval(() => {
    void store.deleteOlderThan(Date.now() - config.ROOM_TTL_HOURS * 60 * 60 * 1000)
  }, 20 * 60 * 1000).unref()

  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, "server ready")
  })

  const shutdown = async () => { await store.close(); server.close(() => process.exit(0)) }
  process.on("SIGINT",  () => void shutdown())
  process.on("SIGTERM", () => void shutdown())
}

main().catch(err => { logger.fatal({ err }, "startup failed"); process.exit(1) })
```

- [ ] **Step 2: Delete `server.js`**

Delete the file `server.js` at the project root.

- [ ] **Step 3: Update `package.json`**

In `package.json`:
- Change `"main": "server.js"` to `"main": "dist/server/index.js"`.
- Remove the `"start:legacy"` script.

- [ ] **Step 4: Build + start with memory store**

Run:
```bash
npm run build
NODE_ENV=development npm start
```
(PowerShell: `$env:NODE_ENV="development"; npm start`)

Expected: stdout contains `"server ready"` JSON line. Stop with Ctrl+C.

- [ ] **Step 5: Verify production guard**

Run:
```bash
NODE_ENV=production npm start
```
(PowerShell: `$env:NODE_ENV="production"; npm start`)

Expected: process exits non-zero with a Zod issue mentioning `DB_PATH`.

- [ ] **Step 6: Verify SQLite path works**

Run:
```bash
NODE_ENV=production DB_PATH=./data/rooms.db npm start
```
(PowerShell: `$env:NODE_ENV="production"; $env:DB_PATH="./data/rooms.db"; npm start`)

Expected: directory `./data` created, server ready. Stop with Ctrl+C; `./data/rooms.db` exists.

**Checkpoint:** Phase 4 done. Server is TS, legacy `server.js` gone, production guard works, SQLite store wired. Frontend still loads the **legacy** `public/index.html` + `app.js` because Phase 5 hasn't run yet — manual smoke test should still work end-to-end (create room, join from another tab, assign roles).

---

# Phase 5 — Client TypeScript + Vite migration

Replace `public/app.js` + `public/games.js` + `public/index.html` with `src/client/**` + project-root `index.html`. Vanilla DOM, markup preserved.

---

### Task 5.1 — Move `index.html` to project root, repoint scripts

**Files:**
- Move: `public/index.html` → `index.html`
- Modify: `index.html` (`<script>` tags + `<link>`)

- [ ] **Step 1: Read and move**

Copy the contents of `public/index.html` to a new file at the project root: `index.html`. Then delete `public/index.html`.

- [ ] **Step 2: Replace the three trailing script tags**

In the new root `index.html`, find:
```html
<script src="/socket.io/socket.io.js"></script>
<script src="/games.js"></script>
<script src="/app.js"></script>
```

Replace with:
```html
<script type="module" src="/src/client/main.ts"></script>
```

(Socket.IO is now bundled via `socket.io-client`; the catalog comes from `/api/games`; app code is `main.ts` and its imports.)

- [ ] **Step 3: Verify stylesheet path**

Confirm the `<link rel="stylesheet" href="/styles.css">` tag is present. `styles.css` will be served from `public/styles.css` via Vite's `publicDir`.

- [ ] **Step 4: Install `socket.io-client`**

Run: `npm install --save socket.io-client@^4.7.5`

**Checkpoint:** entry HTML at project root; scripts repointed.

---

### Task 5.2 — i18n service + canonical EN dictionary

**Files:**
- Create: `src/client/i18n/en.ts`
- Create: `src/client/services/i18n.ts`

- [ ] **Step 1: Write `en.ts`**

Open the existing `public/app.js`, find the translation table (it's a `TRANSLATIONS` or similar object). For each key used by `[data-i18n]` in `index.html`, copy the English text. Structure:

```ts
const en = {
  brand: "Role Room",
  brandSub: "Multi Game Platform",
  liveRoom: "Live Room System",
  title: "Many Games, One System",
  subtitle: "Pick a game, create a room, players join by code, each sees only their own role.",
  secretRole: "Secret Role",
  selectGameMini: "Game Library",
  selectGame: "Select a game",
  selectGameText: "Each game has its own roles and rules. You can add more later.",
  alreadyHaveCode: "Room code already?",
  joinDirectText: "Players can join directly with a code.",
  joinRoom: "Join with Code",
  back: "Back",
  createRoom: "Create Room",
  player: "Player",
  joinTitle: "Join Room",
  roomCode: "Room Code",
  yourName: "Your Name",
  enterRoom: "Enter Room",
  privateScreen: "Private",
  roleNotAssigned: "Role is not assigned yet",
  waitAdmin: "Wait for the admin.",
  adminRoom: "Admin Room",
  copyCode: "Copy Code",
  shareCodeHint: "Send this code to players",
  selectedGame: "Selected Game",
  players: "Players",
  rolesStatus: "Role Status",
  settings: "Settings",
  saveSettings: "Save Settings",
  assignRoles: "Assign Roles",
  clearRoles: "Clear Roles",
  noPlayers: "No players yet.",
  rulesTitle: "How to Play",
  rolesTitle: "Roles",
  errorNameTaken: "That name is taken.",
  errorRoomNotFound: "Room not found.",
  errorNameRequired: "Please enter your name.",
  errorNeedMorePlayers: "Need more players to start.",
  errorTooManySpecial: "Too many special roles for this many players.",
  errorRoomFull: "Room is full.",
  errorRateLimited: "Slow down a little.",
  errorServerBusy: "Server is busy, try again.",
  errorInvalidAdmin: "You are not the admin of this room.",
  errorGeneric: "Something went wrong.",
  copied: "Copied!"
} as const

export type Translations = typeof en
export default en
```

If the legacy `app.js` table has more keys than listed here, add them with sensible English values. Keep keys flat (no nesting) to keep the type narrow.

- [ ] **Step 2: Write `i18n.ts`**

```ts
import type { LangCode } from "@shared/types.js"
import en, { type Translations } from "../i18n/en.js"
import tr from "../i18n/tr.js"
import ar from "../i18n/ar.js"
import ku from "../i18n/ku.js"

const DICTIONARIES: Record<LangCode, Translations> = { en, tr, ar, ku }
const RTL: Record<LangCode, boolean> = { en: false, tr: false, ar: true, ku: true }
const STORAGE_KEY = "role-room:lang"

let current: LangCode = (localStorage.getItem(STORAGE_KEY) as LangCode | null) ?? "en"

export function t(key: keyof Translations): string {
  return DICTIONARIES[current][key]
}

export function getLang(): LangCode { return current }

export function setLang(lang: LangCode): void {
  current = lang
  localStorage.setItem(STORAGE_KEY, lang)
  document.documentElement.lang = lang
  document.documentElement.dir = RTL[lang] ? "rtl" : "ltr"
  applyAll()
}

export function applyAll(): void {
  document.documentElement.lang = current
  document.documentElement.dir = RTL[current] ? "rtl" : "ltr"
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = el.dataset.i18n as keyof Translations | undefined
    if (key && key in DICTIONARIES[current]) el.textContent = DICTIONARIES[current][key]
  }
}
```

**Checkpoint:** canonical dictionary + service ready. (Other languages next.)

---

### Task 5.3 — Other language dictionaries

**Files:**
- Create: `src/client/i18n/tr.ts`
- Create: `src/client/i18n/ar.ts`
- Create: `src/client/i18n/ku.ts`

- [ ] **Step 1: For each language, copy `en.ts` structure and translate values**

Read `public/app.js` for the existing translations and port them. The TS contract — every file must satisfy `Translations` — will surface any missing key at typecheck time.

Skeleton (apply to `tr.ts`, `ar.ts`, `ku.ts`):

```ts
import type { Translations } from "./en.js"

const tr: Translations = {
  brand: "Role Room",
  brandSub: "Çoklu Oyun Platformu",
  // ...fill EVERY key from en.ts with the language's value
} as const

export default tr
```

If a legacy translation is missing for a key you added in `en.ts`, use the English value as a temporary fill and add a `// TODO i18n` line above it. (This is acceptable in this task only — for keys with no source data — because the alternative is shipping the EN fallback at runtime with no marker.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0. Any missing key in tr/ar/ku surfaces as a compile error.

**Checkpoint:** all four dictionaries satisfy `Translations`.

---

### Task 5.4 — Session service

**Files:**
- Create: `src/client/services/session.ts`

- [ ] **Step 1: Write the file**

```ts
const STORAGE_KEY = "role-room:session"

export type Session =
  | { kind: "admin";  code: string; adminSecret: string }
  | { kind: "player"; code: string; playerId: string; name: string }

export function load(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.kind === "admin"  && parsed.code && parsed.adminSecret) return parsed
    if (parsed?.kind === "player" && parsed.code && parsed.playerId && parsed.name) return parsed
    return null
  } catch { return null }
}

export function save(s: Session): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }
export function clear(): void { localStorage.removeItem(STORAGE_KEY) }
```

**Checkpoint:** session API ready.

---

### Task 5.5 — Typed socket wrapper

**Files:**
- Create: `src/client/services/socket.ts`

- [ ] **Step 1: Write the file**

```ts
import { io, type Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents, AckResult } from "@shared/events.js"

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export const socket: TypedSocket = io({ reconnection: true, reconnectionAttempts: Infinity })

export function emit<E extends keyof ClientToServerEvents>(
  event: E,
  payload: Parameters<ClientToServerEvents[E]>[0]
): Promise<AckResult<unknown>> {
  return new Promise(resolve => {
    ;(socket.emit as unknown as (
      e: string,
      p: unknown,
      cb: (r: AckResult<unknown>) => void
    ) => void)(event as string, payload, (r) => resolve(r))
  })
}
```

**Checkpoint:** typed socket exported.

---

### Task 5.6 — DOM helpers (no `innerHTML`)

**Files:**
- Create: `src/client/ui/dom.ts`

- [ ] **Step 1: Write the file**

```ts
export function $<T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(sel)
  if (!el) throw new Error(`element not found: ${sel}`)
  return el
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<Record<string, string | number | boolean>> = {},
  children: Array<Node | string> = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue
    if (k === "class") node.className = String(v)
    else if (k === "dataset") continue
    else node.setAttribute(k, String(v))
  }
  for (const c of children) node.append(typeof c === "string" ? document.createTextNode(c) : c)
  return node
}

export function clear(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild)
}
```

**Checkpoint:** DOM helpers ready; `innerHTML` not used anywhere.

---

### Task 5.7 — Toast UI

**Files:**
- Create: `src/client/ui/toast.ts`

- [ ] **Step 1: Write the file**

```ts
import { $ } from "./dom.js"

let timer: number | undefined

export function showToast(message: string, ms = 2500): void {
  const el = $<HTMLDivElement>("#toast")
  el.textContent = message
  el.classList.remove("hidden")
  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(() => el.classList.add("hidden"), ms)
}
```

**Checkpoint:** toast helper ready.

---

### Task 5.8 — Router

**Files:**
- Create: `src/client/router.ts`

- [ ] **Step 1: Write the file**

```ts
export type ViewId = "homeView" | "gameInfoView" | "joinView" | "playerRoomView" | "adminView"

export interface ViewContext {}

export interface ViewModule {
  id: ViewId
  mount: (ctx: ViewContext) => () => void
}

const registry = new Map<ViewId, ViewModule>()
let currentUnmount: (() => void) | null = null
let currentId: ViewId | null = null

export function register(view: ViewModule): void { registry.set(view.id, view) }

export function setView(id: ViewId, ctx: ViewContext = {}): void {
  if (currentId === id) return
  if (currentUnmount) currentUnmount()

  for (const section of document.querySelectorAll<HTMLElement>("section.view")) {
    section.classList.toggle("active-view", section.id === id)
  }

  const view = registry.get(id)
  currentUnmount = view ? view.mount(ctx) : null
  currentId = id
}
```

**Checkpoint:** router ready.

---

### Task 5.9 — Home view

**Files:**
- Create: `src/client/views/home.ts`

- [ ] **Step 1: Write the file**

```ts
import type { Game } from "@shared/types.js"
import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { setView } from "../router.js"

let games: readonly Game[] = []

export async function loadCatalog(): Promise<void> {
  const res = await fetch("/api/games")
  games = await res.json()
}

export function getGames(): readonly Game[] { return games }

export const homeView = {
  id: "homeView" as const,
  mount() {
    const grid = $<HTMLDivElement>("#gamesGrid")
    clear(grid)
    const lang = getLang()

    for (const game of games) {
      const card = el("button", { class: `game-card theme-${game.theme}`, type: "button", "data-game": game.id }, [
        el("div", { class: "game-icon" }, [game.icon]),
        el("strong", {}, [game.title[lang]]),
        el("span", { class: "muted" }, [game.subtitle[lang]])
      ])
      card.addEventListener("click", () => {
        sessionStorage.setItem("role-room:selectedGame", game.id)
        setView("gameInfoView")
      })
      grid.appendChild(card)
    }

    const onShowJoin = () => setView("joinView")
    $<HTMLButtonElement>("#showJoinBtn").addEventListener("click", onShowJoin)

    return () => {
      $<HTMLButtonElement>("#showJoinBtn").removeEventListener("click", onShowJoin)
    }
  }
}
```

**Checkpoint:** home view ready.

---

### Task 5.10 — Game info view

**Files:**
- Create: `src/client/views/gameInfo.ts`

- [ ] **Step 1: Write the file**

```ts
import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { setView } from "../router.js"
import { emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { showToast } from "../ui/toast.js"
import { getGames } from "./home.js"
import type { CreateRoomData } from "@shared/events.js"

export const gameInfoView = {
  id: "gameInfoView" as const,
  mount() {
    const content = $<HTMLDivElement>("#gameInfoContent")
    const lang = getLang()
    const gameId = sessionStorage.getItem("role-room:selectedGame")
    const game = getGames().find(g => g.id === gameId)
    clear(content)
    if (!game) { setView("homeView"); return () => {} }

    content.appendChild(el("h2", {}, [game.title[lang]]))
    content.appendChild(el("p", { class: "muted" }, [game.subtitle[lang]]))

    const rulesH = el("h3", { class: "section-title" }, [t("rulesTitle")])
    const rulesUl = el("ul", { class: "rules-list" })
    for (const line of game.rules[lang]) rulesUl.appendChild(el("li", {}, [line]))
    content.append(rulesH, rulesUl)

    const rolesH = el("h3", { class: "section-title" }, [t("rolesTitle")])
    const rolesUl = el("ul", { class: "roles-list" })
    for (const role of game.roles) {
      rolesUl.appendChild(el("li", {}, [
        el("span", { class: "role-icon" }, [role.icon]),
        el("strong", {}, [role.name[lang]]),
        el("span", { class: "muted" }, [role.desc[lang]])
      ]))
    }
    content.append(rolesH, rolesUl)

    const onCreate = async () => {
      const r = await emit("admin:create-room", { gameId: game.id })
      if (!r.ok) { showToast(t("errorGeneric")); return }
      const data = r.data as CreateRoomData
      session.save({ kind: "admin", code: data.code, adminSecret: data.adminSecret })
      setView("adminView", { initial: data.room })
    }
    const createBtn = $<HTMLButtonElement>("#createSelectedRoomBtn")
    createBtn.addEventListener("click", onCreate)

    const onBack = () => setView("homeView")
    const backs = document.querySelectorAll<HTMLButtonElement>(".backHome")
    backs.forEach(b => b.addEventListener("click", onBack))

    return () => {
      createBtn.removeEventListener("click", onCreate)
      backs.forEach(b => b.removeEventListener("click", onBack))
    }
  }
}
```

**Checkpoint:** game info view ready.

---

### Task 5.11 — Join view

**Files:**
- Create: `src/client/views/join.ts`

- [ ] **Step 1: Write the file**

```ts
import { $ } from "../ui/dom.js"
import { t } from "../services/i18n.js"
import { setView } from "../router.js"
import { emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { showToast } from "../ui/toast.js"
import type { PlayerJoinData } from "@shared/events.js"
import type { ErrorCode } from "@shared/types.js"

const ERR_TO_KEY: Partial<Record<ErrorCode, string>> = {
  NAME_TAKEN: "errorNameTaken",
  NAME_REQUIRED: "errorNameRequired",
  ROOM_NOT_FOUND: "errorRoomNotFound",
  ROOM_FULL: "errorRoomFull",
  RATE_LIMITED: "errorRateLimited",
  SERVER_BUSY: "errorServerBusy"
}

export const joinView = {
  id: "joinView" as const,
  mount() {
    const code = $<HTMLInputElement>("#joinCodeInput")
    const name = $<HTMLInputElement>("#playerNameInput")
    const msg  = $<HTMLDivElement>("#joinMessage")

    code.value = ""; name.value = ""
    msg.classList.add("hidden"); msg.textContent = ""

    const onJoin = async () => {
      const c = code.value.trim().toUpperCase()
      const n = name.value.trim()
      if (!c || !n) { msg.classList.remove("hidden"); msg.textContent = t("errorNameRequired"); return }

      const r = await emit("player:join", { code: c, name: n })
      if (!r.ok) {
        msg.classList.remove("hidden")
        const k = ERR_TO_KEY[r.error] ?? "errorGeneric"
        msg.textContent = t(k as Parameters<typeof t>[0])
        return
      }
      const data = r.data as PlayerJoinData
      session.save({ kind: "player", code: c, playerId: data.player.id, name: data.player.name })
      setView("playerRoomView", { initial: data })
    }

    const onBack = () => setView("homeView")
    const btn = $<HTMLButtonElement>("#joinBtn")
    const backs = document.querySelectorAll<HTMLButtonElement>(".backHome")
    btn.addEventListener("click", onJoin)
    backs.forEach(b => b.addEventListener("click", onBack))

    return () => {
      btn.removeEventListener("click", onJoin)
      backs.forEach(b => b.removeEventListener("click", onBack))
    }
  }
}
```

**Checkpoint:** join view ready.

---

### Task 5.12 — Player room view

**Files:**
- Create: `src/client/views/playerRoom.ts`

- [ ] **Step 1: Write the file**

```ts
import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { socket } from "../services/socket.js"
import type { PlayerJoinData, RoleAssignedPayload } from "@shared/events.js"

export const playerRoomView = {
  id: "playerRoomView" as const,
  mount(ctx: { initial?: PlayerJoinData }) {
    const gameNameEl = $<HTMLElement>("#playerGameName")
    const welcomeEl  = $<HTMLElement>("#playerWelcome")
    const statusEl   = $<HTMLElement>("#playerStatus")
    const cardEl     = $<HTMLDivElement>("#playerRoleCard")

    const lang = getLang()
    let myRole = ctx.initial?.player.role ?? null
    let myRoleData = ctx.initial?.player.roleData ?? null

    function render() {
      if (ctx.initial) {
        gameNameEl.textContent = ctx.initial.room.game.title[lang]
        welcomeEl.textContent  = ctx.initial.player.name
      }
      clear(cardEl)
      cardEl.classList.toggle("locked", !myRole)

      if (!myRole || !myRoleData) {
        cardEl.append(
          el("div", { class: "role-glow" }),
          el("div", { class: "role-lock" }, ["?"]),
          el("h3", {}, [t("roleNotAssigned")]),
          el("p", {}, [t("waitAdmin")])
        )
        statusEl.textContent = t("waitAdmin")
        return
      }

      cardEl.append(
        el("div", { class: "role-glow" }),
        el("div", { class: "role-icon big" }, [myRoleData.icon]),
        el("h3", {}, [myRoleData.name[lang]]),
        el("p", {}, [myRoleData.desc[lang]])
      )
      statusEl.textContent = ""
    }

    const onAssigned = (payload: RoleAssignedPayload) => {
      myRole = payload.role
      myRoleData = payload.roleData
      render()
    }
    const onCleared = () => { myRole = null; myRoleData = null; render() }

    socket.on("player:role-assigned", onAssigned)
    socket.on("player:role-cleared",  onCleared)
    render()

    return () => {
      socket.off("player:role-assigned", onAssigned)
      socket.off("player:role-cleared",  onCleared)
    }
  }
}
```

**Checkpoint:** player room view ready.

---

### Task 5.13 — Admin view

**Files:**
- Create: `src/client/views/admin.ts`

- [ ] **Step 1: Write the file**

```ts
import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { socket, emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { showToast } from "../ui/toast.js"
import type { VisibleRoom } from "@shared/types.js"
import type { AdminRoomData } from "@shared/events.js"

export const adminView = {
  id: "adminView" as const,
  mount(ctx: { initial?: VisibleRoom }) {
    let room: VisibleRoom | null = ctx.initial ?? null
    const lang = getLang()

    const codeEl     = $<HTMLElement>("#roomCodeText")
    const gameNameEl = $<HTMLElement>("#adminGameName")
    const gameSelEl  = $<HTMLElement>("#selectedGameText")
    const playersN   = $<HTMLElement>("#playersCount")
    const playersNS  = $<HTMLElement>("#playersCountSmall")
    const rolesStat  = $<HTMLElement>("#rolesStatus")
    const settingsEl = $<HTMLDivElement>("#dynamicSettings")
    const listEl     = $<HTMLDivElement>("#adminPlayersList")

    function renderSettings() {
      if (!room) return
      clear(settingsEl)
      for (const def of room.game.settings) {
        const id = `setting-${def.key}`
        const labelText = def.label[lang]
        const value = room.settings[def.key]
        if (def.type === "number") {
          const input = el("input", { id, type: "number", min: String(def.min), max: String(def.max), value: String(value ?? def.min) }) as HTMLInputElement
          settingsEl.append(el("label", { for: id }, [labelText]), input)
        } else {
          const input = el("input", { id, type: "checkbox" }) as HTMLInputElement
          input.checked = Boolean(value)
          settingsEl.append(el("label", { for: id }, [labelText]), input)
        }
      }
    }

    function renderPlayers() {
      if (!room) return
      clear(listEl)
      playersN.textContent  = String(room.players.length)
      playersNS.textContent = String(room.players.length)
      rolesStat.textContent = room.assigned ? "✓" : "—"
      if (room.players.length === 0) {
        listEl.classList.add("empty")
        listEl.textContent = t("noPlayers")
        return
      }
      listEl.classList.remove("empty")
      for (const p of room.players) {
        const row = el("div", { class: `player-row ${p.connected ? "" : "off"}` }, [
          el("span", { class: "player-name" }, [p.name]),
          el("span", { class: "player-role" }, [p.role ?? "—"])
        ])
        listEl.appendChild(row)
      }
    }

    function renderHeader() {
      if (!room) return
      codeEl.textContent     = room.code
      gameNameEl.textContent = room.game.title[lang]
      gameSelEl.textContent  = room.game.title[lang]
    }

    function renderAll() { renderHeader(); renderSettings(); renderPlayers() }

    const onUpdated = (next: VisibleRoom) => { room = next; renderAll() }
    socket.on("admin:room-updated", onUpdated)

    if (room) renderAll()

    const onSave = async () => {
      if (!room) return
      const s = session.load()
      if (s?.kind !== "admin") return
      const incoming: Record<string, number | boolean> = {}
      for (const def of room.game.settings) {
        const input = document.getElementById(`setting-${def.key}`) as HTMLInputElement
        if (def.type === "number")  incoming[def.key] = Number(input.value)
        if (def.type === "boolean") incoming[def.key] = input.checked
      }
      const r = await emit("admin:update-settings", { code: room.code, adminSecret: s.adminSecret, settings: incoming })
      if (!r.ok) showToast(t("errorGeneric"))
    }

    const onAssign = async () => {
      if (!room) return
      const s = session.load(); if (s?.kind !== "admin") return
      const r = await emit("admin:assign-roles", { code: room.code, adminSecret: s.adminSecret })
      if (!r.ok) {
        if (r.error === "NEED_MORE_PLAYERS")        showToast(t("errorNeedMorePlayers"))
        else if (r.error === "TOO_MANY_SPECIAL_ROLES") showToast(t("errorTooManySpecial"))
        else                                        showToast(t("errorGeneric"))
      }
    }

    const onClear = async () => {
      if (!room) return
      const s = session.load(); if (s?.kind !== "admin") return
      const r = await emit("admin:clear-roles", { code: room.code, adminSecret: s.adminSecret })
      if (!r.ok) showToast(t("errorGeneric"))
    }

    const onCopy = async () => {
      if (!room) return
      try { await navigator.clipboard.writeText(room.code); showToast(t("copied")) }
      catch { /* clipboard may be blocked */ }
    }

    const saveBtn   = $<HTMLButtonElement>("#saveSettingsBtn")
    const assignBtn = $<HTMLButtonElement>("#assignRolesBtn")
    const clearBtn  = $<HTMLButtonElement>("#clearRolesBtn")
    const copyBtn   = $<HTMLButtonElement>("#copyCodeBtn")
    saveBtn.addEventListener("click", onSave)
    assignBtn.addEventListener("click", onAssign)
    clearBtn.addEventListener("click", onClear)
    copyBtn.addEventListener("click", onCopy)

    return () => {
      socket.off("admin:room-updated", onUpdated)
      saveBtn.removeEventListener("click", onSave)
      assignBtn.removeEventListener("click", onAssign)
      clearBtn.removeEventListener("click", onClear)
      copyBtn.removeEventListener("click", onCopy)
    }
  }
}
```

**Checkpoint:** admin view ready.

---

### Task 5.14 — Main bootstrap (auto-reconnect, language switch, player room-status subscription)

**Files:**
- Create: `src/client/main.ts`

- [ ] **Step 1: Write the file**

```ts
import { setLang, getLang, applyAll } from "./services/i18n.js"
import { socket, emit } from "./services/socket.js"
import * as session from "./services/session.js"
import { register, setView } from "./router.js"
import { homeView, loadCatalog } from "./views/home.js"
import { gameInfoView } from "./views/gameInfo.js"
import { joinView } from "./views/join.js"
import { playerRoomView } from "./views/playerRoom.js"
import { adminView } from "./views/admin.js"
import type { LangCode, VisibleRoom } from "@shared/types.js"
import type { AdminRoomData, PlayerJoinData } from "@shared/events.js"

async function bootstrap() {
  await loadCatalog()
  applyAll()

  register(homeView)
  register(gameInfoView)
  register(joinView)
  register(playerRoomView)
  register(adminView)

  document.querySelectorAll<HTMLButtonElement>(".lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang as LangCode
      setLang(lang)
      // Rerender the current view by re-mounting it — simplest reliable path
      const active = document.querySelector<HTMLElement>("section.view.active-view")
      if (active) { const id = active.id as Parameters<typeof setView>[0]; setView("homeView"); setView(id) }
    })
  })

  // Listen for room:status updates so the player view (or admin if a player) can react globally
  socket.on("room:status", (room: VisibleRoom) => {
    // Player room view subscribes to role-assigned/cleared itself; this hook is a fallback no-op for now.
    // Future expansion: keep cached room state for connection-state indicators.
    void room
  })

  const existing = session.load()
  if (existing?.kind === "admin") {
    const r = await emit("admin:reconnect", { code: existing.code, adminSecret: existing.adminSecret })
    if (r.ok) {
      const data = r.data as AdminRoomData
      setView("adminView", { initial: data.room })
      return
    }
    session.clear()
  }
  if (existing?.kind === "player") {
    const r = await emit("player:join", { code: existing.code, name: existing.name, playerId: existing.playerId })
    if (r.ok) {
      const data = r.data as PlayerJoinData
      setView("playerRoomView", { initial: data })
      return
    }
    session.clear()
  }

  setView("homeView")
}

void bootstrap()
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** main bootstrap ready.

---

### Task 5.15 — Delete legacy frontend; full smoke test

**Files:**
- Delete: `public/app.js`
- Delete: `public/games.js`

- [ ] **Step 1: Delete files**

Delete `public/app.js` and `public/games.js`. The only thing left in `public/` is `styles.css`.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: TS compiles, Vite emits `dist/client/index.html` + assets.

- [ ] **Step 3: Start production-style locally**

Run (PowerShell):
```powershell
$env:NODE_ENV="production"; $env:DB_PATH="./data/rooms.db"; npm start
```

- [ ] **Step 4: Smoke test in browser**

Open http://localhost:3000 in two browser windows (one for admin, one for a player).
- Admin: pick a game, "Create Room", confirm code shown.
- Player: enter the code + a name, "Enter Room", confirm "Role is not assigned yet".
- Admin: "Assign Roles", confirm player sees their role; player sees only their own role.
- Reload the player tab — they re-bind to the same slot, role still shown.
- Switch languages with the top-right buttons; verify RTL for `ku`/`ar` and that strings switch.

Stop the server with Ctrl+C.

**Checkpoint:** Phase 5 complete. Legacy frontend gone, Vite-bundled TS frontend running, role privacy and reconnect verified manually.

---

# Phase 6 — E2E + CI

---

### Task 6.1 — Playwright install

- [ ] **Step 1: Install browsers**

Run: `npx playwright install chromium`
Expected: chromium binary downloaded.

**Checkpoint:** Playwright runnable.

---

### Task 6.2 — Happy-path E2E with wire-level projection assertions

**Files:**
- Create: `tests/e2e/happy-path.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect, type Page } from "@playwright/test"

interface CapturedFrame { dir: "in" | "out"; payload: string }

function attachFrameCapture(page: Page): CapturedFrame[] {
  const frames: CapturedFrame[] = []
  page.on("websocket", ws => {
    ws.on("framereceived", f => frames.push({ dir: "in",  payload: typeof f.payload === "string" ? f.payload : f.payload.toString() }))
    ws.on("framesent",     f => frames.push({ dir: "out", payload: typeof f.payload === "string" ? f.payload : f.payload.toString() }))
  })
  return frames
}

async function joinAs(page: Page, code: string, name: string): Promise<void> {
  await page.goto("/")
  await page.click("#showJoinBtn")
  await page.fill("#joinCodeInput", code)
  await page.fill("#playerNameInput", name)
  await page.click("#joinBtn")
  await expect(page.locator("#playerWelcome")).toHaveText(name)
}

test("happy path: 4 players, role visibility, wire-level privacy", async ({ browser }) => {
  const adminCtx = await browser.newContext()
  const adminPage = await adminCtx.newPage()
  const adminFrames = attachFrameCapture(adminPage)

  await adminPage.goto("/")
  await adminPage.locator(".game-card").first().click()
  await adminPage.click("#createSelectedRoomBtn")
  await expect(adminPage.locator("#roomCodeText")).not.toHaveText("-----")
  const code = await adminPage.locator("#roomCodeText").innerText()

  const players: Array<{ ctx: Awaited<ReturnType<typeof browser.newContext>>; page: Page; frames: CapturedFrame[]; name: string }> = []
  for (const name of ["Ada","Bea","Cem","Dan"]) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    const frames = attachFrameCapture(page)
    await joinAs(page, code, name)
    players.push({ ctx, page, frames, name })
  }

  await adminPage.click("#assignRolesBtn")
  await expect(adminPage.locator("#rolesStatus")).toHaveText("✓")

  // Each player sees exactly one role on their own card
  for (const p of players) {
    await expect(p.page.locator("#playerRoleCard h3")).toBeVisible()
  }

  // Wire-level: no inbound frame on a player's socket should contain another player's name AND a non-null role together
  for (const p of players) {
    const others = players.filter(o => o !== p).map(o => o.name)
    for (const frame of p.frames.filter(f => f.dir === "in")) {
      const payload = frame.payload
      if (!payload.includes("role")) continue
      for (const other of others) {
        if (payload.includes(`"name":"${other}"`)) {
          // Must not contain a non-null role next to this name
          const match = payload.match(new RegExp(`"name":"${other}"[^}]*"role":"([^"]*)"`))
          if (match) expect(match[1]).toBe("null")
        }
      }
    }
  }

  for (const p of players) await p.ctx.close()
  await adminCtx.close()
})
```

- [ ] **Step 2: Run**

Run: `npm run test:e2e -- happy-path`
Expected: 1 passed.

**Checkpoint:** happy path green.

---

### Task 6.3 — Reconnect E2E (multi-client)

**Files:**
- Create: `tests/e2e/reconnect.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect, type Page } from "@playwright/test"

async function joinAs(page: Page, code: string, name: string): Promise<void> {
  await page.goto("/")
  await page.click("#showJoinBtn")
  await page.fill("#joinCodeInput", code)
  await page.fill("#playerNameInput", name)
  await page.click("#joinBtn")
  await expect(page.locator("#playerWelcome")).toHaveText(name)
}

test("reconnect: A reloads while B stays — A re-binds, B unaffected, no privacy leak", async ({ browser }) => {
  const adminCtx = await browser.newContext()
  const admin = await adminCtx.newPage()
  await admin.goto("/")
  await admin.locator(".game-card").first().click()
  await admin.click("#createSelectedRoomBtn")
  const code = await admin.locator("#roomCodeText").innerText()

  const ctxA = await browser.newContext(); const pageA = await ctxA.newPage(); await joinAs(pageA, code, "Ada")
  const ctxB = await browser.newContext(); const pageB = await ctxB.newPage(); await joinAs(pageB, code, "Bea")

  // Need a third player so the role pool can include one vampire + 2 villagers (Vampire Village minPlayers=3)
  const ctxC = await browser.newContext(); const pageC = await ctxC.newPage(); await joinAs(pageC, code, "Cem")

  await admin.click("#assignRolesBtn")
  await expect(admin.locator("#rolesStatus")).toHaveText("✓")

  const roleABefore = await pageA.locator("#playerRoleCard h3").innerText()

  // Reload A; the same playerId should re-bind
  await pageA.reload()
  await expect(pageA.locator("#playerWelcome")).toHaveText("Ada")
  await expect(pageA.locator("#playerRoleCard h3")).toHaveText(roleABefore)

  // B's view never showed A's role text at any time
  await expect(pageB.locator("body")).not.toContainText(roleABefore)

  // Admin reload — still authoritative
  await admin.reload()
  await expect(admin.locator("#roomCodeText")).toHaveText(code)

  await ctxA.close(); await ctxB.close(); await ctxC.close(); await adminCtx.close()
})
```

- [ ] **Step 2: Run**

Run: `npm run test:e2e -- reconnect`
Expected: 1 passed.

**Checkpoint:** reconnect green.

---

### Task 6.4 — CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the file**

```yaml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test -- --coverage
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

- [ ] **Step 2: Local dry-run of CI steps**

Run sequentially:
```bash
npm run typecheck && npm run lint && npm test -- --coverage && npm run test:e2e
```
Expected: all four succeed.

**Checkpoint:** Phase 6 complete — CI workflow ready (will execute on push when this hits a remote).

---

# Phase 7 — Hardening + docs

---

### Task 7.1 — Update README for the new build/deploy flow

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read existing README**

Open `README.md` and note the legacy sections (Run / Phone testing / Online deployment / How to add a new game / Files).

- [ ] **Step 2: Rewrite to reflect the new architecture**

Replace the body with sections covering:

1. **Run (dev)** — `npm install`, then `npm run dev` (server + Vite together).
2. **Run (prod)** — `npm run build && npm start`. Env vars: `DB_PATH` (required in prod), `PORT`, `ALLOWED_ORIGIN`, `ROOM_TTL_HOURS`, `LOG_LEVEL`, `MAX_*`.
3. **Online deployment** — VPS/Fly/persistent-disk hosts run as-is. Render/Railway free tier note: ephemeral disk → mount a persistent volume to the `DB_PATH` directory or accept restart wipes. WebSocket-capable host required (same as before).
4. **How to add a new game** — edit `src/server/games/catalog.ts`; the typed `Game` interface will guide every field; restart the dev server to pick it up.
5. **Files** — point at the new TS layout (server/, client/, shared/, store/, tests/).
6. **Testing** — `npm test`, `npm run test:e2e`.

Keep the tone of the existing README — short, direct sentences.

- [ ] **Step 3: Smoke verify the doc**

Run `npm run dev` after a clean clone simulation (delete `node_modules`, `npm install`, `npm run dev`). Confirm the README's commands actually work.

**Checkpoint:** README aligned with new architecture.

---

### Task 7.2 — `.gitignore` adjustments

**Files:**
- Modify: `.gitignore` (create if missing)

- [ ] **Step 1: Ensure these patterns are ignored**

Append (and dedupe) the following to `.gitignore`:

```
node_modules/
dist/
data/
coverage/
.env
.env.local
playwright-report/
test-results/
```

**Checkpoint:** generated artefacts ignored.

---

### Task 7.3 — Final acceptance pass

- [ ] **Step 1: Full pipeline run**

Run sequentially:
```bash
npm run typecheck
npm run lint
npm test -- --coverage
npm run build
npm run test:e2e
```
Expected: all green.

- [ ] **Step 2: Manual scenario from the spec's success criteria**

Start the production server (`$env:NODE_ENV="production"; $env:DB_PATH="./data/rooms.db"; npm start`) and confirm:

1. Server restart preserves rooms when `DB_PATH` is set.
2. Page refresh preserves player role.
3. `NODE_ENV=production` without `DB_PATH` fails at startup with a clear Zod error (delete `$env:DB_PATH` and re-run).
4. Admin sees all roles; players see only their own (DOM + Playwright's frame check already confirmed wire-level).
5. Languages switch including RTL for `ku`/`ar`.
6. Resource limits work: try a 26th `player:join` to a 25-slot room — receive `ROOM_FULL`.
7. `/healthz` returns 200.

- [ ] **Step 3: Mark plan complete**

All success criteria from the spec are satisfied.

**Checkpoint:** Phase 7 done. Plan complete.

---

# Self-Review

**Spec coverage check** (mapping each spec requirement to a task):

| Spec section | Implementing task(s) |
|---|---|
| Folder layout | All Phase 0–5 file-creation tasks |
| Module boundaries (domain / store / sockets) | 2.x, 3.x, 4.x |
| Shared types as single source of truth | 1.1, 1.2 |
| Per-viewer projection (`projectRoomFor`) | 2.8, 2.9, 4.7 (used in `broadcastRoom`), 4.8 (player join emissions), 6.2 (wire-level test) |
| Store interface + Memory + SQLite | 3.1, 3.2, 3.4, 3.5 |
| Source of truth = store | enforced by Phase 4 handler implementations (no in-memory cache) |
| SQLite schema | 3.4 |
| Per-room mutation serialization | 3.2 (Map chain), 3.4 (immediate tx), 3.3 contract test "concurrent updates serialize" |
| Socket events + Zod + ack shape | 1.2, 4.4, 4.6, 4.7, 4.8 |
| Reconnect (3 playerId cases) | 4.8 player handler, 5.14 main bootstrap, 6.3 reconnect test |
| Token security (`crypto.randomBytes`) | 2.3, 2.7 (in admin handler via `makeSecret`) |
| DOM rendering rule | 0.5 ESLint config + 5.6 dom helpers |
| Threat model | implicit — design follows it (anonymous tokens, no innerHTML, length caps) |
| Resource limits | 4.3 config, 4.7 admin handler (`MAX_TOTAL_ROOMS`, `MAX_ROOMS_PER_SOCKET`), 4.8 (`MAX_PLAYERS_PER_ROOM`) |
| Rate limit | 4.5, 4.6 (binder) |
| Helmet | 4.10 (server bootstrap) |
| CORS via `ALLOWED_ORIGIN` | 4.10 |
| Build pipeline (Vite + tsc) | 0.3, 0.4, 5.1, 5.15 |
| Vitest unit tests | 2.2–2.9, 3.3, 3.5 |
| Playwright E2E (multi-client + frame check) | 6.2, 6.3 |
| CI | 6.4 |
| Logger + redaction | 4.2 |
| `/healthz` | 4.10 |
| Config Zod + production guard | 4.3 |
| README + `.env.example` | 0.5, 7.1 |
| Backward compatibility (event names, code format) | preserved in 1.2, 2.3 (alphabet), 4.7/4.8 |
| Success criteria | 7.3 |

**Placeholder scan:** the only "TODO" allowed is the `// TODO i18n` marker in Task 5.3 — explicitly justified as a temporary fill for keys with no source data, paired with a typecheck gate that surfaces missing keys. No "implement later" / "similar to Task N" patterns elsewhere.

**Type consistency check:**
- `Game`, `Role`, `Settings`, `Player`, `Room`, `Viewer`, `VisibleRoom`, `VisiblePlayer`, `SelfPlayer`, `ErrorCode` defined once in `src/shared/types.ts`; all later tasks import from there.
- `ClientToServerEvents`, `ServerToClientEvents`, `Ack`, `AckResult` in `src/shared/events.ts`; consumed by socket wrapper and binder.
- `RoomStore` interface in `src/server/store/store.ts`; both implementations and contract test reference the same type.
- `projectRoomFor` signature matches between domain definition and every call site.
- `makeRoomCode(exists)` consistently takes a sync predicate; the admin handler comments around its constraint show the engineer the workaround.
- Function names that appear in multiple tasks (`broadcastRoom`, `bind`, `emit`, `setView`, `register`, `applyAll`, `setLang`) match across definitions and call sites.

---

**Plan complete and saved to** `docs/superpowers/plans/2026-06-10-infrastructure-and-code-quality.md`. **Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints for review.

**Which approach?**
