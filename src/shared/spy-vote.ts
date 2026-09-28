import type { LocalizedText } from "./types.js"

/**
 * What a phone is shown while a Spy Game room is voting on who the spy is.
 *
 * The Spy Game itself still hands out roles and lets the table talk; this is
 * only the vote the host opens once the discussion is over.
 */

export interface SpyVotePlayer {
  id: string
  name: string
  character: string
  accessory: string
  connected: boolean
}

export interface SpyVoteTally {
  playerId: string
  playerName: string
  voteCount: number
  /**
   * Who voted for this person. Present only when the host turned
   * `spyShowVoters` on — otherwise the field is absent, not empty.
   */
  voters?: string[]
}

export interface SpyVotingView {
  kind: "spy-voting"
  roundNumber: number
  roster: SpyVotePlayer[]
  myVote: string | null
  votedCount: number
  totalPlayers: number
}

export interface SpyResultView {
  kind: "spy-result"
  roundNumber: number
  roster: SpyVotePlayer[]
  totalVotes: number
  /** Everybody in the room, most votes first. */
  results: SpyVoteTally[]
  /** More than one on a tie; empty when nobody voted. */
  topPlayerIds: string[]
  /** The real spies, revealed together with the result. */
  spyIds: string[]
  word: LocalizedText | null
}

export type SpyVoteView = SpyVotingView | SpyResultView
