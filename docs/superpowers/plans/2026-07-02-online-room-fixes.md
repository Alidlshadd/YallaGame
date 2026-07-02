# Online Room Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Roles always land on connected players, late joiners auto-receive the filler role, the per-room player cap is removed, and the admin can kick players.

**Architecture:** Pure role logic lives in `src/server/domain/roles.ts` (unit-tested); socket handlers in `src/server/sockets/` call it. Kick is a new `admin:kick-player` → `player:kicked` event pair over the existing typed socket.io contract. Client changes are confined to `admin.ts` (kick button), `playerRoom.ts` (kicked handler), i18n files, and `_base.css`.

**Tech Stack:** TypeScript, socket.io 4, zod, Vitest, Playwright.

Spec: `docs/superpowers/specs/2026-07-02-online-room-fixes-design.md`

---

### Task 1: Domain — connected-only assignment + filler helper

**Files:**
- Modify: `src/server/domain/roles.ts`
- Create: `tests/unit/domain/roles.test.ts`
- Modify (caller updated in Task 2): `src/server/sockets/admin-handlers.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/domain/roles.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { buildRolePool, assignRolesToConnected, fillerRoleId } from "@server/domain/roles.js"
import type { Game, Player } from "@shared/types.js"

const L = (s: string) => ({ ku: s, ar: s, en: s, tr: s })

const game: Game = {
  id: "spy-test", icon: "S", theme: "spy-game", minPlayers: 3,
  defaultSettings: { spyCount: 1 },
  title: L("Spy"), subtitle: L("Spy"), rules: { ku: [], ar: [], en: [], tr: [] },
  roles: [
    { id: "spy", icon: "S", countSetting: "spyCount", name: L("Spy"), desc: L("Spy") },
    { id: "normal", icon: "N", filler: true, name: L("Normal"), desc: L("Normal") }
  ],
  settings: [{ type: "number", key: "spyCount", min: 1, max: 4, label: L("Spies") }]
}

const player = (id: string, connected: boolean): Player =>
  ({ id, name: id, role: null, connected })

describe("fillerRoleId", () => {
  it("returns the filler role id", () => {
    expect(fillerRoleId(game)).toBe("normal")
  })

  it("throws NO_FILLER_ROLE when the game has no filler", () => {
    const broken = { ...game, roles: game.roles.filter(r => !r.filler) }
    expect(() => fillerRoleId(broken)).toThrow("NO_FILLER_ROLE")
  })
})

describe("assignRolesToConnected", () => {
  const rng = () => 0.42

  it("gives every pool role to a connected player and null to disconnected ones", () => {
    const players = [player("a", true), player("b", false), player("c", true), player("d", true)]
    const pool = buildRolePool(game, { spyCount: 1 }, 3)
    const out = assignRolesToConnected(players, pool, rng)

    expect(out.find(p => p.id === "b")!.role).toBeNull()
    const connectedRoles = out.filter(p => p.connected).map(p => p.role)
    expect(connectedRoles).toHaveLength(3)
    expect(connectedRoles.filter(r => r === "spy")).toHaveLength(1)
    expect(connectedRoles.filter(r => r === "normal")).toHaveLength(2)
  })

  it("never places a special role on a disconnected player (many seeds)", () => {
    const players = [player("a", true), player("ghost", false), player("c", true), player("ghost2", false)]
    for (let seed = 0; seed < 50; seed++) {
      let s = seed
      const seededRng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
      const pool = buildRolePool(game, { spyCount: 1 }, 2)
      const out = assignRolesToConnected(players, pool, seededRng)
      for (const p of out) {
        if (!p.connected) expect(p.role).toBeNull()
      }
      expect(out.filter(p => p.role === "spy")).toHaveLength(1)
    }
  })

  it("throws POOL_LENGTH_MISMATCH when pool size differs from connected count", () => {
    const players = [player("a", true), player("b", false)]
    expect(() => assignRolesToConnected(players, ["spy", "normal"], rng)).toThrow("POOL_LENGTH_MISMATCH")
  })

  it("preserves player order and identity fields", () => {
    const players = [player("a", true), player("b", true), player("c", true)]
    const out = assignRolesToConnected(players, ["spy", "normal", "normal"], rng)
    expect(out.map(p => p.id)).toEqual(["a", "b", "c"])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/domain/roles.test.ts`
Expected: FAIL — `assignRolesToConnected` / `fillerRoleId` are not exported.

- [ ] **Step 3: Implement in `src/server/domain/roles.ts`**

Replace the whole file with:

```ts
import type { Game, Player, RoleId, Settings } from "@shared/types.js"

export function fillerRoleId(game: Game): RoleId {
  const filler = game.roles.find(r => r.filler)
  if (!filler) throw new Error("NO_FILLER_ROLE")
  return filler.id
}

export function buildRolePool(game: Game, settings: Settings, playerCount: number): RoleId[] {
  const fillerId = fillerRoleId(game)

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
  while (pool.length < playerCount) pool.push(fillerId)
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

/** Distributes the pool over connected players only; disconnected players end with role: null. */
export function assignRolesToConnected(
  players: readonly Player[],
  pool: readonly RoleId[],
  rng: () => number
): Player[] {
  const connectedCount = players.filter(p => p.connected).length
  if (pool.length !== connectedCount) throw new Error("POOL_LENGTH_MISMATCH")
  const shuffled = shuffle(pool, rng)
  let next = 0
  return players.map(p =>
    p.connected ? { ...p, role: shuffled[next++]! } : { ...p, role: null }
  )
}
```

Note: `assignRolesToPlayers` is deleted; its only caller is updated in Task 2. Typecheck stays broken until Task 2 — commit happens there.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/domain/roles.test.ts`
Expected: PASS (all 6).

### Task 2: Server — assign roles to connected players only

**Files:**
- Modify: `src/server/sockets/admin-handlers.ts:110-129`

- [ ] **Step 1: Update the assign-roles handler**

In `admin-handlers.ts`, change the import (line 9) and the `admin:assign-roles` handler:

```ts
import { buildRolePool, assignRolesToConnected } from "../domain/roles.js"
```

```ts
  bind(socket, "admin:assign-roles", AssignRolesPayload, async ({ code, adminSecret }) => {
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      const game = deps.resolveGame(room.gameId)
      if (!game) throw new Error("UNKNOWN_GAME")
      const connectedCount = room.players.filter(p => p.connected).length
      if (connectedCount < game.minPlayers) throw new Error("NEED_MORE_PLAYERS")
      const pool = buildRolePool(game, room.settings, connectedCount)
      const players = assignRolesToConnected(room.players, pool, deps.rng)
      return { ...room, players, assigned: true }
    })
    const game = deps.resolveGame(updated.gameId)!
    await broadcastRoom(deps, updated)
    for (const p of updated.players) {
      if (!p.role) continue
      const role = game.roles.find(r => r.id === p.role)!
      deps.io.to(`p:${code}:${p.id}`).emit("player:role-assigned", {
        role: p.role, roleData: role, name: p.name, code, game
      })
    }
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })
```

(The `if (!p.role) continue` guard is required: disconnected players now have `role: null` after assignment.)

- [ ] **Step 2: Verify**

Run: `npm test && npm run typecheck`
Expected: all unit tests PASS, typecheck clean.

- [ ] **Step 3: Commit**

```bash
git add src/server/domain/roles.ts src/server/sockets/admin-handlers.ts tests/unit/domain/roles.test.ts
git commit -m "fix: assign roles to connected players only"
```

### Task 3: Join — remove player cap, auto-assign filler in assigned rooms

**Files:**
- Modify: `src/server/sockets/player-handlers.ts:22-52`

- [ ] **Step 1: Update the join handler**

In `player-handlers.ts`, add the import:

```ts
import { fillerRoleId } from "../domain/roles.js"
```

Replace the body of the `store.update` callback inside `player:join` (lines 26-50) with:

```ts
    const updated = await deps.store.update(code, room => {
      const game = deps.resolveGame(room.gameId)
      if (!game) throw new Error("UNKNOWN_GAME")

      // Late joiners / role-less rebinds get the filler role once roles are out.
      const roleFor = (current: string | null) =>
        current ?? (room.assigned ? fillerRoleId(game) : null)

      if (playerId) {
        const existing = room.players.find(p => p.id === playerId)
        if (existing) {
          bound = { ...existing, connected: true, role: roleFor(existing.role) }
          return { ...room, players: room.players.map(p => p.id === playerId ? bound! : p) }
        }
      }

      const collision = room.players.find(p => p.name.toLowerCase() === name.toLowerCase())
      if (collision && collision.connected) throw new Error("NAME_TAKEN")
      if (collision && !collision.connected) {
        bound = { ...collision, connected: true, role: roleFor(collision.role) }
        return { ...room, players: room.players.map(p => p.id === collision.id ? bound! : p) }
      }

      const fresh: Player = { id: makeSecret(), name, role: roleFor(null), connected: true }
      bound = fresh
      return { ...room, players: [...room.players, fresh] }
    })
```

This also deletes the `MAX_PLAYERS_PER_ROOM` / `ROOM_FULL` check. The existing block below (`if (updated.assigned && me.role)`) already emits the role reveal to the joiner — no change needed there. Leave `config` in `PlayerDeps` untouched.

- [ ] **Step 2: Verify**

Run: `npm test && npm run typecheck`
Expected: PASS / clean.

- [ ] **Step 3: Commit**

```bash
git add src/server/sockets/player-handlers.ts
git commit -m "fix: remove room player cap and auto-assign filler role to late joiners"
```

### Task 4: Cleanup — drop ROOM_FULL and MAX_PLAYERS_PER_ROOM everywhere

**Files:**
- Modify: `src/shared/types.ts:101`, `src/server/sockets/bind.ts:13`, `src/server/config.ts:10`, `src/client/views/join.ts:16`, `src/client/i18n/en.ts:119`, `src/client/i18n/tr.ts:121`, `src/client/i18n/ar.ts:121`, `src/client/i18n/ku.ts:121`, `.env.example`, `README.md`

- [ ] **Step 1: Remove the dead code**

- `src/shared/types.ts`: delete the `| "ROOM_FULL"` line from `ErrorCode`.
- `src/server/sockets/bind.ts`: remove `"ROOM_FULL",` from the `ERROR_CODES` set.
- `src/server/config.ts`: delete the `MAX_PLAYERS_PER_ROOM` line from the schema.
- `src/client/views/join.ts`: delete the `ROOM_FULL: "errorRoomFull",` map entry.
- All four i18n files: delete the `errorRoomFull: ...` line.
- `.env.example`: delete the `MAX_PLAYERS_PER_ROOM` line if present.
- `README.md`: delete the `MAX_PLAYERS_PER_ROOM` row from the env-var table.

- [ ] **Step 2: Verify**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS / clean. (Typecheck proves no stale `errorRoomFull` / `ROOM_FULL` references remain.)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove ROOM_FULL error and MAX_PLAYERS_PER_ROOM config"
```

### Task 5: Kick — shared contract and server handler

**Files:**
- Modify: `src/shared/events.ts`, `src/server/sockets/schemas.ts`, `src/server/sockets/rate-limit.ts`, `src/server/sockets/admin-handlers.ts`

- [ ] **Step 1: Extend the shared contract**

`src/shared/events.ts` — add to `ClientToServerEvents`:

```ts
  "admin:kick-player":     (p: { code: string; adminSecret: string; playerId: string },              cb: Ack<AdminRoomData>)  => void
```

and to `ServerToClientEvents`:

```ts
  "player:kicked":        () => void
```

- [ ] **Step 2: Add the zod schema and cooldown**

`src/server/sockets/schemas.ts`:

```ts
export const KickPlayerPayload = z.object({
  code: RoomCode,
  adminSecret: z.string().min(1).max(64),
  playerId: z.string().min(1).max(64)
})
```

`src/server/sockets/rate-limit.ts` — add to `COOLDOWNS_MS`:

```ts
  "admin:kick-player":     200,
```

- [ ] **Step 3: Add the handler**

`src/server/sockets/admin-handlers.ts` — import `KickPlayerPayload` alongside the other schemas, and add inside `registerAdminHandlers`:

```ts
  bind(socket, "admin:kick-player", KickPlayerPayload, async ({ code, adminSecret, playerId }) => {
    const updated = await deps.store.update(code, room => {
      if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
      if (!room.players.some(p => p.id === playerId)) throw new Error("INVALID_INPUT")
      return { ...room, players: room.players.filter(p => p.id !== playerId) }
    })
    deps.io.to(`p:${code}:${playerId}`).emit("player:kicked")
    deps.io.in(`p:${code}:${playerId}`).socketsLeave([`room:${code}`, `p:${code}:${playerId}`])
    await broadcastRoom(deps, updated)
    logger.info({ code, playerId }, "player kicked")
    return { room: projectRoomFor(updated, { kind: "admin", adminSecret }, deps.resolveGame) }
  })
```

- [ ] **Step 4: Verify**

Run: `npm test && npm run typecheck`
Expected: PASS / clean.

- [ ] **Step 5: Commit**

```bash
git add src/shared/events.ts src/server/sockets/schemas.ts src/server/sockets/rate-limit.ts src/server/sockets/admin-handlers.ts
git commit -m "feat: admin can kick players from a room"
```

### Task 6: Kick — client UI and i18n

**Files:**
- Modify: `src/client/i18n/en.ts`, `src/client/i18n/tr.ts`, `src/client/i18n/ar.ts`, `src/client/i18n/ku.ts`
- Modify: `src/client/views/admin.ts:54-73` (renderPlayers)
- Modify: `src/client/views/playerRoom.ts`
- Modify: `src/client/themes/_base.css`

- [ ] **Step 1: Add i18n keys**

Insert after the `noPlayers` line in each file:

- `en.ts`: `kick: "Kick",` and `kickedFromRoom: "You were removed from the room.",`
- `tr.ts`: `kick: "At",` and `kickedFromRoom: "Odadan çıkarıldın.",`
- `ar.ts`: `kick: "طرد",` and `kickedFromRoom: "تم إخراجك من الغرفة.",`
- `ku.ts`: `kick: "دەرکردن",` and `kickedFromRoom: "لە ژوورەکە دەرکرایت.",`

(`en.ts` drives the `Translations` type, so forgetting a language fails typecheck.)

- [ ] **Step 2: Kick button in admin player list**

In `admin.ts` `renderPlayers()`, replace the player-row loop with:

```ts
      for (const p of room.players) {
        const kickBtn = el("button", {
          class: "kick-btn", type: "button", title: t("kick"), "aria-label": `${t("kick")} ${p.name}`
        }, ["✕"])
        kickBtn.addEventListener("click", async () => {
          if (!room) return
          const s = session.load(); if (s?.kind !== "admin") return
          void play("click")
          const r = await emit("admin:kick-player", { code: room.code, adminSecret: s.adminSecret, playerId: p.id })
          if (!r.ok) showToast(t("errorGeneric"))
        })
        const row = el("div", { class: `player-row ${p.connected ? "" : "off"}` }, [
          el("span", { class: "player-name" }, [p.name]),
          el("span", { class: "player-role" }, [p.role ?? "—"]),
          kickBtn
        ])
        listEl.appendChild(row)
      }
```

(Rows are rebuilt on every `admin:room-updated`, so no listener cleanup is needed.)

- [ ] **Step 3: Kicked handler in player room**

In `playerRoom.ts`, add `showToast` to the imports:

```ts
import { showToast } from "../ui/toast.js"
```

Add next to `onCleared`:

```ts
    const onKicked = () => {
      session.clear()
      clearTheme()
      showToast(t("kickedFromRoom"))
      void setView("homeView")
    }
```

Register/unregister with the other socket listeners:

```ts
    socket.on("player:kicked", onKicked)
```

and in the returned cleanup function:

```ts
      socket.off("player:kicked", onKicked)
```

- [ ] **Step 4: Style the kick button**

In `src/client/themes/_base.css`, next to the existing `.player-row` rules, add:

```css
.player-row .kick-btn {
  margin-inline-start: auto;
  border: 1px solid color-mix(in srgb, var(--color-danger, #b33) 55%, transparent);
  background: transparent;
  color: var(--color-danger, #b33);
  border-radius: 6px;
  width: 26px;
  height: 26px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease;
}
.player-row .kick-btn:hover {
  background: color-mix(in srgb, var(--color-danger, #b33) 18%, transparent);
}
```

(Adjust to the actual `.player-row` layout — if `player-role` already uses `margin-inline-start: auto`, put the button after it without `auto` margin.)

- [ ] **Step 5: Verify**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS / clean.

- [ ] **Step 6: Commit**

```bash
git add src/client
git commit -m "feat: kick button in admin room and kicked-player handling"
```

### Task 7: Full verification

- [ ] **Step 1: Run the full local gate**

Run: `npm test && npm run typecheck && npm run lint && npm run test:e2e`
Expected: everything green (e2e builds and boots the prod server itself).

- [ ] **Step 2: Manual browser verification (dev server)**

With `npm run dev` running, verify in the browser:
1. Create a Vampire Village room; join 3 players in separate tabs/contexts.
2. Close one player tab (ghost), assign roles → vampire must be among the two connected players + admin list shows ghost with "—".
3. Join a 4th player after assignment → they instantly receive the Villager reveal; nobody else's role changes.
4. Kick a player → their screen returns home with the kicked toast; admin list shrinks; kicked player can rejoin.
5. Join more than 25 players is no longer capped (spot-check is fine — the check is deleted).

- [ ] **Step 3: Commit any fixups**

```bash
git add -A
git commit -m "test: verify online room fixes end-to-end"
```
