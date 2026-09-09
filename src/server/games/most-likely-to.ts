import type { GameState, Room } from "@shared/types.js"
import type {
  MostLikelyToPlayer, MostLikelyToResult, MostLikelyToView
} from "@shared/most-likely-to.js"
import type { GameEngine, Transition } from "../domain/engine.js"
import { MOST_LIKELY_TO_QUESTIONS, resolveQuestion, type Question } from "./questions/most-likely-to.js"

/**
 * Most Likely To — the table reads a question, everybody points at somebody,
 * and the votes open together.
 *
 * Three phases per round:
 *
 *   QUESTION_DISPLAY  the question, on a short clock so nobody votes on a
 *                     sentence they have not finished reading
 *   VOTING            one secret vote each, on the room's clock; closes early
 *                     the moment every connected phone has answered
 *   ROUND_RESULT      every vote at once. No clock: the host decides when the
 *                     table has finished arguing
 *
 * The room lands on GAME_OVER once the configured number of rounds is played.
 */

export const MOST_LIKELY_TO_ID = "most-likely-to"

export const QUESTION_DISPLAY = "QUESTION_DISPLAY"
export const VOTING = "VOTING"
export const ROUND_RESULT = "ROUND_RESULT"
export const GAME_OVER = "GAME_OVER"

/** Reading time before the buttons appear. */
const READ_MS = 5_000

const DEFAULT_VOTING_SECONDS = 20
const DEFAULT_ROUNDS = 5

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
  /** Ids already used this game, so a round never repeats a question. */
  asked: string[]
  /** The round being played, and only that one. */
  votes: Vote[]
}

/** The room row comes back through JSON, so nothing in it is trusted as typed. */
function stateOf(room: Room): MostLikelyToState {
  const raw = room.gameState as Partial<MostLikelyToState>
  return {
    questionId: typeof raw.questionId === "string" ? raw.questionId : "",
    asked: Array.isArray(raw.asked) ? raw.asked : [],
    votes: Array.isArray(raw.votes) ? raw.votes : []
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

function openRound(asked: readonly string[], rng: () => number): MostLikelyToState {
  const question = pickQuestion(asked, rng)
  return { questionId: question.id, asked: [...asked, question.id], votes: [] }
}

/**
 * Count the round. Everybody in the room appears, including the people nobody
 * picked — a bar at zero is part of the answer.
 */
export function tally(room: Room): MostLikelyToResult {
  const state = stateOf(room)
  const counts = new Map<string, number>(room.players.map(p => [p.id, 0]))

  let totalVotes = 0
  for (const vote of state.votes) {
    const current = counts.get(vote.targetId)
    // The person voted for has left the room since. Their vote is not counted
    // against a seat that is no longer there.
    if (current === undefined) continue
    counts.set(vote.targetId, current + 1)
    totalVotes++
  }

  const results = room.players
    .map(p => {
      const voteCount = counts.get(p.id) ?? 0
      return {
        playerId: p.id,
        playerName: p.name,
        voteCount,
        percentage: totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100)
      }
    })
    .sort((a, b) => b.voteCount - a.voteCount || a.playerName.localeCompare(b.playerName))

  const top = results[0]?.voteCount ?? 0
  // A round nobody voted in has no winner, not a room full of them.
  const winnerPlayerIds = top === 0 ? [] : results.filter(r => r.voteCount === top).map(r => r.playerId)

  return {
    roundNumber: room.round,
    question: resolveQuestion(state.questionId).text,
    totalVotes,
    results,
    winnerPlayerIds,
    isTie: winnerPlayerIds.length > 1
  }
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

  start(_room, rng): Transition {
    return { phase: QUESTION_DISPLAY, state: openRound([], rng), ms: READ_MS, scores: {} }
  },

  act(room, playerId, action): GameState {
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
    // One vote each. A vote that could be changed would let the count shown
    // during voting go down, and the phase close and then reopen.
    if (state.votes.some(v => v.voterId === playerId)) throw new Error("INVALID_INPUT")

    const vote: Vote = { round: room.round, voterId: playerId, targetId: target, createdAt: Date.now() }
    return { ...state, votes: [...state.votes, vote] }
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
    if (room.phase === GAME_OVER || room.round >= totalRounds(room)) {
      return { phase: GAME_OVER, state, ms: null, winner: null }
    }
    return { phase: QUESTION_DISPLAY, state: openRound(state.asked, rng), ms: READ_MS, nextRound: true }
  },

  pending(room): string[] {
    if (room.phase !== VOTING) return []
    const state = stateOf(room)
    return room.players
      .filter(p => p.connected && !state.votes.some(v => v.voterId === p.id))
      .map(p => p.id)
  },

  view(room, playerId): MostLikelyToView {
    const state = stateOf(room)
    const question = resolveQuestion(state.questionId)

    if (room.phase === QUESTION_DISPLAY) {
      return {
        kind: "question",
        roundNumber: room.round,
        question: question.text,
        category: question.category,
        roster: roster(room)
      }
    }

    if (room.phase === VOTING) {
      return {
        kind: "voting",
        roundNumber: room.round,
        question: question.text,
        category: question.category,
        roster: roster(room),
        myVote: state.votes.find(v => v.voterId === playerId)?.targetId ?? null,
        votedCount: state.votes.length,
        totalPlayers: room.players.filter(p => p.connected).length
      }
    }

    return { kind: room.phase === GAME_OVER ? "over" : "result", roster: roster(room), ...tally(room) }
  }
}
