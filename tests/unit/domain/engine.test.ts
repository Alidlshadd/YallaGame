import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { GameOverEvent, PhaseEvent } from "@shared/events.js"
import type { GameState, Room } from "@shared/types.js"
import { MemoryStore } from "@server/store/memory-store.js"
import { cancelAllTimers, hasTimer } from "@server/domain/scheduler.js"
import {
  advance, catchUp, hostAdvance, onPlayerLeft, sendPhaseTo,
  startGame, stopGame, submitAction,
  type EngineDeps, type GameEngine, type Transition
} from "@server/domain/engine.js"

/**
 * A three-phase stand-in for a real game: ASK runs on a clock, VOTE waits for
 * everybody, TALLY waits for the host. Enough shape to exercise every branch
 * the engine owns without dragging a real rulebook in.
 */
interface FakeState extends GameState {
  votes: Record<string, string>
  secret: string
}

const ASK_MS = 2_000
const VOTE_MS = 20_000

function stateOf(room: Room): FakeState {
  return room.gameState as FakeState
}

const fake: GameEngine = {
  gameId: "fake",

  start(): Transition {
    return { phase: "ASK", state: { votes: {}, secret: "answer" }, ms: ASK_MS, scores: {} }
  },

  act(room, playerId, action): GameState {
    const a = action as { type: string; target?: string }
    if (a.type !== "vote") throw new Error("INVALID_INPUT")
    if (a.target === playerId) throw new Error("INVALID_INPUT")
    const st = stateOf(room)
    return { ...st, votes: { ...st.votes, [playerId]: a.target ?? "" } }
  },

  next(room): Transition {
    const st = stateOf(room)
    if (room.phase === "ASK")  return { phase: "VOTE",  state: st, ms: VOTE_MS }
    if (room.phase === "VOTE") return { phase: "TALLY", state: st, ms: null }
    // Three rounds and the game is decided.
    if (room.round >= 3) {
      return { phase: "DONE", state: st, ms: null, winner: "table", scores: { p1: 10 } }
    }
    return { phase: "ASK", state: { ...st, votes: {} }, ms: ASK_MS, nextRound: true }
  },

  pending(room): string[] {
    if (room.phase !== "VOTE") return []
    const st = stateOf(room)
    return room.players.filter(p => p.connected && st.votes[p.id] === undefined).map(p => p.id)
  },

  view(room, playerId) {
    const st = stateOf(room)
    // The secret never leaves; each player learns only their own vote.
    return { myVote: st.votes[playerId] ?? null, votedCount: Object.keys(st.votes).length }
  }
}

function mkRoom(overrides: Partial<Room> = {}): Room {
  const now = Date.now()
  return {
    code: "ABCDE", gameId: "fake", adminSecret: "s3cret", assigned: false,
    settings: {},
    players: [
      { id: "p1", name: "A", role: null, connected: true, character: "owl" },
      { id: "p2", name: "B", role: null, connected: true, character: "fox" },
      { id: "p3", name: "C", role: null, connected: true, character: "wolf" }
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
}

async function harness(room: Room = mkRoom()): Promise<Harness> {
  const store = new MemoryStore()
  await store.create(room)
  const phases: Harness["phases"] = []
  const overs: GameOverEvent[] = []
  const deps: EngineDeps = {
    store,
    resolveEngine: id => (id === "fake" ? fake : undefined),
    rng: () => 0.5,
    emitPhase: (_code, playerId, payload) => { phases.push({ playerId, payload }) },
    emitOver: (_code, payload) => { overs.push(payload) }
  }
  return { deps, store, phases, overs }
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { cancelAllTimers(); vi.useRealTimers() })

describe("startGame", () => {
  it("moves out of idle, resets the round and tells every player", async () => {
    const h = await harness()
    const room = await startGame(h.deps, "ABCDE", "s3cret")

    expect(room.phase).toBe("ASK")
    expect(room.round).toBe(1)
    expect(room.phaseSeq).toBe(1)
    expect(room.phaseEndsAt).toBe(Date.now() + ASK_MS)
    expect(h.phases.map(p => p.playerId)).toEqual(["p1", "p2", "p3"])
  })

  it("refuses a caller who is not the host", async () => {
    const h = await harness()
    await expect(startGame(h.deps, "ABCDE", "wrong")).rejects.toThrow("INVALID_ADMIN")
  })

  it("clears the scores of the previous game", async () => {
    const h = await harness(mkRoom({ scores: { p1: 999 } }))
    const room = await startGame(h.deps, "ABCDE", "s3cret")
    expect(room.scores).toEqual({})
  })
})

describe("advance", () => {
  it("applies a transition exactly once when two callers race", async () => {
    const h = await harness()
    const started = await startGame(h.deps, "ABCDE", "s3cret")
    const expected = { phase: started.phase, seq: started.phaseSeq }

    // The countdown firing and the last player acting, in the same tick.
    const [first, second] = await Promise.all([
      advance(h.deps, "ABCDE", expected, (r, e) => e.next(r, () => 0.5)),
      advance(h.deps, "ABCDE", expected, (r, e) => e.next(r, () => 0.5))
    ])

    expect([first, second].filter(r => r !== null)).toHaveLength(1)
    const room = await h.store.get("ABCDE")
    expect(room?.phase).toBe("VOTE")
    expect(room?.phaseSeq).toBe(2)
  })

  it("ignores a transition aimed at a phase the room has left", async () => {
    const h = await harness()
    await startGame(h.deps, "ABCDE", "s3cret")
    const stale = await advance(h.deps, "ABCDE", { phase: "ASK", seq: 99 }, (r, e) => e.next(r, () => 0.5))
    expect(stale).toBeNull()
    expect((await h.store.get("ABCDE"))?.phase).toBe("ASK")
  })

  it("runs the clock down through the phases on its own", async () => {
    const h = await harness()
    await startGame(h.deps, "ABCDE", "s3cret")

    await vi.advanceTimersByTimeAsync(ASK_MS)
    expect((await h.store.get("ABCDE"))?.phase).toBe("VOTE")

    await vi.advanceTimersByTimeAsync(VOTE_MS)
    const room = await h.store.get("ABCDE")
    expect(room?.phase).toBe("TALLY")
    // A host-driven phase holds no deadline and arms no timer.
    expect(room?.phaseEndsAt).toBeNull()
    expect(hasTimer("ABCDE")).toBe(false)
  })
})

describe("submitAction", () => {
  async function atVote(): Promise<Harness> {
    const h = await harness()
    await startGame(h.deps, "ABCDE", "s3cret")
    await vi.advanceTimersByTimeAsync(ASK_MS)
    return h
  }

  it("records the move and re-broadcasts the phase", async () => {
    const h = await atVote()
    const seq = (await h.store.get("ABCDE"))!.phaseSeq
    h.phases.length = 0

    await submitAction(h.deps, "ABCDE", "p1", seq, { type: "vote", target: "p2" })

    expect(stateOf((await h.store.get("ABCDE"))!).votes).toEqual({ p1: "p2" })
    expect(h.phases).toHaveLength(3)
  })

  it("refuses a tap sent from a screen the room has moved past", async () => {
    const h = await atVote()
    const seq = (await h.store.get("ABCDE"))!.phaseSeq
    await expect(
      submitAction(h.deps, "ABCDE", "p1", seq - 1, { type: "vote", target: "p2" })
    ).rejects.toThrow("PHASE_STALE")
  })

  it("refuses somebody who does not hold a seat", async () => {
    const h = await atVote()
    const seq = (await h.store.get("ABCDE"))!.phaseSeq
    await expect(
      submitAction(h.deps, "ABCDE", "ghost", seq, { type: "vote", target: "p2" })
    ).rejects.toThrow("AUTHZ_MISMATCH")
  })

  it("lets the game refuse an illegal move without changing the phase", async () => {
    const h = await atVote()
    const seq = (await h.store.get("ABCDE"))!.phaseSeq
    await expect(
      submitAction(h.deps, "ABCDE", "p1", seq, { type: "vote", target: "p1" })
    ).rejects.toThrow("INVALID_INPUT")
    const room = await h.store.get("ABCDE")
    expect(room?.phase).toBe("VOTE")
    expect(room?.phaseSeq).toBe(seq)
  })

  it("refuses any move while the room is idle", async () => {
    const h = await harness()
    await expect(
      submitAction(h.deps, "ABCDE", "p1", 0, { type: "vote", target: "p2" })
    ).rejects.toThrow("GAME_NOT_RUNNING")
  })

  it("cuts the countdown short once everybody has acted", async () => {
    const h = await atVote()
    const seq = (await h.store.get("ABCDE"))!.phaseSeq
    for (const [voter, target] of [["p1", "p2"], ["p2", "p3"], ["p3", "p1"]]) {
      await submitAction(h.deps, "ABCDE", voter!, seq, { type: "vote", target })
    }
    expect((await h.store.get("ABCDE"))?.phase).toBe("VOTE")

    // Grace period only, not the remaining nineteen seconds.
    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.store.get("ABCDE"))?.phase).toBe("TALLY")
  })

  it("never hands time back when the phase is nearly over", async () => {
    const h = await atVote()
    const seq = (await h.store.get("ABCDE"))!.phaseSeq
    // 400 ms left, which is less than the grace period.
    await vi.advanceTimersByTimeAsync(VOTE_MS - 400)
    for (const [voter, target] of [["p1", "p2"], ["p2", "p3"], ["p3", "p1"]]) {
      await submitAction(h.deps, "ABCDE", voter!, seq, { type: "vote", target })
    }
    await vi.advanceTimersByTimeAsync(400)
    expect((await h.store.get("ABCDE"))?.phase).toBe("TALLY")
  })
})

describe("a phase never waits on a phone that is gone", () => {
  it("closes once the only player still owing a move disconnects", async () => {
    const h = await harness()
    await startGame(h.deps, "ABCDE", "s3cret")
    await vi.advanceTimersByTimeAsync(ASK_MS)
    const seq = (await h.store.get("ABCDE"))!.phaseSeq

    await submitAction(h.deps, "ABCDE", "p1", seq, { type: "vote", target: "p2" })
    await submitAction(h.deps, "ABCDE", "p2", seq, { type: "vote", target: "p3" })

    await h.store.update("ABCDE", r => ({
      ...r, players: r.players.map(p => p.id === "p3" ? { ...p, connected: false } : p)
    }))
    await onPlayerLeft(h.deps, "ABCDE")

    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.store.get("ABCDE"))?.phase).toBe("TALLY")
  })
})

describe("catchUp", () => {
  it("forces a deadline that passed while the process was down", async () => {
    const h = await harness(mkRoom({
      phase: "ASK", phaseSeq: 1, round: 1,
      phaseEndsAt: Date.now() - 5_000,
      gameState: { votes: {}, secret: "answer" }
    }))
    expect(hasTimer("ABCDE")).toBe(false)

    await catchUp(h.deps, "ABCDE")

    const room = await h.store.get("ABCDE")
    expect(room?.phase).toBe("VOTE")
    expect(room?.phaseSeq).toBe(2)
  })

  it("re-arms a phase that is still running but has no timer behind it", async () => {
    const h = await harness(mkRoom({
      phase: "ASK", phaseSeq: 1, round: 1,
      phaseEndsAt: Date.now() + 1_000,
      gameState: { votes: {}, secret: "answer" }
    }))

    await catchUp(h.deps, "ABCDE")
    expect(hasTimer("ABCDE")).toBe(true)

    await vi.advanceTimersByTimeAsync(1_000)
    expect((await h.store.get("ABCDE"))?.phase).toBe("VOTE")
  })

  it("stops walking forward rather than replaying a whole abandoned evening", async () => {
    const h = await harness(mkRoom({
      phase: "ASK", phaseSeq: 1, round: 1,
      phaseEndsAt: Date.now() - 60 * 60 * 1000,
      gameState: { votes: {}, secret: "answer" }
    }))
    await catchUp(h.deps, "ABCDE")
    // Four steps at most, not one per phase of the last hour.
    expect((await h.store.get("ABCDE"))!.phaseSeq).toBeLessThanOrEqual(5)
  })

  it("leaves an idle room alone", async () => {
    const h = await harness()
    await catchUp(h.deps, "ABCDE")
    expect((await h.store.get("ABCDE"))?.phase).toBe("idle")
    expect(hasTimer("ABCDE")).toBe(false)
  })
})

describe("projection", () => {
  it("sends each player their own view and never the game's secret", async () => {
    const h = await harness()
    await startGame(h.deps, "ABCDE", "s3cret")
    await vi.advanceTimersByTimeAsync(ASK_MS)
    const seq = (await h.store.get("ABCDE"))!.phaseSeq
    h.phases.length = 0
    await submitAction(h.deps, "ABCDE", "p1", seq, { type: "vote", target: "p2" })

    const forP1 = h.phases.find(p => p.playerId === "p1")!.payload
    const forP2 = h.phases.find(p => p.playerId === "p2")!.payload
    expect(forP1.view).toEqual({ myVote: "p2", votedCount: 1 })
    expect(forP2.view).toEqual({ myVote: null, votedCount: 1 })

    for (const { payload } of h.phases) {
      expect(JSON.stringify(payload)).not.toContain("answer")
      expect(JSON.stringify(payload)).not.toContain("secret")
    }
  })

  it("sends no view at all for an idle room", async () => {
    const h = await harness()
    await startGame(h.deps, "ABCDE", "s3cret")
    h.phases.length = 0
    await stopGame(h.deps, "ABCDE", "s3cret")
    expect(h.phases.every(p => p.payload.view === null)).toBe(true)
  })

  it("hands a reconnecting player the phase they are in", async () => {
    const h = await harness()
    await startGame(h.deps, "ABCDE", "s3cret")
    h.phases.length = 0
    await sendPhaseTo(h.deps, "ABCDE", "p2")
    expect(h.phases).toHaveLength(1)
    expect(h.phases[0]).toMatchObject({ playerId: "p2", payload: { phase: "ASK" } })
  })
})

describe("host controls", () => {
  it("closes a phase that has no clock of its own", async () => {
    const h = await harness()
    await startGame(h.deps, "ABCDE", "s3cret")
    await vi.advanceTimersByTimeAsync(ASK_MS + VOTE_MS)
    const room = await h.store.get("ABCDE")
    expect(room?.phase).toBe("TALLY")

    await hostAdvance(h.deps, "ABCDE", "s3cret", room!.phaseSeq)
    const next = await h.store.get("ABCDE")
    expect(next?.phase).toBe("ASK")
    expect(next?.round).toBe(2)
  })

  it("treats a double tap as done rather than as an error", async () => {
    const h = await harness()
    await startGame(h.deps, "ABCDE", "s3cret")
    await vi.advanceTimersByTimeAsync(ASK_MS + VOTE_MS)
    const seq = (await h.store.get("ABCDE"))!.phaseSeq

    expect(await hostAdvance(h.deps, "ABCDE", "s3cret", seq)).not.toBeNull()
    expect(await hostAdvance(h.deps, "ABCDE", "s3cret", seq)).toBeNull()
  })

  it("refuses a stranger holding the wrong secret", async () => {
    const h = await harness()
    await startGame(h.deps, "ABCDE", "s3cret")
    await expect(hostAdvance(h.deps, "ABCDE", "nope", 1)).rejects.toThrow("INVALID_ADMIN")
    await expect(stopGame(h.deps, "ABCDE", "nope")).rejects.toThrow("INVALID_ADMIN")
  })

  it("stop returns the room to the lobby and drops the clock", async () => {
    const h = await harness()
    await startGame(h.deps, "ABCDE", "s3cret")
    const room = await stopGame(h.deps, "ABCDE", "s3cret")
    expect(room.phase).toBe("idle")
    expect(room.phaseEndsAt).toBeNull()
    expect(room.gameState).toEqual({})
    expect(hasTimer("ABCDE")).toBe(false)
  })
})

describe("a room that disappears under a running clock", () => {
  it("lets the deadline pass without taking the process down", async () => {
    const h = await harness()
    await startGame(h.deps, "ABCDE", "s3cret")
    // The host closed the room, or the TTL sweep collected it.
    await h.store.delete("ABCDE")

    await expect(vi.advanceTimersByTimeAsync(ASK_MS)).resolves.not.toThrow()
    expect(await h.store.get("ABCDE")).toBeNull()
  })
})

describe("game over", () => {
  it("announces the winner and stops keeping time", async () => {
    const h = await harness(mkRoom({
      phase: "TALLY", phaseSeq: 7, round: 3,
      phaseEndsAt: null,
      gameState: { votes: {}, secret: "answer" }
    }))

    await hostAdvance(h.deps, "ABCDE", "s3cret", 7)

    expect(h.overs).toEqual([{ winner: "table", scores: { p1: 10 }, round: 3 }])
    expect((await h.store.get("ABCDE"))?.phase).toBe("DONE")
    expect(hasTimer("ABCDE")).toBe(false)
  })
})
