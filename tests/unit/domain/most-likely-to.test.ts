import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { GameOverEvent, PhaseEvent } from "@shared/events.js"
import type { Room } from "@shared/types.js"
import { MemoryStore } from "@server/store/memory-store.js"
import { cancelAllTimers } from "@server/domain/scheduler.js"
import {
  hostAdvance, onPlayerLeft, startGame, submitAction, type EngineDeps
} from "@server/domain/engine.js"
import { isTurnBased, resolveEngine } from "@server/games/engines.js"
import { resolveGame } from "@server/games/catalog.js"
import {
  GAME_OVER, MOST_LIKELY_TO_ID, QUESTION_DISPLAY, ROUND_RESULT, VOTING,
  mostLikelyToEngine, tally
} from "@server/games/most-likely-to.js"
import { MOST_LIKELY_TO_QUESTIONS } from "@server/games/questions/most-likely-to.js"
import type { MostLikelyToResult, MostLikelyToView } from "@shared/most-likely-to.js"

const VOTING_MS = 20_000
const READ_MS = 5_000

function mkRoom(overrides: Partial<Room> = {}): Room {
  const now = Date.now()
  return {
    code: "MLT01", gameId: MOST_LIKELY_TO_ID, adminSecret: "s3cret", assigned: false,
    settings: { votingSeconds: 20, roundCount: 5 },
    players: [
      { id: "p1", name: "Ali", role: null, connected: true, character: "owl" },
      { id: "p2", name: "Mahmud", role: null, connected: true, character: "fox" },
      { id: "p3", name: "Morinji", role: null, connected: true, character: "wolf" }
    ],
    createdAt: now, updatedAt: now,
    hostPlayerId: "p1", isPublic: false, requireApproval: false, pending: [],
    phase: "idle", phaseSeq: 0, phaseEndsAt: null, round: 0, gameState: {}, scores: {},
    ...overrides
  }
}

interface Harness {
  deps: EngineDeps
  store: MemoryStore
  phases: Array<{ playerId: string; payload: PhaseEvent }>
  overs: GameOverEvent[]
  room(): Promise<Room>
  seq(): Promise<number>
  viewFor(playerId: string): Promise<MostLikelyToView>
}

async function harness(room: Room = mkRoom()): Promise<Harness> {
  const store = new MemoryStore()
  await store.create(room)
  const phases: Harness["phases"] = []
  const overs: GameOverEvent[] = []
  const deps: EngineDeps = {
    store,
    resolveEngine,
    // Always the first question still unused, so a round is reproducible.
    rng: () => 0,
    emitPhase: (_code, playerId, payload) => { phases.push({ playerId, payload }) },
    emitOver: (_code, payload) => { overs.push(payload) }
  }
  return {
    deps, store, phases, overs,
    async room() { return (await store.get(room.code))! },
    async seq() { return (await store.get(room.code))!.phaseSeq },
    async viewFor(playerId) {
      return mostLikelyToEngine.view((await store.get(room.code))!, playerId) as MostLikelyToView
    }
  }
}

/** Start, then run the reading clock down so the room is taking votes. */
async function atVoting(h: Harness): Promise<number> {
  await startGame(h.deps, "MLT01", "s3cret")
  await vi.advanceTimersByTimeAsync(READ_MS)
  return h.seq()
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { cancelAllTimers(); vi.useRealTimers() })

describe("registration", () => {
  it("is the engine the server resolves for its own slug", () => {
    expect(resolveEngine(MOST_LIKELY_TO_ID)).toBe(mostLikelyToEngine)
    expect(isTurnBased(MOST_LIKELY_TO_ID)).toBe(true)
  })

  it("leaves the role-dealing games off the turn engine", () => {
    for (const id of ["vampire-village", "mafia-classic", "spy-game", "who-am-i", "football-player-guess"]) {
      expect(resolveEngine(id)).toBeUndefined()
      expect(isTurnBased(id)).toBe(false)
    }
  })

  it("is in the catalogue, needs two players, and is marked turn-based", () => {
    const game = resolveGame(MOST_LIKELY_TO_ID)
    expect(game).toBeDefined()
    expect(game!.minPlayers).toBe(2)
    expect(game!.turnBased).toBe(true)
  })

  it("seeds every question in all four languages", () => {
    for (const question of MOST_LIKELY_TO_QUESTIONS) {
      for (const lang of ["en", "tr", "ar", "ku"] as const) {
        expect(question.text[lang].length).toBeGreaterThan(0)
      }
    }
  })
})

describe("a round", () => {
  it("opens on a question and moves to voting on its own", async () => {
    const h = await harness()
    const started = await startGame(h.deps, "MLT01", "s3cret")

    expect(started.phase).toBe(QUESTION_DISPLAY)
    expect(started.round).toBe(1)
    const shown = await h.viewFor("p1")
    expect(shown.kind).toBe("question")
    expect(shown.question.tr.length).toBeGreaterThan(0)

    await vi.advanceTimersByTimeAsync(READ_MS)
    const room = await h.room()
    expect(room.phase).toBe(VOTING)
    expect(room.phaseEndsAt).toBe(Date.now() + VOTING_MS)
  })

  it("never asks the same question twice in one game", async () => {
    const h = await harness()
    await startGame(h.deps, "MLT01", "s3cret")
    const asked = new Set<string>()

    for (let round = 0; round < 4; round++) {
      const state = (await h.room()).gameState as { questionId: string }
      expect(asked.has(state.questionId)).toBe(false)
      asked.add(state.questionId)
      await vi.advanceTimersByTimeAsync(READ_MS + VOTING_MS)
      await hostAdvance(h.deps, "MLT01", "s3cret", await h.seq())
    }
    expect(asked.size).toBe(4)
  })

  it("locks the round when the clock runs out, missing votes and all", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p2" })

    await vi.advanceTimersByTimeAsync(VOTING_MS)

    const room = await h.room()
    expect(room.phase).toBe(ROUND_RESULT)
    // No clock of its own: the table argues for as long as it likes.
    expect(room.phaseEndsAt).toBeNull()
    expect((await h.viewFor("p2") as MostLikelyToResult).totalVotes).toBe(1)
  })

  it("opens the votes early once every phone has answered", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p2" })
    await submitAction(h.deps, "MLT01", "p2", seq, { type: "vote", target: "p3" })
    await submitAction(h.deps, "MLT01", "p3", seq, { type: "vote", target: "p2" })

    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.room()).phase).toBe(ROUND_RESULT)
  })

  it("hands the next round to the host, not to a clock", async () => {
    const h = await harness()
    await atVoting(h)
    await vi.advanceTimersByTimeAsync(VOTING_MS)

    await hostAdvance(h.deps, "MLT01", "s3cret", await h.seq())
    const room = await h.room()
    expect(room.phase).toBe(QUESTION_DISPLAY)
    expect(room.round).toBe(2)
    expect((room.gameState as { votes: unknown[] }).votes).toEqual([])
  })

  it("ends the game after the last round", async () => {
    const h = await harness(mkRoom({ settings: { votingSeconds: 20, roundCount: 2 } }))
    await startGame(h.deps, "MLT01", "s3cret")

    for (let round = 0; round < 2; round++) {
      await vi.advanceTimersByTimeAsync(READ_MS + VOTING_MS)
      await hostAdvance(h.deps, "MLT01", "s3cret", await h.seq())
    }

    expect((await h.room()).phase).toBe(GAME_OVER)
    expect(h.overs).toHaveLength(1)
    expect((await h.viewFor("p1")).kind).toBe("over")
  })
})

describe("what a vote is refused for", () => {
  it("refuses a vote for yourself", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    await expect(
      submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p1" })
    ).rejects.toThrow("INVALID_INPUT")
    expect((await h.room()).gameState).toMatchObject({ votes: [] })
  })

  it("refuses a second vote in the same round", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p2" })

    await expect(
      submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p3" })
    ).rejects.toThrow("INVALID_INPUT")

    const votes = (await h.room()).gameState as { votes: Array<{ targetId: string }> }
    expect(votes.votes).toHaveLength(1)
    expect(votes.votes[0]!.targetId).toBe("p2")
  })

  it("refuses a vote while the question is still being read", async () => {
    const h = await harness()
    await startGame(h.deps, "MLT01", "s3cret")
    await expect(
      submitAction(h.deps, "MLT01", "p1", await h.seq(), { type: "vote", target: "p2" })
    ).rejects.toThrow("GAME_NOT_RUNNING")
  })

  it("refuses a vote that arrives after the round is locked", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    await vi.advanceTimersByTimeAsync(VOTING_MS)

    // The phone was still showing the voting screen when the finger landed.
    await expect(
      submitAction(h.deps, "MLT01", "p3", seq, { type: "vote", target: "p1" })
    ).rejects.toThrow("PHASE_STALE")
    expect((await h.viewFor("p1") as MostLikelyToResult).totalVotes).toBe(0)
  })

  it("refuses a vote for somebody who is not in the room", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    await expect(
      submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "ghost" })
    ).rejects.toThrow("INVALID_INPUT")
  })

  it("refuses a move that is not a vote", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    await expect(
      submitAction(h.deps, "MLT01", "p1", seq, { type: "shout", target: "p2" })
    ).rejects.toThrow("INVALID_INPUT")
  })
})

describe("what the table is allowed to see", () => {
  it("keeps the votes secret while they are being cast", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    h.phases.length = 0
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p2" })

    const mine = await h.viewFor("p1")
    const theirs = await h.viewFor("p3")
    expect(mine).toMatchObject({ kind: "voting", myVote: "p2", votedCount: 1, totalPlayers: 3 })
    expect(theirs).toMatchObject({ kind: "voting", myVote: null, votedCount: 1 })

    // Everybody learns that one vote is in; nobody but p1 learns it was for p2.
    const others = h.phases.filter(p => p.playerId !== "p1")
    for (const { payload } of others) {
      expect(JSON.stringify(payload.view)).not.toContain("\"myVote\":\"p2\"")
    }
  })
})

describe("counting the round", () => {
  function resultRoom(votes: Array<[string, string]>): Room {
    return mkRoom({
      phase: ROUND_RESULT, phaseSeq: 3, round: 1, phaseEndsAt: null,
      gameState: {
        questionId: "become-famous",
        asked: ["become-famous"],
        votes: votes.map(([voterId, targetId]) => ({ round: 1, voterId, targetId, createdAt: 0 }))
      }
    })
  }

  it("counts the votes, ranks them, and names one winner", () => {
    const result = tally(resultRoom([["p1", "p2"], ["p3", "p2"], ["p2", "p1"]]))

    expect(result.totalVotes).toBe(3)
    expect(result.results.map(r => [r.playerId, r.voteCount])).toEqual([["p2", 2], ["p1", 1], ["p3", 0]])
    expect(result.results.map(r => r.percentage)).toEqual([67, 33, 0])
    expect(result.winnerPlayerIds).toEqual(["p2"])
    expect(result.isTie).toBe(false)
    expect(result.roundNumber).toBe(1)
  })

  it("reports a tie rather than picking between the two", () => {
    const result = tally(resultRoom([["p1", "p2"], ["p2", "p3"]]))

    expect(result.winnerPlayerIds).toEqual(["p2", "p3"])
    expect(result.isTie).toBe(true)
    expect(result.results.map(r => r.percentage)).toEqual([50, 50, 0])
  })

  it("has no winner at all in a round nobody voted in", () => {
    const result = tally(resultRoom([]))

    expect(result.totalVotes).toBe(0)
    expect(result.winnerPlayerIds).toEqual([])
    expect(result.isTie).toBe(false)
    expect(result.results.every(r => r.percentage === 0)).toBe(true)
  })

  it("says how many pointed and never who, unless the host asked for names", () => {
    const secret = tally(resultRoom([["p1", "p2"], ["p3", "p2"]]))
    expect(secret.results.every(r => r.voters === undefined)).toBe(true)
    // The field is absent, not an empty list that leaks a count of nothing.
    expect(JSON.stringify(secret)).not.toContain("voters")
  })

  it("names the voters once the host turns showVoters on", () => {
    const room = resultRoom([["p1", "p2"], ["p3", "p2"], ["p2", "p1"]])
    const named = tally({ ...room, settings: { ...room.settings, showVoters: true } })

    const byId = new Map(named.results.map(r => [r.playerId, r.voters]))
    expect(byId.get("p2")).toEqual(["Ali", "Morinji"])
    expect(byId.get("p1")).toEqual(["Mahmud"])
    // Everybody carries the field, so a nil row is an empty list, not a gap.
    expect(byId.get("p3")).toEqual([])
  })

  it("drops a vote cast for somebody who has since left the room", () => {
    const room = resultRoom([["p1", "p2"], ["p3", "gone"]])
    const result = tally(room)

    expect(result.totalVotes).toBe(1)
    expect(result.winnerPlayerIds).toEqual(["p2"])
  })
})

describe("names stay sealed until the reveal", () => {
  it("keeps the voters out of the voting screen even with showVoters on", async () => {
    const h = await harness(mkRoom({ settings: { votingSeconds: 20, roundCount: 5, showVoters: true } }))
    const seq = await atVoting(h)
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p2" })

    // A round the table can watch being cast is not the same game.
    const shown = await h.viewFor("p3")
    expect(shown.kind).toBe("voting")
    // Names are on this screen as buttons; what must not be here is which of
    // them has already pointed, and at whom.
    expect(JSON.stringify(shown)).not.toContain("voters")
    expect(shown).toMatchObject({ myVote: null, votedCount: 1 })

    await vi.advanceTimersByTimeAsync(VOTING_MS)
    const opened = await h.viewFor("p3") as MostLikelyToResult
    expect(opened.results.find(r => r.playerId === "p2")?.voters).toEqual(["Ali"])
  })
})

describe("a phone that goes dark", () => {
  it("is not waited on once the rest of the room has voted", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p2" })
    await submitAction(h.deps, "MLT01", "p2", seq, { type: "vote", target: "p1" })

    expect(mostLikelyToEngine.pending(await h.room())).toEqual(["p3"])
    await h.store.update("MLT01", r => ({
      ...r, players: r.players.map(p => p.id === "p3" ? { ...p, connected: false } : p)
    }))
    expect(mostLikelyToEngine.pending(await h.room())).toEqual([])
  })

  it("does not cut the reading clock short when a phone drops before anyone votes", async () => {
    const h = await harness()
    await startGame(h.deps, "MLT01", "s3cret")
    expect((await h.room()).phase).toBe(QUESTION_DISPLAY)

    // One second into the five-second reading clock, a phone drops.
    await vi.advanceTimersByTimeAsync(1_000)
    await h.store.update("MLT01", r => ({
      ...r, players: r.players.map(p => p.id === "p3" ? { ...p, connected: false } : p)
    }))
    await onPlayerLeft(h.deps, "MLT01")

    // The grace period alone would have closed it by now; the full reading
    // clock must not.
    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.room()).phase).toBe(QUESTION_DISPLAY)

    await vi.advanceTimersByTimeAsync(READ_MS - 1_000 - 1_200)
    expect((await h.room()).phase).toBe(VOTING)
  })

  it("does not count a vote toward the live readout once its voter has left", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p2" })

    await h.store.update("MLT01", r => ({
      ...r, players: r.players.map(p => p.id === "p1" ? { ...p, connected: false } : p)
    }))

    const shown = await h.viewFor("p2")
    expect(shown).toMatchObject({ kind: "voting", votedCount: 0, totalPlayers: 2 })
  })
})
