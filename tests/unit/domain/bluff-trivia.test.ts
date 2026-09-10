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
  BLUFF_TRIVIA_ID, GAME_OVER, GUESSING_PHASE, QUESTION_INPUT, SCORE_REVEAL, SUBMIT_LIES,
  bluffTriviaEngine, normalizeAnswer, seededShuffle, type BluffTriviaState
} from "@server/games/bluff-trivia.js"
import { BLUFF_TRIVIA_QUESTIONS } from "@server/games/questions/bluff-trivia.js"
import type {
  BluffTriviaGuessingView, BluffTriviaRevealView, BluffTriviaSubmitView, BluffTriviaView
} from "@shared/bluff-trivia.js"

const QUESTION_MS = 4_000
const SUBMIT_MS = 30_000
const GUESS_MS = 25_000

function mkRoom(overrides: Partial<Room> = {}): Room {
  const now = Date.now()
  return {
    code: "BLF01", gameId: BLUFF_TRIVIA_ID, adminSecret: "s3cret", assigned: false,
    settings: { roundCount: 6 },
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
  viewFor(playerId: string): Promise<BluffTriviaView>
}

async function harness(room: Room = mkRoom()): Promise<Harness> {
  const store = new MemoryStore()
  await store.create(room)
  const phases: Harness["phases"] = []
  const overs: GameOverEvent[] = []
  const deps: EngineDeps = {
    store, resolveEngine,
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
      return bluffTriviaEngine.view((await store.get(room.code))!, playerId) as BluffTriviaView
    }
  }
}

/** Start, then run the reading clock down so the room is taking lies. */
async function atSubmitting(h: Harness): Promise<number> {
  await startGame(h.deps, "BLF01", "s3cret")
  await vi.advanceTimersByTimeAsync(QUESTION_MS)
  return h.seq()
}

/** Submit the given lies, then run the writing clock down so the room is guessing. */
async function atGuessing(h: Harness, lies: Record<string, string>): Promise<number> {
  const seq = await atSubmitting(h)
  for (const [playerId, text] of Object.entries(lies)) {
    await submitAction(h.deps, "BLF01", playerId, seq, { type: "lie", text })
  }
  await vi.advanceTimersByTimeAsync(SUBMIT_MS)
  return h.seq()
}

async function correctOptionId(h: Harness): Promise<string> {
  const state = (await h.room()).gameState as BluffTriviaState
  return state.options.find(o => o.kind === "correct")!.id
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { cancelAllTimers(); vi.useRealTimers() })

describe("registration", () => {
  it("is the engine the server resolves for its own slug", () => {
    expect(resolveEngine(BLUFF_TRIVIA_ID)).toBe(bluffTriviaEngine)
    expect(isTurnBased(BLUFF_TRIVIA_ID)).toBe(true)
  })

  it("is in the catalogue, needs two players, and is marked turn-based", () => {
    const game = resolveGame(BLUFF_TRIVIA_ID)
    expect(game).toBeDefined()
    expect(game!.minPlayers).toBe(2)
    expect(game!.turnBased).toBe(true)
  })

  it("does not disturb the engine already registered for Most Likely To", () => {
    expect(resolveEngine("most-likely-to")).not.toBe(bluffTriviaEngine)
    expect(isTurnBased("most-likely-to")).toBe(true)
  })
})

describe("normalizeAnswer", () => {
  it("folds Turkish dotless/dotted I the Turkish way, not the default way", () => {
    expect(normalizeAnswer("YIL")).toBe("yıl")
    expect(normalizeAnswer("İSTANBUL")).toBe("istanbul")
  })

  it("trims and collapses repeated whitespace without touching interior casing rules", () => {
    expect(normalizeAnswer("  a   parfüm   olarak  ")).toBe("a parfüm olarak")
  })

  it("treats visually-equal Unicode compositions as the same answer", () => {
    expect(normalizeAnswer("café")).toBe(normalizeAnswer("café"))
  })
})

describe("seededShuffle", () => {
  it("gives the same order for the same seed", () => {
    const items = ["a", "b", "c", "d", "e"]
    expect(seededShuffle(items, "ROOM1-1-q1")).toEqual(seededShuffle(items, "ROOM1-1-q1"))
  })

  it("gives a different order for a different seed", () => {
    const items = ["a", "b", "c", "d", "e"]
    expect(seededShuffle(items, "ROOM1-1-q1")).not.toEqual(seededShuffle(items, "ROOM2-1-q1"))
  })

  it("never drops or duplicates an item", () => {
    const items = [1, 2, 3, 4, 5, 6]
    expect([...seededShuffle(items, "seed")].sort()).toEqual(items)
  })
})

describe("a round", () => {
  it("opens on a question and moves to lie submission on its own", async () => {
    const h = await harness()
    const started = await startGame(h.deps, "BLF01", "s3cret")

    expect(started.phase).toBe(QUESTION_INPUT)
    expect(started.round).toBe(1)
    const shown = await h.viewFor("p1")
    expect(shown.kind).toBe("bluff-question")
    expect(shown.question.tr.length).toBeGreaterThan(0)

    await vi.advanceTimersByTimeAsync(QUESTION_MS)
    const room = await h.room()
    expect(room.phase).toBe(SUBMIT_LIES)
    expect(room.phaseEndsAt).toBe(Date.now() + SUBMIT_MS)
  })

  it("moves from submitting to guessing once the clock runs out, with a full pool", async () => {
    const h = await harness()
    await atSubmitting(h)
    await vi.advanceTimersByTimeAsync(SUBMIT_MS)

    expect((await h.room()).phase).toBe(GUESSING_PHASE)
    const view = await h.viewFor("p1") as BluffTriviaGuessingView
    expect(view.options.length).toBeGreaterThanOrEqual(4)
  })

  it("opens guessing early once everyone has submitted", async () => {
    const h = await harness()
    const seq = await atSubmitting(h)
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "lie", text: "One" })
    await submitAction(h.deps, "BLF01", "p2", seq, { type: "lie", text: "Two" })
    await submitAction(h.deps, "BLF01", "p3", seq, { type: "lie", text: "Three" })

    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.room()).phase).toBe(GUESSING_PHASE)
  })

  it("moves to score reveal once the clock runs out, missing guesses and all", async () => {
    const h = await harness()
    await atGuessing(h, {})
    await vi.advanceTimersByTimeAsync(GUESS_MS)

    const room = await h.room()
    expect(room.phase).toBe(SCORE_REVEAL)
    expect(room.phaseEndsAt).toBeNull()
  })

  it("opens the reveal early once everyone has guessed", async () => {
    const h = await harness()
    const seq = await atGuessing(h, {})
    const view = await h.viewFor("p1") as BluffTriviaGuessingView
    for (const playerId of ["p1", "p2", "p3"]) {
      await submitAction(h.deps, "BLF01", playerId, seq, { type: "guess", optionId: view.options[0]!.optionId })
    }
    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.room()).phase).toBe(SCORE_REVEAL)
  })

  it("hands the next round to the host, not to a clock", async () => {
    const h = await harness()
    await atGuessing(h, {})
    await vi.advanceTimersByTimeAsync(GUESS_MS)

    await hostAdvance(h.deps, "BLF01", "s3cret", await h.seq())
    const room = await h.room()
    expect(room.phase).toBe(QUESTION_INPUT)
    expect(room.round).toBe(2)
  })

  it("never asks the same question twice in one game", async () => {
    const h = await harness(mkRoom({ settings: { roundCount: BLUFF_TRIVIA_QUESTIONS.length } }))
    await startGame(h.deps, "BLF01", "s3cret")
    const asked = new Set<string>()

    for (let round = 0; round < BLUFF_TRIVIA_QUESTIONS.length; round++) {
      const state = (await h.room()).gameState as BluffTriviaState
      expect(asked.has(state.questionId)).toBe(false)
      asked.add(state.questionId)
      await vi.advanceTimersByTimeAsync(QUESTION_MS + SUBMIT_MS + GUESS_MS)
      await hostAdvance(h.deps, "BLF01", "s3cret", await h.seq())
    }
    expect(asked.size).toBe(BLUFF_TRIVIA_QUESTIONS.length)
  })

  it("ends the game after the last round", async () => {
    const h = await harness(mkRoom({ settings: { roundCount: 2 } }))
    await startGame(h.deps, "BLF01", "s3cret")

    for (let round = 0; round < 2; round++) {
      await vi.advanceTimersByTimeAsync(QUESTION_MS + SUBMIT_MS + GUESS_MS)
      await hostAdvance(h.deps, "BLF01", "s3cret", await h.seq())
    }

    expect((await h.room()).phase).toBe(GAME_OVER)
    expect(h.overs).toHaveLength(1)
    expect((await h.viewFor("p1")).kind).toBe("bluff-over")
  })
})

describe("submitting a lie", () => {
  it("keeps the correct answer off every view before the guessing pool is built", async () => {
    const h = await harness()
    await startGame(h.deps, "BLF01", "s3cret")
    const answer = BLUFF_TRIVIA_QUESTIONS[0]!.correctAnswer.en

    for (const playerId of ["p1", "p2", "p3"]) {
      expect(JSON.stringify(await h.viewFor(playerId))).not.toContain(answer)
    }
    await vi.advanceTimersByTimeAsync(QUESTION_MS)
    for (const playerId of ["p1", "p2", "p3"]) {
      expect(JSON.stringify(await h.viewFor(playerId))).not.toContain(answer)
    }
  })

  it("never says which pooled option is the correct one while guessing is open", async () => {
    const h = await harness()
    await atGuessing(h, { p1: "A silly guess" })
    // The correct answer's text is meant to be in the pool — that is the
    // whole game — but nothing marking it correct (kind, ownerIds) may leak.
    const view = JSON.stringify(await h.viewFor("p2"))
    expect(view).not.toContain("ownerIds")
    expect(view).not.toMatch(/"(kind|type)":"correct"/)
  })

  it("accepts a lie and reflects it back only to its own author", async () => {
    const h = await harness()
    const seq = await atSubmitting(h)
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "lie", text: "A silly guess" })

    const mine = await h.viewFor("p1") as BluffTriviaSubmitView
    const theirs = await h.viewFor("p2") as BluffTriviaSubmitView
    expect(mine.mySubmission).toBe("A silly guess")
    expect(theirs.mySubmission).toBeNull()
    expect(mine.submittedCount).toBe(1)
    expect(JSON.stringify(theirs)).not.toContain("A silly guess")
  })

  it("rejects a lie over 80 characters", async () => {
    const h = await harness()
    const seq = await atSubmitting(h)
    await expect(
      submitAction(h.deps, "BLF01", "p1", seq, { type: "lie", text: "x".repeat(81) })
    ).rejects.toThrow("INVALID_INPUT")
  })

  it("accepts a lie at exactly 80 characters", async () => {
    const h = await harness()
    const seq = await atSubmitting(h)
    await expect(
      submitAction(h.deps, "BLF01", "p1", seq, { type: "lie", text: "x".repeat(80) })
    ).resolves.not.toThrow()
  })

  it("rejects an empty (whitespace-only) lie", async () => {
    const h = await harness()
    const seq = await atSubmitting(h)
    await expect(
      submitAction(h.deps, "BLF01", "p1", seq, { type: "lie", text: "   " })
    ).rejects.toThrow("INVALID_INPUT")
  })

  it("stores an XSS-looking lie as harmless literal text", async () => {
    const h = await harness()
    const seq = await atSubmitting(h)
    const payload = "<script>alert(1)</script>"
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "lie", text: payload })
    expect((await h.viewFor("p1") as BluffTriviaSubmitView).mySubmission).toBe(payload)
  })

  it("rejects a second submission from the same player", async () => {
    const h = await harness()
    const seq = await atSubmitting(h)
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "lie", text: "First" })
    await expect(
      submitAction(h.deps, "BLF01", "p1", seq, { type: "lie", text: "Second" })
    ).rejects.toThrow("INVALID_INPUT")
  })

  it("rejects a lie submitted outside the writing phase", async () => {
    const h = await harness()
    await startGame(h.deps, "BLF01", "s3cret")
    await expect(
      submitAction(h.deps, "BLF01", "p1", await h.seq(), { type: "lie", text: "Too early" })
    ).rejects.toThrow("GAME_NOT_RUNNING")
  })

  it("rejects a lie that arrives after the writing phase is locked", async () => {
    const h = await harness()
    const seq = await atSubmitting(h)
    await vi.advanceTimersByTimeAsync(SUBMIT_MS)
    await expect(
      submitAction(h.deps, "BLF01", "p1", seq, { type: "lie", text: "Too late" })
    ).rejects.toThrow("PHASE_STALE")
  })

  it("accepts a lie that normalizes to the correct answer, rather than rejecting it", async () => {
    const h = await harness()
    const seq = await atSubmitting(h)
    await expect(
      submitAction(h.deps, "BLF01", "p1", seq, { type: "lie", text: "  BINLERCE   YIL  " })
    ).resolves.not.toThrow()
  })
})

describe("building the guessing pool", () => {
  it("merges identical lies (case/whitespace-insensitive) into one option owned by both", async () => {
    const h = await harness()
    await atGuessing(h, { p2: "a parfüm olarak", p3: "  A PARFÜM olarak " })
    const state = (await h.room()).gameState as BluffTriviaState
    const lieOptions = state.options.filter(o => o.kind === "lie")
    expect(lieOptions).toHaveLength(1)
    expect(lieOptions[0]!.ownerIds.slice().sort()).toEqual(["p2", "p3"])
  })

  it("excludes a lie that matches the correct answer from the pool, crediting a truth-guess instead", async () => {
    const h = await harness()
    await atGuessing(h, { p1: "  binlerce   YIL  ", p2: "Wrong guess" })
    const state = (await h.room()).gameState as BluffTriviaState
    expect(state.truthGuesserPlayerIds).toEqual(["p1"])
    expect(state.options.some(o => o.kind === "lie" && o.ownerIds.includes("p1"))).toBe(false)
  })

  it("marks an own lie for its writer only, never leaking ownership to anyone else", async () => {
    const h = await harness()
    await atGuessing(h, { p1: "My own lie" })
    const mine = await h.viewFor("p1") as BluffTriviaGuessingView
    const theirs = await h.viewFor("p2") as BluffTriviaGuessingView
    expect(mine.options.some(o => o.isOwn)).toBe(true)
    expect(theirs.options.every(o => !o.isOwn)).toBe(true)
    expect(JSON.stringify(theirs)).not.toContain("ownerIds")
  })

  it("fills the pool with decoys when there are not enough submitted lies", async () => {
    const h = await harness()
    await atGuessing(h, {})
    const view = await h.viewFor("p1") as BluffTriviaGuessingView
    expect(view.options.length).toBeGreaterThanOrEqual(4)
  })

  it("gives every player the same option order", async () => {
    const h = await harness()
    await atGuessing(h, { p1: "One lie", p2: "Another lie" })
    const forP1 = await h.viewFor("p1") as BluffTriviaGuessingView
    const forP2 = await h.viewFor("p2") as BluffTriviaGuessingView
    expect(forP2.options.map(o => o.optionId)).toEqual(forP1.options.map(o => o.optionId))
  })
})

describe("what a guess is refused for", () => {
  it("refuses a guess for your own lie", async () => {
    const h = await harness()
    const seq = await atGuessing(h, { p1: "My own lie" })
    const mine = await h.viewFor("p1") as BluffTriviaGuessingView
    const ownOption = mine.options.find(o => o.isOwn)!
    await expect(
      submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: ownOption.optionId })
    ).rejects.toThrow("INVALID_INPUT")
  })

  it("refuses a second guess in the same round", async () => {
    const h = await harness()
    const seq = await atGuessing(h, {})
    const view = await h.viewFor("p1") as BluffTriviaGuessingView
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: view.options[0]!.optionId })
    await expect(
      submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: view.options[1]!.optionId })
    ).rejects.toThrow("INVALID_INPUT")
  })

  it("refuses an unknown option id", async () => {
    const h = await harness()
    const seq = await atGuessing(h, {})
    await expect(
      submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: "opt-does-not-exist" })
    ).rejects.toThrow("INVALID_INPUT")
  })

  it("refuses a guess submitted outside the guessing phase", async () => {
    const h = await harness()
    const seq = await atSubmitting(h)
    await expect(
      submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: "opt-correct" })
    ).rejects.toThrow("GAME_NOT_RUNNING")
  })

  it("refuses a guess that arrives after the guessing phase is locked", async () => {
    const h = await harness()
    const seq = await atGuessing(h, {})
    await vi.advanceTimersByTimeAsync(GUESS_MS)
    await expect(
      submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: "opt-correct" })
    ).rejects.toThrow("PHASE_STALE")
  })
})

describe("scoring", () => {
  it("gives +500 for a correct guess", async () => {
    const h = await harness()
    const seq = await atGuessing(h, { p2: "Wrong guess" })
    const correctId = await correctOptionId(h)
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: correctId })
    await vi.advanceTimersByTimeAsync(GUESS_MS)
    expect((await h.room()).scores.p1).toBe(500)
  })

  it("gives a lie's owner +250 for every player fooled by it", async () => {
    const h = await harness()
    const seq = await atGuessing(h, { p3: "A tempting lie" })
    const lieOption = ((await h.room()).gameState as BluffTriviaState).options.find(o => o.kind === "lie")!
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: lieOption.id })
    await submitAction(h.deps, "BLF01", "p2", seq, { type: "guess", optionId: lieOption.id })
    await vi.advanceTimersByTimeAsync(GUESS_MS)
    expect((await h.room()).scores.p3).toBe(500)
  })

  it("pays every owner of a merged lie the full fooled bonus, not a split share", async () => {
    const room = mkRoom({
      players: [
        { id: "p1", name: "A", role: null, connected: true, character: "owl" },
        { id: "p2", name: "B", role: null, connected: true, character: "fox" },
        { id: "p3", name: "C", role: null, connected: true, character: "wolf" },
        { id: "p4", name: "D", role: null, connected: true, character: "cat" }
      ]
    })
    const h = await harness(room)
    // Whitespace-only variation: the case-folding quirk of Turkish-safe
    // lowercasing (capital "I" -> dotless "ı") has its own dedicated test
    // below and would otherwise make "SAME LIE" miss "same lie" here.
    const seq = await atGuessing(h, { p3: "same lie", p4: "  same lie  " })
    const lieOption = ((await h.room()).gameState as BluffTriviaState).options.find(o => o.kind === "lie")!
    expect(lieOption.ownerIds.slice().sort()).toEqual(["p3", "p4"])

    await submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: lieOption.id })
    await submitAction(h.deps, "BLF01", "p2", seq, { type: "guess", optionId: lieOption.id })
    await vi.advanceTimersByTimeAsync(GUESS_MS)

    const scored = await h.room()
    expect(scored.scores.p3).toBe(500)
    expect(scored.scores.p4).toBe(500)
  })

  it("gives a truth-guesser a flat +1000 and not an additional +500 for also picking the answer", async () => {
    const h = await harness()
    const seq = await atGuessing(h, { p1: "  binlerce   YIL  " })
    const correctId = await correctOptionId(h)
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: correctId })
    await vi.advanceTimersByTimeAsync(GUESS_MS)
    expect((await h.room()).scores.p1).toBe(1000)
  })

  it("accumulates points across rounds rather than resetting them", async () => {
    const h = await harness(mkRoom({ settings: { roundCount: 2 } }))
    const seq1 = await atGuessing(h, {})
    await submitAction(h.deps, "BLF01", "p1", seq1, { type: "guess", optionId: await correctOptionId(h) })
    await vi.advanceTimersByTimeAsync(GUESS_MS)
    await hostAdvance(h.deps, "BLF01", "s3cret", await h.seq())

    await vi.advanceTimersByTimeAsync(QUESTION_MS + SUBMIT_MS)
    const seq2 = await h.seq()
    await submitAction(h.deps, "BLF01", "p1", seq2, { type: "guess", optionId: await correctOptionId(h) })
    await vi.advanceTimersByTimeAsync(GUESS_MS)

    expect((await h.room()).scores.p1).toBe(1000)
  })
})

describe("the reveal", () => {
  it("always shows the correct answer last, regardless of its own vote count", async () => {
    const h = await harness()
    const seq = await atGuessing(h, { p2: "A believable lie" })
    const correctId = await correctOptionId(h)
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: correctId })
    await submitAction(h.deps, "BLF01", "p3", seq, { type: "guess", optionId: correctId })
    await vi.advanceTimersByTimeAsync(GUESS_MS)

    const view = await h.viewFor("p1") as BluffTriviaRevealView
    expect(view.options.at(-1)!.optionId).toBe(correctId)
    expect(view.options.at(-1)!.voteCount).toBe(2)
  })

  it("orders the deceptions least-picked first", async () => {
    const h = await harness()
    const seq = await atGuessing(h, { p1: "Popular lie", p2: "Unpopular lie" })
    const state = (await h.room()).gameState as BluffTriviaState
    const popular = state.options.find(o => o.kind === "lie" && o.ownerIds.includes("p1"))!
    await submitAction(h.deps, "BLF01", "p3", seq, { type: "guess", optionId: popular.id })
    await vi.advanceTimersByTimeAsync(GUESS_MS)

    const view = await h.viewFor("p1") as BluffTriviaRevealView
    const counts = view.options.filter(o => o.optionId !== view.correctOptionId).map(o => o.voteCount)
    expect(counts).toEqual([...counts].sort((a, b) => a - b))
  })

  it("names who wrote a lie and who fell for it once the reveal opens", async () => {
    const h = await harness()
    const seq = await atGuessing(h, { p2: "A believable lie" })
    const lieOption = ((await h.room()).gameState as BluffTriviaState).options.find(o => o.kind === "lie")!
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: lieOption.id })
    await vi.advanceTimersByTimeAsync(GUESS_MS)

    const view = await h.viewFor("p3") as BluffTriviaRevealView
    const revealed = view.options.find(o => o.optionId === lieOption.id)!
    expect(revealed.owners).toEqual(["p2"])
    expect(revealed.selectedBy).toEqual(["p1"])
    expect(revealed.voteCount).toBe(1)
  })
})

describe("reconnect", () => {
  it("shows a reconnecting writer their own submission and nobody else's", async () => {
    const h = await harness()
    const seq = await atSubmitting(h)
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "lie", text: "My lie" })

    const reconnected = await h.viewFor("p1") as BluffTriviaSubmitView
    expect(reconnected.mySubmission).toBe("My lie")
    expect(reconnected.submittedCount).toBe(1)
    expect((await h.viewFor("p2") as BluffTriviaSubmitView).mySubmission).toBeNull()
  })

  it("gives a reconnecting guesser the same option order as before, and remembers their guess", async () => {
    const h = await harness()
    const seq = await atGuessing(h, { p2: "A lie" })
    const before = await h.viewFor("p1") as BluffTriviaGuessingView
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: before.options[0]!.optionId })

    const after = await h.viewFor("p1") as BluffTriviaGuessingView
    expect(after.options.map(o => o.optionId)).toEqual(before.options.map(o => o.optionId))
    expect(after.myGuess).toBe(before.options[0]!.optionId)
    await expect(
      submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: before.options[1]!.optionId })
    ).rejects.toThrow("INVALID_INPUT")
  })

  it("hands a reconnecting player the same authoritative reveal payload every time", async () => {
    const h = await harness()
    await atGuessing(h, {})
    await vi.advanceTimersByTimeAsync(GUESS_MS)

    expect(await h.viewFor("p1")).toEqual(await h.viewFor("p1"))
  })
})

describe("a phone that goes dark", () => {
  it("is not waited on once the rest of the room has guessed", async () => {
    const h = await harness()
    const seq = await atGuessing(h, {})
    const view = await h.viewFor("p1") as BluffTriviaGuessingView
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "guess", optionId: view.options[0]!.optionId })
    await submitAction(h.deps, "BLF01", "p2", seq, { type: "guess", optionId: view.options[0]!.optionId })

    expect(bluffTriviaEngine.pending(await h.room())).toEqual(["p3"])
    await h.store.update("BLF01", r => ({
      ...r, players: r.players.map(p => p.id === "p3" ? { ...p, connected: false } : p)
    }))
    expect(bluffTriviaEngine.pending(await h.room())).toEqual([])
  })

  it("does not cut the question-reading clock short when a phone drops before anyone acts", async () => {
    const h = await harness()
    await startGame(h.deps, "BLF01", "s3cret")
    await vi.advanceTimersByTimeAsync(1_000)
    await h.store.update("BLF01", r => ({
      ...r, players: r.players.map(p => p.id === "p3" ? { ...p, connected: false } : p)
    }))
    await onPlayerLeft(h.deps, "BLF01")

    await vi.advanceTimersByTimeAsync(1_200)
    expect((await h.room()).phase).toBe(QUESTION_INPUT)

    await vi.advanceTimersByTimeAsync(QUESTION_MS - 1_000 - 1_200)
    expect((await h.room()).phase).toBe(SUBMIT_LIES)
  })

  it("does not count a submission toward the live readout once its author has left", async () => {
    const h = await harness()
    const seq = await atSubmitting(h)
    await submitAction(h.deps, "BLF01", "p1", seq, { type: "lie", text: "Gone soon" })
    await h.store.update("BLF01", r => ({
      ...r, players: r.players.map(p => p.id === "p1" ? { ...p, connected: false } : p)
    }))
    const view = await h.viewFor("p2") as BluffTriviaSubmitView
    expect(view.submittedCount).toBe(0)
    expect(view.totalPlayers).toBe(2)
  })
})
