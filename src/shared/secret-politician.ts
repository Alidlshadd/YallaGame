/**
 * What a phone is shown while a "Secret Politician" room is running.
 *
 * Same contract as the other two turn-based games: the engine's own phase
 * names stay on the server, the screen switches on `kind` alone. Kinds carry
 * a `politician-` prefix so they never collide with another game's view in a
 * shared union.
 *
 * This is the one game in the platform built entirely on hidden information,
 * so every view type below is deliberately narrow — a field that could leak
 * a role, a card, or a ballot before its reveal moment simply is not on the
 * type for the phase where it must not be seen.
 */

export type PoliticianRole = "innocent" | "traitor" | "leader"
export type PoliticianPower = "investigate" | "specialElection" | "peek" | "execute"

export interface PoliticianPlayer {
  id: string
  name: string
  character: string
  accessory: string
  connected: boolean
  /** Eliminated players stay on every roster, watching, marked here. */
  alive: boolean
}

/** An ally this viewer is allowed to know about — never sent to anyone else. */
export interface PoliticianAlly {
  id: string
  name: string
  isLeader: boolean
}

export interface PoliticianRoleRevealView {
  kind: "politician-role-reveal"
  roundNumber: number
  roster: PoliticianPlayer[]
  myRole: PoliticianRole
  /** Present only for a traitor, and for the leader when the room plays with allies visible. */
  allies: PoliticianAlly[]
}

/** What the last completed vote looked like — attached to the screen that follows it. */
export interface PoliticianVoteSummary {
  presidentId: string
  chancellorId: string
  approved: boolean
  ballots: Record<string, boolean>
}

/** What the last executive action did — never the private result (a peek or an investigation). */
export interface PoliticianExecutiveSummary {
  power: PoliticianPower
  targetId: string | null
}

export interface PoliticianBoard {
  good: number
  bad: number
}

export interface PoliticianNominationView {
  kind: "politician-nomination"
  roundNumber: number
  roster: PoliticianPlayer[]
  board: PoliticianBoard
  tracker: number
  presidentId: string
  eligibleIds: string[]
  /** Set the instant the president taps a name, so that screen can lock itself before the vote even opens. */
  chancellorNomineeId: string | null
  lastVote: PoliticianVoteSummary | null
  lastExecutive: PoliticianExecutiveSummary | null
}

export interface PoliticianVoteView {
  kind: "politician-vote"
  roundNumber: number
  roster: PoliticianPlayer[]
  board: PoliticianBoard
  presidentId: string
  chancellorNomineeId: string
  myVote: boolean | null
  votedCount: number
  totalVoters: number
}

export interface PoliticianLegislativeView {
  kind: "politician-legislative"
  roundNumber: number
  roster: PoliticianPlayer[]
  board: PoliticianBoard
  presidentId: string
  chancellorId: string
  /** Whose turn it is to act on the hand right now — the president or the chancellor. */
  actingRole: "president" | "chancellor"
  /** This viewer's hand, only when they are the one holding it right now. */
  hand: Card[] | null
  /** Whether the chancellor may offer a veto instead of enacting (board.bad >= 5). */
  vetoAvailable: boolean
  /** A veto the chancellor already offered this hand, awaiting the president. */
  vetoOffered: boolean
}

export interface PoliticianVetoConfirmView {
  kind: "politician-veto-confirm"
  roundNumber: number
  roster: PoliticianPlayer[]
  board: PoliticianBoard
  presidentId: string
  chancellorId: string
  /** The president's own decision, once made — so their screen can lock itself before the phase actually turns over. */
  myDecision: boolean | null
}

export interface PoliticianBoardUpdateView {
  kind: "politician-board-update"
  roundNumber: number
  roster: PoliticianPlayer[]
  board: PoliticianBoard
  /** The card that was just enacted, public the moment it lands on the board. */
  enacted: Card
}

export type Card = "good" | "bad"

export interface PoliticianExecutiveActionView {
  kind: "politician-executive-action"
  roundNumber: number
  roster: PoliticianPlayer[]
  board: PoliticianBoard
  presidentId: string
  power: PoliticianPower
  eligibleIds: string[]
  /** True once the president has used the power — locks their own screen before the phase turns over. */
  resolved: boolean
  /** Set only on the president's own screen, only for "peek". */
  peekCards: Card[] | null
  /** Set only on the president's own screen, only after "investigate" resolves. */
  investigationResult: { targetId: string; side: "innocent" | "traitor" } | null
}

export interface PoliticianOverView {
  kind: "politician-over"
  roundNumber: number
  roster: PoliticianPlayer[]
  board: PoliticianBoard
  winner: "innocents" | "traitors"
  /** So the reveal can finally show the table who was who. */
  roles: Record<string, PoliticianRole>
}

export type PoliticianView =
  | PoliticianRoleRevealView
  | PoliticianNominationView
  | PoliticianVoteView
  | PoliticianLegislativeView
  | PoliticianVetoConfirmView
  | PoliticianBoardUpdateView
  | PoliticianExecutiveActionView
  | PoliticianOverView
