import type { GameState, LocalizedText, Room, Scores } from "@shared/types.js"
import type {
  BluffOptionKind, BluffTriviaPlayer, BluffTriviaRevealView, BluffTriviaView
} from "@shared/bluff-trivia.js"
import type { GameEngine, Transition } from "../domain/engine.js"
import { resolveGame } from "./catalog.js"
import { BLUFF_TRIVIA_QUESTIONS, resolveBluffQuestion, type BluffTriviaQuestion } from "./questions/bluff-trivia.js"

/**
 * Bluff Trivia — the table reads a question, everybody writes a plausible
 * lie, and then the room guesses which of the mixed-in answers is real.
 *
 * Four phases per round:
 *
 *   QUESTION_INPUT  the question, on a short clock; the real answer never
 *                   leaves the server
 *   SUBMIT_LIES     everyone writes one fake answer, on the room's clock
 *   GUESSING_PHASE  the real answer, every distinct lie, and enough decoys
 *                   to fill the screen, shuffled once and stored; closes
 *                   early once every connected phone has guessed
 *   SCORE_REVEAL    the whole reveal, least-picked lie first, real answer
 *                   last. No clock — the host decides when the table has
 *                   finished arguing about who wrote what
 *
 * The room lands on GAME_OVER once the configured number of rounds is played.
 */

export const BLUFF_TRIVIA_ID = "bluff-trivia"

export const QUESTION_INPUT = "QUESTION_INPUT"
export const SUBMIT_LIES = "SUBMIT_LIES"
export const GUESSING_PHASE = "GUESSING_PHASE"
export const SCORE_REVEAL = "SCORE_REVEAL"
export const GAME_OVER = "GAME_OVER"

const QUESTION_MS = 4_000
const SUBMIT_MS = 30_000
const GUESS_MS = 25_000

/** A lie shorter or longer than this never reaches the state. */
const MAX_LIE_LENGTH = 80

/** The guessing screen always has at least this many options. */
const MIN_OPTIONS = 4

// The catalogue already carries this under `defaultSettings` — read it from
// there rather than hand-duplicating it, so there is one source of truth for
// what a fresh room starts with.
const CATALOG_DEFAULTS = resolveGame(BLUFF_TRIVIA_ID)?.defaultSettings ?? {}

function catalogNumber(key: string, fallback: number): number {
  const value = CATALOG_DEFAULTS[key]
  return typeof value === "number" ? value : fallback
}

const DEFAULT_ROUNDS = catalogNumber("roundCount", 6)

function settingNumber(room: Room, key: string, fallback: number): number {
  const value = room.settings[key]
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function totalRounds(room: Room): number {
  return settingNumber(room, "roundCount", DEFAULT_ROUNDS)
}

/**
 * A question the table has not had yet. Once the seed is exhausted the pool
 * reopens rather than leaving a round with nothing to ask.
 */
function pickQuestion(asked: readonly string[], rng: () => number): BluffTriviaQuestion {
  const fresh = BLUFF_TRIVIA_QUESTIONS.filter(q => !asked.includes(q.id))
  const pool = fresh.length > 0 ? fresh : BLUFF_TRIVIA_QUESTIONS
  const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length))
  return pool[index]!
}

/** One player's submitted lie: what everyone would see, and what it compares as. */
export interface LieEntry {
  display: string
  normalized: string
}

/** One entry in the guessing pool. Never sent to a client with its `kind`/`ownerIds` intact before the reveal. */
export interface BluffOption {
  id: string
  text: LocalizedText
  kind: BluffOptionKind
  /** Who wrote this exact (normalized) lie. Empty for the correct answer and for a decoy. */
  ownerIds: string[]
}

export interface BluffTriviaState extends GameState {
  questionId: string
  /** Ids already used this game, so a round never repeats a question. */
  asked: string[]
  /** This round's submissions: playerId -> what they wrote. */
  lies: Record<string, LieEntry>
  /** Players whose lie normalized to the real answer — a bonus, not a pool entry. */
  truthGuesserPlayerIds: string[]
  /** The final, shuffled guessing pool. Built once, entering GUESSING_PHASE. */
  options: BluffOption[]
  /** This round's guesses: playerId -> optionId. */
  guesses: Record<string, string>
}

/** The room row comes back through JSON, so nothing in it is trusted as typed. */
function stateOf(room: Room): BluffTriviaState {
  const raw = room.gameState as Partial<BluffTriviaState>
  return {
    questionId: typeof raw.questionId === "string" ? raw.questionId : "",
    asked: Array.isArray(raw.asked) ? raw.asked : [],
    lies: typeof raw.lies === "object" && raw.lies !== null ? raw.lies : {},
    truthGuesserPlayerIds: Array.isArray(raw.truthGuesserPlayerIds) ? raw.truthGuesserPlayerIds : [],
    options: Array.isArray(raw.options) ? raw.options : [],
    guesses: typeof raw.guesses === "object" && raw.guesses !== null ? raw.guesses : {}
  }
}

function openRound(asked: readonly string[], rng: () => number): BluffTriviaState {
  const question = pickQuestion(asked, rng)
  return {
    questionId: question.id, asked: [...asked, question.id],
    lies: {}, truthGuesserPlayerIds: [], options: [], guesses: {}
  }
}

/**
 * What a lie is compared as: trimmed, whitespace collapsed, Unicode-folded,
 * and lowercased with the Turkish locale so "İ" and "I" fold the way a
 * Turkish keyboard expects rather than the way the default locale would.
 * The text a player actually typed is kept separately — this is only ever
 * used to decide whether two answers are "the same answer".
 */
export function normalizeAnswer(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").normalize("NFKC").toLocaleLowerCase("tr")
}

function normalizedVariants(text: LocalizedText): string[] {
  return Object.values(text).map(normalizeAnswer)
}

/** A player's raw lie has no translation — every locale of the option shows it as typed. */
function sameForAllLangs(text: string): LocalizedText {
  return { en: text, tr: text, ar: text, ku: text }
}

// ─── Deterministic shuffle ───────────────────────────────────────────────
// The room needs one option order every phone agrees on. The server only
// ever runs this once per round and stores the result, so nothing about
// this has to be fast — only reproducible, so a test can pin it down.

function hashSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const rng = mulberry32(hashSeed(seed))
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = tmp
  }
  return arr
}

/**
 * Turns this round's submissions into the guessing pool: the real answer,
 * one option per distinct lie (merged across everyone who wrote the same
 * one), and just enough decoys to keep the screen from looking thin.
 */
function buildOptionPool(
  question: BluffTriviaQuestion,
  lies: Record<string, LieEntry>,
  room: Room
): { options: BluffOption[]; truthGuesserPlayerIds: string[] } {
  const correctVariants = new Set(normalizedVariants(question.correctAnswer))
  const usedVariants = new Set(correctVariants)

  const truthGuesserPlayerIds: string[] = []
  // Insertion order of a Record with string keys is submission order, so the
  // first person to write a given lie is whose spelling the room sees.
  const groups = new Map<string, { display: string; ownerIds: string[] }>()

  for (const [playerId, lie] of Object.entries(lies)) {
    // Written the truth. That is a bonus of its own (3.3), not a fake option
    // — the real answer is already in the pool.
    if (correctVariants.has(lie.normalized)) {
      truthGuesserPlayerIds.push(playerId)
      continue
    }
    const group = groups.get(lie.normalized)
    if (group === undefined) groups.set(lie.normalized, { display: lie.display, ownerIds: [playerId] })
    else group.ownerIds.push(playerId)
  }

  const lieOptions: BluffOption[] = [...groups.entries()].map(([normalized, group], index) => {
    usedVariants.add(normalized)
    return { id: `opt-lie-${index}`, text: sameForAllLangs(group.display), kind: "lie" as const, ownerIds: group.ownerIds }
  })

  const correctOption: BluffOption = { id: "opt-correct", text: question.correctAnswer, kind: "correct", ownerIds: [] }

  const needed = Math.max(0, MIN_OPTIONS - (1 + lieOptions.length))
  const decoyOptions: BluffOption[] = []
  for (const decoy of question.decoys) {
    if (decoyOptions.length >= needed) break
    const variants = normalizedVariants(decoy)
    // A decoy that happens to match the real answer or an already-submitted
    // lie would look like a second copy of the same option on the screen.
    if (variants.some(v => usedVariants.has(v))) continue
    for (const v of variants) usedVariants.add(v)
    decoyOptions.push({ id: `opt-decoy-${decoyOptions.length}`, text: decoy, kind: "decoy", ownerIds: [] })
  }

  const pool = [correctOption, ...lieOptions, ...decoyOptions]
  const seed = `${room.code}-${room.round}-${question.id}`
  return { options: seededShuffle(pool, seed), truthGuesserPlayerIds }
}

/**
 * This round's score changes, in isolation — a pure function of the round's
 * own state, so it is testable without a room around it.
 */
export function computeRoundDeltas(state: BluffTriviaState): Scores {
  const deltas: Scores = {}
  const add = (id: string, points: number): void => { deltas[id] = (deltas[id] ?? 0) + points }

  const correctOption = state.options.find(o => o.kind === "correct")

  for (const [playerId, optionId] of Object.entries(state.guesses)) {
    const isTruthGuesser = state.truthGuesserPlayerIds.includes(playerId)
    if (correctOption !== undefined && optionId === correctOption.id) {
      // Their own +1000 below already rewards knowing the truth; picking the
      // answer they themselves wrote would be crediting the same insight twice.
      if (!isTruthGuesser) add(playerId, 500)
      continue
    }
    const option = state.options.find(o => o.id === optionId)
    for (const owner of option?.ownerIds ?? []) add(owner, 250)
  }

  for (const playerId of state.truthGuesserPlayerIds) add(playerId, 1000)

  return deltas
}

/** This round's deltas, merged onto the room's running total. */
export function scoreRound(room: Room, state: BluffTriviaState): Scores {
  const deltas = computeRoundDeltas(state)
  const next = { ...room.scores }
  for (const [id, points] of Object.entries(deltas)) next[id] = (next[id] ?? 0) + points
  return next
}

function roster(room: Room): BluffTriviaPlayer[] {
  return room.players.map(p => ({
    id: p.id, name: p.name, character: p.character, accessory: p.accessory ?? "", connected: p.connected
  }))
}

/**
 * The full reveal: every option in show order (least-picked deception
 * first, the truth always last), who wrote and who fell for each, and the
 * scoreboard. One authoritative payload — the client's staggered animation
 * plays it back locally and never asks the server for a second one.
 */
function reveal(room: Room, state: BluffTriviaState): Omit<BluffTriviaRevealView, "kind"> {
  const correctOption = state.options.find(o => o.kind === "correct")
  const correctOptionId = correctOption?.id ?? ""

  const selectedBy = new Map<string, string[]>(state.options.map(o => [o.id, []]))
  for (const [playerId, optionId] of Object.entries(state.guesses)) {
    selectedBy.get(optionId)?.push(playerId)
  }

  const options = state.options
    .map(o => ({
      optionId: o.id, text: o.text, type: o.kind, owners: o.ownerIds,
      selectedBy: selectedBy.get(o.id) ?? [],
      voteCount: (selectedBy.get(o.id) ?? []).length
    }))
    .sort((a, b) => {
      if (a.optionId === correctOptionId) return 1
      if (b.optionId === correctOptionId) return -1
      return a.voteCount - b.voteCount || a.optionId.localeCompare(b.optionId)
    })

  return {
    roundNumber: room.round,
    roster: roster(room),
    question: resolveBluffQuestion(state.questionId).question,
    options,
    correctOptionId,
    truthGuesserPlayerIds: state.truthGuesserPlayerIds,
    roundScoreChanges: computeRoundDeltas(state),
    totalScores: room.scores
  }
}

export const bluffTriviaEngine: GameEngine = {
  gameId: BLUFF_TRIVIA_ID,

  start(_room, rng): Transition {
    return { phase: QUESTION_INPUT, state: openRound([], rng), ms: QUESTION_MS, scores: {} }
  },

  act(room, playerId, action): GameState {
    const state = stateOf(room)
    const move = action as { type?: unknown; text?: unknown; optionId?: unknown }

    // Dispatch on what the move claims to be first, then check whether this
    // room is even taking that kind of move right now — so a guess mailed in
    // during SUBMIT_LIES reads as "wrong phase" (a late tap from the screen
    // before), not as a malformed guess.
    if (move.type === "lie") {
      if (room.phase !== SUBMIT_LIES) throw new Error("GAME_NOT_RUNNING")
      // One lie each. Letting it be changed would let the submitted count
      // shown during the phase go down, which is the same trap MLT's votes hit.
      if (state.lies[playerId] !== undefined) throw new Error("INVALID_INPUT")
      if (typeof move.text !== "string") throw new Error("INVALID_INPUT")
      const display = move.text.trim()
      if (display === "" || display.length > MAX_LIE_LENGTH) throw new Error("INVALID_INPUT")
      return { ...state, lies: { ...state.lies, [playerId]: { display, normalized: normalizeAnswer(display) } } }
    }

    if (move.type === "guess") {
      if (room.phase !== GUESSING_PHASE) throw new Error("GAME_NOT_RUNNING")
      if (state.guesses[playerId] !== undefined) throw new Error("INVALID_INPUT")
      const optionId = typeof move.optionId === "string" ? move.optionId : ""
      const option = state.options.find(o => o.id === optionId)
      if (option === undefined) throw new Error("INVALID_INPUT")
      // The client already disables this button, but a forged packet does
      // not go through a button — the server is where this is actually decided.
      if (option.ownerIds.includes(playerId)) throw new Error("INVALID_INPUT")
      return { ...state, guesses: { ...state.guesses, [playerId]: optionId } }
    }

    throw new Error("INVALID_INPUT")
  },

  next(room, rng): Transition {
    const state = stateOf(room)

    if (room.phase === QUESTION_INPUT) {
      return { phase: SUBMIT_LIES, state, ms: SUBMIT_MS }
    }
    if (room.phase === SUBMIT_LIES) {
      const question = resolveBluffQuestion(state.questionId)
      const { options, truthGuesserPlayerIds } = buildOptionPool(question, state.lies, room)
      return { phase: GUESSING_PHASE, state: { ...state, options, truthGuesserPlayerIds }, ms: GUESS_MS }
    }
    if (room.phase === GUESSING_PHASE) {
      return { phase: SCORE_REVEAL, state, ms: null, scores: scoreRound(room, state) }
    }
    if (room.phase === GAME_OVER || room.round >= totalRounds(room)) {
      return { phase: GAME_OVER, state, ms: null, winner: null }
    }
    return { phase: QUESTION_INPUT, state: openRound(state.asked, rng), ms: QUESTION_MS, nextRound: true }
  },

  pending(room): string[] {
    const state = stateOf(room)
    if (room.phase === SUBMIT_LIES) {
      return room.players.filter(p => p.connected && state.lies[p.id] === undefined).map(p => p.id)
    }
    if (room.phase === GUESSING_PHASE) {
      return room.players.filter(p => p.connected && state.guesses[p.id] === undefined).map(p => p.id)
    }
    // QUESTION_INPUT has nothing to act on — it is a reading clock, not a
    // wait for moves — so it must never report "done" just because a phone
    // dropped. Every connected player counts as still pending.
    if (room.phase === QUESTION_INPUT) {
      return room.players.filter(p => p.connected).map(p => p.id)
    }
    return []
  },

  view(room, playerId): BluffTriviaView {
    const state = stateOf(room)
    const question = resolveBluffQuestion(state.questionId)

    if (room.phase === QUESTION_INPUT) {
      return {
        kind: "bluff-question", roundNumber: room.round,
        question: question.question, category: question.category, roster: roster(room)
      }
    }

    if (room.phase === SUBMIT_LIES) {
      return {
        kind: "bluff-submit", roundNumber: room.round,
        question: question.question, category: question.category, roster: roster(room),
        mySubmission: state.lies[playerId]?.display ?? null,
        // Only counted for a phone still in the room — a disconnect must
        // never let the numerator outrun the denominator.
        submittedCount: Object.keys(state.lies).filter(id => room.players.some(p => p.id === id && p.connected)).length,
        totalPlayers: room.players.filter(p => p.connected).length
      }
    }

    if (room.phase === GUESSING_PHASE) {
      return {
        kind: "bluff-guessing", roundNumber: room.round,
        question: question.question, category: question.category, roster: roster(room),
        options: state.options.map(o => ({ optionId: o.id, text: o.text, isOwn: o.ownerIds.includes(playerId) })),
        myGuess: state.guesses[playerId] ?? null,
        guessedCount: Object.keys(state.guesses).filter(id => room.players.some(p => p.id === id && p.connected)).length,
        totalPlayers: room.players.filter(p => p.connected).length
      }
    }

    return { kind: room.phase === GAME_OVER ? "bluff-over" : "bluff-reveal", ...reveal(room, state) }
  }
}
