import type { LocalizedText, Scores } from "./types.js"

/**
 * What a phone is shown while a "Bluff Trivia" room is running.
 *
 * Same contract as most-likely-to.ts's view file: the engine's own phase
 * names stay on the server, the screen switches on `kind` alone — never on a
 * phase string. Kinds carry a `bluff-` prefix so a screen that ever has to
 * tell two turn-based games' views apart can do it without ambiguity.
 */

export interface BluffTriviaPlayer {
  id: string
  name: string
  character: string
  accessory: string
  connected: boolean
}

export type BluffOptionKind = "correct" | "lie" | "decoy"

export interface BluffTriviaQuestionView {
  kind: "bluff-question"
  roundNumber: number
  question: LocalizedText
  category: string
  roster: BluffTriviaPlayer[]
}

export interface BluffTriviaSubmitView {
  kind: "bluff-submit"
  roundNumber: number
  question: LocalizedText
  category: string
  roster: BluffTriviaPlayer[]
  /** This player's own submitted lie, or null before they have sent one. */
  mySubmission: string | null
  submittedCount: number
  totalPlayers: number
}

export interface BluffTriviaGuessOption {
  optionId: string
  text: LocalizedText
  /**
   * True for an option this viewer owns — wrote it, or wrote the same lie as
   * someone else who got merged into it. Sealed from selection, on the
   * server as well as here. Never says whether it is correct, a decoy, or
   * whose it is otherwise — that stays hidden until the reveal.
   */
  isOwn: boolean
}

export interface BluffTriviaGuessingView {
  kind: "bluff-guessing"
  roundNumber: number
  question: LocalizedText
  category: string
  roster: BluffTriviaPlayer[]
  options: BluffTriviaGuessOption[]
  myGuess: string | null
  guessedCount: number
  totalPlayers: number
}

export interface BluffTriviaRevealOption {
  optionId: string
  text: LocalizedText
  type: BluffOptionKind
  /** Who wrote it. Empty for the correct answer and for a decoy. */
  owners: string[]
  selectedBy: string[]
  voteCount: number
}

export interface BluffTriviaRevealView {
  kind: "bluff-reveal" | "bluff-over"
  roundNumber: number
  roster: BluffTriviaPlayer[]
  question: LocalizedText
  /** Least-picked deception first; the correct answer is always last. */
  options: BluffTriviaRevealOption[]
  correctOptionId: string
  /** Players whose lie was the real answer, each worth a flat bonus. */
  truthGuesserPlayerIds: string[]
  roundScoreChanges: Scores
  totalScores: Scores
}

export type BluffTriviaView =
  | BluffTriviaQuestionView
  | BluffTriviaSubmitView
  | BluffTriviaGuessingView
  | BluffTriviaRevealView
