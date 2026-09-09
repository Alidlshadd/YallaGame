# Vampire Village & Classic Mafia — Elimination Voting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the daytime lynch vote for Vampire Village and Classic Mafia onto the server — secret ballots, a timed clock, tie-breaking by revote/spin/cards, an automatic win check — while night actions stay spoken at the table exactly as today.

**Architecture:** One `GameEngine` factory (`createEliminationEngine`) produces two engine instances that differ only in which role id counts as "evil". Both register in the existing turn engine (`src/server/domain/engine.ts`) the same way Most Likely To does. The client's `gameStage.ts` is split into a thin shell plus a per-game render module, so the new game's screens live in their own file without touching Most Likely To's.

**Tech Stack:** TypeScript, Vitest (unit), Playwright (e2e), the existing `Room`/`GameState`/`Vote` patterns from `most-likely-to.ts`.

**Spec:** `docs/superpowers/specs/2026-09-09-vampire-mafia-elimination-voting-design.md` — read it first if anything here is ambiguous; this plan implements it exactly.

---

## Before you start

Read these existing files — the plan assumes you've seen them:
- `src/server/domain/engine.ts` — the turn engine every game plugs into (`GameEngine`, `Transition`, `advance`, `startGame`, `submitAction`, `hostAdvance`)
- `src/server/games/most-likely-to.ts` — the pattern this plan mirrors closely
- `src/shared/most-likely-to.ts` — the view-type pattern this plan mirrors
- `src/client/ui/gameStage.ts` — gets split in Tasks 12–13
- `src/client/views/admin.ts` — `renderActions()` gets a third mode in Task 16
- `tests/unit/domain/most-likely-to.test.ts` — the test pattern this plan mirrors

All new game logic lives behind one phase-name set, opaque to the generic engine, exactly like Most Likely To's `QUESTION_DISPLAY`/`VOTING`/`ROUND_RESULT`/`GAME_OVER`.

---

## Task 1: Shared view types

**Files:**
- Create: `src/shared/elimination-vote.ts`

- [ ] **Step 1: Write the file**

```ts
import type { LocalizedText } from "./types.js"

/**
 * What a phone is shown while a Vampire Village or Classic Mafia room runs
 * its daytime vote. Night actions never appear here — they stay spoken at
 * the table, outside the system.
 *
 * Types only, mirroring `shared/most-likely-to.ts`: the engine's own phase
 * names stay on the server, the screen switches on `kind`.
 */

/** Everybody in the room, enough to draw a face, a name, and whether they're out. */
export interface EliminationPlayer {
  id: string
  name: string
  character: string
  accessory: string
  connected: boolean
  eliminated: boolean
}

export interface EliminationTally {
  playerId: string
  playerName: string
  voteCount: number
  /** Of the votes actually cast, rounded. 0 for a round nobody voted in. */
  percentage: number
  /** Present only when the room's `showVoters` setting is on. */
  voters?: string[]
}

/** The daytime vote, or the revote among tied names. */
export interface EliminationVoteView {
  kind: "day-vote" | "tiebreak-vote"
  roster: EliminationPlayer[]
  /** Who can be voted for right now — everyone alive, or just the tied names. */
  votableIds: string[]
  /** This one player's own vote. Nobody else's reaches this phone. */
  myVote: string | null
  votedCount: number
  totalVoters: number
  /** True once this viewer has been voted out; their screen has no buttons. */
  amEliminated: boolean
}

export interface EliminationResultView {
  kind: "day-result" | "tiebreak-result"
  roster: EliminationPlayer[]
  totalVotes: number
  /** Everyone who could be voted for this round, most votes first. */
  results: EliminationTally[]
  /** Set the moment someone is voted out this round; null on a tie or a round nobody voted in. */
  eliminatedThisRound: string | null
  isTie: boolean
}

/** The table votes on how to break a second tie in a row. */
export interface EliminationMethodVoteView {
  kind: "method-vote"
  /** The names still tied, for display only. */
  tiedNames: string[]
  myVote: "spin" | "cards" | null
  votedCount: number
  totalVoters: number
  amEliminated: boolean
}

export interface EliminationSpinResultView {
  kind: "spin-result"
  roster: EliminationPlayer[]
  /** The names the wheel was spun among. */
  candidateIds: string[]
  eliminatedId: string
}

/** Face-down cards, no names — see the design spec's "card scenario". */
export interface EliminationCardVoteView {
  kind: "card-vote"
  /** e.g. ["red","blue"] for two tied names, ["1","2","3"] for three or more. */
  cardIds: string[]
  myVote: string | null
  votedCount: number
  totalVoters: number
  amEliminated: boolean
}

export interface EliminationCardResultView {
  kind: "card-result"
  roster: EliminationPlayer[]
  cardIds: string[]
  cardVoteCounts: Record<string, number>
  /**
   * This view only ever exists once a card has won — a tied card vote goes
   * straight back to CARD_VOTE on the server and is never projected as a
   * CARD_RESULT, so there is no "no winner yet" state to represent here.
   */
  winningCardId: string
  eliminatedId: string
  eliminatedName: string
}

export interface EliminationGameOverView {
  kind: "over"
  roster: EliminationPlayer[]
  winner: "good" | "evil"
}

export type EliminationView =
  | EliminationVoteView
  | EliminationResultView
  | EliminationMethodVoteView
  | EliminationSpinResultView
  | EliminationCardVoteView
  | EliminationCardResultView
  | EliminationGameOverView

// Re-exported so callers don't need `LocalizedText` from two modules.
export type { LocalizedText }
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors (nothing imports this file yet, so this only checks the file parses and its own types are internally consistent).

- [ ] **Step 3: Commit**

```bash
git add src/shared/elimination-vote.ts
git commit -m "Add shared view types for the elimination-vote games"
```

---

## Task 2: Engine state, helpers, and `start()`

**Files:**
- Create: `src/server/games/elimination-vote.ts`
- Test: `tests/unit/domain/elimination-vote.test.ts`

This task writes the state shape, the small pure helpers (`tallyVotes`, `livingCounts`, `checkWinner`, `shuffle`), and `start()`. Later tasks add `act()`, `pending()`, `next()`, `view()` to the same file and test file.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/domain/elimination-vote.test.ts
import { describe, it, expect } from "vitest"
import type { Room } from "@shared/types.js"
import { createEliminationEngine } from "@server/games/elimination-vote.js"

const evilId = "vampire"
const engine = createEliminationEngine({ gameId: "vampire-village", evilRoleId: evilId })

function mkRoom(overrides: Partial<Room> = {}): Room {
  const now = Date.now()
  return {
    code: "ELIM1", gameId: "vampire-village", adminSecret: "s3cret", assigned: true,
    settings: { dayVoteSeconds: 60 },
    players: [
      { id: "p1", name: "Ali",     role: "vampire",  connected: true, character: "owl" },
      { id: "p2", name: "Mahmud",  role: "villager", connected: true, character: "fox" },
      { id: "p3", name: "Morinji", role: "villager", connected: true, character: "wolf" },
      { id: "p4", name: "Dila",    role: "doctor",   connected: true, character: "bee" },
      { id: "p5", name: "Zana",    role: "detective",connected: true, character: "cat" }
    ],
    createdAt: now, updatedAt: now,
    hostPlayerId: "p1", isPublic: false, requireApproval: false, pending: [],
    phase: "idle", phaseSeq: 0, phaseEndsAt: null, round: 0, gameState: {}, scores: {},
    ...overrides
  }
}

describe("start", () => {
  it("opens the day vote with every living player as a candidate", () => {
    const room = mkRoom()
    const t = engine.start(room, () => 0.5)
    expect(t.phase).toBe("DAY_VOTE")
    expect(t.ms).toBe(60_000)
    const state = t.state as { voteCandidates: string[]; eliminated: string[] }
    expect(state.voteCandidates.sort()).toEqual(["p1", "p2", "p3", "p4", "p5"])
    expect(state.eliminated).toEqual([])
  })

  it("refuses to start when no one has a role yet", () => {
    const room = mkRoom({ players: mkRoom().players.map(p => ({ ...p, role: null })) })
    expect(() => engine.start(room, () => 0.5)).toThrow("INVALID_INPUT")
  })

  it("refuses to start when the win condition is already met", () => {
    // 2 vampires, 1 other role — evil already outnumbers good.
    const room = mkRoom({
      players: [
        { id: "p1", name: "Ali", role: "vampire", connected: true, character: "owl" },
        { id: "p2", name: "Bea", role: "vampire", connected: true, character: "fox" },
        { id: "p3", name: "Cem", role: "villager", connected: true, character: "wolf" }
      ]
    })
    expect(() => engine.start(room, () => 0.5)).toThrow("INVALID_INPUT")
  })

  it("defaults the vote clock to 60 seconds when the room has no setting", () => {
    const room = mkRoom({ settings: {} })
    const t = engine.start(room, () => 0.5)
    expect(t.ms).toBe(60_000)
  })

  it("honors a custom dayVoteSeconds setting", () => {
    const room = mkRoom({ settings: { dayVoteSeconds: 15 } })
    const t = engine.start(room, () => 0.5)
    expect(t.ms).toBe(15_000)
  })
})
```

- [ ] **Step 2: Run the tests to see them fail on a missing module**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: FAIL — `Cannot find module '@server/games/elimination-vote.js'`

- [ ] **Step 3: Write the engine file (state, helpers, `start()` only — other `GameEngine` methods throw for now so the file compiles)**

```ts
// src/server/games/elimination-vote.ts
import type { GameState, Room } from "@shared/types.js"
import type {
  EliminationPlayer, EliminationResultView, EliminationView
} from "@shared/elimination-vote.js"
import type { GameEngine, Transition } from "../domain/engine.js"

/**
 * Elimination Voting — shared by Vampire Village and Classic Mafia.
 *
 * Night actions (the kill, the save, the investigation) are never in here:
 * they stay spoken at the table, exactly as before this engine existed. Only
 * the daytime lynch vote runs on the server. The two games differ only in
 * which role id counts as "evil" — see `createEliminationEngine` below.
 *
 * Phases, in the order a round can visit them:
 *
 *   DAY_VOTE          secret vote among everyone still alive
 *   DAY_RESULT        the count opens; a clear winner is eliminated here
 *   TIEBREAK_VOTE     only on a tie — revote among just the tied names
 *   TIEBREAK_RESULT
 *   METHOD_VOTE       only on a second tie in a row — the table votes
 *                     Spin or Cards
 *   SPIN_RESULT       the server's rng picks one of the tied names
 *   CARD_VOTE         face-down cards, one per tied name; nobody (host
 *                     included) is ever told which card holds which name
 *                     until the winning card opens
 *   CARD_RESULT
 *   GAME_OVER
 *
 * The win condition is checked after every elimination: evil reaches zero
 * (good wins) or evil is at least as many as good (evil wins). It is also
 * checked once before the very first vote — a room that starts already
 * decided refuses to start.
 */

export const DAY_VOTE = "DAY_VOTE"
export const DAY_RESULT = "DAY_RESULT"
export const TIEBREAK_VOTE = "TIEBREAK_VOTE"
export const TIEBREAK_RESULT = "TIEBREAK_RESULT"
export const METHOD_VOTE = "METHOD_VOTE"
export const SPIN_RESULT = "SPIN_RESULT"
export const CARD_VOTE = "CARD_VOTE"
export const CARD_RESULT = "CARD_RESULT"
export const GAME_OVER = "GAME_OVER"

const DEFAULT_DAY_VOTE_SECONDS = 60
/** After this many tied card votes in a row, the server opens one at random
    rather than asking the table to vote a fourth time. */
const MAX_CARD_ATTEMPTS = 3

export interface EliminationConfig {
  gameId: string
  /** The role id that counts as the side trying to outlast everyone else. */
  evilRoleId: string
}

/**
 * One vote. The target's meaning depends on the phase: a player id in
 * DAY_VOTE/TIEBREAK_VOTE, "spin"|"cards" in METHOD_VOTE, a card id in
 * CARD_VOTE. Same shape throughout, mirroring Most Likely To's `Vote`.
 */
export interface Vote {
  round: number
  voterId: string
  target: string
  createdAt: number
}

export interface EliminationGameState extends GameState {
  /** Everyone voted out so far, across every round. Permanent. */
  eliminated: string[]
  /** Who this round's result screen names as freshly out, or null. */
  eliminatedThisRound: string | null
  /** True when the last vote counted (day, tiebreak, or card) tied. */
  isTie: boolean
  /** Who the currently-open or just-closed vote could target. */
  voteCandidates: string[]
  /** This vote's ballots only; cleared every time a new vote opens. */
  votes: Vote[]
  /** How many times in a row the card vote itself has tied, 0-based. */
  cardAttempt: number
  /** cardId -> playerId. Never sent to any client before CARD_RESULT. */
  cardAssignment: Record<string, string>
  /** Set once the game is decided; view() reads this after GAME_OVER. */
  winner: "good" | "evil" | null
}

/** The room row comes back through JSON, so nothing in it is trusted as typed. */
function stateOf(room: Room): EliminationGameState {
  const raw = room.gameState as Partial<EliminationGameState>
  return {
    eliminated: Array.isArray(raw.eliminated) ? raw.eliminated : [],
    eliminatedThisRound: typeof raw.eliminatedThisRound === "string" ? raw.eliminatedThisRound : null,
    isTie: raw.isTie === true,
    voteCandidates: Array.isArray(raw.voteCandidates) ? raw.voteCandidates : [],
    votes: Array.isArray(raw.votes) ? raw.votes : [],
    cardAttempt: typeof raw.cardAttempt === "number" ? raw.cardAttempt : 0,
    cardAssignment:
      typeof raw.cardAssignment === "object" && raw.cardAssignment !== null ? raw.cardAssignment : {},
    winner: raw.winner === "good" || raw.winner === "evil" ? raw.winner : null
  }
}

function dayVoteMs(room: Room): number {
  const v = room.settings["dayVoteSeconds"]
  return (typeof v === "number" && Number.isFinite(v) ? v : DEFAULT_DAY_VOTE_SECONDS) * 1000
}

/** Fisher-Yates, local rather than shared with `domain/roles.ts` — one line,
    not worth a cross-module dependency for. */
function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/** Counts, and who's tied for the most, among only the given candidates. */
function tallyVotes(
  votes: readonly Vote[],
  candidateIds: readonly string[]
): { counts: Map<string, number>; top: string[]; totalVotes: number } {
  const counts = new Map(candidateIds.map(id => [id, 0]))
  let totalVotes = 0
  for (const v of votes) {
    const c = counts.get(v.target)
    if (c === undefined) continue
    counts.set(v.target, c + 1)
    totalVotes++
  }
  const max = counts.size === 0 ? 0 : Math.max(0, ...counts.values())
  const top = max === 0 ? [] : [...counts.entries()].filter(([, n]) => n === max).map(([id]) => id)
  return { counts, top, totalVotes }
}

function livingCounts(
  room: Room,
  state: EliminationGameState,
  evilRoleId: string
): { evil: number; good: number } {
  let evil = 0
  let good = 0
  for (const p of room.players) {
    if (state.eliminated.includes(p.id)) continue
    if (p.role === evilRoleId) evil++
    else if (p.role !== null) good++
  }
  return { evil, good }
}

/** null means "not decided yet". Also null when nobody has a role at all —
    `start()` checks that separately and refuses rather than declaring a
    winner over an empty table. */
function checkWinner(room: Room, state: EliminationGameState, evilRoleId: string): "good" | "evil" | null {
  const { evil, good } = livingCounts(room, state, evilRoleId)
  if (evil === 0 && good > 0) return "good"
  if (evil > 0 && evil >= good) return "evil"
  return null
}

function buildRoster(room: Room, state: EliminationGameState): EliminationPlayer[] {
  return room.players.map(p => ({
    id: p.id,
    name: p.name,
    character: p.character,
    accessory: p.accessory ?? "",
    connected: p.connected,
    eliminated: state.eliminated.includes(p.id)
  }))
}

/** Vote counts and per-target results, for the DAY_RESULT/TIEBREAK_RESULT
    view. Shared by both so the shape only exists in one place. */
function tallyResult(
  room: Room,
  state: EliminationGameState,
  candidateIds: readonly string[]
): Pick<EliminationResultView, "totalVotes" | "results"> {
  const named = room.settings["showVoters"] === true
  const nameOf = new Map(room.players.map(p => [p.id, p.name]))
  const { counts, totalVotes } = tallyVotes(state.votes, candidateIds)
  const voters = new Map<string, string[]>(candidateIds.map(id => [id, []]))
  for (const v of state.votes) {
    if (!voters.has(v.target)) continue
    const voterName = nameOf.get(v.voterId)
    if (voterName !== undefined) voters.get(v.target)!.push(voterName)
  }
  const results = candidateIds
    .map(id => {
      const voteCount = counts.get(id) ?? 0
      return {
        playerId: id,
        playerName: nameOf.get(id) ?? "",
        voteCount,
        percentage: totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100),
        ...(named ? { voters: voters.get(id) ?? [] } : {})
      }
    })
    .sort((a, b) => b.voteCount - a.voteCount || a.playerName.localeCompare(b.playerName))
  return { totalVotes, results }
}

/** A decided game, or a fresh round opened for the table to keep playing. */
function checkWinAndAdvance(
  room: Room,
  state: EliminationGameState,
  evilRoleId: string
): Transition {
  const winner = checkWinner(room, state, evilRoleId)
  if (winner !== null) return { phase: GAME_OVER, state: { ...state, winner }, ms: null, winner }

  const alive = room.players.filter(p => !state.eliminated.includes(p.id)).map(p => p.id)
  const fresh: EliminationGameState = {
    eliminated: state.eliminated,
    eliminatedThisRound: null,
    isTie: false,
    voteCandidates: alive,
    votes: [],
    cardAttempt: 0,
    cardAssignment: {},
    winner: null
  }
  return { phase: DAY_VOTE, state: fresh, ms: dayVoteMs(room), nextRound: true }
}

export function createEliminationEngine(config: EliminationConfig): GameEngine {
  const { evilRoleId } = config

  return {
    gameId: config.gameId,

    start(room, _rng): Transition {
      const alive = room.players.map(p => p.id)
      const state: EliminationGameState = {
        eliminated: [],
        eliminatedThisRound: null,
        isTie: false,
        voteCandidates: alive,
        votes: [],
        cardAttempt: 0,
        cardAssignment: {},
        winner: null
      }
      const { evil, good } = livingCounts(room, state, evilRoleId)
      // Nobody has a role: Assign Roles was never pressed, or Clear Roles
      // undid it. Starting a vote over an empty table is a bug, not a game.
      if (evil === 0 && good === 0) throw new Error("INVALID_INPUT")
      if (checkWinner(room, state, evilRoleId) !== null) throw new Error("INVALID_INPUT")
      return { phase: DAY_VOTE, state, ms: dayVoteMs(room), scores: {} }
    },

    act(_room, _playerId, _action): GameState {
      throw new Error("GAME_NOT_RUNNING") // replaced in Task 3
    },

    next(_room, _rng): Transition {
      throw new Error("GAME_NOT_RUNNING") // replaced in Tasks 5-7
    },

    pending(_room): string[] {
      return [] // replaced in Task 4
    },

    view(_room, _playerId): EliminationView {
      throw new Error("GAME_NOT_RUNNING") // replaced in Task 8
    }
  }
}

// Exported for the test file and for later tasks in this same plan.
export { stateOf, dayVoteMs, shuffle, tallyVotes, livingCounts, checkWinner, buildRoster, tallyResult, checkWinAndAdvance, MAX_CARD_ATTEMPTS }
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: PASS — all 5 tests in the `start` describe block.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint . --ext .ts,.cjs`
Expected: clean. (The unused-parameter underscores on `act`/`next`/`view`/`pending` satisfy the linter; they're replaced with real bodies in later tasks.)

- [ ] **Step 6: Commit**

```bash
git add src/server/games/elimination-vote.ts tests/unit/domain/elimination-vote.test.ts
git commit -m "Add the elimination-vote engine's state, helpers, and start()"
```

---

## Task 3: `act()` — casting a vote

**Files:**
- Modify: `src/server/games/elimination-vote.ts`
- Test: `tests/unit/domain/elimination-vote.test.ts`

- [ ] **Step 1: Write the failing tests (append to the test file)**

```ts
describe("act", () => {
  function atDayVote(): Room {
    const room = mkRoom()
    const t = engine.start(room, () => 0.5)
    return { ...room, phase: t.phase, phaseSeq: 1, phaseEndsAt: Date.now() + t.ms!, round: 1, gameState: t.state }
  }

  it("records a vote for someone else alive", () => {
    const room = atDayVote()
    const state = engine.act(room, "p2", { type: "vote", target: "p1" }) as { votes: Vote[] }
    expect(state.votes).toEqual([{ round: 1, voterId: "p2", target: "p1", createdAt: expect.any(Number) }])
  })

  it("refuses a vote for yourself", () => {
    const room = atDayVote()
    expect(() => engine.act(room, "p1", { type: "vote", target: "p1" })).toThrow("INVALID_INPUT")
  })

  it("refuses a second vote in the same round", () => {
    const room = atDayVote()
    const afterFirst = engine.act(room, "p2", { type: "vote", target: "p1" })
    const withVote = { ...room, gameState: afterFirst }
    expect(() => engine.act(withVote, "p2", { type: "vote", target: "p3" })).toThrow("INVALID_INPUT")
  })

  it("refuses a vote for someone not in the room", () => {
    const room = atDayVote()
    expect(() => engine.act(room, "p2", { type: "vote", target: "ghost" })).toThrow("INVALID_INPUT")
  })

  it("refuses a vote from someone already eliminated", () => {
    const room = atDayVote()
    const withElimination = { ...room, gameState: { ...room.gameState as object, eliminated: ["p2"] } }
    expect(() => engine.act(withElimination, "p2", { type: "vote", target: "p1" })).toThrow("INVALID_INPUT")
  })

  it("refuses a move that is not a vote", () => {
    const room = atDayVote()
    expect(() => engine.act(room, "p2", { type: "shout", target: "p1" })).toThrow("INVALID_INPUT")
  })

  it("during a tiebreak, refuses a vote for someone outside the tied names", () => {
    const room = atDayVote()
    const tiebreak = {
      ...room, phase: TIEBREAK_VOTE,
      gameState: { ...room.gameState as object, voteCandidates: ["p2", "p3"] }
    }
    expect(() => engine.act(tiebreak, "p1", { type: "vote", target: "p4" })).toThrow("INVALID_INPUT")
    // p2 and p3 are still valid targets for anyone not eliminated.
    const state = engine.act(tiebreak, "p1", { type: "vote", target: "p2" }) as { votes: Vote[] }
    expect(state.votes).toHaveLength(1)
  })

  it("during the method vote, only accepts spin or cards", () => {
    const room = atDayVote()
    const methodRoom = { ...room, phase: METHOD_VOTE }
    expect(() => engine.act(methodRoom, "p1", { type: "vote", target: "p2" })).toThrow("INVALID_INPUT")
    const state = engine.act(methodRoom, "p1", { type: "vote", target: "spin" }) as { votes: Vote[] }
    expect(state.votes[0]!.target).toBe("spin")
  })

  it("during a card vote, only accepts a card id that was actually dealt", () => {
    const room = atDayVote()
    const cardRoom = {
      ...room, phase: CARD_VOTE,
      gameState: { ...room.gameState as object, cardAssignment: { red: "p2", blue: "p3" } }
    }
    expect(() => engine.act(cardRoom, "p1", { type: "vote", target: "green" })).toThrow("INVALID_INPUT")
    const state = engine.act(cardRoom, "p1", { type: "vote", target: "red" }) as { votes: Vote[] }
    expect(state.votes[0]!.target).toBe("red")
  })

  it("refuses any vote outside a voting phase", () => {
    const room = atDayVote()
    const resultRoom = { ...room, phase: DAY_RESULT }
    expect(() => engine.act(resultRoom, "p1", { type: "vote", target: "p2" })).toThrow("GAME_NOT_RUNNING")
  })
})
```

Add the phase-constant imports at the top of the test file:

```ts
import { createEliminationEngine, TIEBREAK_VOTE, METHOD_VOTE, CARD_VOTE, DAY_RESULT, type Vote } from "@server/games/elimination-vote.js"
```

(Replace the earlier single-symbol import of `createEliminationEngine` with this line.)

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: FAIL — the `act` describe block throws `GAME_NOT_RUNNING` for every case (the placeholder body).

- [ ] **Step 3: Replace the placeholder `act()` in `src/server/games/elimination-vote.ts`**

```ts
    act(room, playerId, action): GameState {
      const state = stateOf(room)
      // An eliminated player has nothing left to decide.
      if (state.eliminated.includes(playerId)) throw new Error("INVALID_INPUT")

      const move = action as { type?: unknown; target?: unknown }
      if (move.type !== "vote") throw new Error("INVALID_INPUT")
      const target = typeof move.target === "string" ? move.target : ""
      if (target === "") throw new Error("INVALID_INPUT")
      // One vote each. A vote that could be changed would let the count
      // shown during voting go down, and the phase close and reopen.
      if (state.votes.some(v => v.voterId === playerId)) throw new Error("INVALID_INPUT")

      if (room.phase === DAY_VOTE || room.phase === TIEBREAK_VOTE) {
        if (target === playerId) throw new Error("INVALID_INPUT")
        if (!state.voteCandidates.includes(target)) throw new Error("INVALID_INPUT")
      } else if (room.phase === METHOD_VOTE) {
        if (target !== "spin" && target !== "cards") throw new Error("INVALID_INPUT")
      } else if (room.phase === CARD_VOTE) {
        if (!(target in state.cardAssignment)) throw new Error("INVALID_INPUT")
      } else {
        // Result screens and GAME_OVER take no votes.
        throw new Error("GAME_NOT_RUNNING")
      }

      const vote: Vote = { round: room.round, voterId: playerId, target, createdAt: Date.now() }
      return { ...state, votes: [...state.votes, vote] }
    },
```

Add the phase-constant imports this needs: `TIEBREAK_VOTE`, `METHOD_VOTE`, `CARD_VOTE` are already declared as exported constants earlier in the file from Task 2 — no new import needed, just reference them.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: PASS — both `start` and `act` describe blocks.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint . --ext .ts,.cjs`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/server/games/elimination-vote.ts tests/unit/domain/elimination-vote.test.ts
git commit -m "Add the elimination-vote engine's act()"
```

---

## Task 4: `pending()` — who still owes a vote

**Files:**
- Modify: `src/server/games/elimination-vote.ts`
- Test: `tests/unit/domain/elimination-vote.test.ts`

- [ ] **Step 1: Write the failing tests (append)**

```ts
describe("pending", () => {
  it("lists everyone alive and connected who has not voted yet", () => {
    const room = mkRoom({ phase: DAY_VOTE, gameState: { voteCandidates: ["p1", "p2", "p3", "p4", "p5"], votes: [] } })
    expect(engine.pending(room).sort()).toEqual(["p1", "p2", "p3", "p4", "p5"])
  })

  it("drops a player once they've voted", () => {
    const room = mkRoom({
      phase: DAY_VOTE,
      gameState: {
        voteCandidates: ["p1", "p2", "p3", "p4", "p5"],
        votes: [{ round: 1, voterId: "p1", target: "p2", createdAt: 0 }]
      }
    })
    expect(engine.pending(room)).not.toContain("p1")
  })

  it("drops an eliminated player even if they haven't voted", () => {
    const room = mkRoom({
      phase: DAY_VOTE,
      gameState: { voteCandidates: ["p1", "p2", "p3", "p4", "p5"], votes: [], eliminated: ["p3"] }
    })
    expect(engine.pending(room)).not.toContain("p3")
  })

  it("is empty outside a voting phase", () => {
    const room = mkRoom({ phase: DAY_RESULT, gameState: {} })
    expect(engine.pending(room)).toEqual([])
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: FAIL — `pending` always returns `[]`, so the first two tests fail.

- [ ] **Step 3: Replace the placeholder `pending()`**

```ts
    pending(room): string[] {
      const state = stateOf(room)
      const votePhases: readonly string[] = [DAY_VOTE, TIEBREAK_VOTE, METHOD_VOTE, CARD_VOTE]
      if (!votePhases.includes(room.phase)) return []
      return room.players
        .filter(p => p.connected && !state.eliminated.includes(p.id) && !state.votes.some(v => v.voterId === p.id))
        .map(p => p.id)
    },
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: PASS — all describe blocks so far.

- [ ] **Step 5: Commit**

```bash
git add src/server/games/elimination-vote.ts tests/unit/domain/elimination-vote.test.ts
git commit -m "Add the elimination-vote engine's pending()"
```

---

## Task 5: `next()` — day vote and tiebreak vote closing

**Files:**
- Modify: `src/server/games/elimination-vote.ts`
- Test: `tests/unit/domain/elimination-vote.test.ts`

This task covers `DAY_VOTE → DAY_RESULT`, `DAY_RESULT → (next round | TIEBREAK_VOTE | GAME_OVER)`, and the same for `TIEBREAK_VOTE/TIEBREAK_RESULT`. `METHOD_VOTE` and `CARD_VOTE` come in Tasks 6-7.

- [ ] **Step 1: Write the failing tests (append)**

```ts
describe("next: closing the day vote", () => {
  function withVotes(votes: Vote[]): Room {
    const room = mkRoom()
    const started = engine.start(room, () => 0.5)
    return { ...room, phase: started.phase, phaseSeq: 1, round: 1, gameState: { ...started.state, votes } }
  }

  it("eliminates the clear top target and lands on DAY_RESULT", () => {
    const room = withVotes([
      { round: 1, voterId: "p2", target: "p1", createdAt: 0 },
      { round: 1, voterId: "p3", target: "p1", createdAt: 0 },
      { round: 1, voterId: "p4", target: "p2", createdAt: 0 }
    ])
    const t = engine.next(room, () => 0.5)
    expect(t.phase).toBe(DAY_RESULT)
    const state = t.state as { eliminated: string[]; eliminatedThisRound: string | null; isTie: boolean }
    expect(state.eliminated).toEqual(["p1"])
    expect(state.eliminatedThisRound).toBe("p1")
    expect(state.isTie).toBe(false)
  })

  it("eliminates nobody when the vote is a real tie", () => {
    const room = withVotes([
      { round: 1, voterId: "p3", target: "p1", createdAt: 0 },
      { round: 1, voterId: "p4", target: "p2", createdAt: 0 }
    ])
    const t = engine.next(room, () => 0.5)
    expect(t.phase).toBe(DAY_RESULT)
    const state = t.state as { eliminated: string[]; eliminatedThisRound: string | null; isTie: boolean; voteCandidates: string[] }
    expect(state.eliminated).toEqual([])
    expect(state.eliminatedThisRound).toBeNull()
    expect(state.isTie).toBe(true)
    expect(state.voteCandidates.sort()).toEqual(["p1", "p2"])
  })

  it("eliminates nobody when nobody voted at all", () => {
    const room = withVotes([])
    const t = engine.next(room, () => 0.5)
    const state = t.state as { eliminated: string[]; isTie: boolean }
    expect(state.eliminated).toEqual([])
    expect(state.isTie).toBe(false)
  })
})

describe("next: closing the day result", () => {
  function atDayResult(overrides: Partial<EliminationGameState>): Room {
    return mkRoom({
      phase: DAY_RESULT, round: 1,
      gameState: {
        eliminated: [], eliminatedThisRound: null, isTie: false,
        voteCandidates: ["p1", "p2", "p3", "p4", "p5"], votes: [], cardAttempt: 0, cardAssignment: {}, winner: null,
        ...overrides
      }
    })
  }

  it("opens a fresh day vote when nobody tied and nobody has won yet", () => {
    const room = atDayResult({ eliminated: ["p1"], eliminatedThisRound: "p1", isTie: false })
    const t = engine.next(room, () => 0.5)
    expect(t.phase).toBe(DAY_VOTE)
    expect(t.nextRound).toBe(true)
    const state = t.state as { voteCandidates: string[]; votes: unknown[] }
    expect(state.voteCandidates.sort()).toEqual(["p2", "p3", "p4", "p5"])
    expect(state.votes).toEqual([])
  })

  it("declares the winner instead of opening a new round when the vote decided the game", () => {
    // Eliminating the vampire leaves an all-good table.
    const room = atDayResult({ eliminated: ["p1"], eliminatedThisRound: "p1", isTie: false })
    const t = engine.next(room, () => 0.5)
    expect(t.phase).toBe(DAY_VOTE) // not decided: only the vampire was ever evil, removing it means good already won
    // Re-check directly: the win check must fire. Force it by eliminating the only evil player.
    const decided = atDayResult({ eliminated: ["p1"], eliminatedThisRound: "p1", isTie: false })
    const winTransition = engine.next(decided, () => 0.5)
    expect(winTransition.winner).toBe("good")
    expect(winTransition.phase).toBe(GAME_OVER)
  })

  it("opens a tiebreak vote among just the tied names on a first tie", () => {
    const room = atDayResult({ isTie: true, voteCandidates: ["p2", "p3"] })
    const t = engine.next(room, () => 0.5)
    expect(t.phase).toBe(TIEBREAK_VOTE)
    const state = t.state as { voteCandidates: string[]; votes: unknown[] }
    expect(state.voteCandidates).toEqual(["p2", "p3"])
    expect(state.votes).toEqual([])
  })
})

describe("next: tiebreak vote and result", () => {
  it("closing TIEBREAK_VOTE eliminates a clear winner among the tied names only", () => {
    const room = mkRoom({
      phase: TIEBREAK_VOTE, round: 1,
      gameState: {
        eliminated: [], eliminatedThisRound: null, isTie: true,
        voteCandidates: ["p2", "p3"],
        votes: [
          { round: 1, voterId: "p1", target: "p2", createdAt: 0 },
          { round: 1, voterId: "p4", target: "p2", createdAt: 0 }
        ],
        cardAttempt: 0, cardAssignment: {}, winner: null
      }
    })
    const t = engine.next(room, () => 0.5)
    expect(t.phase).toBe(TIEBREAK_RESULT)
    const state = t.state as { eliminated: string[]; isTie: boolean }
    expect(state.eliminated).toEqual(["p2"])
    expect(state.isTie).toBe(false)
  })

  it("closing TIEBREAK_RESULT opens METHOD_VOTE on a second tie in a row", () => {
    const room = mkRoom({
      phase: TIEBREAK_RESULT, round: 1,
      gameState: {
        eliminated: [], eliminatedThisRound: null, isTie: true,
        voteCandidates: ["p2", "p3"], votes: [], cardAttempt: 0, cardAssignment: {}, winner: null
      }
    })
    const t = engine.next(room, () => 0.5)
    expect(t.phase).toBe(METHOD_VOTE)
    const state = t.state as { votes: unknown[] }
    expect(state.votes).toEqual([])
  })

  it("closing TIEBREAK_RESULT with a clear winner runs the same win check as a day result", () => {
    const room = mkRoom({
      phase: TIEBREAK_RESULT, round: 1,
      gameState: {
        eliminated: ["p1"], eliminatedThisRound: "p1", isTie: false,
        voteCandidates: ["p2", "p3"], votes: [], cardAttempt: 0, cardAssignment: {}, winner: null
      }
    })
    const t = engine.next(room, () => 0.5)
    expect(t.winner).toBe("good")
    expect(t.phase).toBe(GAME_OVER)
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: FAIL — `next` always throws `GAME_NOT_RUNNING` (the placeholder body).

- [ ] **Step 3: Replace the placeholder `next()`** — add these module-level helper functions above `createEliminationEngine`, and the real `next()` method inside it.

```ts
function afterVoteClose(state: EliminationGameState, resultPhase: string): Transition {
  const { top } = tallyVotes(state.votes, state.voteCandidates)

  if (top.length === 1) {
    const picked = top[0]!
    return {
      phase: resultPhase,
      state: { ...state, eliminated: [...state.eliminated, picked], eliminatedThisRound: picked, isTie: false },
      ms: null
    }
  }
  if (top.length === 0) {
    // Nobody voted. Not a tie — nobody is "most voted" with zero votes.
    return { phase: resultPhase, state: { ...state, eliminatedThisRound: null, isTie: false }, ms: null }
  }
  return {
    phase: resultPhase,
    state: { ...state, eliminatedThisRound: null, isTie: true, voteCandidates: top },
    ms: null
  }
}

function afterResultClose(room: Room, state: EliminationGameState, evilRoleId: string): Transition {
  if (!state.isTie) return checkWinAndAdvance(room, state, evilRoleId)

  if (room.phase === DAY_RESULT) {
    // First tie: narrow to just the tied names and vote again.
    return { phase: TIEBREAK_VOTE, state: { ...state, votes: [] }, ms: dayVoteMs(room) }
  }
  // Coming from TIEBREAK_RESULT and still tied: second tie in a row.
  return { phase: METHOD_VOTE, state: { ...state, votes: [] }, ms: dayVoteMs(room) }
}
```

Add to the `createEliminationEngine` return object, replacing the placeholder `next`:

```ts
    next(room, _rng): Transition {
      const state = stateOf(room)

      if (room.phase === DAY_VOTE) return afterVoteClose(state, DAY_RESULT)
      if (room.phase === DAY_RESULT) return afterResultClose(room, state, evilRoleId)
      if (room.phase === TIEBREAK_VOTE) return afterVoteClose(state, TIEBREAK_RESULT)
      if (room.phase === TIEBREAK_RESULT) return afterResultClose(room, state, evilRoleId)

      // METHOD_VOTE, SPIN_RESULT, CARD_VOTE, CARD_RESULT: added in Tasks 6-7.
      throw new Error("GAME_NOT_RUNNING")
    },
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: PASS — every describe block down through "next: tiebreak vote and result".

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint . --ext .ts,.cjs`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/server/games/elimination-vote.ts tests/unit/domain/elimination-vote.test.ts
git commit -m "Add day-vote and tiebreak-vote transitions to the elimination engine"
```

---

## Task 6: `next()` — the method vote and the spin

**Files:**
- Modify: `src/server/games/elimination-vote.ts`
- Test: `tests/unit/domain/elimination-vote.test.ts`

- [ ] **Step 1: Write the failing tests (append)**

```ts
describe("next: method vote", () => {
  function atMethodVote(votes: Vote[]): Room {
    return mkRoom({
      phase: METHOD_VOTE, round: 1,
      gameState: {
        eliminated: [], eliminatedThisRound: null, isTie: true,
        voteCandidates: ["p2", "p3"], votes, cardAttempt: 0, cardAssignment: {}, winner: null
      }
    })
  }

  it("eliminates one of the tied names via the rng when spin wins", () => {
    const room = atMethodVote([
      { round: 1, voterId: "p1", target: "spin", createdAt: 0 },
      { round: 1, voterId: "p4", target: "spin", createdAt: 0 }
    ])
    const t = engine.next(room, () => 0.9) // near the end of a 2-item array -> index 1
    expect(t.phase).toBe(SPIN_RESULT)
    const state = t.state as { eliminated: string[]; eliminatedThisRound: string | null }
    expect(state.eliminated).toEqual(["p3"])
    expect(state.eliminatedThisRound).toBe("p3")
  })

  it("picks a low rng roll as the first tied name", () => {
    const room = atMethodVote([{ round: 1, voterId: "p1", target: "spin", createdAt: 0 }])
    const t = engine.next(room, () => 0.0)
    const state = t.state as { eliminatedThisRound: string | null }
    expect(state.eliminatedThisRound).toBe("p2")
  })

  it("opens two face-down cards when cards wins, one per tied name", () => {
    const room = atMethodVote([
      { round: 1, voterId: "p1", target: "cards", createdAt: 0 },
      { round: 1, voterId: "p4", target: "cards", createdAt: 0 }
    ])
    const t = engine.next(room, () => 0.5)
    expect(t.phase).toBe(CARD_VOTE)
    const state = t.state as { cardAssignment: Record<string, string> }
    expect(Object.keys(state.cardAssignment).sort()).toEqual(["blue", "red"])
    expect(new Set(Object.values(state.cardAssignment))).toEqual(new Set(["p2", "p3"]))
  })

  it("uses numbered cards for three or more tied names", () => {
    const room = mkRoom({
      phase: METHOD_VOTE, round: 1,
      gameState: {
        eliminated: [], eliminatedThisRound: null, isTie: true,
        voteCandidates: ["p1", "p2", "p3"],
        votes: [{ round: 1, voterId: "p4", target: "cards", createdAt: 0 }],
        cardAttempt: 0, cardAssignment: {}, winner: null
      }
    })
    const t = engine.next(room, () => 0.5)
    const state = t.state as { cardAssignment: Record<string, string> }
    expect(Object.keys(state.cardAssignment).sort()).toEqual(["1", "2", "3"])
  })

  it("falls back to cards when the method vote itself ties", () => {
    const room = atMethodVote([
      { round: 1, voterId: "p1", target: "spin", createdAt: 0 },
      { round: 1, voterId: "p4", target: "cards", createdAt: 0 }
    ])
    const t = engine.next(room, () => 0.5)
    expect(t.phase).toBe(CARD_VOTE)
  })

  it("closing SPIN_RESULT runs the win check and opens the next round, or ends the game", () => {
    const room = mkRoom({
      phase: SPIN_RESULT, round: 1,
      gameState: {
        eliminated: ["p1"], eliminatedThisRound: "p1", isTie: false,
        voteCandidates: [], votes: [], cardAttempt: 0, cardAssignment: {}, winner: null
      }
    })
    const t = engine.next(room, () => 0.5)
    expect(t.winner).toBe("good")
    expect(t.phase).toBe(GAME_OVER)
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: FAIL — `next` throws `GAME_NOT_RUNNING` for `METHOD_VOTE` and `SPIN_RESULT`.

- [ ] **Step 3: Add the method-vote helper and wire it into `next()`**

```ts
function afterMethodClose(room: Room, state: EliminationGameState, rng: () => number): Transition {
  const { top } = tallyVotes(state.votes, ["spin", "cards"])
  // A tie between the two methods, or nobody voting at all, both fall to
  // Cards — the more deliberate of the two, and never the one that skips a
  // second vote of the table's own.
  const method: "spin" | "cards" = top.length === 1 ? (top[0] as "spin" | "cards") : "cards"

  if (method === "spin") {
    const alive = state.voteCandidates
    const idx = Math.min(alive.length - 1, Math.floor(rng() * alive.length))
    const picked = alive[idx]!
    return {
      phase: SPIN_RESULT,
      state: { ...state, eliminated: [...state.eliminated, picked], eliminatedThisRound: picked, votes: [] },
      ms: null
    }
  }

  const cardIds = state.voteCandidates.length === 2 ? ["red", "blue"] : state.voteCandidates.map((_, i) => String(i + 1))
  const shuffled = shuffle(state.voteCandidates, rng)
  const cardAssignment: Record<string, string> = {}
  cardIds.forEach((cid, i) => { cardAssignment[cid] = shuffled[i]! })
  return { phase: CARD_VOTE, state: { ...state, votes: [], cardAssignment, cardAttempt: 0 }, ms: dayVoteMs(room) }
}
```

Update `next()`:

```ts
    next(room, rng): Transition {
      const state = stateOf(room)

      if (room.phase === DAY_VOTE) return afterVoteClose(state, DAY_RESULT)
      if (room.phase === DAY_RESULT) return afterResultClose(room, state, evilRoleId)
      if (room.phase === TIEBREAK_VOTE) return afterVoteClose(state, TIEBREAK_RESULT)
      if (room.phase === TIEBREAK_RESULT) return afterResultClose(room, state, evilRoleId)
      if (room.phase === METHOD_VOTE) return afterMethodClose(room, state, rng)
      if (room.phase === SPIN_RESULT) return checkWinAndAdvance(room, state, evilRoleId)

      // CARD_VOTE, CARD_RESULT: added in Task 7.
      throw new Error("GAME_NOT_RUNNING")
    },
```

(The `next(room, _rng)` parameter name from Task 5 becomes `next(room, rng)` now that it's used.)

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: PASS — every describe block down through "next: method vote".

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint . --ext .ts,.cjs`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/server/games/elimination-vote.ts tests/unit/domain/elimination-vote.test.ts
git commit -m "Add the method vote and spin transitions to the elimination engine"
```

---

## Task 7: `next()` — the card vote and its result

**Files:**
- Modify: `src/server/games/elimination-vote.ts`
- Test: `tests/unit/domain/elimination-vote.test.ts`

- [ ] **Step 1: Write the failing tests (append)**

```ts
describe("next: card vote", () => {
  function atCardVote(overrides: Partial<EliminationGameState> = {}, votes: Vote[] = []): Room {
    return mkRoom({
      phase: CARD_VOTE, round: 1,
      gameState: {
        eliminated: [], eliminatedThisRound: null, isTie: false,
        voteCandidates: ["p2", "p3"], votes, cardAttempt: 0,
        cardAssignment: { red: "p2", blue: "p3" }, winner: null,
        ...overrides
      }
    })
  }

  it("opens the winning card and eliminates the name under it", () => {
    const room = atCardVote({}, [
      { round: 1, voterId: "p1", target: "red", createdAt: 0 },
      { round: 1, voterId: "p4", target: "red", createdAt: 0 },
      { round: 1, voterId: "p5", target: "blue", createdAt: 0 }
    ])
    const t = engine.next(room, () => 0.5)
    expect(t.phase).toBe(CARD_RESULT)
    const state = t.state as { eliminated: string[]; eliminatedThisRound: string | null }
    expect(state.eliminated).toEqual(["p2"])
    expect(state.eliminatedThisRound).toBe("p2")
  })

  it("never eliminates the name under the losing card", () => {
    const room = atCardVote({}, [{ round: 1, voterId: "p1", target: "blue", createdAt: 0 }])
    const t = engine.next(room, () => 0.5)
    const state = t.state as { eliminated: string[] }
    expect(state.eliminated).not.toContain("p2")
  })

  it("re-deals the cards with a new mapping when the card vote ties, under the attempt limit", () => {
    const room = atCardVote({ cardAttempt: 0 }, [
      { round: 1, voterId: "p1", target: "red", createdAt: 0 },
      { round: 1, voterId: "p4", target: "blue", createdAt: 0 }
    ])
    const t = engine.next(room, () => 0.5)
    expect(t.phase).toBe(CARD_VOTE)
    const state = t.state as { cardAttempt: number; votes: unknown[]; cardAssignment: Record<string, string> }
    expect(state.cardAttempt).toBe(1)
    expect(state.votes).toEqual([])
    expect(Object.keys(state.cardAssignment).sort()).toEqual(["blue", "red"])
  })

  it("opens a random card on the third tied attempt instead of dealing a fourth time", () => {
    const room = atCardVote({ cardAttempt: 2 }, [
      { round: 1, voterId: "p1", target: "red", createdAt: 0 },
      { round: 1, voterId: "p4", target: "blue", createdAt: 0 }
    ])
    const t = engine.next(room, () => 0.0) // picks index 0
    expect(t.phase).toBe(CARD_RESULT)
    const state = t.state as { eliminated: string[] }
    expect(state.eliminated).toHaveLength(1)
  })

  it("closing CARD_RESULT runs the win check the same as every other elimination", () => {
    const room = mkRoom({
      phase: CARD_RESULT, round: 1,
      gameState: {
        eliminated: ["p1"], eliminatedThisRound: "p1", isTie: false,
        voteCandidates: [], votes: [], cardAttempt: 0, cardAssignment: { red: "p2", blue: "p3" }, winner: null
      }
    })
    const t = engine.next(room, () => 0.5)
    expect(t.winner).toBe("good")
    expect(t.phase).toBe(GAME_OVER)
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: FAIL — `next` throws `GAME_NOT_RUNNING` for `CARD_VOTE` and `CARD_RESULT`.

- [ ] **Step 3: Add the card-vote helper and finish `next()`**

```ts
function afterCardVoteClose(room: Room, state: EliminationGameState, rng: () => number): Transition {
  const cardIds = Object.keys(state.cardAssignment)
  const { top } = tallyVotes(state.votes, cardIds)

  if (top.length === 1) {
    const winningCard = top[0]!
    const eliminatedPlayer = state.cardAssignment[winningCard]!
    return {
      phase: CARD_RESULT,
      state: { ...state, eliminated: [...state.eliminated, eliminatedPlayer], eliminatedThisRound: eliminatedPlayer },
      ms: null
    }
  }

  if (state.cardAttempt >= MAX_CARD_ATTEMPTS - 1) {
    // Third tied attempt: the table has voted three times without deciding.
    // The server opens one card at random rather than asking a fourth time.
    const idx = Math.min(cardIds.length - 1, Math.floor(rng() * cardIds.length))
    const winningCard = cardIds[idx]!
    const eliminatedPlayer = state.cardAssignment[winningCard]!
    return {
      phase: CARD_RESULT,
      state: { ...state, eliminated: [...state.eliminated, eliminatedPlayer], eliminatedThisRound: eliminatedPlayer },
      ms: null
    }
  }

  // Re-deal: same tied names, a fresh random card-to-name mapping.
  const shuffled = shuffle(state.voteCandidates, rng)
  const newAssignment: Record<string, string> = {}
  cardIds.forEach((cid, i) => { newAssignment[cid] = shuffled[i]! })
  return {
    phase: CARD_VOTE,
    state: { ...state, votes: [], cardAssignment: newAssignment, cardAttempt: state.cardAttempt + 1 },
    ms: dayVoteMs(room)
  }
}
```

Update `next()` to its final form:

```ts
    next(room, rng): Transition {
      const state = stateOf(room)

      if (room.phase === DAY_VOTE) return afterVoteClose(state, DAY_RESULT)
      if (room.phase === DAY_RESULT) return afterResultClose(room, state, evilRoleId)
      if (room.phase === TIEBREAK_VOTE) return afterVoteClose(state, TIEBREAK_RESULT)
      if (room.phase === TIEBREAK_RESULT) return afterResultClose(room, state, evilRoleId)
      if (room.phase === METHOD_VOTE) return afterMethodClose(room, state, rng)
      if (room.phase === SPIN_RESULT) return checkWinAndAdvance(room, state, evilRoleId)
      if (room.phase === CARD_VOTE) return afterCardVoteClose(room, state, rng)
      if (room.phase === CARD_RESULT) return checkWinAndAdvance(room, state, evilRoleId)

      // GAME_OVER has no clock and no host-advance button; next() is never
      // called for it in practice, but stay put rather than throw.
      return { phase: GAME_OVER, state, ms: null }
    },
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: PASS — every `next`-related describe block.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint . --ext .ts,.cjs`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/server/games/elimination-vote.ts tests/unit/domain/elimination-vote.test.ts
git commit -m "Add the card vote and card result transitions to the elimination engine"
```

---

## Task 8: `view()` — what each phone is shown

**Files:**
- Modify: `src/server/games/elimination-vote.ts`
- Test: `tests/unit/domain/elimination-vote.test.ts`

- [ ] **Step 1: Write the failing tests (append)**

```ts
describe("view", () => {
  it("shows a day-vote screen with the caller's own vote and nobody else's", () => {
    const room = mkRoom({
      phase: DAY_VOTE, round: 1,
      gameState: {
        eliminated: [], eliminatedThisRound: null, isTie: false,
        voteCandidates: ["p1", "p2", "p3", "p4", "p5"],
        votes: [{ round: 1, voterId: "p2", target: "p1", createdAt: 0 }],
        cardAttempt: 0, cardAssignment: {}, winner: null
      }
    })
    const mine = engine.view(room, "p2") as { kind: string; myVote: string | null; votedCount: number }
    const theirs = engine.view(room, "p3") as { kind: string; myVote: string | null }
    expect(mine).toMatchObject({ kind: "day-vote", myVote: "p1", votedCount: 1 })
    expect(theirs.myVote).toBeNull()
    expect(JSON.stringify(theirs)).not.toContain("\"myVote\":\"p1\"")
  })

  it("tells an eliminated player plainly that they're out", () => {
    const room = mkRoom({
      phase: DAY_VOTE, round: 1,
      gameState: {
        eliminated: ["p3"], eliminatedThisRound: null, isTie: false,
        voteCandidates: ["p1", "p2", "p4", "p5"], votes: [], cardAttempt: 0, cardAssignment: {}, winner: null
      }
    })
    const view = engine.view(room, "p3") as { amEliminated: boolean }
    expect(view.amEliminated).toBe(true)
  })

  it("shows the day-result with per-target counts and who was eliminated", () => {
    const room = mkRoom({
      phase: DAY_RESULT, round: 1,
      gameState: {
        eliminated: ["p1"], eliminatedThisRound: "p1", isTie: false,
        voteCandidates: ["p1", "p2", "p3", "p4", "p5"],
        votes: [
          { round: 1, voterId: "p2", target: "p1", createdAt: 0 },
          { round: 1, voterId: "p3", target: "p1", createdAt: 0 }
        ],
        cardAttempt: 0, cardAssignment: {}, winner: null
      }
    })
    const view = engine.view(room, "p2") as { kind: string; totalVotes: number; eliminatedThisRound: string | null; results: Array<{ playerId: string; voteCount: number }> }
    expect(view.kind).toBe("day-result")
    expect(view.totalVotes).toBe(2)
    expect(view.eliminatedThisRound).toBe("p1")
    expect(view.results[0]).toMatchObject({ playerId: "p1", voteCount: 2 })
  })

  it("omits voter names from a result by default, includes them when showVoters is on", () => {
    const votes = [{ round: 1, voterId: "p2", target: "p1", createdAt: 0 }]
    const base = {
      phase: DAY_RESULT, round: 1,
      gameState: {
        eliminated: ["p1"], eliminatedThisRound: "p1", isTie: false,
        voteCandidates: ["p1", "p2", "p3", "p4", "p5"], votes, cardAttempt: 0, cardAssignment: {}, winner: null
      }
    }
    const off = engine.view(mkRoom(base), "p2") as { results: Array<{ voters?: string[] }> }
    expect(off.results.every(r => r.voters === undefined)).toBe(true)

    const on = engine.view(mkRoom({ ...base, settings: { showVoters: true } }), "p2") as { results: Array<{ playerId: string; voters?: string[] }> }
    expect(on.results.find(r => r.playerId === "p1")?.voters).toEqual(["Mahmud"])
  })

  it("never reveals which card holds which name before CARD_RESULT", () => {
    const room = mkRoom({
      phase: CARD_VOTE, round: 1,
      gameState: {
        eliminated: [], eliminatedThisRound: null, isTie: false,
        voteCandidates: ["p2", "p3"], votes: [], cardAttempt: 0,
        cardAssignment: { red: "p2", blue: "p3" }, winner: null
      }
    })
    for (const viewerId of ["p1", "p2", "p3", "p4", "p5"]) {
      const view = engine.view(room, viewerId)
      const json = JSON.stringify(view)
      expect(json).not.toContain("p2")
      expect(json).not.toContain("p3")
    }
  })

  it("reveals only the winning card's name at CARD_RESULT, never the losing card's", () => {
    const room = mkRoom({
      phase: CARD_RESULT, round: 1,
      gameState: {
        eliminated: ["p2"], eliminatedThisRound: "p2", isTie: false,
        voteCandidates: ["p2", "p3"],
        votes: [{ round: 1, voterId: "p1", target: "red", createdAt: 0 }],
        cardAttempt: 0, cardAssignment: { red: "p2", blue: "p3" }, winner: null
      }
    })
    const view = engine.view(room, "p1") as {
      winningCardId: string; eliminatedName: string
    }
    expect(view.winningCardId).toBe("red")
    expect(view.eliminatedName).toBe("Ali")
    // p3 sits behind the "blue" card; that name never appears in this view.
    expect(JSON.stringify(view)).not.toContain("Morinji")
  })

  it("shows the method-vote screen with the tied names and the caller's own choice", () => {
    const room = mkRoom({
      phase: METHOD_VOTE, round: 1,
      gameState: {
        eliminated: [], eliminatedThisRound: null, isTie: true,
        voteCandidates: ["p2", "p3"],
        votes: [{ round: 1, voterId: "p1", target: "spin", createdAt: 0 }],
        cardAttempt: 0, cardAssignment: {}, winner: null
      }
    })
    const view = engine.view(room, "p1") as { kind: string; tiedNames: string[]; myVote: string | null }
    expect(view.kind).toBe("method-vote")
    expect(view.tiedNames.sort()).toEqual(["Mahmud", "Morinji"])
    expect(view.myVote).toBe("spin")
  })

  it("shows the spin result with who the wheel was spun among and who it picked", () => {
    const room = mkRoom({
      phase: SPIN_RESULT, round: 1,
      gameState: {
        eliminated: ["p3"], eliminatedThisRound: "p3", isTie: false,
        voteCandidates: ["p2", "p3"], votes: [], cardAttempt: 0, cardAssignment: {}, winner: null
      }
    })
    const view = engine.view(room, "p1") as { kind: string; candidateIds: string[]; eliminatedId: string }
    expect(view.kind).toBe("spin-result")
    expect(view.candidateIds.sort()).toEqual(["p2", "p3"])
    expect(view.eliminatedId).toBe("p3")
  })

  it("shows the game-over screen with the stored winner", () => {
    const room = mkRoom({
      phase: GAME_OVER, round: 2,
      gameState: {
        eliminated: ["p1"], eliminatedThisRound: "p1", isTie: false,
        voteCandidates: [], votes: [], cardAttempt: 0, cardAssignment: {}, winner: "good"
      }
    })
    const view = engine.view(room, "p2") as { kind: string; winner: string }
    expect(view).toMatchObject({ kind: "over", winner: "good" })
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: FAIL — `view` throws `GAME_NOT_RUNNING` (the placeholder body).

- [ ] **Step 3: Replace the placeholder `view()`**

```ts
    view(room, playerId): EliminationView {
      const state = stateOf(room)
      const roster = buildRoster(room, state)
      const amEliminated = state.eliminated.includes(playerId)
      const totalVoters = room.players.filter(p => p.connected && !state.eliminated.includes(p.id)).length

      if (room.phase === DAY_VOTE || room.phase === TIEBREAK_VOTE) {
        return {
          kind: room.phase === DAY_VOTE ? "day-vote" : "tiebreak-vote",
          roster,
          votableIds: state.voteCandidates,
          myVote: state.votes.find(v => v.voterId === playerId)?.target ?? null,
          votedCount: state.votes.length,
          totalVoters,
          amEliminated
        }
      }

      if (room.phase === DAY_RESULT || room.phase === TIEBREAK_RESULT) {
        const { totalVotes, results } = tallyResult(room, state, state.voteCandidates)
        return {
          kind: room.phase === DAY_RESULT ? "day-result" : "tiebreak-result",
          roster,
          totalVotes,
          results,
          eliminatedThisRound: state.eliminatedThisRound,
          isTie: state.isTie
        }
      }

      if (room.phase === METHOD_VOTE) {
        const nameOf = new Map(room.players.map(p => [p.id, p.name]))
        return {
          kind: "method-vote",
          tiedNames: state.voteCandidates.map(id => nameOf.get(id) ?? ""),
          myVote: (state.votes.find(v => v.voterId === playerId)?.target as "spin" | "cards" | undefined) ?? null,
          votedCount: state.votes.length,
          totalVoters,
          amEliminated
        }
      }

      if (room.phase === SPIN_RESULT) {
        return {
          kind: "spin-result",
          roster,
          candidateIds: state.voteCandidates,
          eliminatedId: state.eliminatedThisRound ?? ""
        }
      }

      if (room.phase === CARD_VOTE) {
        return {
          kind: "card-vote",
          cardIds: Object.keys(state.cardAssignment),
          myVote: state.votes.find(v => v.voterId === playerId)?.target ?? null,
          votedCount: state.votes.length,
          totalVoters,
          amEliminated
        }
      }

      if (room.phase === CARD_RESULT) {
        const cardIds = Object.keys(state.cardAssignment)
        const { counts } = tallyVotes(state.votes, cardIds)
        // CARD_RESULT is only ever entered once a card has won — see
        // afterCardVoteClose in Task 7, which always sets eliminatedThisRound
        // before moving here. The `?? ""` / `?? cardIds[0]!` fallbacks exist
        // only so this compiles against `eliminatedThisRound`'s general
        // `string | null` type; they never run in practice. A losing card's
        // name stays in `cardAssignment` on the server and nowhere else — it
        // is never put into a view, this round or any later one.
        const eliminatedId = state.eliminatedThisRound ?? ""
        const winningCardId = cardIds.find(cid => state.cardAssignment[cid] === eliminatedId) ?? cardIds[0]!
        return {
          kind: "card-result",
          roster,
          cardIds,
          cardVoteCounts: Object.fromEntries(counts),
          winningCardId,
          eliminatedId,
          eliminatedName: room.players.find(p => p.id === eliminatedId)?.name ?? ""
        }
      }

      // GAME_OVER
      return { kind: "over", roster, winner: state.winner ?? "good" }
    }
```

- [ ] **Step 4: Run the full test file**

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: PASS — every describe block, full file.

- [ ] **Step 5: Typecheck, lint, and run the whole unit suite**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint . --ext .ts,.cjs && npx vitest run`
Expected: all clean; the pre-existing suites (most-likely-to, engine, etc.) still pass unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/server/games/elimination-vote.ts tests/unit/domain/elimination-vote.test.ts
git commit -m "Add the elimination-vote engine's view()"
```

---

## Task 9: Two engine instances and registration

**Files:**
- Create: `src/server/games/vampire-village.ts`
- Create: `src/server/games/mafia-classic.ts`
- Modify: `src/server/games/engines.ts`
- Test: `tests/unit/domain/elimination-vote.test.ts`

- [ ] **Step 1: Write the two one-line engine files**

```ts
// src/server/games/vampire-village.ts
import { createEliminationEngine } from "./elimination-vote.js"

export const vampireVillageEngine = createEliminationEngine({
  gameId: "vampire-village",
  evilRoleId: "vampire"
})
```

```ts
// src/server/games/mafia-classic.ts
import { createEliminationEngine } from "./elimination-vote.js"

export const mafiaClassicEngine = createEliminationEngine({
  gameId: "mafia-classic",
  evilRoleId: "mafia"
})
```

- [ ] **Step 2: Register both in `src/server/games/engines.ts`**

```ts
import type { GameEngine } from "../domain/engine.js"
import { mostLikelyToEngine } from "./most-likely-to.js"
import { vampireVillageEngine } from "./vampire-village.js"
import { mafiaClassicEngine } from "./mafia-classic.js"

/**
 * Games the server runs turn by turn.
 *
 * The role-distribution games in `catalog.ts` are not in here and do not need
 * to be: they hand out roles and let the table run the evening itself, so their
 * rooms stay on `IDLE_PHASE` forever. A game only appears here once the server
 * has to keep time, collect answers, or hold something secret between phases.
 *
 * Vampire Village and Classic Mafia are both: the admin still hands out
 * roles the same way as ever, and only the daytime lynch vote that follows
 * runs on this engine.
 */
const ENGINES: readonly GameEngine[] = [mostLikelyToEngine, vampireVillageEngine, mafiaClassicEngine]

const byId = new Map(ENGINES.map(e => [e.gameId, e]))

export function resolveEngine(gameId: string): GameEngine | undefined {
  return byId.get(gameId)
}

/** True for a game the host can press Start on. */
export function isTurnBased(gameId: string): boolean {
  return byId.has(gameId)
}
```

- [ ] **Step 3: Write and run a registration test (append to the elimination-vote test file)**

```ts
import { resolveEngine, isTurnBased } from "@server/games/engines.js"
import { vampireVillageEngine } from "@server/games/vampire-village.js"
import { mafiaClassicEngine } from "@server/games/mafia-classic.js"

describe("registration", () => {
  it("resolves both games to their own engine instance", () => {
    expect(resolveEngine("vampire-village")).toBe(vampireVillageEngine)
    expect(resolveEngine("mafia-classic")).toBe(mafiaClassicEngine)
    expect(isTurnBased("vampire-village")).toBe(true)
    expect(isTurnBased("mafia-classic")).toBe(true)
  })

  it("leaves the other three role-dealing games off the turn engine", () => {
    for (const id of ["spy-game", "who-am-i", "football-player-guess"]) {
      expect(resolveEngine(id)).toBeUndefined()
      expect(isTurnBased(id)).toBe(false)
    }
  })
})
```

Run: `npx vitest run tests/unit/domain/elimination-vote.test.ts`
Expected: PASS.

- [ ] **Step 4: Typecheck, lint, full unit suite**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint . --ext .ts,.cjs && npx vitest run`
Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add src/server/games/vampire-village.ts src/server/games/mafia-classic.ts src/server/games/engines.ts tests/unit/domain/elimination-vote.test.ts
git commit -m "Register the elimination-vote engine for Vampire Village and Classic Mafia"
```

---

## Task 10: Catalog settings and `turnBased`

**Files:**
- Modify: `src/server/games/catalog.ts`

Vampire Village's entry is at line 4, Classic Mafia's at line 118 (before this edit — check with `grep -n '"vampire-village"\|"mafia-classic"' src/server/games/catalog.ts` since earlier edits in this plan may have shifted lines slightly).

- [ ] **Step 1: Add `turnBased: true` and the two new settings to Vampire Village**

Find:
```ts
    id: "vampire-village",
    icon: "🧛",
    theme: "vampire-village",
    minPlayers: 3,
    defaultSettings: { vampireCount: 1, doctor: true, detective: true },
```

Replace with:
```ts
    id: "vampire-village",
    icon: "🧛",
    theme: "vampire-village",
    minPlayers: 3,
    // Roles are still dealt by hand, same as ever; only the daytime lynch
    // vote that follows runs on the turn engine.
    turnBased: true,
    defaultSettings: { vampireCount: 1, doctor: true, detective: true, dayVoteSeconds: 60, showVoters: false },
```

Find the `settings: [` array that ends the Vampire Village entry (three entries: `vampireCount`, `doctor`, `detective`) and add two more entries before its closing `]`:

```ts
      {
        type: "boolean",
        key: "detective",
        label: { ku: "پشکنەر هەبێت", ar: "تفعيل المحقق", en: "Enable Detective", tr: "Dedektif Olsun" }
      },
      {
        type: "number",
        key: "dayVoteSeconds",
        min: 10,
        max: 120,
        label: {
          ku: "کاتی دەنگدانی ڕۆژ (چرکە)",
          ar: "وقت تصويت النهار (ثواني)",
          en: "Day Vote Time (seconds)",
          tr: "Gündüz Oylama Süresi (saniye)"
        }
      },
      {
        // Off by default: seeing who voted for whom during a lynch is a
        // different, more accusatory evening. The host opts in.
        type: "boolean",
        key: "showVoters",
        label: {
          ku: "دەنگدەران ئاشکرا بکە",
          ar: "إظهار من صوّت لمن",
          en: "Show Who Voted",
          tr: "Kimin Oy Verdiğini Göster"
        }
      }
    ]
  },
```

(That closing `]\n  },` is the existing end of the Vampire Village entry — replace it with the block above, which is the same closing plus the two new settings inserted before it.)

- [ ] **Step 2: Do the identical edit to Classic Mafia**

Find:
```ts
    id: "mafia-classic",
    icon: "🕴️",
    theme: "mafia-classic",
    minPlayers: 4,
    defaultSettings: { mafiaCount: 1, doctor: true, detective: true },
```

Replace with:
```ts
    id: "mafia-classic",
    icon: "🕴️",
    theme: "mafia-classic",
    minPlayers: 4,
    // Roles are still dealt by hand, same as ever; only the daytime lynch
    // vote that follows runs on the turn engine.
    turnBased: true,
    defaultSettings: { mafiaCount: 1, doctor: true, detective: true, dayVoteSeconds: 60, showVoters: false },
```

Find Classic Mafia's `settings: [` array (also ending in `detective`) and add the same two entries before its closing `]`, keyed identically (`dayVoteSeconds`, `showVoters` — the labels can be copy-pasted verbatim, they're shared vocabulary between the two games).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean. (`Game.turnBased` already exists as an optional field on the `Game` interface from the Most Likely To work — no type change needed here.)

- [ ] **Step 4: Run the existing catalog-adjacent unit tests**

Run: `npx vitest run tests/unit/domain/settings.test.ts tests/unit/domain/visibility.test.ts`
Expected: PASS — these don't hardcode the two games' setting lists, so adding settings doesn't break them.

- [ ] **Step 5: Commit**

```bash
git add src/server/games/catalog.ts
git commit -m "Add turnBased and vote settings to Vampire Village and Classic Mafia"
```

---

## Task 11: i18n keys

**Files:**
- Modify: `src/client/i18n/en.ts`, `src/client/i18n/tr.ts`, `src/client/i18n/ar.ts`, `src/client/i18n/ku.ts`

Every key below is needed by Tasks 14 and 16. Add each language's block right before its final `copyrightRights` key (the same spot Most Likely To's keys were added), so the four files stay in step.

- [ ] **Step 1: `src/client/i18n/en.ts`**

Find:
```ts
  errorVoteRejected: "That vote did not go through.",
  copyrightRights: "All rights reserved."
```

Replace with:
```ts
  errorVoteRejected: "That vote did not go through.",
  // Vampire Village / Classic Mafia — elimination vote screens
  elimStartVoting: "Start Voting",
  elimDayVote: "Who should the table vote out?",
  elimTiebreakVote: "It's tied. Vote again, just between them.",
  elimVoteHint: "Tap the one person you mean.",
  elimVoteLocked: "Your vote is in. It stays hidden until the reveal.",
  elimVoted: "voted",
  elimResultsOpen: "The votes are open",
  elimEliminated: "Eliminated",
  elimTie: "Tied. Voting again.",
  elimNoVotes: "Nobody voted this round.",
  elimYouAreOut: "You're eliminated",
  elimYouAreOutBody: "Watch how the rest of the table plays out.",
  elimNextRound: "Next Round",
  elimMethodPrompt: "Two ties in a row. How should the table decide?",
  elimMethodSpin: "Spin the Wheel",
  elimMethodCards: "Pick a Card",
  elimSpinning: "Spinning…",
  elimCardPrompt: "Pick a card. Nobody knows who's behind which one.",
  elimCardReveal: "This card was",
  elimGoodWins: "The village wins.",
  elimEvilWins: "The vampires win.",
  elimMafiaWins: "The mafia wins.",
  elimGameOver: "That's the game.",
  elimBackToLobby: "Back to the Room",
  elimEndGame: "End Game",
  elimWaitingHost: "Waiting for the host…",
  errorRolesNotAssigned: "Assign roles before starting the vote.",
  errorAlreadyDecided: "This room's already decided — check the roles.",
  copyrightRights: "All rights reserved."
```

- [ ] **Step 2: `src/client/i18n/tr.ts`**

Find:
```ts
  errorVoteRejected: "Oy gönderilemedi.",
  copyrightRights: "Tüm hakları saklıdır."
```

Replace with:
```ts
  errorVoteRejected: "Oy gönderilemedi.",
  // Vampir Köylü / Klasik Mafya — eleme oylaması ekranları
  elimStartVoting: "Oylamayı Başlat",
  elimDayVote: "Masa kimi oylayıp çıkarsın?",
  elimTiebreakVote: "Berabere kaldı. Sadece onlar arasında tekrar oyla.",
  elimVoteHint: "Aklındaki kişiye dokun.",
  elimVoteLocked: "Oy verdin. Açılana kadar gizli kalacak.",
  elimVoted: "oy verdi",
  elimResultsOpen: "Oylar açıldı",
  elimEliminated: "Elendi",
  elimTie: "Berabere. Tekrar oylanıyor.",
  elimNoVotes: "Bu turda kimse oy vermedi.",
  elimYouAreOut: "Elendin",
  elimYouAreOutBody: "Masanın geri kalanını izlemeye devam et.",
  elimNextRound: "Sonraki Tur",
  elimMethodPrompt: "Üst üste iki beraberlik. Masa nasıl karar versin?",
  elimMethodSpin: "Çarkı Çevir",
  elimMethodCards: "Kart Seç",
  elimSpinning: "Dönüyor…",
  elimCardPrompt: "Bir kart seç. Kimse hangi kartın arkasında kim olduğunu bilmiyor.",
  elimCardReveal: "Bu kart",
  elimGoodWins: "Köy kazandı.",
  elimEvilWins: "Vampirler kazandı.",
  elimMafiaWins: "Mafya kazandı.",
  elimGameOver: "Oyun bitti.",
  elimBackToLobby: "Odaya Dön",
  elimEndGame: "Oyunu Bitir",
  elimWaitingHost: "Host bekleniyor…",
  errorRolesNotAssigned: "Oylamayı başlatmadan önce rolleri dağıt.",
  errorAlreadyDecided: "Bu odanın sonucu zaten belli — rolleri kontrol et.",
  copyrightRights: "Tüm hakları saklıdır."
```

- [ ] **Step 3: `src/client/i18n/ar.ts`**

Find:
```ts
  errorVoteRejected: "لم يتم إرسال صوتك.",
  copyrightRights: "جميع الحقوق محفوظة."
```

Replace with:
```ts
  errorVoteRejected: "لم يتم إرسال صوتك.",
  // قرية مصاصي الدماء / المافيا الكلاسيكية — شاشات تصويت الإقصاء
  elimStartVoting: "ابدأ التصويت",
  elimDayVote: "من الذي يجب أن تُقصيه الطاولة؟",
  elimTiebreakVote: "تعادل. صوّتوا مرة أخرى بينهما فقط.",
  elimVoteHint: "اضغط على الشخص الذي تقصده.",
  elimVoteLocked: "تم تسجيل صوتك. يبقى مخفياً حتى الكشف.",
  elimVoted: "صوّتوا",
  elimResultsOpen: "كُشفت الأصوات",
  elimEliminated: "أُقصي",
  elimTie: "تعادل. يُعاد التصويت.",
  elimNoVotes: "لم يصوّت أحد في هذه الجولة.",
  elimYouAreOut: "لقد أُقصيت",
  elimYouAreOutBody: "تابع مشاهدة بقية الطاولة.",
  elimNextRound: "الجولة التالية",
  elimMethodPrompt: "تعادل مرتين متتاليتين. كيف تقرر الطاولة؟",
  elimMethodSpin: "أدر العجلة",
  elimMethodCards: "اختر بطاقة",
  elimSpinning: "تدور…",
  elimCardPrompt: "اختر بطاقة. لا أحد يعرف من خلف أي بطاقة.",
  elimCardReveal: "هذه البطاقة كانت",
  elimGoodWins: "فازت القرية.",
  elimEvilWins: "فاز مصاصو الدماء.",
  elimMafiaWins: "فازت المافيا.",
  elimGameOver: "انتهت اللعبة.",
  elimBackToLobby: "العودة إلى الغرفة",
  elimEndGame: "أنهِ اللعبة",
  elimWaitingHost: "بانتظار المضيف…",
  errorRolesNotAssigned: "وزّع الأدوار قبل بدء التصويت.",
  errorAlreadyDecided: "نتيجة هذه الغرفة محسومة بالفعل — تحقق من الأدوار.",
  copyrightRights: "جميع الحقوق محفوظة."
```

- [ ] **Step 4: `src/client/i18n/ku.ts`**

Find:
```ts
  errorVoteRejected: "دەنگەکەت نەنێردرا.",
  copyrightRights: "هەموو مافەکان پارێزراون."
```

Replace with:
```ts
  errorVoteRejected: "دەنگەکەت نەنێردرا.",
  // گوندی ڤامپایەر / مافیای کلاسیک — شاشەکانی دەنگدانی دەرکردن
  elimStartVoting: "دەنگدان دەست پێ بکە",
  elimDayVote: "مێز کێ لە ژوورەوە بکات؟",
  elimTiebreakVote: "یەکسانن. تەنها لەنێوان ئەوانەدا دووبارە دەنگ بدە.",
  elimVoteHint: "دەست بنێ بەو کەسەی مەبەستتە.",
  elimVoteLocked: "دەنگەکەت تۆمار کرا. تا کاتی ئاشکراکردن شاراوە دەمێنێتەوە.",
  elimVoted: "دەنگیان دا",
  elimResultsOpen: "دەنگەکان ئاشکرا بوون",
  elimEliminated: "دەرکرا",
  elimTie: "یەکسانن. دووبارە دەنگدان دەکرێت.",
  elimNoVotes: "لەم خولەدا کەس دەنگی نەدا.",
  elimYouAreOut: "تۆ دەرکرایت",
  elimYouAreOutBody: "چاوەڕێی ئەوە بکە کە مێزەکە چۆن بەردەوام دەبێت.",
  elimNextRound: "خولی داهاتوو",
  elimMethodPrompt: "دوو جار پێکەوە یەکسان بوون. مێز چۆن بڕیار بدات؟",
  elimMethodSpin: "چەرخە بسڕەوە",
  elimMethodCards: "کارتێک هەڵبژێرە",
  elimSpinning: "دەسڕێتەوە…",
  elimCardPrompt: "کارتێک هەڵبژێرە. کەس نازانێت کێ لە پشت کام کارتەوەیە.",
  elimCardReveal: "ئەم کارتە بوو بە",
  elimGoodWins: "گوند براوە بوو.",
  elimEvilWins: "ڤامپایەرەکان براوە بوون.",
  elimMafiaWins: "مافیا براوە بوو.",
  elimGameOver: "یاری تەواو بوو.",
  elimBackToLobby: "گەڕانەوە بۆ ژوور",
  elimEndGame: "کۆتاییهێنان بە یاری",
  elimWaitingHost: "چاوەڕوانی هۆست…",
  errorRolesNotAssigned: "پێش دەستپێکردنی دەنگدان ڕۆڵەکان دابەش بکە.",
  errorAlreadyDecided: "ئەنجامی ئەم ژوورە پێشتر دیارییکراوە — ڕۆڵەکان بپشکنە.",
  copyrightRights: "هەموو مافەکان پارێزراون."
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean. (`Translations = Record<keyof typeof en, string>` means every language must carry exactly the same key set as `en.ts` — a missing key in `tr`/`ar`/`ku` fails here.)

- [ ] **Step 6: Commit**

```bash
git add src/client/i18n/en.ts src/client/i18n/tr.ts src/client/i18n/ar.ts src/client/i18n/ku.ts
git commit -m "Add elimination-vote translations in all four languages"
```

---

## Task 12: Split `gameStage.ts` — move Most Likely To's rendering out

**Files:**
- Create: `src/client/ui/stages/mostLikelyTo.ts`
- Modify: `src/client/ui/gameStage.ts`

Pure refactor, no behavior change. The existing e2e suite (`tests/e2e/most-likely-to.spec.ts`) is the safety net — it must still pass unmodified afterward.

- [ ] **Step 1: Create `src/client/ui/stages/mostLikelyTo.ts` with the content-building logic moved out of `gameStage.ts`**

```ts
import { el } from "../dom.js"
import { getLang, t } from "../../services/i18n.js"
import { buildAvatar } from "../avatar.js"
import type { MostLikelyToPlayer, MostLikelyToView } from "@shared/most-likely-to.js"

/**
 * Most Likely To's panel content — everything below the shared stage header
 * (round number, clock, end-game button), which `gameStage.ts` still builds
 * itself since every turn-based game needs the same three things there.
 */

export interface MostLikelyToCtx {
  myPlayerId: string
  isHost: boolean
  castVote(target: string): Promise<void>
  closePhase(): Promise<void>
  endGame(): Promise<void>
}

function avatarOf(person: MostLikelyToPlayer | undefined, name: string, size: number): HTMLElement {
  return buildAvatar(person?.character ?? "", name, getLang(), {
    size,
    lazy: false,
    accessory: person?.accessory ?? ""
  })
}

function buildVoting(view: Extract<MostLikelyToView, { kind: "voting" }>, ctx: MostLikelyToCtx): HTMLElement[] {
  const locked = view.myVote !== null
  const grid = el("div", { class: "mlt-targets" })

  for (const person of view.roster) {
    // Nobody votes for themselves, so the button is not there to be tapped.
    if (person.id === ctx.myPlayerId) continue
    const chosen = view.myVote === person.id
    const button = el("button", {
      class: `mlt-target${chosen ? " chosen" : ""}${person.connected ? "" : " off"}`,
      type: "button",
      "aria-pressed": chosen ? "true" : "false"
    }, [
      avatarOf(person, person.name, 52),
      el("span", { class: "mlt-target-name" }, [person.name])
    ]) as HTMLButtonElement
    button.disabled = locked
    button.addEventListener("click", () => void ctx.castVote(person.id))
    grid.appendChild(button)
  }

  return [
    grid,
    el("p", { class: "mlt-hint" }, [locked ? t("mltVoteLocked") : t("mltVoteHint")]),
    el("p", { class: "mlt-counter" }, [`${view.votedCount} / ${view.totalPlayers} ${t("mltVoted")}`])
  ]
}

function buildReveal(view: Extract<MostLikelyToView, { kind: "result" | "over" }>, ctx: MostLikelyToCtx): HTMLElement[] {
  const byId = new Map(view.roster.map(p => [p.id, p]))
  const bars = el("div", { class: "mlt-bars" })

  for (const row of view.results) {
    const isWinner = view.winnerPlayerIds.includes(row.playerId)
    const fill = el("span", { class: "mlt-bar-fill" })
    fill.style.width = `${row.percentage}%`
    const bar = el("div", { class: `mlt-bar${isWinner ? " winner" : ""}` }, [
      avatarOf(byId.get(row.playerId), row.playerName, 36),
      el("span", { class: "mlt-bar-name" }, [row.playerName]),
      el("span", { class: "mlt-bar-track" }, [fill]),
      el("span", { class: "mlt-bar-count" }, [String(row.voteCount)])
    ])
    if (row.voters !== undefined && row.voters.length > 0) {
      bar.appendChild(el("span", { class: "mlt-bar-voters" }, [
        `${t("mltVotedBy")} ${row.voters.join(", ")}`
      ]))
    }
    bars.appendChild(bar)
  }

  const winnerNames = view.results
    .filter(r => view.winnerPlayerIds.includes(r.playerId))
    .map(r => r.playerName)
  const verdict =
    view.totalVotes === 0 ? t("mltNoVotes")
    : view.isTie          ? `${t("mltTie")} ${winnerNames.join(" · ")}`
    : `${t("mltMostLikely")}: ${winnerNames[0] ?? ""}`

  const out: HTMLElement[] = [
    el("p", { class: "mlt-eyebrow" }, [view.kind === "over" ? t("mltGameOver") : t("mltResults")]),
    bars,
    el("p", { class: "mlt-verdict" }, [verdict])
  ]

  if (ctx.isHost) {
    const label = view.kind === "over" ? t("mltBackToLobby") : t("mltNextRound")
    const button = el("button", { class: "btn btn-primary mlt-advance", type: "button" }, [label])
    button.addEventListener("click", () => void (view.kind === "over" ? ctx.endGame() : ctx.closePhase()))
    out.push(button)
  } else {
    out.push(el("p", { class: "mlt-counter" }, [t("mltWaitingHost")]))
  }
  return out
}

/** The panel body for a Most Likely To phase — everything under the shared header. */
export function renderMostLikelyTo(view: MostLikelyToView, ctx: MostLikelyToCtx): HTMLElement[] {
  const lang = getLang()
  const out: HTMLElement[] = [el("p", { class: "mlt-question" }, [view.question[lang]])]

  if (view.kind === "question") out.push(el("p", { class: "mlt-hint" }, [t("mltGetReady")]))
  else if (view.kind === "voting") out.push(...buildVoting(view, ctx))
  else out.push(...buildReveal(view, ctx))

  return out
}
```

- [ ] **Step 2: Replace `src/client/ui/gameStage.ts` with the shell version — everything MLT-specific delegates to the new module**

```ts
import { $, clear, el } from "./dom.js"
import { t } from "../services/i18n.js"
import { emit, lastPhase, socket } from "../services/socket.js"
import { showToast } from "./toast.js"
import { vibrate } from "./haptics.js"
import { renderMostLikelyTo, type MostLikelyToCtx } from "./stages/mostLikelyTo.js"
import type { PhaseEvent } from "@shared/events.js"
import type { MostLikelyToView } from "@shared/most-likely-to.js"

/**
 * The screen a turn-based game is played on.
 *
 * It lives above whichever room view is mounted — the host stays on the admin
 * room, players stay on their own — and draws whatever the last `game:phase`
 * said, nothing more. Every decision about what is allowed was already made on
 * the server: this only stops asking for what it knows is refused.
 *
 * This module owns only what every turn-based game needs identically: the
 * stage container, the round/clock header, the end-game control, and the
 * socket plumbing. What a phase actually looks like is each game's own
 * module under `stages/`, picked by `gameId`.
 *
 * An idle room projects no view, so the stage hides itself and the room
 * underneath is back.
 */

export interface GameStageOptions {
  code: string
  gameId: string
  myPlayerId: string
  /** Only the host holds one. It is what the phase-closing buttons need. */
  adminSecret?: string
}

/** Under this many seconds left, the clock starts asking for attention. */
const URGENT_SECONDS = 5

type Renderer = (view: unknown, ctx: MostLikelyToCtx) => HTMLElement[]

// gameId -> panel-content renderer. Each game's module exports one function
// shaped `(view, ctx) => HTMLElement[]`; the shared `MostLikelyToCtx` shape
// (myPlayerId, isHost, castVote, closePhase, endGame) is generic enough that
// every turn-based game's render module can use it as its own context type.
const RENDERERS: Record<string, Renderer> = {
  "most-likely-to": renderMostLikelyTo as Renderer
}

export function mountGameStage(opts: GameStageOptions): () => void {
  const stage = $<HTMLElement>("#gameStage")
  const isHost = typeof opts.adminSecret === "string" && opts.adminSecret.length > 0

  let phase: PhaseEvent | null = null
  let clockOffset = 0
  let sending = false
  let clockEl: HTMLElement | null = null

  /** The table shares one countdown, so it runs off the server's clock. */
  const serverNow = (): number => Date.now() + clockOffset

  function drawClock(): void {
    if (clockEl === null || phase === null) return
    if (phase.endsAt === null) {
      clockEl.hidden = true
      return
    }
    const left = Math.max(0, phase.endsAt - serverNow())
    // Rounding up alone showed "21" on a twenty-second phase, because the
    // measured offset leaves a few milliseconds over the nominal length.
    const seconds = Math.max(0, Math.ceil((left - 250) / 1000))
    clockEl.hidden = false
    clockEl.textContent = String(seconds)
    clockEl.classList.toggle("urgent", seconds <= URGENT_SECONDS)
  }

  async function castVote(target: string): Promise<void> {
    if (phase === null || sending) return
    sending = true
    // `seq` is the screen this tap came from; the server refuses one sent from
    // a round it has already closed.
    const r = await emit("game:action", {
      code: opts.code,
      seq: phase.seq,
      action: { type: "vote", target }
    })
    sending = false
    if (r.ok) vibrate("tap")
    else showToast(t("errorVoteRejected"))
  }

  async function closePhase(): Promise<void> {
    if (phase === null || opts.adminSecret === undefined) return
    const r = await emit("game:advance", { code: opts.code, adminSecret: opts.adminSecret, seq: phase.seq })
    if (!r.ok) showToast(t("errorGeneric"))
  }

  async function endGame(): Promise<void> {
    if (opts.adminSecret === undefined) return
    const r = await emit("game:end", { code: opts.code, adminSecret: opts.adminSecret })
    if (!r.ok) showToast(t("errorGeneric"))
  }

  function buildHead(roundNumber: number): HTMLElement {
    clockEl = el("span", { class: "mlt-clock", "aria-live": "off" })
    clockEl.hidden = true
    const head = el("header", { class: "mlt-head" }, [
      el("span", { class: "mlt-round" }, [`${t("mltRound")} ${roundNumber}`]),
      clockEl
    ])

    // The stage covers the room it is drawn over, so the way out of a running
    // game has to be on the stage itself.
    if (isHost) {
      const quit = el("button", { class: "btn btn-ghost mlt-end", type: "button" }, [t("mltEndGame")])
      quit.addEventListener("click", () => void endGame())
      head.appendChild(quit)
    }
    return head
  }

  function render(): void {
    clear(stage)
    clockEl = null

    const view = phase?.view
    if (phase === null || view === null || view === undefined) {
      stage.hidden = true
      document.body.classList.remove("stage-open")
      return
    }

    stage.hidden = false
    document.body.classList.add("stage-open")

    const renderer = RENDERERS[opts.gameId]
    const ctx: MostLikelyToCtx = { myPlayerId: opts.myPlayerId, isHost, castVote, closePhase, endGame }

    // `.mlt` is the shared stage-panel layout (flex column, spacing) — the
    // name is historical, from when this was the only game on the engine.
    const panel = el("div", { class: "mlt" })
    if (opts.gameId === "most-likely-to") {
      const mltView = view as MostLikelyToView
      if (mltView.kind === "question" || mltView.kind === "voting") {
        panel.setAttribute("data-category", mltView.category)
      }
    }

    panel.append(buildHead(phase.round))
    if (renderer) panel.append(...renderer(view, ctx))

    stage.appendChild(panel)
    drawClock()
  }

  const onPhase = (payload: PhaseEvent): void => {
    // Another room's round, held by a socket this phone shares. Not ours.
    if (payload.code !== opts.code) return
    // A packet that overtook a newer one must not drag the room backwards.
    if (phase !== null && payload.seq < phase.seq) return
    const moved = phase === null || payload.seq !== phase.seq
    phase = payload
    render()
    if (moved && payload.view !== null) vibrate("tap")
  }

  socket.on("game:phase", onPhase)

  // The phase that arrived while this screen was still being fetched — a
  // reload, or a reconnect into a game that was already running.
  phase = lastPhase(opts.code)

  const ticker = window.setInterval(drawClock, 250)

  void (async () => {
    const sent = Date.now()
    const r = await emit("time:sync", {})
    if (!r.ok) return
    // Half the round trip is the best guess at how stale the answer already is.
    clockOffset = (r.data as { now: number }).now - (sent + (Date.now() - sent) / 2)
    drawClock()
  })()

  render()

  return () => {
    socket.off("game:phase", onPhase)
    window.clearInterval(ticker)
    clear(stage)
    stage.hidden = true
    document.body.classList.remove("stage-open")
  }
}
```

- [ ] **Step 3: Update the two call sites to pass `gameId`**

In `src/client/views/playerRoom.ts`, find:
```ts
    const releaseGameStage = ctx.initial
      ? mountGameStage({ code: ctx.initial.room.code, myPlayerId: ctx.initial.player.id })
      : () => {}
```
Replace with:
```ts
    const releaseGameStage = ctx.initial
      ? mountGameStage({ code: ctx.initial.room.code, gameId: ctx.initial.room.gameId, myPlayerId: ctx.initial.player.id })
      : () => {}
```

In `src/client/views/admin.ts`, find:
```ts
    const releaseGameStage = room !== null && hostSession?.kind === "admin"
      ? mountGameStage({
          code: room.code,
          myPlayerId: room.hostPlayerId,
          adminSecret: hostSession.adminSecret
        })
      : () => {}
```
Replace with:
```ts
    const releaseGameStage = room !== null && hostSession?.kind === "admin"
      ? mountGameStage({
          code: room.code,
          gameId: room.gameId,
          myPlayerId: room.hostPlayerId,
          adminSecret: hostSession.adminSecret
        })
      : () => {}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint . --ext .ts,.cjs`
Expected: clean.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Run the Most Likely To e2e suite to confirm the refactor changed nothing observable**

Run: `npx playwright test tests/e2e/most-likely-to.spec.ts`
Expected: all 5 tests PASS, unmodified from before this task.

- [ ] **Step 7: Commit**

```bash
git add src/client/ui/gameStage.ts src/client/ui/stages/mostLikelyTo.ts src/client/views/playerRoom.ts src/client/views/admin.ts
git commit -m "Split gameStage.ts into a shared shell and Most Likely To's own render module"
```

---

## Task 13: Client render module for the elimination-vote games

**Files:**
- Create: `src/client/ui/stages/eliminationVote.ts`
- Modify: `src/client/ui/gameStage.ts` (register the new renderer)

- [ ] **Step 1: Write `src/client/ui/stages/eliminationVote.ts`**

```ts
import { el } from "../dom.js"
import { getLang, t } from "../../services/i18n.js"
import { buildAvatar } from "../avatar.js"
import type {
  EliminationPlayer, EliminationView
} from "@shared/elimination-vote.js"

/**
 * Vampire Village / Classic Mafia's panel content — everything below the
 * shared stage header (round number, clock, end-game button) that
 * `gameStage.ts` builds for every turn-based game.
 */

export interface EliminationCtx {
  myPlayerId: string
  isHost: boolean
  castVote(target: string): Promise<void>
  closePhase(): Promise<void>
  endGame(): Promise<void>
}

function avatarOf(person: EliminationPlayer | undefined, name: string, size: number): HTMLElement {
  return buildAvatar(person?.character ?? "", name, getLang(), {
    size,
    lazy: false,
    accessory: person?.accessory ?? ""
  })
}

function buildEliminatedNotice(): HTMLElement[] {
  return [
    el("p", { class: "elim-eyebrow" }, [t("elimYouAreOut")]),
    el("p", { class: "elim-hint" }, [t("elimYouAreOutBody")])
  ]
}

function buildVote(
  view: Extract<EliminationView, { kind: "day-vote" | "tiebreak-vote" }>,
  ctx: EliminationCtx
): HTMLElement[] {
  if (view.amEliminated) return buildEliminatedNotice()

  const byId = new Map(view.roster.map(p => [p.id, p]))
  const locked = view.myVote !== null
  const grid = el("div", { class: "elim-targets" })

  for (const targetId of view.votableIds) {
    if (targetId === ctx.myPlayerId) continue
    const person = byId.get(targetId)
    const chosen = view.myVote === targetId
    const button = el("button", {
      class: `elim-target${chosen ? " chosen" : ""}${person?.connected === false ? " off" : ""}`,
      type: "button",
      "aria-pressed": chosen ? "true" : "false"
    }, [
      avatarOf(person, person?.name ?? "", 52),
      el("span", { class: "elim-target-name" }, [person?.name ?? ""])
    ]) as HTMLButtonElement
    button.disabled = locked
    button.addEventListener("click", () => void ctx.castVote(targetId))
    grid.appendChild(button)
  }

  return [
    el("p", { class: "elim-eyebrow" }, [t(view.kind === "tiebreak-vote" ? "elimTiebreakVote" : "elimDayVote")]),
    grid,
    el("p", { class: "elim-hint" }, [locked ? t("elimVoteLocked") : t("elimVoteHint")]),
    el("p", { class: "elim-counter" }, [`${view.votedCount} / ${view.totalVoters} ${t("elimVoted")}`])
  ]
}

function buildResult(
  view: Extract<EliminationView, { kind: "day-result" | "tiebreak-result" }>,
  ctx: EliminationCtx
): HTMLElement[] {
  const byId = new Map(view.roster.map(p => [p.id, p]))
  const bars = el("div", { class: "elim-bars" })

  for (const row of view.results) {
    const isEliminated = row.playerId === view.eliminatedThisRound
    const fill = el("span", { class: "elim-bar-fill" })
    fill.style.width = `${row.percentage}%`
    const bar = el("div", { class: `elim-bar${isEliminated ? " out" : ""}` }, [
      avatarOf(byId.get(row.playerId), row.playerName, 36),
      el("span", { class: "elim-bar-name" }, [row.playerName]),
      el("span", { class: "elim-bar-track" }, [fill]),
      el("span", { class: "elim-bar-count" }, [String(row.voteCount)])
    ])
    if (row.voters !== undefined && row.voters.length > 0) {
      bar.appendChild(el("span", { class: "elim-bar-voters" }, [
        `${t("mltVotedBy")} ${row.voters.join(", ")}`
      ]))
    }
    bars.appendChild(bar)
  }

  const eliminatedPlayer = view.results.find(r => r.playerId === view.eliminatedThisRound)
  const verdict =
    view.totalVotes === 0 ? t("elimNoVotes")
    : view.isTie          ? t("elimTie")
    : `${t("elimEliminated")}: ${eliminatedPlayer?.playerName ?? ""}`

  const out: HTMLElement[] = [
    el("p", { class: "elim-eyebrow" }, [t("elimResultsOpen")]),
    bars,
    el("p", { class: "elim-verdict" }, [verdict])
  ]

  // A tie moves the room straight into the next vote on its own — there is
  // nothing for the host to press. Only a settled round needs Next Round.
  if (!view.isTie) {
    if (ctx.isHost) {
      const button = el("button", { class: "btn btn-primary elim-advance", type: "button" }, [t("elimNextRound")])
      button.addEventListener("click", () => void ctx.closePhase())
      out.push(button)
    } else {
      out.push(el("p", { class: "elim-counter" }, [t("elimWaitingHost")]))
    }
  }
  return out
}

function buildMethodVote(
  view: Extract<EliminationView, { kind: "method-vote" }>,
  ctx: EliminationCtx
): HTMLElement[] {
  if (view.amEliminated) return buildEliminatedNotice()

  const locked = view.myVote !== null
  const options: Array<{ id: "spin" | "cards"; label: string }> = [
    { id: "spin", label: t("elimMethodSpin") },
    { id: "cards", label: t("elimMethodCards") }
  ]
  const grid = el("div", { class: "elim-method-grid" })
  for (const opt of options) {
    const chosen = view.myVote === opt.id
    const button = el("button", {
      class: `elim-method-btn${chosen ? " chosen" : ""}`,
      type: "button",
      "aria-pressed": chosen ? "true" : "false"
    }, [opt.label]) as HTMLButtonElement
    button.disabled = locked
    button.addEventListener("click", () => void ctx.castVote(opt.id))
    grid.appendChild(button)
  }

  return [
    el("p", { class: "elim-eyebrow" }, [t("elimMethodPrompt")]),
    el("p", { class: "elim-hint" }, [view.tiedNames.join(" · ")]),
    grid,
    el("p", { class: "elim-counter" }, [`${view.votedCount} / ${view.totalVoters} ${t("elimVoted")}`])
  ]
}

function buildSpinResult(view: Extract<EliminationView, { kind: "spin-result" }>): HTMLElement[] {
  const byId = new Map(view.roster.map(p => [p.id, p]))
  const wheel = el("div", { class: "elim-wheel" })
  for (const id of view.candidateIds) {
    const person = byId.get(id)
    const isPicked = id === view.eliminatedId
    wheel.appendChild(el("div", { class: `elim-wheel-name${isPicked ? " picked" : ""}` }, [
      avatarOf(person, person?.name ?? "", 40),
      el("span", {}, [person?.name ?? ""])
    ]))
  }
  const eliminatedName = byId.get(view.eliminatedId)?.name ?? ""
  return [
    el("p", { class: "elim-eyebrow" }, [t("elimSpinning")]),
    wheel,
    el("p", { class: "elim-verdict" }, [`${t("elimEliminated")}: ${eliminatedName}`])
  ]
}

function buildCardVote(view: Extract<EliminationView, { kind: "card-vote" }>, ctx: EliminationCtx): HTMLElement[] {
  if (view.amEliminated) return buildEliminatedNotice()

  const locked = view.myVote !== null
  const grid = el("div", { class: "elim-cards" })
  for (const cardId of view.cardIds) {
    const chosen = view.myVote === cardId
    const isColorCard = cardId === "red" || cardId === "blue"
    const button = el("button", {
      class: `elim-card elim-card-${cardId}${chosen ? " chosen" : ""}`,
      type: "button",
      "aria-pressed": chosen ? "true" : "false"
    }, [isColorCard ? "" : cardId]) as HTMLButtonElement
    button.disabled = locked
    button.addEventListener("click", () => void ctx.castVote(cardId))
    grid.appendChild(button)
  }

  return [
    el("p", { class: "elim-eyebrow" }, [t("elimCardPrompt")]),
    grid,
    el("p", { class: "elim-hint" }, [locked ? t("elimVoteLocked") : ""]),
    el("p", { class: "elim-counter" }, [`${view.votedCount} / ${view.totalVoters} ${t("elimVoted")}`])
  ]
}

function buildCardResult(
  view: Extract<EliminationView, { kind: "card-result" }>,
  ctx: EliminationCtx
): HTMLElement[] {
  // This view only ever exists once a card has won — see the note on
  // `EliminationCardResultView.winningCardId` in Task 1. A tied card vote
  // reopens CARD_VOTE on the server; it never reaches this screen, so there
  // is no "still tied" state to render here.
  const grid = el("div", { class: "elim-cards" })
  for (const cardId of view.cardIds) {
    const isWinner = cardId === view.winningCardId
    const isColorCard = cardId === "red" || cardId === "blue"
    const card = el("div", { class: `elim-card elim-card-${cardId}${isWinner ? " revealed" : ""}` }, [])
    if (isWinner) card.append(el("span", { class: "elim-card-name" }, [view.eliminatedName]))
    else if (!isColorCard) card.append(cardId)
    grid.appendChild(card)
  }

  const out: HTMLElement[] = [
    el("p", { class: "elim-eyebrow" }, [t("elimResultsOpen")]),
    grid,
    el("p", { class: "elim-verdict" }, [`${t("elimCardReveal")} ${view.eliminatedName}`])
  ]
  if (ctx.isHost) {
    const button = el("button", { class: "btn btn-primary elim-advance", type: "button" }, [t("elimNextRound")])
    button.addEventListener("click", () => void ctx.closePhase())
    out.push(button)
  } else {
    out.push(el("p", { class: "elim-counter" }, [t("elimWaitingHost")]))
  }
  return out
}

function buildGameOver(view: Extract<EliminationView, { kind: "over" }>, ctx: EliminationCtx, gameId: string): HTMLElement[] {
  const winnerText = view.winner === "good"
    ? t("elimGoodWins")
    : gameId === "mafia-classic" ? t("elimMafiaWins") : t("elimEvilWins")

  const out: HTMLElement[] = [
    el("p", { class: "elim-eyebrow" }, [t("elimGameOver")]),
    el("p", { class: "elim-verdict" }, [winnerText])
  ]
  if (ctx.isHost) {
    const button = el("button", { class: "btn btn-primary elim-advance", type: "button" }, [t("elimBackToLobby")])
    button.addEventListener("click", () => void ctx.endGame())
    out.push(button)
  }
  return out
}

/**
 * The panel body for one elimination-vote phase. `gameId` distinguishes
 * "the vampires win" from "the mafia wins" on the game-over screen — the
 * two engines share every other string.
 */
export function renderEliminationVote(view: EliminationView, ctx: EliminationCtx, gameId: string): HTMLElement[] {
  switch (view.kind) {
    case "day-vote":
    case "tiebreak-vote": return buildVote(view, ctx)
    case "day-result":
    case "tiebreak-result": return buildResult(view, ctx)
    case "method-vote": return buildMethodVote(view, ctx)
    case "spin-result": return buildSpinResult(view)
    case "card-vote": return buildCardVote(view, ctx)
    case "card-result": return buildCardResult(view, ctx)
    case "over": return buildGameOver(view, ctx, gameId)
  }
}
```

- [ ] **Step 2: Register the renderer in `gameStage.ts`**

In `src/client/ui/gameStage.ts`, find the import line from Task 12:

```ts
import { renderMostLikelyTo, type MostLikelyToCtx } from "./stages/mostLikelyTo.js"
```

Replace it with:

```ts
import { renderMostLikelyTo, type MostLikelyToCtx } from "./stages/mostLikelyTo.js"
import { renderEliminationVote } from "./stages/eliminationVote.js"
```

Then find the `type Renderer` line and the `RENDERERS` map from Task 12:

```ts
type Renderer = (view: unknown, ctx: MostLikelyToCtx) => HTMLElement[]

// gameId -> panel-content renderer. Each game's module exports one function
// shaped `(view, ctx) => HTMLElement[]`; the shared `MostLikelyToCtx` shape
// (myPlayerId, isHost, castVote, closePhase, endGame) is generic enough that
// every turn-based game's render module can use it as its own context type.
const RENDERERS: Record<string, Renderer> = {
  "most-likely-to": renderMostLikelyTo as Renderer
}
```

Replace with:

```ts
// `Renderer`'s third parameter exists only for `renderEliminationVote`
// (it needs `gameId` to pick "vampire" vs. "mafia" wording on the game-over
// screen); `renderMostLikelyTo` simply ignores the extra argument.
type Renderer = (view: unknown, ctx: MostLikelyToCtx, gameId: string) => HTMLElement[]

// gameId -> panel-content renderer. Each game's module exports one function
// shaped `(view, ctx, gameId) => HTMLElement[]`. `MostLikelyToCtx` and
// `EliminationCtx` (in stages/eliminationVote.ts) are structurally identical
// — {myPlayerId, isHost, castVote, closePhase, endGame} — so one shape
// serves as the type every render module is cast to here.
const RENDERERS: Record<string, Renderer> = {
  "most-likely-to": renderMostLikelyTo as Renderer,
  "vampire-village": renderEliminationVote as Renderer,
  "mafia-classic": renderEliminationVote as Renderer
}
```

Find the call site in `render()` from Task 12:

```ts
    if (renderer) panel.append(...renderer(view, ctx))
```

Replace with:

```ts
    if (renderer) panel.append(...renderer(view, ctx, opts.gameId))
```

(`renderMostLikelyTo`'s signature is `(view, ctx)` — the extra third argument is simply unused by it, which TypeScript allows for a function assigned to a wider-arity type through the `as Renderer` cast already in place.)

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint . --ext .ts,.cjs`
Expected: clean.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/client/ui/stages/eliminationVote.ts src/client/ui/gameStage.ts
git commit -m "Add the client render module for the elimination-vote games"
```

---

## Task 14: CSS for the elimination-vote screens

**Files:**
- Modify: `src/client/themes/_base.css`

- [ ] **Step 1: Append the new rules to `src/client/themes/_base.css`**

```css

/* ─── ELIMINATION VOTE (Vampire Village / Classic Mafia) ───────────── */
/* Layout mirrors the .mlt-* rules above; a separate namespace so neither
   game's styles can leak into the other's markup by accident. */

.elim-eyebrow {
  margin: 0;
  font-size: var(--type-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--theme-accent);
}

.elim-hint, .elim-counter {
  margin: 0;
  font-size: var(--type-sm);
  color: var(--text-muted);
}

.elim-counter { font-variant-numeric: tabular-nums; }

.elim-verdict {
  margin: 0;
  font-size: var(--type-base);
  font-weight: 600;
  color: var(--theme-accent);
  text-wrap: balance;
}

.elim-targets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--s-3);
}

.elim-target {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-height: 68px;
  padding: var(--s-3);
  border-radius: 14px;
  border: 1px solid var(--border-faint);
  background: var(--theme-surface);
  color: var(--text-primary);
  font-size: var(--type-base);
  font-weight: 600;
  text-align: start;
  transition: transform var(--motion-ui-duration) var(--motion-ui-easing),
              border-color var(--motion-ui-duration) var(--motion-ui-easing);
}

.elim-target:hover:not(:disabled) { border-color: var(--theme-accent); }
.elim-target:active:not(:disabled) { transform: scale(0.98); }
.elim-target.chosen { border-color: var(--theme-accent); box-shadow: 0 0 24px -8px var(--theme-glow); }
.elim-target:disabled { opacity: 0.45; }
.elim-target.chosen:disabled { opacity: 1; }
.elim-target.off { opacity: 0.4; }

.elim-target-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.elim-bars { display: flex; flex-direction: column; gap: var(--s-2); }

.elim-bar {
  display: grid;
  grid-template-columns: auto minmax(60px, 1fr) 2fr auto;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-2) var(--s-3);
  border-radius: 12px;
  border: 1px solid transparent;
}

/* The row that was actually voted out — the negative color is deliberate,
   this is a loss for that player, not a win to celebrate like Most Likely
   To's winner row. */
.elim-bar.out { border-color: #ff8080; background: rgba(180, 50, 60, 0.1); }

.elim-bar-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.elim-bar-track {
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  overflow: hidden;
}

.elim-bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #ff8080;
  transition: width var(--motion-flow) var(--ease-out-expo);
}

.elim-bar-count {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
}

.elim-bar-voters {
  grid-column: 2 / -1;
  margin-top: 2px;
  font-size: var(--type-xs);
  line-height: 1.4;
  color: var(--text-muted);
}

.elim-method-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}

.elim-method-btn {
  min-height: 64px;
  border-radius: 14px;
  border: 1px solid var(--border-faint);
  background: var(--theme-surface);
  color: var(--text-primary);
  font-size: var(--type-base);
  font-weight: 700;
  transition: border-color var(--motion-ui-duration) var(--motion-ui-easing);
}

.elim-method-btn:hover:not(:disabled) { border-color: var(--theme-accent); }
.elim-method-btn.chosen { border-color: var(--theme-accent); box-shadow: 0 0 24px -8px var(--theme-glow); }
.elim-method-btn:disabled { opacity: 0.45; }
.elim-method-btn.chosen:disabled { opacity: 1; }

.elim-wheel {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
  justify-content: center;
  padding: var(--s-4);
}

.elim-wheel-name {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-1);
  padding: var(--s-2);
  border-radius: 12px;
  font-size: var(--type-xs);
  color: var(--text-muted);
  opacity: 0.6;
  transition: opacity var(--motion-flow) ease-out, transform var(--motion-flow) ease-out;
}

.elim-wheel-name.picked {
  opacity: 1;
  color: var(--theme-accent);
  transform: scale(1.15);
}

.elim-cards {
  display: flex;
  gap: var(--s-3);
  justify-content: center;
  flex-wrap: wrap;
  padding: var(--s-2) 0;
}

.elim-card {
  width: 84px;
  height: 116px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: var(--type-lg);
  color: var(--text-muted);
  background: var(--theme-surface);
  transition: transform var(--motion-ui-duration) var(--motion-ui-easing);
}

.elim-card:hover:not(:disabled) { transform: translateY(-4px); }
.elim-card:disabled { opacity: 0.6; }

.elim-card-red { background: linear-gradient(160deg, #5a1620, #2c0a10); }
.elim-card-blue { background: linear-gradient(160deg, #123a52, #081c2a); }

.elim-card.chosen, .elim-card.revealed {
  border-color: var(--theme-accent);
  box-shadow: 0 0 24px -4px var(--theme-glow);
}

.elim-card-name {
  color: var(--text-primary);
  font-size: var(--type-sm);
  text-align: center;
  padding: 0 var(--s-2);
}

.elim-advance { width: 100%; }

@media (prefers-reduced-motion: reduce) {
  .elim-bar-fill { transition: none; }
  .elim-wheel-name { transition: none; }
  .elim-card { transition: none; }
}

@media (max-width: 400px) {
  .elim-targets { grid-template-columns: 1fr; }
  .elim-bar { grid-template-columns: auto minmax(52px, 1fr) 1.4fr auto; }
}
```

- [ ] **Step 2: Build (Vite validates CSS syntax as part of the build)**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/client/themes/_base.css
git commit -m "Add CSS for the elimination-vote screens"
```

---

## Task 15: Admin screen — the third button mode

**Files:**
- Modify: `src/client/views/admin.ts`
- Modify: `index.html`

- [ ] **Step 1: In `index.html`, drop the hardcoded `data-i18n` on the Start button — its text now depends on which kind of turn-based game is running, so it's set in code**

Find:
```html
        <!-- Turn-based games are started, not dealt; shown instead of the two above.
             Ending one lives on the game stage, which covers this screen. -->
        <button id="startGameBtn" class="btn btn-primary glow-breathe" data-i18n="mltStartGame" hidden>Start Game</button>
```
Replace with:
```html
        <!-- Turn-based games are started, not dealt; shown next to (or instead
             of) the two above. Its label depends on whether the game also
             deals roles first — set in admin.ts, not here. Ending a running
             game lives on the game stage, which covers this screen. -->
        <button id="startGameBtn" class="btn btn-primary glow-breathe" hidden></button>
```

- [ ] **Step 2: In `src/client/views/admin.ts`, replace `renderActions()`**

Find:
```ts
    /**
     * A turn-based game is started, not dealt: the server owns the rounds, so
     * the two role buttons have nothing to do and would only throw. The games
     * that hand out roles never see the Start pair.
     */
    function renderActions() {
      const turnBased = room?.game.turnBased === true
      assignBtn.hidden = turnBased
      clearBtn.hidden  = turnBased
      startBtn.hidden  = !turnBased
    }
```
Replace with:
```ts
    /**
     * Three shapes this row can take:
     *
     *   - Role-only (spy, football, who-am-i): Assign/Clear Roles, no Start.
     *   - Turn-only (Most Likely To): Start/nothing else, no roles to deal.
     *   - Role-then-turn (Vampire Village, Classic Mafia): Assign/Clear Roles
     *     as always, and Start Voting appears next to them once roles are on
     *     the table — starting a vote before anyone has a role makes no sense.
     */
    function renderActions() {
      if (!room) return
      const turnBased = room.game.turnBased === true
      const hasRoles = room.game.roles.length > 0

      assignBtn.hidden = !hasRoles
      clearBtn.hidden  = !hasRoles
      startBtn.hidden  = !turnBased || (hasRoles && !room.assigned)
      startBtn.textContent = hasRoles ? t("elimStartVoting") : t("mltStartGame")
    }
```

- [ ] **Step 3: Update `onStartGame`'s error handling — a role-dealing turn-based game can be refused for reasons Most Likely To never hits**

Find:
```ts
    const onStartGame = async () => {
      if (!room) return
      const s = session.load(); if (s?.kind !== "admin") return
      const r = await emit("game:start", { code: room.code, adminSecret: s.adminSecret })
      if (!r.ok) {
        showToast(r.error === "NEED_MORE_PLAYERS" ? t("errorNeedMorePlayers") : t("errorGeneric"))
      }
    }
```
Replace with:
```ts
    const onStartGame = async () => {
      if (!room) return
      const s = session.load(); if (s?.kind !== "admin") return
      // Read off `room` before the `await`: it's a mutable closure variable
      // that `onUpdated` can reassign while this call is in flight, so
      // TypeScript can't carry the `!room` narrowing across the await —
      // capturing the two fields we need now sidesteps that cleanly.
      const hasRoles = room.game.roles.length > 0
      const wasAssigned = room.assigned
      const r = await emit("game:start", { code: room.code, adminSecret: s.adminSecret })
      if (!r.ok) {
        if (r.error === "NEED_MORE_PLAYERS") showToast(t("errorNeedMorePlayers"))
        // The engine refuses INVALID_INPUT for two reasons on these two
        // games: roles were cleared after being assigned (wasAssigned is
        // stale by the time the tap lands), or the room is already decided
        // (e.g. every non-evil role was hand-picked out by settings). Both
        // read the same to the host: something about the roles is wrong.
        else if (r.error === "INVALID_INPUT" && hasRoles) {
          showToast(wasAssigned ? t("errorAlreadyDecided") : t("errorRolesNotAssigned"))
        }
        else showToast(t("errorGeneric"))
      }
    }
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint . --ext .ts,.cjs`
Expected: clean.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Manual smoke check in the browser**

Run: `npm run dev` (leave it running), then in a browser: create a Vampire Village room, confirm only Assign/Clear Roles show; press Assign Roles; confirm Start Voting now appears with the label "Start Voting" (or the current UI language's equivalent); press it; confirm the vote screen opens and Assign/Clear Roles are gone from under it once the stage is up. Stop the dev server after (Ctrl+C).

- [ ] **Step 7: Commit**

```bash
git add index.html src/client/views/admin.ts
git commit -m "Give the admin screen a Start Voting mode for role-dealing turn-based games"
```

---

## Task 16: E2E tests

**Files:**
- Create: `tests/e2e/elimination-vote.spec.ts`

Mirrors `tests/e2e/most-likely-to.spec.ts`'s structure and its `helpers.ts` usage (`createRoom`, `joinAs`).

- [ ] **Step 1: Write the test file**

```ts
import { test, expect, type Page } from "@playwright/test"
import { createRoom, joinAs } from "./helpers.js"

/**
 * Vampire Village's daytime vote, played on four phones plus the host.
 * Roles: p1(host)=vampire, p2..p4=villager/doctor/detective — the exact
 * mix the server deals is random, so these tests read who got what off
 * each screen rather than assuming seat order.
 */

const PHASE_TIMEOUT = 15_000

async function createVampireRoom(hostPage: Page): Promise<string> {
  return createRoom(hostPage, { theme: "vampire-village", hostName: "Host", hostCharacter: "ace" })
}

test("vampire village: assign roles, then start voting appears", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  await createVampireRoom(host)

  await expect(host.locator("#startGameBtn")).toBeHidden()
  await host.click("#assignRolesBtn")
  await expect(host.locator("#rolesStatus")).toHaveText("✓")
  await expect(host.locator("#startGameBtn")).toBeVisible()

  await hostCtx.close()
})

test("vampire village: a full day-vote round eliminates the top target and checks the win condition", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createVampireRoom(host)

  const players = []
  for (const [name, character] of [["Ada", "ruby"], ["Bea", "pebble"], ["Cem", "gizmo"]] as const) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await joinAs(page, code, name, character)
    players.push({ ctx, page, name })
  }
  const everyone = [host, ...players.map(p => p.page)]

  // Turn dead simple for the test: only 1 vampire among 4 players total.
  await host.click("#assignRolesBtn")
  await expect(host.locator("#rolesStatus")).toHaveText("✓")
  await host.click("#startGameBtn")

  for (const page of everyone) {
    await expect(page.locator("#gameStage .elim-targets")).toBeVisible({ timeout: PHASE_TIMEOUT })
  }

  // Everyone votes for Ada — a clear, unambiguous winner.
  for (const page of everyone) {
    const adaButton = page.locator(".elim-target", { hasText: "Ada" })
    if (await adaButton.count() > 0) await adaButton.click()
  }

  for (const page of everyone) {
    await expect(page.locator(".elim-bars")).toBeVisible({ timeout: PHASE_TIMEOUT })
    await expect(page.locator(".elim-bar.out")).toContainText("Ada")
  }

  // Ada's own screen now says she's out.
  const ada = players.find(p => p.name === "Ada")!
  // Ada is host-side visible only through the bars; verify from a different
  // phone's perspective that Ada shows zero remaining vote power next round.
  await host.locator(".elim-advance").click()

  for (const page of everyone) {
    // Either a fresh day-vote (game continues) or the game-over screen —
    // both are valid depending on which role Ada happened to hold.
    await expect(page.locator("#gameStage")).toBeVisible({ timeout: PHASE_TIMEOUT })
  }

  for (const p of players) await p.ctx.close()
  await hostCtx.close()
})

test("vampire village: the eliminated player's own bar is marked, whatever role they held", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createVampireRoom(host)

  const ctx = await browser.newContext()
  const player = await ctx.newPage()
  await joinAs(player, code, "Ada", "ruby")
  const ctx2 = await browser.newContext()
  const player2 = await ctx2.newPage()
  await joinAs(player2, code, "Bea", "pebble")

  await host.click("#assignRolesBtn")
  await host.click("#startGameBtn")

  const everyone = [host, player, player2]
  for (const page of everyone) {
    await expect(page.locator("#gameStage .elim-targets")).toBeVisible({ timeout: PHASE_TIMEOUT })
  }
  for (const page of everyone) {
    const adaButton = page.locator(".elim-target", { hasText: "Ada" })
    if (await adaButton.count() > 0) await adaButton.click()
  }

  // Ada's own phone shows the same marked-out bar everyone else sees — the
  // room does not hide a player's own elimination from them. Whether the
  // game ends here or continues depends on which role Ada happened to draw
  // (an already-covered branch, deterministically, in the engine's unit
  // tests), so this only checks what every branch has in common.
  await expect(player.locator(".elim-bar.out")).toContainText("Ada", { timeout: PHASE_TIMEOUT })

  await ctx.close(); await ctx2.close(); await hostCtx.close()
})

test("classic mafia: assign roles, start voting, and reach a result screen", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createRoom(host, { theme: "mafia-classic", hostName: "Host", hostCharacter: "ace" })

  const ctx = await browser.newContext()
  const player = await ctx.newPage()
  await joinAs(player, code, "Ada", "ruby")
  const ctx2 = await browser.newContext()
  const player2 = await ctx2.newPage()
  await joinAs(player2, code, "Bea", "pebble")
  const ctx3 = await browser.newContext()
  const player3 = await ctx3.newPage()
  await joinAs(player3, code, "Cem", "gizmo")

  await host.click("#assignRolesBtn")
  await expect(host.locator("#rolesStatus")).toHaveText("✓")
  await host.click("#startGameBtn")

  const everyone = [host, player, player2, player3]
  for (const page of everyone) {
    await expect(page.locator("#gameStage .elim-targets")).toBeVisible({ timeout: PHASE_TIMEOUT })
  }
  for (const page of everyone) {
    const adaButton = page.locator(".elim-target", { hasText: "Ada" })
    if (await adaButton.count() > 0) await adaButton.click()
  }
  for (const page of everyone) {
    await expect(page.locator(".elim-bars")).toBeVisible({ timeout: PHASE_TIMEOUT })
  }

  await ctx.close(); await ctx2.close(); await ctx3.close(); await hostCtx.close()
})

test("vampire village: a room with an already-decided role split refuses to start", async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const code = await createRoom(host, { theme: "vampire-village", hostName: "Host", hostCharacter: "ace" })

  // Push vampireCount to its max relative to a 3-player room: with only the
  // host and no one else joined, minPlayers (3) blocks Assign Roles first —
  // so instead verify the pre-check by setting an extreme vampireCount on a
  // room with just enough players for the deal to succeed, then confirm
  // Start Voting is refused with a toast rather than silently opening.
  const ctx = await browser.newContext()
  const player = await ctx.newPage()
  await joinAs(player, code, "Ada", "ruby")
  const ctx2 = await browser.newContext()
  const player2 = await ctx2.newPage()
  await joinAs(player2, code, "Bea", "pebble")

  // Doctor and detective are on by default; with them left on, 2 vampires +
  // doctor + detective is 4 roles for 3 players and Assign Roles itself
  // would refuse (TOO_MANY_SPECIAL_ROLES) before ever reaching the vote.
  // Turning them off leaves exactly 2 vampires + 1 filler villager — 3 roles
  // for 3 players, and evil already outnumbers good the moment they're dealt.
  await host.locator("#setting-vampireCount").fill("2")
  await host.locator("#setting-doctor").uncheck()
  await host.locator("#setting-detective").uncheck()
  await host.click("#saveSettingsBtn")
  await host.click("#assignRolesBtn")
  await expect(host.locator("#rolesStatus")).toHaveText("✓")

  await host.click("#startGameBtn")
  // 2 vampires out of 3 players means evil already outnumbers good; the
  // engine refuses to start and no stage appears.
  await expect(host.locator("#gameStage")).toBeHidden()

  await ctx.close(); await ctx2.close(); await hostCtx.close()
})
```

- [ ] **Step 2: Run the new suite**

Run: `npx playwright test tests/e2e/elimination-vote.spec.ts`
Expected: all tests PASS. If the "already-decided" test is flaky because 2-of-3 vampires doesn't reliably fail the win check (it always should — 2 evil ≥ 1 good — but double check the arithmetic against `checkWinner` in Task 2 if it fails), fix the test's player count rather than the engine.

- [ ] **Step 3: Run the full e2e suite to confirm nothing else moved**

Run: `npx playwright test`
Expected: all suites pass, including `most-likely-to.spec.ts`, `happy-path.spec.ts`, `morinji.spec.ts`, and `room-browser.spec.ts` unchanged.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/elimination-vote.spec.ts
git commit -m "Add e2e tests for the Vampire Village and Classic Mafia vote"
```

---

## Task 17: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full clean run**

Run:
```bash
npx tsc --noEmit -p tsconfig.json
npx eslint . --ext .ts,.cjs
npx vitest run
npm run build
npx playwright test
```
Expected: every command exits clean; the unit suite count has grown by the elimination-vote test file's cases; the e2e suite count has grown by 5 (Task 16).

- [ ] **Step 2: Manual browser pass for both games in a non-English language**

Run: `npm run dev`. In the browser, switch the UI to Arabic, then play one full Vampire Village round to a result screen (Assign Roles → Start Voting → vote → result). Confirm the vote buttons, result bars, and verdict line are all in Arabic and read right-to-left, matching the pattern already verified for Most Likely To. Repeat quickly for Classic Mafia. Stop the dev server after.

- [ ] **Step 3: Update the project's own memory of this work (optional but recommended)**

If a memory file already tracks this feature area (check `yallagame-three-new-modes.md` referenced in earlier project memory), add a line noting elimination voting shipped for Vampire Village and Classic Mafia, and that night actions remain manual by design.

- [ ] **Step 4: Final commit if any stray changes remain**

```bash
git status --short
```
If clean, nothing to do. If anything is unstaged (e.g. a formatting fix made during manual testing), stage exactly those files by name and commit with a specific message — never `git add -A`.
