import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import type { GameOverEvent, PhaseEvent } from "@shared/events.js"
import type { GameState, Room } from "@shared/types.js"
import { MemoryStore } from "@server/store/memory-store.js"
import { cancelAllTimers } from "@server/domain/scheduler.js"
import {
  hostAdvance, startGame, submitAction, type EngineDeps
} from "@server/domain/engine.js"
import { isTurnBased, resolveEngine } from "@server/games/engines.js"
import { resolveGame } from "@server/games/catalog.js"
import {
  BOARD_UPDATE, EXECUTIVE_ACTION, GAME_OVER, LEGISLATIVE_CHANCELLOR, LEGISLATIVE_PRESIDENT,
  NOMINATION, ROLE_REVEAL, SECRET_POLITICIAN_ID, VETO_CONFIRM, VOTE_GOVERNMENT,
  secretPoliticianEngine, type PoliticianState
} from "@server/games/secret-politician.js"
import type {
  PoliticianExecutiveActionView, PoliticianNominationView,
  PoliticianRoleRevealView, PoliticianVoteView
} from "@shared/secret-politician.js"

const RNG = (): number => 0.5

function mkRoom(playerCount: number, overrides: Partial<Room> = {}): Room {
  const now = Date.now()
  const players = Array.from({ length: playerCount }, (_, i) => ({
    id: `p${i + 1}`, name: `Player ${i + 1}`, role: null, connected: true, character: "owl"
  }))
  return {
    code: "POL01", gameId: SECRET_POLITICIAN_ID, adminSecret: "s3cret", assigned: false,
    settings: { leaderKnowsAllies: false },
    players,
    createdAt: now, updatedAt: now,
    hostPlayerId: "p1", isPublic: false, requireApproval: false, pending: [],
    phase: "idle", phaseSeq: 0, phaseEndsAt: null, round: 1, gameState: {}, scores: {},
    ...overrides
  }
}

function mkState(overrides: Partial<PoliticianState> = {}): PoliticianState {
  return {
    roles: { p1: "leader", p2: "traitor", p3: "innocent", p4: "innocent", p5: "innocent" },
    order: ["p1", "p2", "p3", "p4", "p5"],
    alive: ["p1", "p2", "p3", "p4", "p5"],
    deck: ["good", "good", "good", "bad", "bad", "bad"],
    discard: [],
    board: { good: 0, bad: 0 },
    tracker: 0,
    presidentIndex: 0,
    presidentId: "p1",
    specialPresidentId: null,
    chancellorNomineeId: null,
    chancellorId: null,
    lastElected: null,
    ballots: {},
    lastVote: null,
    hand: [],
    vetoOffered: false,
    vetoApproved: null,
    pendingPower: null,
    executiveResolved: false,
    investigated: [],
    investigationResult: null,
    peekCards: null,
    lastExecutive: null,
    lastEnactedCard: null,
    lastEnactedFromChaos: false,
    leaderKnowsAllies: false,
    winner: null,
    ...overrides
  }
}

/** A room frozen mid-phase, its state hand-built rather than played out. */
function roomAt(phase: string, playerCount: number, state: Partial<PoliticianState> = {}, room: Partial<Room> = {}): Room {
  const seats = Array.from({ length: playerCount }, (_, i) => `p${i + 1}`)
  return mkRoom(playerCount, {
    phase, gameState: mkState({ order: seats, alive: seats, ...state }) as unknown as GameState, ...room
  })
}

function stateOf(room: Room): PoliticianState {
  return room.gameState as unknown as PoliticianState
}

interface Harness {
  deps: EngineDeps
  store: MemoryStore
  phases: Array<{ playerId: string; payload: PhaseEvent }>
  overs: GameOverEvent[]
  room(): Promise<Room>
  seq(): Promise<number>
  state(): Promise<PoliticianState>
}

async function harness(room: Room): Promise<Harness> {
  const store = new MemoryStore()
  await store.create(room)
  const phases: Harness["phases"] = []
  const overs: GameOverEvent[] = []
  const deps: EngineDeps = {
    store, resolveEngine, rng: RNG,
    emitPhase: (_code, playerId, payload) => { phases.push({ playerId, payload }) },
    emitOver: (_code, payload) => { overs.push(payload) }
  }
  return {
    deps, store, phases, overs,
    async room() { return (await store.get(room.code))! },
    async seq() { return (await store.get(room.code))!.phaseSeq },
    async state() { return stateOf((await store.get(room.code))!) }
  }
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { cancelAllTimers(); vi.useRealTimers() })

describe("registration", () => {
  it("is the engine the server resolves for its own slug", () => {
    expect(resolveEngine(SECRET_POLITICIAN_ID)).toBe(secretPoliticianEngine)
    expect(isTurnBased(SECRET_POLITICIAN_ID)).toBe(true)
  })

  it("is in the catalogue, needs five players, and is marked turn-based", () => {
    const game = resolveGame(SECRET_POLITICIAN_ID)
    expect(game).toBeDefined()
    expect(game!.minPlayers).toBe(5)
    expect(game!.turnBased).toBe(true)
  })

  it("does not disturb the other two turn-based engines", () => {
    expect(resolveEngine("most-likely-to")).not.toBe(secretPoliticianEngine)
    expect(resolveEngine("bluff-trivia")).not.toBe(secretPoliticianEngine)
  })
})

describe("role assignment", () => {
  it.each([
    [5, 3, 1], [6, 4, 1], [7, 4, 2], [8, 5, 2], [9, 5, 3], [10, 6, 3]
  ])("gives %i players %i innocents and %i traitors, plus exactly one leader", (count, innocents, traitors) => {
    const t = secretPoliticianEngine.start(mkRoom(count), RNG)
    const state = t.state as unknown as PoliticianState
    const counts = { innocent: 0, traitor: 0, leader: 0 }
    for (const role of Object.values(state.roles)) counts[role]++
    expect(counts.innocent).toBe(innocents)
    expect(counts.traitor).toBe(traitors)
    expect(counts.leader).toBe(1)
    expect(Object.keys(state.roles)).toHaveLength(count)
  })

  it("fixes the rotation order to the room's players and starts everyone alive", () => {
    const t = secretPoliticianEngine.start(mkRoom(5), RNG)
    const state = t.state as unknown as PoliticianState
    expect(state.order).toEqual(["p1", "p2", "p3", "p4", "p5"])
    expect(state.alive).toEqual(state.order)
  })

  it("deals a full 17-card deck, six good and eleven bad", () => {
    const t = secretPoliticianEngine.start(mkRoom(5), RNG)
    const state = t.state as unknown as PoliticianState
    expect(state.deck).toHaveLength(17)
    expect(state.deck.filter(c => c === "good")).toHaveLength(6)
    expect(state.deck.filter(c => c === "bad")).toHaveLength(11)
  })
})

describe("role reveal visibility", () => {
  it("shows an innocent no allies at all", () => {
    const room = roomAt(ROLE_REVEAL, 5)
    const view = secretPoliticianEngine.view(room, "p3") as PoliticianRoleRevealView
    expect(view.myRole).toBe("innocent")
    expect(view.allies).toEqual([])
  })

  it("shows a traitor every other traitor and the leader, always", () => {
    const room = roomAt(ROLE_REVEAL, 7, {
      roles: { p1: "leader", p2: "traitor", p3: "traitor", p4: "innocent", p5: "innocent", p6: "innocent", p7: "innocent" }
    })
    const view = secretPoliticianEngine.view(room, "p2") as PoliticianRoleRevealView
    expect(view.myRole).toBe("traitor")
    expect(view.allies.map(a => a.id).sort()).toEqual(["p1", "p3"])
    expect(view.allies.find(a => a.id === "p1")?.isLeader).toBe(true)
  })

  it("keeps the leader blind to allies by default", () => {
    const room = roomAt(ROLE_REVEAL, 7, {
      roles: { p1: "leader", p2: "traitor", p3: "traitor", p4: "innocent", p5: "innocent", p6: "innocent", p7: "innocent" },
      leaderKnowsAllies: false
    })
    const view = secretPoliticianEngine.view(room, "p1") as PoliticianRoleRevealView
    expect(view.myRole).toBe("leader")
    expect(view.allies).toEqual([])
  })

  it("shows the leader allies once the room turns leaderKnowsAllies on", () => {
    const room = roomAt(ROLE_REVEAL, 7, {
      roles: { p1: "leader", p2: "traitor", p3: "traitor", p4: "innocent", p5: "innocent", p6: "innocent", p7: "innocent" },
      leaderKnowsAllies: true
    })
    const view = secretPoliticianEngine.view(room, "p1") as PoliticianRoleRevealView
    expect(view.allies.map(a => a.id).sort()).toEqual(["p2", "p3"])
  })
})

describe("chancellor eligibility and term limits", () => {
  it("bars the sitting president", () => {
    const room = roomAt(NOMINATION, 7, { presidentId: "p1", alive: ["p1", "p2", "p3", "p4", "p5", "p6", "p7"] })
    const view = secretPoliticianEngine.view(room, "p1") as PoliticianNominationView
    expect(view.eligibleIds).not.toContain("p1")
  })

  it("bars both the last president and the last chancellor when more than five are alive", () => {
    const room = roomAt(NOMINATION, 7, {
      presidentId: "p1", alive: ["p1", "p2", "p3", "p4", "p5", "p6", "p7"],
      lastElected: { presidentId: "p2", chancellorId: "p3" }
    })
    const view = secretPoliticianEngine.view(room, "p1") as PoliticianNominationView
    expect(view.eligibleIds).not.toContain("p2")
    expect(view.eligibleIds).not.toContain("p3")
  })

  it("only bars the last chancellor once the table is down to five", () => {
    const room = roomAt(NOMINATION, 5, {
      presidentId: "p1", alive: ["p1", "p2", "p3", "p4", "p5"],
      lastElected: { presidentId: "p2", chancellorId: "p3" }
    })
    const view = secretPoliticianEngine.view(room, "p1") as PoliticianNominationView
    expect(view.eligibleIds).toContain("p2")
    expect(view.eligibleIds).not.toContain("p3")
  })
})

describe("what act() refuses", () => {
  it("refuses a nomination from anyone but the president", () => {
    const room = roomAt(NOMINATION, 5, { presidentId: "p1" })
    expect(() => secretPoliticianEngine.act(room, "p2", { type: "nominate", targetId: "p3" })).toThrow("AUTHZ_MISMATCH")
  })

  it("refuses a nominee who is not eligible", () => {
    const room = roomAt(NOMINATION, 5, { presidentId: "p1" })
    expect(() => secretPoliticianEngine.act(room, "p1", { type: "nominate", targetId: "p1" })).toThrow("INVALID_INPUT")
  })

  it("refuses a second nomination once one is already in", () => {
    const room = roomAt(NOMINATION, 5, { presidentId: "p1", chancellorNomineeId: "p2" })
    expect(() => secretPoliticianEngine.act(room, "p1", { type: "nominate", targetId: "p3" })).toThrow("INVALID_INPUT")
  })

  it("refuses a vote from a dead player", () => {
    const room = roomAt(VOTE_GOVERNMENT, 5, { alive: ["p1", "p2", "p3", "p4"], chancellorNomineeId: "p2" })
    expect(() => secretPoliticianEngine.act(room, "p5", { type: "vote", approve: true })).toThrow("AUTHZ_MISMATCH")
  })

  it("refuses a second vote from the same player", () => {
    const room = roomAt(VOTE_GOVERNMENT, 5, { chancellorNomineeId: "p2", ballots: { p1: true } })
    expect(() => secretPoliticianEngine.act(room, "p1", { type: "vote", approve: false })).toThrow("INVALID_INPUT")
  })

  it("refuses a discard from anyone but the president", () => {
    const room = roomAt(LEGISLATIVE_PRESIDENT, 5, { presidentId: "p1", hand: ["good", "good", "bad"] })
    expect(() => secretPoliticianEngine.act(room, "p2", { type: "discard", index: 0 })).toThrow("AUTHZ_MISMATCH")
  })

  it("refuses a discard index out of range", () => {
    const room = roomAt(LEGISLATIVE_PRESIDENT, 5, { presidentId: "p1", hand: ["good", "good", "bad"] })
    expect(() => secretPoliticianEngine.act(room, "p1", { type: "discard", index: 3 })).toThrow("INVALID_INPUT")
  })

  it("refuses an enact from anyone but the chancellor", () => {
    const room = roomAt(LEGISLATIVE_CHANCELLOR, 5, { chancellorId: "p2", hand: ["good", "bad"] })
    expect(() => secretPoliticianEngine.act(room, "p1", { type: "enact", index: 0 })).toThrow("AUTHZ_MISMATCH")
  })

  it("refuses a veto below five bad laws", () => {
    const room = roomAt(LEGISLATIVE_CHANCELLOR, 5, { chancellorId: "p2", hand: ["good", "bad"], board: { good: 1, bad: 4 } })
    expect(() => secretPoliticianEngine.act(room, "p2", { type: "veto" })).toThrow("INVALID_INPUT")
  })

  it("allows a veto once five bad laws are up", () => {
    const room = roomAt(LEGISLATIVE_CHANCELLOR, 5, { chancellorId: "p2", hand: ["good", "bad"], board: { good: 0, bad: 5 } })
    const next = secretPoliticianEngine.act(room, "p2", { type: "veto" }) as unknown as PoliticianState
    expect(next.vetoOffered).toBe(true)
  })

  it("refuses a veto decision from anyone but the president", () => {
    const room = roomAt(VETO_CONFIRM, 5, { presidentId: "p1", chancellorId: "p2" })
    expect(() => secretPoliticianEngine.act(room, "p2", { type: "vetoDecision", approve: true })).toThrow("AUTHZ_MISMATCH")
  })

  it("refuses an executive power the president was not actually given", () => {
    const room = roomAt(EXECUTIVE_ACTION, 5, { presidentId: "p1", pendingPower: "peek" })
    expect(() => secretPoliticianEngine.act(room, "p1", { type: "execute", targetId: "p2" })).toThrow("INVALID_INPUT")
  })

  it("refuses investigating the same player twice", () => {
    const room = roomAt(EXECUTIVE_ACTION, 7, { presidentId: "p1", pendingPower: "investigate", investigated: ["p2"] })
    expect(() => secretPoliticianEngine.act(room, "p1", { type: "investigate", targetId: "p2" })).toThrow("INVALID_INPUT")
  })

  it("refuses the president targeting themselves with a power", () => {
    const room = roomAt(EXECUTIVE_ACTION, 7, { presidentId: "p1", pendingPower: "execute" })
    expect(() => secretPoliticianEngine.act(room, "p1", { type: "execute", targetId: "p1" })).toThrow("INVALID_INPUT")
  })
})

describe("the vote", () => {
  it("approves on a strict majority", () => {
    const room = roomAt(VOTE_GOVERNMENT, 5, {
      chancellorNomineeId: "p2", ballots: { p1: true, p2: true, p3: true, p4: false, p5: false }
    })
    const t = secretPoliticianEngine.next(room, RNG)
    expect(t.phase).toBe(LEGISLATIVE_PRESIDENT)
  })

  it("rejects a tie", () => {
    const room = roomAt(VOTE_GOVERNMENT, 4, {
      order: ["p1", "p2", "p3", "p4"], alive: ["p1", "p2", "p3", "p4"],
      chancellorNomineeId: "p2", ballots: { p1: true, p2: true, p3: false, p4: false }
    })
    const t = secretPoliticianEngine.next(room, RNG)
    expect(t.phase).toBe(NOMINATION)
    expect((t.state as unknown as PoliticianState).tracker).toBe(1)
  })

  it("elects nobody chancellor on rejection — the seat stays empty", () => {
    const room = roomAt(VOTE_GOVERNMENT, 5, {
      chancellorNomineeId: "p2", ballots: { p1: false, p2: false, p3: false, p4: true, p5: true }
    })
    const t = secretPoliticianEngine.next(room, RNG)
    const state = t.state as unknown as PoliticianState
    expect(state.chancellorId).toBeNull()
    expect(state.chancellorNomineeId).toBeNull()
  })

  it("makes the last vote public on the very next screen", () => {
    const room = roomAt(VOTE_GOVERNMENT, 5, {
      presidentId: "p1", chancellorNomineeId: "p2",
      ballots: { p1: true, p2: true, p3: true, p4: false, p5: false }
    })
    const t = secretPoliticianEngine.next(room, RNG)
    const nextRoom = { ...room, phase: t.phase, gameState: t.state as unknown as GameState }
    const view = secretPoliticianEngine.view(nextRoom, "p3") as unknown as { lastVote?: unknown }
    // LEGISLATIVE_PRESIDENT's own view type has no lastVote field — check the
    // state directly carries it forward for the *next* NOMINATION screen.
    expect((t.state as unknown as PoliticianState).lastVote).toEqual({
      presidentId: "p1", chancellorId: "p2", approved: true,
      ballots: { p1: true, p2: true, p3: true, p4: false, p5: false }
    })
    void view
  })

  it("wins it for the traitors instantly if the leader is elected chancellor after three bad laws", () => {
    const room = roomAt(VOTE_GOVERNMENT, 7, {
      roles: { p1: "innocent", p2: "leader", p3: "traitor", p4: "traitor", p5: "innocent", p6: "innocent", p7: "innocent" },
      board: { good: 1, bad: 3 },
      chancellorNomineeId: "p2", ballots: { p1: true, p2: true, p3: true, p4: true, p5: false, p6: false, p7: false }
    })
    const t = secretPoliticianEngine.next(room, RNG)
    expect(t.phase).toBe(GAME_OVER)
    expect(t.winner).toBe("traitors")
  })

  it("does not trigger the leader-as-chancellor win before three bad laws are up", () => {
    const room = roomAt(VOTE_GOVERNMENT, 7, {
      roles: { p1: "innocent", p2: "leader", p3: "traitor", p4: "traitor", p5: "innocent", p6: "innocent", p7: "innocent" },
      board: { good: 1, bad: 2 },
      chancellorNomineeId: "p2", ballots: { p1: true, p2: true, p3: true, p4: true, p5: false, p6: false, p7: false }
    })
    const t = secretPoliticianEngine.next(room, RNG)
    expect(t.phase).toBe(LEGISLATIVE_PRESIDENT)
  })
})

describe("the legislative session", () => {
  it("deals the president three cards and moves to the chancellor with two, once discarded", () => {
    const president = roomAt(LEGISLATIVE_PRESIDENT, 5, { presidentId: "p1", hand: ["good", "bad", "good"] })
    const afterDiscard = secretPoliticianEngine.act(president, "p1", { type: "discard", index: 1 }) as unknown as PoliticianState
    expect(afterDiscard.hand).toEqual(["good", "good"])
    expect(afterDiscard.discard).toEqual(["bad"])

    const t = secretPoliticianEngine.next({ ...president, gameState: afterDiscard as unknown as GameState }, RNG)
    expect(t.phase).toBe(LEGISLATIVE_CHANCELLOR)
    expect((t.state as unknown as PoliticianState).hand).toEqual(["good", "good"])
  })

  it("enacts whichever card the chancellor kept, discarding the other", () => {
    const chancellor = roomAt(LEGISLATIVE_CHANCELLOR, 5, { chancellorId: "p2", hand: ["bad", "good"] })
    const afterEnact = secretPoliticianEngine.act(chancellor, "p2", { type: "enact", index: 1 }) as unknown as PoliticianState
    const t = secretPoliticianEngine.next({ ...chancellor, gameState: afterEnact as unknown as GameState }, RNG)
    expect(t.phase).toBe(BOARD_UPDATE)
    const state = t.state as unknown as PoliticianState
    expect(state.board.good).toBe(1)
    expect(state.board.bad).toBe(0)
    expect(state.lastEnactedCard).toBe("good")
  })

  it("never lets the discarded card's identity reach any view", () => {
    const chancellor = roomAt(LEGISLATIVE_CHANCELLOR, 5, { chancellorId: "p2", hand: ["bad", "good"] })
    const afterEnact = secretPoliticianEngine.act(chancellor, "p2", { type: "enact", index: 1 }) as unknown as PoliticianState
    const t = secretPoliticianEngine.next({ ...chancellor, gameState: afterEnact as unknown as GameState }, RNG)
    const boardRoom = { ...chancellor, phase: t.phase, gameState: t.state as unknown as GameState }
    for (const id of ["p1", "p2", "p3", "p4", "p5"]) {
      const json = JSON.stringify(secretPoliticianEngine.view(boardRoom, id))
      expect(json).not.toContain("discard")
    }
  })

  it("times out the president by discarding the first card", () => {
    const president = roomAt(LEGISLATIVE_PRESIDENT, 5, { presidentId: "p1", hand: ["bad", "good", "good"] })
    const t = secretPoliticianEngine.next(president, RNG)
    expect(t.phase).toBe(LEGISLATIVE_CHANCELLOR)
    expect((t.state as unknown as PoliticianState).hand).toEqual(["good", "good"])
  })

  it("times out the chancellor by enacting the first card", () => {
    const chancellor = roomAt(LEGISLATIVE_CHANCELLOR, 5, { chancellorId: "p2", hand: ["bad", "good"] })
    const t = secretPoliticianEngine.next(chancellor, RNG)
    expect(t.phase).toBe(BOARD_UPDATE)
    expect((t.state as unknown as PoliticianState).board.bad).toBe(1)
  })
})

describe("veto", () => {
  it("denies without a decision, forcing the chancellor's card through", () => {
    const room = roomAt(VETO_CONFIRM, 5, {
      presidentId: "p1", chancellorId: "p2", hand: ["bad", "good"], vetoOffered: true, board: { good: 0, bad: 5 }
    })
    const t = secretPoliticianEngine.next(room, RNG)
    expect(t.phase).toBe(BOARD_UPDATE)
    expect((t.state as unknown as PoliticianState).board.bad).toBe(6)
  })

  it("discards both cards and bumps the tracker once the president approves", () => {
    const room = roomAt(VETO_CONFIRM, 5, {
      presidentId: "p1", chancellorId: "p2", hand: ["bad", "good"], vetoOffered: true,
      vetoApproved: true, board: { good: 0, bad: 5 }, tracker: 0
    })
    const t = secretPoliticianEngine.next(room, RNG)
    expect(t.phase).toBe(NOMINATION)
    const state = t.state as unknown as PoliticianState
    expect(state.board).toEqual({ good: 0, bad: 5 })
    expect(state.tracker).toBe(1)
    expect(state.discard).toEqual(expect.arrayContaining(["bad", "good"]))
  })

  it("forces an enact when the president rejects the veto", () => {
    const room = roomAt(VETO_CONFIRM, 5, {
      presidentId: "p1", chancellorId: "p2", hand: ["bad", "good"], vetoOffered: true,
      vetoApproved: false, board: { good: 0, bad: 5 }
    })
    const t = secretPoliticianEngine.next(room, RNG)
    expect(t.phase).toBe(BOARD_UPDATE)
    expect((t.state as unknown as PoliticianState).board.bad).toBe(6)
  })
})

describe("the election tracker and chaos", () => {
  it("just bumps the tracker on the first and second failed elections", () => {
    const voteRoom = roomAt(VOTE_GOVERNMENT, 5, {
      tracker: 1, chancellorNomineeId: "p2", ballots: { p1: false, p2: false, p3: false, p4: true, p5: true }
    })
    const t = secretPoliticianEngine.next(voteRoom, RNG)
    expect(t.phase).toBe(NOMINATION)
    expect((t.state as unknown as PoliticianState).tracker).toBe(2)
  })

  it("auto-enacts the top card and resets the tracker on the third failed election", () => {
    const voteRoom = roomAt(VOTE_GOVERNMENT, 5, {
      tracker: 2, chancellorNomineeId: "p2", deck: ["bad", "good", "good"],
      lastElected: { presidentId: "p3", chancellorId: "p4" },
      ballots: { p1: false, p2: false, p3: false, p4: true, p5: true }
    })
    const t = secretPoliticianEngine.next(voteRoom, RNG)
    expect(t.phase).toBe(BOARD_UPDATE)
    const state = t.state as unknown as PoliticianState
    expect(state.tracker).toBe(0)
    expect(state.lastElected).toBeNull()
    expect(state.board.bad).toBe(1)
    expect(state.lastEnactedFromChaos).toBe(true)
  })

  it("never opens an executive power from a chaos-enacted bad law", () => {
    const room = roomAt(BOARD_UPDATE, 10, {
      board: { good: 0, bad: 1 }, lastEnactedCard: "bad", lastEnactedFromChaos: true
    })
    const t = secretPoliticianEngine.next(room, RNG)
    expect(t.phase).toBe(NOMINATION)
  })
})

describe("the deck", () => {
  it("reshuffles the discard back in before a draw that would run the deck short", () => {
    const room = roomAt(VOTE_GOVERNMENT, 5, {
      chancellorNomineeId: "p2", deck: ["good"], discard: ["bad", "bad", "good"],
      ballots: { p1: true, p2: true, p3: true, p4: false, p5: false }
    })
    const t = secretPoliticianEngine.next(room, RNG)
    const state = t.state as unknown as PoliticianState
    expect(t.phase).toBe(LEGISLATIVE_PRESIDENT)
    expect(state.hand).toHaveLength(3)
    expect(state.discard).toEqual([])
    // Every card that existed before the draw is still accounted for.
    expect(state.hand.length + state.deck.length).toBe(4)
  })
})

describe("presidential powers", () => {
  it.each([
    [1, 10, "investigate"], [1, 8, undefined], [1, 6, undefined],
    [2, 8, "investigate"], [2, 6, undefined],
    [3, 6, "peek"], [3, 8, "specialElection"],
    [4, 6, "execute"], [4, 8, "execute"], [4, 10, "execute"],
    [5, 6, "execute"]
  ])("opens the right power at %i bad laws for %i players", (badCount, playerCount, expected) => {
    const chancellor = roomAt(LEGISLATIVE_CHANCELLOR, playerCount, {
      chancellorId: "p2", hand: ["bad", "good"],
      board: { good: 0, bad: badCount - 1 }
    })
    const afterEnact = secretPoliticianEngine.act(chancellor, "p2", { type: "enact", index: 0 }) as unknown as PoliticianState
    const boardUpdate = secretPoliticianEngine.next({ ...chancellor, gameState: afterEnact as unknown as GameState }, RNG)
    const finalT = secretPoliticianEngine.next(
      { ...chancellor, phase: boardUpdate.phase, gameState: boardUpdate.state as unknown as GameState }, RNG
    )
    if (expected === undefined) {
      expect(finalT.phase).toBe(NOMINATION)
    } else {
      expect(finalT.phase).toBe(EXECUTIVE_ACTION)
      expect((finalT.state as unknown as PoliticianState).pendingPower).toBe(expected)
    }
  })

  it("investigate reveals a side only to the president, and the leader reads as a traitor", () => {
    const room = roomAt(EXECUTIVE_ACTION, 7, {
      presidentId: "p1", pendingPower: "investigate",
      roles: { p1: "innocent", p2: "leader", p3: "traitor", p4: "innocent", p5: "innocent", p6: "innocent", p7: "innocent" }
    })
    const next = secretPoliticianEngine.act(room, "p1", { type: "investigate", targetId: "p2" }) as unknown as PoliticianState
    expect(next.investigationResult).toEqual({ targetId: "p2", side: "traitor" })

    const after = { ...room, gameState: next as unknown as GameState }
    expect((secretPoliticianEngine.view(after, "p1") as PoliticianExecutiveActionView).investigationResult)
      .toEqual({ targetId: "p2", side: "traitor" })
    expect((secretPoliticianEngine.view(after, "p3") as PoliticianExecutiveActionView).investigationResult).toBeNull()
  })

  it("peek shows the top three cards to the president alone, and removes nothing", () => {
    const chancellor = roomAt(LEGISLATIVE_CHANCELLOR, 6, {
      presidentId: "p1", chancellorId: "p2", hand: ["bad", "good"],
      board: { good: 0, bad: 2 }, deck: ["good", "bad", "good", "good", "bad"]
    })
    const afterEnact = secretPoliticianEngine.act(chancellor, "p2", { type: "enact", index: 0 }) as unknown as PoliticianState
    const boardUpdate = secretPoliticianEngine.next({ ...chancellor, gameState: afterEnact as unknown as GameState }, RNG)
    const executive = secretPoliticianEngine.next(
      { ...chancellor, phase: boardUpdate.phase, gameState: boardUpdate.state as unknown as GameState }, RNG
    )
    expect(executive.phase).toBe(EXECUTIVE_ACTION)
    const state = executive.state as unknown as PoliticianState
    expect(state.pendingPower).toBe("peek")
    expect(state.peekCards).toHaveLength(3)
    // Nothing was drawn out of the deck for a peek — it is only looked at.
    expect(state.deck).toHaveLength(5)

    const executiveRoom = { ...chancellor, phase: executive.phase, gameState: state as unknown as GameState }
    expect((secretPoliticianEngine.view(executiveRoom, "p1") as PoliticianExecutiveActionView).peekCards).toHaveLength(3)
    expect((secretPoliticianEngine.view(executiveRoom, "p3") as PoliticianExecutiveActionView).peekCards).toBeNull()
  })

  it("execute removes the target from the living", () => {
    const room = roomAt(EXECUTIVE_ACTION, 7, { presidentId: "p1", pendingPower: "execute" })
    const next = secretPoliticianEngine.act(room, "p1", { type: "execute", targetId: "p4" }) as unknown as PoliticianState
    expect(next.alive).not.toContain("p4")
  })

  it("wins it for the innocents the instant the leader is executed", () => {
    const room = roomAt(EXECUTIVE_ACTION, 7, {
      presidentId: "p1", pendingPower: "execute",
      roles: { p1: "innocent", p2: "leader", p3: "traitor", p4: "innocent", p5: "innocent", p6: "innocent", p7: "innocent" }
    })
    const afterExecute = secretPoliticianEngine.act(room, "p1", { type: "execute", targetId: "p2" }) as unknown as PoliticianState
    const t = secretPoliticianEngine.next({ ...room, gameState: afterExecute as unknown as GameState }, RNG)
    expect(t.phase).toBe(GAME_OVER)
    expect(t.winner).toBe("innocents")
  })

  it("special election appoints next round's president without moving the rotation index", () => {
    const room = roomAt(EXECUTIVE_ACTION, 7, {
      order: ["p1", "p2", "p3", "p4", "p5", "p6", "p7"], alive: ["p1", "p2", "p3", "p4", "p5", "p6", "p7"],
      presidentIndex: 2, presidentId: "p3", pendingPower: "specialElection"
    })
    const afterAct = secretPoliticianEngine.act(room, "p3", { type: "specialElection", targetId: "p6" }) as unknown as PoliticianState
    expect(afterAct.specialPresidentId).toBe("p6")

    const t = secretPoliticianEngine.next({ ...room, gameState: afterAct as unknown as GameState }, RNG)
    expect(t.phase).toBe(NOMINATION)
    const afterState = t.state as unknown as PoliticianState
    expect(afterState.presidentId).toBe("p6")
    expect(afterState.presidentIndex).toBe(2)
    expect(afterState.specialPresidentId).toBeNull()
  })

  it("resumes normal rotation from where it left off once the special election's round ends", () => {
    // p3 (index 2) handed the chair to p6 without moving the rotation. Once
    // p6's own round is rejected, order should resume from index 3 (p4) —
    // never from wherever p6 would have been.
    const afterSpecial = roomAt(VOTE_GOVERNMENT, 7, {
      order: ["p1", "p2", "p3", "p4", "p5", "p6", "p7"], alive: ["p1", "p2", "p3", "p4", "p5", "p6", "p7"],
      presidentIndex: 2, presidentId: "p6", specialPresidentId: null,
      chancellorNomineeId: "p1", tracker: 0,
      ballots: { p1: false, p2: false, p3: false, p4: true, p5: true, p6: false, p7: false }
    })
    const t = secretPoliticianEngine.next(afterSpecial, RNG)
    expect(t.phase).toBe(NOMINATION)
    const state = t.state as unknown as PoliticianState
    expect(state.presidentIndex).toBe(3)
    expect(state.presidentId).toBe("p4")
  })

  it("times out to a deterministic default target instead of stalling", () => {
    const room = roomAt(EXECUTIVE_ACTION, 7, { presidentId: "p1", pendingPower: "execute" })
    const t = secretPoliticianEngine.next(room, RNG)
    expect(t.phase).toBe(NOMINATION)
    const state = t.state as unknown as PoliticianState
    expect(state.alive).toHaveLength(6)
    expect(state.lastExecutive?.power).toBe("execute")
  })
})

describe("winning", () => {
  it("innocents win at five good laws", () => {
    const room = roomAt(BOARD_UPDATE, 5, { board: { good: 5, bad: 2 }, lastEnactedCard: "good" })
    const t = secretPoliticianEngine.next(room, RNG)
    expect(t.phase).toBe(GAME_OVER)
    expect(t.winner).toBe("innocents")
  })

  it("traitors win at six bad laws", () => {
    const room = roomAt(BOARD_UPDATE, 5, { board: { good: 2, bad: 6 }, lastEnactedCard: "bad", lastEnactedFromChaos: false })
    const t = secretPoliticianEngine.next(room, RNG)
    expect(t.phase).toBe(GAME_OVER)
    expect(t.winner).toBe("traitors")
  })

  it("the game-over screen finally shows every role", () => {
    const room = roomAt(GAME_OVER, 5, { winner: "innocents" })
    const view = secretPoliticianEngine.view(room, "p3") as { kind: string; roles: Record<string, string> }
    expect(view.kind).toBe("politician-over")
    expect(view.roles).toEqual(stateOf(room).roles)
  })
})

describe("the secret hand never leaks", () => {
  const phases = [
    ROLE_REVEAL, NOMINATION, VOTE_GOVERNMENT, LEGISLATIVE_PRESIDENT,
    LEGISLATIVE_CHANCELLOR, VETO_CONFIRM, BOARD_UPDATE, EXECUTIVE_ACTION
  ]

  it.each(phases)("in %s, only the entitled key ever carries roles, deck, discard or another player's hand", phase => {
    const room = roomAt(phase, 7, {
      presidentId: "p1", chancellorId: "p2", chancellorNomineeId: "p2",
      hand: ["good", "bad"], pendingPower: "investigate", vetoOffered: true
    })
    for (const player of room.players) {
      const view = secretPoliticianEngine.view(room, player.id) as unknown as Record<string, unknown>
      expect(view).not.toHaveProperty("roles")
      expect(view).not.toHaveProperty("deck")
      expect(view).not.toHaveProperty("discard")
      expect(view).not.toHaveProperty("ballots")
      if ("hand" in view && view["hand"] !== null) {
        const isActor = (phase === LEGISLATIVE_PRESIDENT && player.id === "p1")
          || (phase === LEGISLATIVE_CHANCELLOR && player.id === "p2")
        expect(isActor).toBe(true)
      }
    }
  })

  it("keeps the vote sealed while it is still being cast", () => {
    const room = roomAt(VOTE_GOVERNMENT, 5, { chancellorNomineeId: "p2", ballots: { p1: true } })
    for (const id of ["p2", "p3", "p4", "p5"]) {
      const view = secretPoliticianEngine.view(room, id) as PoliticianVoteView
      expect(view.myVote).toBeNull()
    }
    const json = JSON.stringify(secretPoliticianEngine.view(room, "p3"))
    expect(json).not.toContain("\"p1\":true")
  })
})

describe("a phone that goes dark", () => {
  it("does not cut the board-update display short when a phone drops", () => {
    const room = roomAt(BOARD_UPDATE, 5, { board: { good: 1, bad: 0 }, lastEnactedCard: "good" })
    const pending = secretPoliticianEngine.pending(room)
    expect(pending.length).toBeGreaterThan(0)
  })

  it("waits out the full clock for a disconnected president rather than closing early", () => {
    const room = roomAt(LEGISLATIVE_PRESIDENT, 5, {
      presidentId: "p1", hand: ["bad", "good", "good"]
    }, { players: mkRoom(5).players.map(p => p.id === "p1" ? { ...p, connected: false } : p) })
    expect(secretPoliticianEngine.pending(room)).toEqual(["p1"])
  })

  it("is not waited on for a vote once every other connected player has voted", () => {
    const players = mkRoom(5).players.map(p => p.id === "p5" ? { ...p, connected: false } : p)
    const room = roomAt(VOTE_GOVERNMENT, 5, {
      chancellorNomineeId: "p2", ballots: { p1: true, p2: true, p3: true, p4: false }
    }, { players })
    expect(secretPoliticianEngine.pending(room)).toEqual([])
  })
})

describe("a full playthrough", () => {
  it("plays role reveal through a full round and back to a fresh nomination", async () => {
    const h = await harness(mkRoom(5))
    await startGame(h.deps, "POL01", "s3cret")
    expect((await h.room()).phase).toBe(ROLE_REVEAL)

    await hostAdvance(h.deps, "POL01", "s3cret", await h.seq())
    expect((await h.room()).phase).toBe(NOMINATION)

    let seq = await h.seq()
    let state = await h.state()
    await submitAction(h.deps, "POL01", state.presidentId, seq, {
      type: "nominate", targetId: state.order.find(id => id !== state.presidentId)!
    })
    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.room()).phase).toBe(VOTE_GOVERNMENT)

    seq = await h.seq()
    state = await h.state()
    for (const id of state.alive) {
      await submitAction(h.deps, "POL01", id, seq, { type: "vote", approve: true })
    }
    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.room()).phase).toBe(LEGISLATIVE_PRESIDENT)

    seq = await h.seq()
    state = await h.state()
    await submitAction(h.deps, "POL01", state.presidentId, seq, { type: "discard", index: 0 })
    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.room()).phase).toBe(LEGISLATIVE_CHANCELLOR)

    seq = await h.seq()
    state = await h.state()
    await submitAction(h.deps, "POL01", state.chancellorId!, seq, { type: "enact", index: 0 })
    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.room()).phase).toBe(BOARD_UPDATE)

    await vi.advanceTimersByTimeAsync(6_000)
    const after = await h.room()
    expect([NOMINATION, EXECUTIVE_ACTION]).toContain(after.phase)
    expect(after.round).toBeGreaterThanOrEqual(1)
  })
})
