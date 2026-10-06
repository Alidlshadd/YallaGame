import type { GameState, Room } from "@shared/types.js"
import type { LocalizedText } from "@shared/types.js"
import type {
  MostLikelyToCategory, MostLikelyToPlayer, MostLikelyToResult, MostLikelyToView
} from "@shared/most-likely-to.js"
import type { GameEngine, Transition } from "../domain/engine.js"
import { resolveGame } from "./catalog.js"
import { MOST_LIKELY_TO_QUESTIONS, resolveQuestion, type Question } from "./questions/most-likely-to.js"

/**
 * Most Likely To — the table reads a question, everybody points at somebody,
 * and the votes open together.
 *
 * Phases per round:
 *
 *   QUESTION_DISPLAY      the question, on a short clock so nobody votes on a
 *                         sentence they have not finished reading
 *   VOTING                one secret vote each, changeable until the room's
 *                         voting clock expires
 *   ROUND_RESULT          every vote at once. No clock: the host decides when
 *                         the table has finished arguing
 *   CUSTOM_QUESTION_PROMPT  only in a room with `customQuestionsEnabled` —
 *                         between a result and the next question, anyone can
 *                         write one question or pass. Closes once everyone
 *                         has answered or time expires, then plays all queued
 *                         questions in player order before asking for more.
 *
 * The room ends after the configured bank questions plus player-written questions.
 */

export const MOST_LIKELY_TO_ID = "most-likely-to"

export const QUESTION_DISPLAY = "QUESTION_DISPLAY"
export const VOTING = "VOTING"
export const ROUND_RESULT = "ROUND_RESULT"
export const CUSTOM_QUESTION_PROMPT = "CUSTOM_QUESTION_PROMPT"
export const GAME_OVER = "GAME_OVER"

/** Reading time before the buttons appear. */
const READ_MS = 5_000

/** Sentinel `questionId` for a round whose question a player wrote, not the bank. */
const CUSTOM_QUESTION_ID = "__custom__"

// The catalogue already carries these under `defaultSettings` — a room's
// settings are normalized against it before the engine ever sees them — so
// they are read from there rather than hand-duplicated, to keep one source
// of truth for what a fresh room starts with.
const CATALOG_DEFAULTS = resolveGame(MOST_LIKELY_TO_ID)?.defaultSettings ?? {}

function catalogNumber(key: string, fallback: number): number {
  const value = CATALOG_DEFAULTS[key]
  return typeof value === "number" ? value : fallback
}

const DEFAULT_VOTING_SECONDS = catalogNumber("votingSeconds", 20)
const DEFAULT_ROUNDS = catalogNumber("roundCount", 5)
const DEFAULT_CUSTOM_QUESTION_SECONDS = catalogNumber("customQuestionSeconds", 30)
const DEFAULT_CUSTOM_QUESTION_MAX_LENGTH = catalogNumber("customQuestionMaxLength", 100)

/**
 * One vote. Flat, and carrying everything a `votes` row would need — round,
 * voter, target, time — so this list can move into a table without the engine
 * changing shape. The room code is the row it already lives in.
 */
export interface Vote {
  round: number
  voterId: string
  targetId: string
  createdAt: number
}

export interface MostLikelyToState extends GameState {
  questionId: string
  /** Bank questions already used in this room's current deck, across games. */
  asked: string[]
  /** Bank questions played in this game; custom questions do not consume this limit. */
  bankQuestionsPlayed: number
  /** The round being played, and only that one. */
  votes: Vote[]
  /**
   * The custom question currently being played, for `view`/`tally`.
   * Null everywhere else — a round from the bank has no text of its own here.
   */
  customQuestionText: string | null
  /** Accepted questions waiting to be played, persisted with the room. */
  customQuestionQueue: Array<{ text: string; writerId: string }>
  /** Whichever connected player already chose "pass" this prompt. */
  passedPlayerIds: string[]
  /**
   * Who is behind `customQuestionText`. Kept for that player's own prompt
   * view, and named to the table only when the host turned
   * `customQuestionShowAuthor` on (see `authorOf`).
   */
  customQuestionWriterId: string | null
}

/** The room row comes back through JSON, so nothing in it is trusted as typed. */
function stateOf(room: Room): MostLikelyToState {
  const raw = room.gameState as Partial<MostLikelyToState>
  return {
    questionId: typeof raw.questionId === "string" ? raw.questionId : "",
    asked: Array.isArray(raw.asked) ? raw.asked : [],
    bankQuestionsPlayed: typeof raw.bankQuestionsPlayed === "number" ? raw.bankQuestionsPlayed
      : Array.isArray(raw.asked) ? raw.asked.length : 0,
    votes: Array.isArray(raw.votes) ? raw.votes : [],
    customQuestionText: typeof raw.customQuestionText === "string" ? raw.customQuestionText : null,
    customQuestionQueue: Array.isArray(raw.customQuestionQueue) ? raw.customQuestionQueue : [],
    passedPlayerIds: Array.isArray(raw.passedPlayerIds) ? raw.passedPlayerIds : [],
    customQuestionWriterId: typeof raw.customQuestionWriterId === "string" ? raw.customQuestionWriterId : null
  }
}

function settingNumber(room: Room, key: string, fallback: number): number {
  const value = room.settings[key]
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function votingMs(room: Room): number {
  return settingNumber(room, "votingSeconds", DEFAULT_VOTING_SECONDS) * 1000
}

function totalRounds(room: Room): number {
  return settingNumber(room, "roundCount", DEFAULT_ROUNDS)
}

function customQuestionsEnabled(room: Room): boolean {
  return room.settings["customQuestionsEnabled"] === true
}

function customQuestionMs(room: Room): number {
  return settingNumber(room, "customQuestionSeconds", DEFAULT_CUSTOM_QUESTION_SECONDS) * 1000
}

function customQuestionMaxLength(room: Room): number {
  return settingNumber(room, "customQuestionMaxLength", DEFAULT_CUSTOM_QUESTION_MAX_LENGTH)
}

/**
 * A question the table has not had yet. Once the seed is exhausted the pool
 * reopens rather than leaving a round with nothing to ask.
 */
function pickQuestion(asked: readonly string[], rng: () => number): Question {
  const fresh = MOST_LIKELY_TO_QUESTIONS.filter(q => !asked.includes(q.id))
  const pool = fresh.length > 0 ? fresh : MOST_LIKELY_TO_QUESTIONS
  const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length))
  return pool[index]!
}

function openRound(asked: readonly string[], rng: () => number, bankQuestionsPlayed = 0): MostLikelyToState {
  // Refill only after the entire bank has been played. Keep the last question
  // out of the new deck's first draw, and keep persisted history bounded.
  const history = MOST_LIKELY_TO_QUESTIONS.every(q => asked.includes(q.id)) ? asked.slice(-1) : asked
  const question = pickQuestion(history, rng)
  return {
    questionId: question.id, asked: [...history, question.id], votes: [],
    bankQuestionsPlayed: bankQuestionsPlayed + 1,
    customQuestionText: null, customQuestionQueue: [], passedPlayerIds: [], customQuestionWriterId: null
  }
}

/** Clears the previous round's leftovers and opens the floor for a submission. */
function openCustomPrompt(state: MostLikelyToState): MostLikelyToState {
  return { ...state, customQuestionText: null, customQuestionQueue: [], passedPlayerIds: [], customQuestionWriterId: null }
}

/**
 * Play one queued question, retaining the rest for subsequent rounds.
 * If nobody submitted, fall back to the bank.
 */
function resolveCustomOrRandom(state: MostLikelyToState, rng: () => number): MostLikelyToState {
  const [question, ...remaining] = state.customQuestionQueue
  if (question !== undefined) {
    // The writer is kept with the round so a host who asked for it can name
    // them; `authorOf` decides whether that ever leaves the server.
    return {
      questionId: CUSTOM_QUESTION_ID, asked: state.asked, votes: [],
      bankQuestionsPlayed: state.bankQuestionsPlayed,
      customQuestionText: question.text, customQuestionQueue: remaining,
      passedPlayerIds: [], customQuestionWriterId: question.writerId
    }
  }
  return openRound(state.asked, rng, state.bankQuestionsPlayed)
}

/** The question this round is actually asking, whichever source it came from. */
function currentQuestion(state: MostLikelyToState): { text: LocalizedText; category?: MostLikelyToCategory } {
  if (state.questionId === CUSTOM_QUESTION_ID && state.customQuestionText !== null) {
    const text = state.customQuestionText
    return { text: { en: text, tr: text, ar: text, ku: text } }
  }
  const question = resolveQuestion(state.questionId)
  return { text: question.text, category: question.category }
}

/**
 * Count the round. Everybody in the room appears, including the people nobody
 * picked — a bar at zero is part of the answer.
 */
export function tally(room: Room): MostLikelyToResult {
  const state = stateOf(room)
  // Off by default: a round where the table can see who pointed at whom is a
  // different evening, so the host has to ask for it.
  const named = room.settings["showVoters"] === true

  const byPlayer = new Map<string, { name: string; voteCount: number; voters: string[] }>(
    room.players.map(p => [p.id, { name: p.name, voteCount: 0, voters: [] }])
  )

  let totalVotes = 0
  for (const vote of state.votes) {
    const target = byPlayer.get(vote.targetId)
    // The person voted for has left the room since. Their vote is not counted
    // against a seat that is no longer there.
    if (target === undefined) continue
    target.voteCount++
    // A voter who has since left is counted but cannot be named.
    const voterName = byPlayer.get(vote.voterId)?.name
    if (voterName !== undefined) target.voters.push(voterName)
    totalVotes++
  }

  const results = room.players
    .map(p => {
      const entry = byPlayer.get(p.id)!
      return {
        playerId: p.id,
        playerName: p.name,
        voteCount: entry.voteCount,
        percentage: totalVotes === 0 ? 0 : Math.round((entry.voteCount / totalVotes) * 100),
        ...(named ? { voters: entry.voters } : {})
      }
    })
    .sort((a, b) => b.voteCount - a.voteCount || a.playerName.localeCompare(b.playerName))

  const top = results[0]?.voteCount ?? 0
  // A round nobody voted in has no winner, not a room full of them.
  const winnerPlayerIds = top === 0 ? [] : results.filter(r => r.voteCount === top).map(r => r.playerId)

  return {
    roundNumber: room.round,
    question: currentQuestion(state).text,
    totalVotes,
    results,
    winnerPlayerIds,
    isTie: winnerPlayerIds.length > 1
  }
}

/** The writer of this round's player-written question, only when the host chose to show it. */
function authorOf(room: Room, state: MostLikelyToState): { customQuestionAuthor?: string } {
  if (room.settings["customQuestionShowAuthor"] !== true) return {}
  if (state.questionId !== CUSTOM_QUESTION_ID || state.customQuestionWriterId === null) return {}
  const name = room.players.find(p => p.id === state.customQuestionWriterId)?.name
  return name === undefined ? {} : { customQuestionAuthor: name }
}

function roster(room: Room): MostLikelyToPlayer[] {
  return room.players.map(p => ({
    id: p.id,
    name: p.name,
    character: p.character,
    accessory: p.accessory ?? "",
    connected: p.connected
  }))
}

export const mostLikelyToEngine: GameEngine = {
  gameId: MOST_LIKELY_TO_ID,

  start(room, rng): Transition {
    return { phase: QUESTION_DISPLAY, state: openRound(stateOf(room).asked, rng), ms: READ_MS, scores: {} }
  },

  idleState(room): GameState {
    return { asked: stateOf(room).asked }
  },

  act(room, playerId, action): GameState {
    if (room.phase === CUSTOM_QUESTION_PROMPT) {
      const state = stateOf(room)
      const move = action as { type?: unknown; text?: unknown }
      if (state.passedPlayerIds.includes(playerId) || state.customQuestionQueue.some(q => q.writerId === playerId)) {
        throw new Error("INVALID_INPUT")
      }

      if (move.type === "pass") {
        return { ...state, passedPlayerIds: [...state.passedPlayerIds, playerId] }
      }
      if (move.type === "submit") {
        const text = typeof move.text === "string" ? move.text.trim() : ""
        if (text === "" || text.length > customQuestionMaxLength(room)) throw new Error("INVALID_INPUT")
        return { ...state, customQuestionQueue: [...state.customQuestionQueue, { text, writerId: playerId }] }
      }
      throw new Error("INVALID_INPUT")
    }

    // Voting happens at the one screen that has buttons on it. A vote arriving
    // in any other phase is a forged packet rather than a slow finger — a late
    // tap from the screen before is already refused as a stale phase.
    if (room.phase !== VOTING) throw new Error("GAME_NOT_RUNNING")

    const move = action as { type?: unknown; target?: unknown }
    if (move.type !== "vote") throw new Error("INVALID_INPUT")
    const target = typeof move.target === "string" ? move.target : ""
    if (target === "") throw new Error("INVALID_INPUT")
    if (target === playerId) throw new Error("INVALID_INPUT")
    if (!room.players.some(p => p.id === target)) throw new Error("INVALID_INPUT")

    const state = stateOf(room)
    // A changed choice replaces the previous vote; it never adds another voter.
    const vote: Vote = { round: room.round, voterId: playerId, targetId: target, createdAt: Date.now() }
    return { ...state, votes: [...state.votes.filter(v => v.voterId !== playerId), vote] }
  },

  next(room, rng): Transition {
    const state = stateOf(room)

    if (room.phase === QUESTION_DISPLAY) {
      return { phase: VOTING, state, ms: votingMs(room) }
    }
    if (room.phase === VOTING) {
      // Whatever votes are in are the votes there are; the missing ones stay missing.
      return { phase: ROUND_RESULT, state, ms: null }
    }
    if (room.phase === ROUND_RESULT) {
      // Custom questions are extra: finish the batch without consuming the
      // host's bank-question count, then return to the next bank question.
      if (state.customQuestionQueue.length > 0) {
        return { phase: QUESTION_DISPLAY, state: resolveCustomOrRandom(state, rng), ms: READ_MS, nextRound: true }
      }
      if (customQuestionsEnabled(room) && state.questionId !== CUSTOM_QUESTION_ID) {
        return { phase: CUSTOM_QUESTION_PROMPT, state: openCustomPrompt(state), ms: customQuestionMs(room) }
      }
      if (state.bankQuestionsPlayed >= totalRounds(room)) {
        return { phase: GAME_OVER, state, ms: null, winner: null }
      }
      return { phase: QUESTION_DISPLAY, state: openRound(state.asked, rng, state.bankQuestionsPlayed), ms: READ_MS, nextRound: true }
    }
    if (room.phase === CUSTOM_QUESTION_PROMPT) {
      if (state.customQuestionQueue.length === 0 && state.bankQuestionsPlayed >= totalRounds(room)) {
        return { phase: GAME_OVER, state, ms: null, winner: null }
      }
      // Submission speed never decides priority. Departed writers keep their
      // accepted questions, after the players still in the room.
      const playerOrder = new Map(room.players.map((p, index) => [p.id, index]))
      const customQuestionQueue = [...state.customQuestionQueue].sort((a, b) =>
        (playerOrder.get(a.writerId) ?? room.players.length) - (playerOrder.get(b.writerId) ?? room.players.length))
      return { phase: QUESTION_DISPLAY, state: resolveCustomOrRandom({ ...state, customQuestionQueue }, rng), ms: READ_MS, nextRound: true }
    }
    return { phase: GAME_OVER, state, ms: null, winner: null }
  },

  canCloseEarly(room): boolean {
    return room.phase !== VOTING
  },

  pending(room): string[] {
    if (room.phase === VOTING) {
      const state = stateOf(room)
      return room.players
        .filter(p => p.connected && !state.votes.some(v => v.voterId === p.id))
        .map(p => p.id)
    }
    if (room.phase === CUSTOM_QUESTION_PROMPT) {
      const state = stateOf(room)
      return room.players.filter(p => p.connected && !state.passedPlayerIds.includes(p.id)
        && !state.customQuestionQueue.some(q => q.writerId === p.id)).map(p => p.id)
    }
    // QUESTION_DISPLAY has nothing to act on — it is a reading clock, not a
    // wait for moves — so it must never report "done" just because a phone
    // dropped. Reporting every connected player as still pending keeps
    // closeEarlyIfDone from cutting the reading time short.
    if (room.phase === QUESTION_DISPLAY) {
      return room.players.filter(p => p.connected).map(p => p.id)
    }
    return []
  },

  view(room, playerId): MostLikelyToView {
    const state = stateOf(room)

    if (room.phase === CUSTOM_QUESTION_PROMPT) {
      const myStatus =
        state.customQuestionQueue.some(q => q.writerId === playerId) ? "submitted"
        : state.passedPlayerIds.includes(playerId) ? "passed"
        : "idle"
      return {
        kind: "customPrompt",
        roundNumber: room.round,
        roster: roster(room),
        myStatus,
        maxLength: customQuestionMaxLength(room)
      }
    }

    const question = currentQuestion(state)

    if (room.phase === QUESTION_DISPLAY) {
      return {
        kind: "question",
        roundNumber: room.round,
        question: question.text,
        ...(question.category !== undefined ? { category: question.category } : {}),
        roster: roster(room),
        ...authorOf(room, state)
      }
    }

    if (room.phase === VOTING) {
      return {
        kind: "voting",
        roundNumber: room.round,
        question: question.text,
        ...(question.category !== undefined ? { category: question.category } : {}),
        roster: roster(room),
        myVote: state.votes.find(v => v.voterId === playerId)?.targetId ?? null,
        // A vote from a phone that has since dropped still counts toward the
        // final tally, but the live "X / Y voted" readout is about who is
        // still in the room right now — counting it here would let the
        // numerator outrun the denominator.
        votedCount: state.votes.filter(v => room.players.some(p => p.connected && p.id === v.voterId)).length,
        totalPlayers: room.players.filter(p => p.connected).length,
        ...authorOf(room, state)
      }
    }

    return { kind: room.phase === GAME_OVER ? "over" : "result", roster: roster(room), ...tally(room), ...authorOf(room, state) }
  }
}
