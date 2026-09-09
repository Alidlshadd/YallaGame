import type { LocalizedText } from "./types.js"

/**
 * What a phone is shown while a "Most Likely To" room is running.
 *
 * Types only, and deliberately so: this is the contract between the engine
 * that projects a phase and the screen that draws it, and it is the only
 * description of a running round either side has. The engine's own phase names
 * stay on the server — the screen switches on `kind`, never on a phase string.
 */

export type MostLikelyToCategory = "funny" | "friendship" | "school" | "daily" | "chaos"

/** Everybody in the room, enough to draw a face and a name. */
export interface MostLikelyToPlayer {
  id: string
  name: string
  character: string
  accessory: string
  connected: boolean
}

export interface MostLikelyToTally {
  playerId: string
  playerName: string
  voteCount: number
  /** Of the votes actually cast, rounded. 0 for a round nobody voted in. */
  percentage: number
}

export interface MostLikelyToResult {
  roundNumber: number
  question: LocalizedText
  totalVotes: number
  /** Everybody in the room, most votes first. A bar at zero is part of the answer. */
  results: MostLikelyToTally[]
  /** More than one on a tie; empty when nobody voted. */
  winnerPlayerIds: string[]
  isTie: boolean
}

export interface MostLikelyToQuestionView {
  kind: "question"
  roundNumber: number
  question: LocalizedText
  category: MostLikelyToCategory
  roster: MostLikelyToPlayer[]
}

export interface MostLikelyToVotingView {
  kind: "voting"
  roundNumber: number
  question: LocalizedText
  category: MostLikelyToCategory
  roster: MostLikelyToPlayer[]
  /** This one player's own vote. Nobody's else's reaches this phone. */
  myVote: string | null
  votedCount: number
  totalPlayers: number
}

export type MostLikelyToRevealView = {
  kind: "result" | "over"
  /** Carried again so the result bars can draw a face beside every name. */
  roster: MostLikelyToPlayer[]
} & MostLikelyToResult

export type MostLikelyToView =
  | MostLikelyToQuestionView
  | MostLikelyToVotingView
  | MostLikelyToRevealView
