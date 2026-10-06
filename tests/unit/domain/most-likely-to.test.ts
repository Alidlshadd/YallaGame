import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { GameOverEvent, PhaseEvent } from "@shared/events.js"
import type { Room } from "@shared/types.js"
import { MemoryStore } from "@server/store/memory-store.js"
import { cancelAllTimers } from "@server/domain/scheduler.js"
import {
  hostAdvance, onPlayerLeft, startGame, stopGame, submitAction, type EngineDeps
} from "@server/domain/engine.js"
import { isTurnBased, resolveEngine } from "@server/games/engines.js"
import { resolveGame } from "@server/games/catalog.js"
import {
  CUSTOM_QUESTION_PROMPT, GAME_OVER, MOST_LIKELY_TO_ID, QUESTION_DISPLAY, ROUND_RESULT, VOTING,
  mostLikelyToEngine, tally
} from "@server/games/most-likely-to.js"
import { MOST_LIKELY_TO_QUESTIONS } from "@server/games/questions/most-likely-to.js"
import type { MostLikelyToResult, MostLikelyToView } from "@shared/most-likely-to.js"

const VOTING_MS = 20_000
const READ_MS = 5_000
const CUSTOM_QUESTION_MS = 30_000

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

/** Start, then run the clock past voting so the room is sitting on a result. */
async function atRoundResult(h: Harness): Promise<number> {
  await atVoting(h)
  await vi.advanceTimersByTimeAsync(VOTING_MS)
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
    for (const id of ["vampire-village", "mafia-classic", "who-am-i", "football-player-guess"]) {
      expect(resolveEngine(id)).toBeUndefined()
      expect(isTurnBased(id)).toBe(false)
    }
    // Spy Game only runs its vote on the engine; it is still dealt as roles.
    expect(isTurnBased("spy-game")).toBe(false)
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
    expect((shown as Extract<MostLikelyToView, { kind: "question" }>).question.tr.length).toBeGreaterThan(0)

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

  it("remembers questions across two seven-question games and persisted lobby state", async () => {
    const h = await harness(mkRoom({ settings: { votingSeconds: 20, roundCount: 7 } }))
    const seen = new Set<string>()
    for (let game = 0; game < 2; game++) {
      await startGame(h.deps, "MLT01", "s3cret")
      for (let round = 1; round <= 7; round++) {
        const room = await h.room()
        expect(room.phase).toBe(QUESTION_DISPLAY)
        expect(room.round).toBe(round)
        const id = room.gameState.questionId as string
        expect(seen.has(id)).toBe(false)
        seen.add(id)
        await vi.advanceTimersByTimeAsync(READ_MS + VOTING_MS)
        await hostAdvance(h.deps, "MLT01", "s3cret", await h.seq())
      }
      expect((await h.room()).phase).toBe(GAME_OVER)
      await stopGame(h.deps, "MLT01", "s3cret")
      await h.store.update("MLT01", room => JSON.parse(JSON.stringify(room)) as Room)
    }
    expect(seen.size).toBe(14)
  })

  it("remembers a shown question even when the host stops a game early", async () => {
    const h = await harness()
    await startGame(h.deps, "MLT01", "s3cret")
    const first = (await h.room()).gameState.questionId
    await stopGame(h.deps, "MLT01", "s3cret")
    await startGame(h.deps, "MLT01", "s3cret")
    expect((await h.room()).gameState.questionId).not.toBe(first)
    expect((await h.room()).gameState.bankQuestionsPlayed).toBe(1)
  })

  it("refills an exhausted bank without immediate repeats or unbounded history", () => {
    let room = mkRoom()
    let lastId: unknown
    const firstDeck = new Set<string>()
    for (let index = 0; index < MOST_LIKELY_TO_QUESTIONS.length * 2; index++) {
      const transition = mostLikelyToEngine.start(room, () => 0)
      const id = transition.state.questionId as string
      expect(id).not.toBe(lastId)
      if (index < MOST_LIKELY_TO_QUESTIONS.length) {
        expect(firstDeck.has(id)).toBe(false)
        firstDeck.add(id)
      }
      expect((transition.state.asked as string[]).length).toBeLessThanOrEqual(MOST_LIKELY_TO_QUESTIONS.length)
      room = { ...room, gameState: transition.state }
      room.gameState = mostLikelyToEngine.idleState!(room)
      lastId = id
    }
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

  it("keeps the full voting clock after everyone votes so choices can still change", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p2" })
    await submitAction(h.deps, "MLT01", "p2", seq, { type: "vote", target: "p3" })
    await submitAction(h.deps, "MLT01", "p3", seq, { type: "vote", target: "p2" })

    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.room()).phase).toBe(VOTING)
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p3" })
    await vi.advanceTimersByTimeAsync(VOTING_MS - 1_201)
    expect((await h.room()).phase).toBe(VOTING)
    await vi.advanceTimersByTimeAsync(1)
    expect((await h.room()).phase).toBe(ROUND_RESULT)
    expect(await h.viewFor("p1")).toMatchObject({ totalVotes: 3, winnerPlayerIds: ["p3"] })
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

  it("replaces a player's vote without increasing the voter count or revealing the choice", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p2" })

    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p3" })
    // Repeating the same choice is harmless, too.
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p3" })

    const votes = (await h.room()).gameState as { votes: Array<{ targetId: string }> }
    expect(votes.votes).toHaveLength(1)
    expect(votes.votes[0]!.targetId).toBe("p3")
    expect(await h.viewFor("p1")).toMatchObject({ myVote: "p3", votedCount: 1 })
    expect(await h.viewFor("p2")).toMatchObject({ myVote: null, votedCount: 1 })
    expect(mostLikelyToEngine.pending(await h.room())).toEqual(["p2", "p3"])
    await vi.advanceTimersByTimeAsync(VOTING_MS)
    expect(await h.viewFor("p1")).toMatchObject({ totalVotes: 1, winnerPlayerIds: ["p3"] })
    await expect(submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p2" }))
      .rejects.toThrow("PHASE_STALE")
  })

  it("preserves the previous vote when a replacement is invalid", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p2" })
    for (const target of ["p1", "ghost", ""]) {
      await expect(submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target }))
        .rejects.toThrow("INVALID_INPUT")
    }
    expect(await h.viewFor("p1")).toMatchObject({ myVote: "p2", votedCount: 1 })
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
  it("keeps the voting clock after the last pending phone disconnects", async () => {
    const h = await harness()
    const seq = await atVoting(h)
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p2" })
    await submitAction(h.deps, "MLT01", "p2", seq, { type: "vote", target: "p1" })

    expect(mostLikelyToEngine.pending(await h.room())).toEqual(["p3"])
    await h.store.update("MLT01", r => ({
      ...r, players: r.players.map(p => p.id === "p3" ? { ...p, connected: false } : p)
    }))
    expect(mostLikelyToEngine.pending(await h.room())).toEqual([])
    await onPlayerLeft(h.deps, "MLT01")
    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.room()).phase).toBe(VOTING)
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "vote", target: "p3" })
    await vi.advanceTimersByTimeAsync(VOTING_MS - 1_200)
    expect((await h.room()).phase).toBe(ROUND_RESULT)
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

describe("the custom question prompt", () => {
  function customRoom(overrides: Partial<Room> = {}): Room {
    return mkRoom({
      settings: { votingSeconds: 20, roundCount: 5, customQuestionsEnabled: true, customQuestionSeconds: 30 },
      ...overrides
    })
  }

  it("stays off the flow entirely when the host has not turned it on", async () => {
    const h = await harness()
    const seq = await atRoundResult(h)
    await hostAdvance(h.deps, "MLT01", "s3cret", seq)
    expect((await h.room()).phase).toBe(QUESTION_DISPLAY)
  })

  it("opens between a result and the next question once the host turns it on", async () => {
    const h = await harness(customRoom())
    const seq = await atRoundResult(h)
    await hostAdvance(h.deps, "MLT01", "s3cret", seq)

    const room = await h.room()
    expect(room.phase).toBe(CUSTOM_QUESTION_PROMPT)
    expect(room.phaseEndsAt).toBe(Date.now() + CUSTOM_QUESTION_MS)
    // The round the table just argued about is still the round on screen —
    // it only advances once the next question is actually decided.
    expect(room.round).toBe(1)
  })

  it("offers extra player questions after the final bank question and ends if everyone passes", async () => {
    const h = await harness(customRoom({ settings: { votingSeconds: 20, roundCount: 1, customQuestionsEnabled: true } }))
    const seq = await atRoundResult(h)
    await hostAdvance(h.deps, "MLT01", "s3cret", seq)
    expect((await h.room()).phase).toBe(CUSTOM_QUESTION_PROMPT)
    for (const id of ["p1", "p2", "p3"]) {
      await submitAction(h.deps, "MLT01", id, await h.seq(), { type: "pass" })
    }
    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.room()).phase).toBe(GAME_OVER)
  })

  it("falls back to the bank once everyone passes", async () => {
    const h = await harness(customRoom())
    const seq = await atRoundResult(h)
    await hostAdvance(h.deps, "MLT01", "s3cret", seq)
    const promptSeq = await h.seq()

    await submitAction(h.deps, "MLT01", "p1", promptSeq, { type: "pass" })
    await submitAction(h.deps, "MLT01", "p2", promptSeq, { type: "pass" })
    await submitAction(h.deps, "MLT01", "p3", promptSeq, { type: "pass" })
    await vi.advanceTimersByTimeAsync(1_200)

    const room = await h.room()
    expect(room.phase).toBe(QUESTION_DISPLAY)
    expect(room.round).toBe(2)
    const state = room.gameState as { questionId: string }
    expect(MOST_LIKELY_TO_QUESTIONS.some(q => q.id === state.questionId)).toBe(true)
  })

  it("falls back to the bank once the clock runs out with nobody writing", async () => {
    const h = await harness(customRoom())
    const seq = await atRoundResult(h)
    await hostAdvance(h.deps, "MLT01", "s3cret", seq)

    await vi.advanceTimersByTimeAsync(CUSTOM_QUESTION_MS)
    expect((await h.room()).phase).toBe(QUESTION_DISPLAY)
  })

  it("waits for everyone to submit or pass before opening a custom question in every language", async () => {
    const h = await harness(customRoom())
    const seq = await atRoundResult(h)
    await hostAdvance(h.deps, "MLT01", "s3cret", seq)
    const promptSeq = await h.seq()

    await submitAction(h.deps, "MLT01", "p2", promptSeq, { type: "submit", text: "Kim en tembel?" })
    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.room()).phase).toBe(CUSTOM_QUESTION_PROMPT)
    expect(mostLikelyToEngine.pending(await h.room())).toEqual(["p1", "p3"])
    await submitAction(h.deps, "MLT01", "p1", promptSeq, { type: "pass" })
    await submitAction(h.deps, "MLT01", "p3", promptSeq, { type: "pass" })
    await vi.advanceTimersByTimeAsync(1_200)

    const room = await h.room()
    expect(room.phase).toBe(QUESTION_DISPLAY)
    const shown = await h.viewFor("p1") as Extract<MostLikelyToView, { kind: "question" }>
    expect(shown.question).toEqual({
      en: "Kim en tembel?", tr: "Kim en tembel?", ar: "Kim en tembel?", ku: "Kim en tembel?"
    })
    // A question a player wrote was never sorted into one of the bank's categories.
    expect(shown.category).toBeUndefined()
  })

  it("plays every player's question in player order in addition to the bank-question limit", async () => {
    const h = await harness(customRoom({
      settings: { votingSeconds: 20, roundCount: 1, customQuestionsEnabled: true, customQuestionShowAuthor: true }
    }))
    await atRoundResult(h)
    await hostAdvance(h.deps, "MLT01", "s3cret", await h.seq())
    const promptSeq = await h.seq()

    // Submit in reverse order: speed must not set the playing order.
    for (const id of ["p3", "p2", "p1"]) {
      await submitAction(h.deps, "MLT01", id, promptSeq, { type: "submit", text: `Question by ${id}` })
    }
    await vi.advanceTimersByTimeAsync(1_200)

    for (const [index, id] of ["p1", "p2", "p3"].entries()) {
      expect((await h.room()).phase).toBe(QUESTION_DISPLAY)
      expect(await h.viewFor("p1")).toMatchObject({
        kind: "question", roundNumber: index + 2,
        question: { en: `Question by ${id}` },
        customQuestionAuthor: ["Ali", "Mahmud", "Morinji"][index]
      })
      expect((await h.room()).gameState).toMatchObject({ votes: [] })
      await vi.advanceTimersByTimeAsync(READ_MS + VOTING_MS)
      await hostAdvance(h.deps, "MLT01", "s3cret", await h.seq())
    }
    expect((await h.room()).phase).toBe(GAME_OVER)
    expect(h.overs).toHaveLength(1)
  })

  it("plays all questions collected at the deadline and rejects a late submission", async () => {
    const h = await harness(customRoom())
    await atRoundResult(h)
    await hostAdvance(h.deps, "MLT01", "s3cret", await h.seq())
    const promptSeq = await h.seq()
    await submitAction(h.deps, "MLT01", "p3", promptSeq, { type: "submit", text: "Third player's question" })
    await vi.advanceTimersByTimeAsync(CUSTOM_QUESTION_MS - 1)
    expect((await h.room()).phase).toBe(CUSTOM_QUESTION_PROMPT)
    await submitAction(h.deps, "MLT01", "p2", promptSeq, { type: "submit", text: "Second player's question" })
    await vi.advanceTimersByTimeAsync(1)

    await expect(submitAction(h.deps, "MLT01", "p1", promptSeq, { type: "submit", text: "Too late" }))
      .rejects.toThrow("PHASE_STALE")
    for (const question of ["Second player's question", "Third player's question"]) {
      expect(await h.viewFor("p1")).toMatchObject({ kind: "question", question: { en: question } })
      expect(await h.viewFor("p1")).not.toHaveProperty("customQuestionAuthor")
      await vi.advanceTimersByTimeAsync(READ_MS + VOTING_MS)
      await hostAdvance(h.deps, "MLT01", "s3cret", await h.seq())
    }
    // The next bank question still plays after the batch, then writing reopens.
    expect((await h.room()).phase).toBe(QUESTION_DISPLAY)
    expect((await h.room()).gameState).toMatchObject({ bankQuestionsPlayed: 2 })
    expect((await h.room()).gameState.questionId).not.toBe("__custom__")
    await vi.advanceTimersByTimeAsync(READ_MS + VOTING_MS)
    await hostAdvance(h.deps, "MLT01", "s3cret", await h.seq())
    expect((await h.room()).phase).toBe(CUSTOM_QUESTION_PROMPT)
    expect(await h.viewFor("p2")).toMatchObject({ myStatus: "idle" })
    expect((await h.room()).gameState).toMatchObject({ customQuestionQueue: [], passedPlayerIds: [] })
  })

  it("plays exactly seven bank questions plus all twenty-one submitted questions", async () => {
    const h = await harness(customRoom({ settings: { votingSeconds: 20, roundCount: 7, customQuestionsEnabled: true } }))
    await startGame(h.deps, "MLT01", "s3cret")
    const bankIds = new Set<string>()
    for (let bank = 1; bank <= 7; bank++) {
      expect((await h.room()).phase).toBe(QUESTION_DISPLAY)
      const id = (await h.room()).gameState.questionId as string
      expect(id).not.toBe("__custom__")
      expect(bankIds.has(id)).toBe(false)
      bankIds.add(id)
      await vi.advanceTimersByTimeAsync(READ_MS + VOTING_MS)
      await hostAdvance(h.deps, "MLT01", "s3cret", await h.seq())
      expect((await h.room()).phase).toBe(CUSTOM_QUESTION_PROMPT)
      for (const player of ["p1", "p2", "p3"]) {
        await submitAction(h.deps, "MLT01", player, await h.seq(), { type: "submit", text: `${bank} by ${player}` })
      }
      await vi.advanceTimersByTimeAsync(1_200)
      for (const player of ["p1", "p2", "p3"]) {
        expect(await h.viewFor(player)).toMatchObject({ kind: "question", question: { en: `${bank} by ${player}` } })
        expect((await h.room()).gameState.bankQuestionsPlayed).toBe(bank)
        await vi.advanceTimersByTimeAsync(READ_MS + VOTING_MS)
        await hostAdvance(h.deps, "MLT01", "s3cret", await h.seq())
      }
    }
    expect((await h.room()).phase).toBe(GAME_OVER)
    expect((await h.room()).round).toBe(28)
    expect(bankIds.size).toBe(7)
  })

  it("retains queued questions through serialization and a writer leaving", async () => {
    const h = await harness(customRoom())
    await atRoundResult(h)
    await hostAdvance(h.deps, "MLT01", "s3cret", await h.seq())
    const seq = await h.seq()
    await submitAction(h.deps, "MLT01", "p1", seq, { type: "submit", text: "First question" })
    await submitAction(h.deps, "MLT01", "p2", seq, { type: "submit", text: "Keep my question" })
    await h.store.update("MLT01", r => ({
      ...r, gameState: JSON.parse(JSON.stringify(r.gameState)),
      players: r.players.map(p => p.id !== "p1" ? { ...p, connected: false } : p)
    }))
    await onPlayerLeft(h.deps, "MLT01")
    await vi.advanceTimersByTimeAsync(1_200)
    expect(await h.viewFor("p1")).toMatchObject({ kind: "question", question: { en: "First question" } })
    await vi.advanceTimersByTimeAsync(READ_MS + VOTING_MS)
    await hostAdvance(h.deps, "MLT01", "s3cret", await h.seq())
    expect(await h.viewFor("p1")).toMatchObject({ kind: "question", question: { en: "Keep my question" } })
  })

  it("refuses a second submission or a pass after submitting from the same player", async () => {
    const h = await harness(customRoom())
    const seq = await atRoundResult(h)
    await hostAdvance(h.deps, "MLT01", "s3cret", seq)
    const promptSeq = await h.seq()

    await submitAction(h.deps, "MLT01", "p2", promptSeq, { type: "submit", text: "İlk soru" })
    await expect(
      submitAction(h.deps, "MLT01", "p2", promptSeq, { type: "submit", text: "İkinci soru" })
    ).rejects.toThrow("INVALID_INPUT")
    await expect(submitAction(h.deps, "MLT01", "p2", promptSeq, { type: "pass" })).rejects.toThrow("INVALID_INPUT")
  })

  it("refuses an empty submission and one over the length limit", async () => {
    const h = await harness(customRoom({
      settings: { votingSeconds: 20, roundCount: 5, customQuestionsEnabled: true, customQuestionMaxLength: 10 }
    }))
    const seq = await atRoundResult(h)
    await hostAdvance(h.deps, "MLT01", "s3cret", seq)
    const promptSeq = await h.seq()

    await expect(
      submitAction(h.deps, "MLT01", "p1", promptSeq, { type: "submit", text: "   " })
    ).rejects.toThrow("INVALID_INPUT")
    await expect(
      submitAction(h.deps, "MLT01", "p1", promptSeq, { type: "submit", text: "way too long a question" })
    ).rejects.toThrow("INVALID_INPUT")
  })

  it("refuses a second pass from the same player", async () => {
    const h = await harness(customRoom())
    const seq = await atRoundResult(h)
    await hostAdvance(h.deps, "MLT01", "s3cret", seq)
    const promptSeq = await h.seq()

    await submitAction(h.deps, "MLT01", "p1", promptSeq, { type: "pass" })
    await expect(
      submitAction(h.deps, "MLT01", "p1", promptSeq, { type: "pass" })
    ).rejects.toThrow("INVALID_INPUT")
    await expect(
      submitAction(h.deps, "MLT01", "p1", promptSeq, { type: "submit", text: "After passing" })
    ).rejects.toThrow("INVALID_INPUT")
  })

  it("never tells anybody else who is writing or who passed", async () => {
    const h = await harness(customRoom())
    const seq = await atRoundResult(h)
    await hostAdvance(h.deps, "MLT01", "s3cret", seq)
    const promptSeq = await h.seq()
    h.phases.length = 0

    await submitAction(h.deps, "MLT01", "p1", promptSeq, { type: "pass" })
    await submitAction(h.deps, "MLT01", "p2", promptSeq, { type: "submit", text: "Kim en şanslı?" })

    const mine = await h.viewFor("p2")
    const theirs = await h.viewFor("p3")
    expect(mine).toMatchObject({ kind: "customPrompt", myStatus: "submitted" })
    expect(theirs).toMatchObject({ kind: "customPrompt", myStatus: "idle" })

    // Nothing broadcast to the room ever names who wrote it or who passed.
    for (const { playerId, payload } of h.phases) {
      if (playerId === "p2") continue
      const json = JSON.stringify(payload.view)
      expect(json).not.toContain("Kim en şanslı")
      expect(json).not.toContain("submitted")
    }
  })
})
