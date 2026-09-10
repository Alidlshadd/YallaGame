import type { GameState, Room } from "@shared/types.js"
import type {
  Card, PoliticianAlly, PoliticianExecutiveSummary, PoliticianPower, PoliticianPlayer,
  PoliticianRole, PoliticianView, PoliticianVoteSummary
} from "@shared/secret-politician.js"
import type { GameEngine, Transition } from "../domain/engine.js"

/**
 * Secret Politician — a secret hand, a shared deck, and a presidential power
 * that can turn the whole table. The heaviest game on the platform: eight
 * phases, four win conditions, and a lot of state nobody but the right
 * player may ever see.
 *
 *   ROLE_REVEAL             host-paced. Everyone reads their own role.
 *   NOMINATION       45s    the sitting president names a chancellor.
 *   VOTE_GOVERNMENT  30s    everyone votes yes/no in secret; opens together.
 *   LEGISLATIVE_PRESIDENT   30s   president discards one of three cards.
 *   LEGISLATIVE_CHANCELLOR  30s   chancellor enacts one of the remaining two
 *                                 (or offers a veto once five bad laws are up).
 *   VETO_CONFIRM     20s    conditional — president approves or denies it.
 *   BOARD_UPDATE      6s    the enacted card lands on the board; win checked.
 *   EXECUTIVE_ACTION 45s    conditional — the power the bad-law count unlocked.
 *
 * Two gaps the source spec left open, resolved here:
 *   - term limits (the last elected president and chancellor cannot be
 *     re-nominated next round; only the chancellor is restricted once the
 *     table is down to five or fewer players)
 *   - the presidential powers table (which power unlocks at which bad-law
 *     count, for which table size) — see POWER_TABLE below.
 */

export const SECRET_POLITICIAN_ID = "secret-politician"

export const ROLE_REVEAL = "ROLE_REVEAL"
export const NOMINATION = "NOMINATION"
export const VOTE_GOVERNMENT = "VOTE_GOVERNMENT"
export const LEGISLATIVE_PRESIDENT = "LEGISLATIVE_PRESIDENT"
export const LEGISLATIVE_CHANCELLOR = "LEGISLATIVE_CHANCELLOR"
export const VETO_CONFIRM = "VETO_CONFIRM"
export const EXECUTIVE_ACTION = "EXECUTIVE_ACTION"
export const BOARD_UPDATE = "BOARD_UPDATE"
export const GAME_OVER = "GAME_OVER"

const NOMINATION_MS = 45_000
const VOTE_MS = 30_000
const PRESIDENT_HAND_MS = 30_000
const CHANCELLOR_HAND_MS = 30_000
const VETO_MS = 20_000
const EXECUTIVE_MS = 45_000
const BOARD_UPDATE_MS = 6_000

const GOOD_CARDS = 6
const BAD_CARDS = 11
const GOOD_WIN = 5
const BAD_WIN = 6
const CHAOS_TRACKER = 3
const VETO_UNLOCK_BAD = 5

const ROLE_COUNTS: Record<number, { innocents: number; traitors: number }> = {
  5: { innocents: 3, traitors: 1 },
  6: { innocents: 4, traitors: 1 },
  7: { innocents: 4, traitors: 2 },
  8: { innocents: 5, traitors: 2 },
  9: { innocents: 5, traitors: 3 },
  10: { innocents: 6, traitors: 3 }
}

type Bucket = "5-6" | "7-8" | "9-10"
function bucketFor(playerCount: number): Bucket {
  if (playerCount <= 6) return "5-6"
  if (playerCount <= 8) return "7-8"
  return "9-10"
}

/** Indexed by how many bad laws are now on the board. Good laws never trigger a power. */
const POWER_TABLE: Record<number, Partial<Record<Bucket, PoliticianPower>>> = {
  1: { "9-10": "investigate" },
  2: { "7-8": "investigate", "9-10": "investigate" },
  3: { "5-6": "peek", "7-8": "specialElection", "9-10": "specialElection" },
  4: { "5-6": "execute", "7-8": "execute", "9-10": "execute" },
  5: { "5-6": "execute", "7-8": "execute", "9-10": "execute" }
}

function powerFor(badCount: number, playerCount: number): PoliticianPower | undefined {
  return POWER_TABLE[badCount]?.[bucketFor(playerCount)]
}

function roleCountsFor(playerCount: number): { innocents: number; traitors: number } {
  const clamped = Math.min(10, Math.max(5, playerCount))
  return ROLE_COUNTS[clamped]!
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = tmp
  }
  return arr
}

function freshDeck(rng: () => number): Card[] {
  const cards: Card[] = [
    ...Array<Card>(GOOD_CARDS).fill("good"),
    ...Array<Card>(BAD_CARDS).fill("bad")
  ]
  return shuffle(cards, rng)
}

function assignRoles(playerIds: readonly string[], rng: () => number): Record<string, PoliticianRole> {
  const { traitors } = roleCountsFor(playerIds.length)
  const order = shuffle(playerIds, rng)
  const roles: Record<string, PoliticianRole> = {}
  let i = 0
  roles[order[i++]!] = "leader"
  for (let t = 0; t < traitors; t++) roles[order[i++]!] = "traitor"
  for (; i < order.length; i++) roles[order[i]!] = "innocent"
  return roles
}

function leaderOf(state: PoliticianState): string {
  return Object.keys(state.roles).find(id => state.roles[id] === "leader")!
}

/** Rotate to the next alive seat in the fixed table order, wrapping around. */
function advancePresidentIndex(order: readonly string[], alive: readonly string[], fromIndex: number): number {
  for (let step = 1; step <= order.length; step++) {
    const idx = (fromIndex + step) % order.length
    if (alive.includes(order[idx]!)) return idx
  }
  return fromIndex
}

/** alive ∧ ≠ president ∧ ∉ lastElected — except the last president is no longer barred once the table is down to five or fewer. */
function eligibleChancellors(state: PoliticianState): string[] {
  const barred = new Set<string>([state.presidentId])
  if (state.lastElected !== null) {
    barred.add(state.lastElected.chancellorId)
    if (state.alive.length > 5) barred.add(state.lastElected.presidentId)
  }
  return state.alive.filter(id => !barred.has(id))
}

function executiveEligibleIds(state: PoliticianState, power: PoliticianPower): string[] {
  const base = state.alive.filter(id => id !== state.presidentId)
  return power === "investigate" ? base.filter(id => !state.investigated.includes(id)) : base
}

/** Before any draw of `needed` cards: reshuffle the discard back in if the deck is running short. */
function ensureDeckFor(state: PoliticianState, needed: number, rng: () => number): { deck: Card[]; discard: Card[] } {
  if (state.deck.length >= needed) return { deck: state.deck, discard: state.discard }
  return { deck: shuffle([...state.deck, ...state.discard], rng), discard: [] }
}

function drawHand(state: PoliticianState, count: number, rng: () => number): { cards: Card[]; deck: Card[]; discard: Card[] } {
  const { deck, discard } = ensureDeckFor(state, count, rng)
  return { cards: deck.slice(0, count), deck: deck.slice(count), discard }
}

/** A "tepeden bakış" look: the top three stay in the deck, unlike a hand draw — only a reshuffle-if-needed actually changes anything. */
function peekTop3(state: PoliticianState, rng: () => number): { cards: Card[]; deck: Card[]; discard: Card[] } {
  const { deck, discard } = ensureDeckFor(state, 3, rng)
  return { cards: deck.slice(0, 3), deck, discard }
}

export interface PoliticianState extends GameState {
  roles: Record<string, PoliticianRole>
  /** The table's fixed seating order, set once at the start of the game. */
  order: string[]
  alive: string[]
  deck: Card[]
  discard: Card[]
  board: { good: number; bad: number }
  tracker: number
  presidentIndex: number
  presidentId: string
  /** This round only — consumed the moment it is used, never advances presidentIndex. */
  specialPresidentId: string | null
  chancellorNomineeId: string | null
  chancellorId: string | null
  lastElected: { presidentId: string; chancellorId: string } | null
  ballots: Record<string, boolean>
  /** The last vote's full result — public from the moment VOTE_GOVERNMENT closes. */
  lastVote: PoliticianVoteSummary | null
  /** Whoever is currently deciding (president, then chancellor) holds this. */
  hand: Card[]
  vetoOffered: boolean
  vetoApproved: boolean | null
  pendingPower: PoliticianPower | null
  executiveResolved: boolean
  investigated: string[]
  investigationResult: { targetId: string; side: "innocent" | "traitor" } | null
  peekCards: Card[] | null
  lastExecutive: PoliticianExecutiveSummary | null
  lastEnactedCard: Card | null
  /** A chaos-enacted law (tracker hit 3) never triggers a power. */
  lastEnactedFromChaos: boolean
  leaderKnowsAllies: boolean
  winner: "innocents" | "traitors" | null
}

/** The room row comes back through JSON, so nothing in it is trusted as typed. */
function stateOf(room: Room): PoliticianState {
  const raw = room.gameState as Partial<PoliticianState>
  return {
    roles: typeof raw.roles === "object" && raw.roles !== null ? raw.roles : {},
    order: Array.isArray(raw.order) ? raw.order : [],
    alive: Array.isArray(raw.alive) ? raw.alive : [],
    deck: Array.isArray(raw.deck) ? raw.deck : [],
    discard: Array.isArray(raw.discard) ? raw.discard : [],
    board: raw.board ?? { good: 0, bad: 0 },
    tracker: typeof raw.tracker === "number" ? raw.tracker : 0,
    presidentIndex: typeof raw.presidentIndex === "number" ? raw.presidentIndex : 0,
    presidentId: typeof raw.presidentId === "string" ? raw.presidentId : "",
    specialPresidentId: typeof raw.specialPresidentId === "string" ? raw.specialPresidentId : null,
    chancellorNomineeId: typeof raw.chancellorNomineeId === "string" ? raw.chancellorNomineeId : null,
    chancellorId: typeof raw.chancellorId === "string" ? raw.chancellorId : null,
    lastElected: raw.lastElected ?? null,
    ballots: typeof raw.ballots === "object" && raw.ballots !== null ? raw.ballots : {},
    lastVote: raw.lastVote ?? null,
    hand: Array.isArray(raw.hand) ? raw.hand : [],
    vetoOffered: raw.vetoOffered === true,
    vetoApproved: typeof raw.vetoApproved === "boolean" ? raw.vetoApproved : null,
    pendingPower: raw.pendingPower ?? null,
    executiveResolved: raw.executiveResolved === true,
    investigated: Array.isArray(raw.investigated) ? raw.investigated : [],
    investigationResult: raw.investigationResult ?? null,
    peekCards: raw.peekCards ?? null,
    lastExecutive: raw.lastExecutive ?? null,
    lastEnactedCard: raw.lastEnactedCard ?? null,
    lastEnactedFromChaos: raw.lastEnactedFromChaos === true,
    leaderKnowsAllies: raw.leaderKnowsAllies === true,
    winner: raw.winner ?? null
  }
}

function roster(room: Room, state: PoliticianState): PoliticianPlayer[] {
  return room.players.map(p => ({
    id: p.id, name: p.name, character: p.character, accessory: p.accessory ?? "",
    connected: p.connected, alive: state.alive.includes(p.id)
  }))
}

/** Traitors always see the whole fascist side, leader included. The leader sees allies only when the room turned that on. */
function alliesFor(room: Room, state: PoliticianState, playerId: string, myRole: PoliticianRole): PoliticianAlly[] {
  if (myRole === "innocent") return []
  if (myRole === "leader" && !state.leaderKnowsAllies) return []
  const leaderId = leaderOf(state)
  return room.players
    .filter(p => p.id !== playerId && (state.roles[p.id] === "traitor" || state.roles[p.id] === "leader"))
    .map(p => ({ id: p.id, name: p.name, isLeader: p.id === leaderId }))
}

/** One shared resolution path for a power, whether the president chose it or the clock did. */
function resolvePower(state: PoliticianState, power: PoliticianPower, targetId: string | null): PoliticianState {
  const base: PoliticianState = { ...state, executiveResolved: true, lastExecutive: { power, targetId } }
  if (power === "peek" || targetId === null) return base
  if (power === "investigate") {
    const side = state.roles[targetId] === "innocent" ? "innocent" : "traitor"
    return { ...base, investigated: [...state.investigated, targetId], investigationResult: { targetId, side } }
  }
  if (power === "specialElection") return { ...base, specialPresidentId: targetId }
  return { ...base, alive: state.alive.filter(id => id !== targetId) } // execute
}

/** The president never used the power in time: a deterministic default, same philosophy as the discard/enact/veto timeouts. */
function applyDefaultExecutiveAction(state: PoliticianState): PoliticianState {
  const power = state.pendingPower!
  if (power === "peek") return resolvePower(state, power, null)
  const eligible = executiveEligibleIds(state, power)
  return resolvePower(state, power, eligible[0] ?? null)
}

/** A card lands on the board. Always routes through BOARD_UPDATE, chaos included — that phase is the one place win conditions and power triggers are checked. */
function enactLaw(state: PoliticianState, card: Card, discard: Card[], fromChaos: boolean): Transition {
  const board = card === "good" ? { ...state.board, good: state.board.good + 1 } : { ...state.board, bad: state.board.bad + 1 }
  const next: PoliticianState = {
    ...state, board, discard, hand: [],
    vetoOffered: false, vetoApproved: null,
    lastEnactedCard: card, lastEnactedFromChaos: fromChaos
  }
  return { phase: BOARD_UPDATE, state: next, ms: BOARD_UPDATE_MS }
}

function advanceToNextNomination(state: PoliticianState): Transition {
  let presidentIndex = state.presidentIndex
  let presidentId: string
  if (state.specialPresidentId !== null) {
    // A one-time detour: the rotation index does not move, so normal order
    // resumes right where it would have once this president's turn ends.
    presidentId = state.specialPresidentId
  } else {
    presidentIndex = advancePresidentIndex(state.order, state.alive, state.presidentIndex)
    presidentId = state.order[presidentIndex]!
  }

  const next: PoliticianState = {
    ...state, presidentIndex, presidentId, specialPresidentId: null,
    chancellorNomineeId: null, chancellorId: null,
    ballots: {}, hand: [], vetoOffered: false, vetoApproved: null,
    pendingPower: null, executiveResolved: false, investigationResult: null, peekCards: null
  }
  return { phase: NOMINATION, state: next, ms: NOMINATION_MS, nextRound: true }
}

export const secretPoliticianEngine: GameEngine = {
  gameId: SECRET_POLITICIAN_ID,

  start(room, rng): Transition {
    const order = room.players.map(p => p.id)
    const roles = assignRoles(order, rng)
    const presidentIndex = Math.floor(rng() * order.length)
    const state: PoliticianState = {
      roles, order, alive: [...order],
      deck: freshDeck(rng), discard: [],
      board: { good: 0, bad: 0 }, tracker: 0,
      presidentIndex, presidentId: order[presidentIndex]!, specialPresidentId: null,
      chancellorNomineeId: null, chancellorId: null, lastElected: null,
      ballots: {}, lastVote: null, hand: [],
      vetoOffered: false, vetoApproved: null,
      pendingPower: null, executiveResolved: false, investigated: [],
      investigationResult: null, peekCards: null, lastExecutive: null,
      lastEnactedCard: null, lastEnactedFromChaos: false,
      leaderKnowsAllies: room.settings["leaderKnowsAllies"] === true,
      winner: null
    }
    return { phase: ROLE_REVEAL, state, ms: null, scores: {} }
  },

  act(room, playerId, action): GameState {
    const state = stateOf(room)
    const move = action as { type?: unknown; targetId?: unknown; index?: unknown; approve?: unknown }

    if (move.type === "nominate") {
      if (room.phase !== NOMINATION) throw new Error("GAME_NOT_RUNNING")
      if (playerId !== state.presidentId) throw new Error("AUTHZ_MISMATCH")
      if (state.chancellorNomineeId !== null) throw new Error("INVALID_INPUT")
      const targetId = typeof move.targetId === "string" ? move.targetId : ""
      if (!eligibleChancellors(state).includes(targetId)) throw new Error("INVALID_INPUT")
      return { ...state, chancellorNomineeId: targetId }
    }

    if (move.type === "vote") {
      if (room.phase !== VOTE_GOVERNMENT) throw new Error("GAME_NOT_RUNNING")
      if (!state.alive.includes(playerId)) throw new Error("AUTHZ_MISMATCH")
      if (state.ballots[playerId] !== undefined) throw new Error("INVALID_INPUT")
      if (typeof move.approve !== "boolean") throw new Error("INVALID_INPUT")
      return { ...state, ballots: { ...state.ballots, [playerId]: move.approve } }
    }

    if (move.type === "discard") {
      if (room.phase !== LEGISLATIVE_PRESIDENT) throw new Error("GAME_NOT_RUNNING")
      if (playerId !== state.presidentId) throw new Error("AUTHZ_MISMATCH")
      if (state.hand.length !== 3) throw new Error("INVALID_INPUT")
      const index = move.index
      if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index > 2) throw new Error("INVALID_INPUT")
      const discarded = state.hand[index]!
      return { ...state, hand: state.hand.filter((_, i) => i !== index), discard: [...state.discard, discarded] }
    }

    if (move.type === "enact") {
      if (room.phase !== LEGISLATIVE_CHANCELLOR) throw new Error("GAME_NOT_RUNNING")
      if (playerId !== state.chancellorId) throw new Error("AUTHZ_MISMATCH")
      if (state.vetoOffered) throw new Error("INVALID_INPUT")
      if (state.hand.length !== 2) throw new Error("INVALID_INPUT")
      const index = move.index
      if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index > 1) throw new Error("INVALID_INPUT")
      const enacted = state.hand[index]!
      const discarded = state.hand[1 - index]!
      // The chosen card moves into `hand` alone; next() reads it from there to enact the law.
      return { ...state, hand: [enacted], discard: [...state.discard, discarded] }
    }

    if (move.type === "veto") {
      if (room.phase !== LEGISLATIVE_CHANCELLOR) throw new Error("GAME_NOT_RUNNING")
      if (playerId !== state.chancellorId) throw new Error("AUTHZ_MISMATCH")
      if (state.board.bad < VETO_UNLOCK_BAD) throw new Error("INVALID_INPUT")
      if (state.hand.length !== 2) throw new Error("INVALID_INPUT")
      if (state.vetoOffered) throw new Error("INVALID_INPUT")
      return { ...state, vetoOffered: true }
    }

    if (move.type === "vetoDecision") {
      if (room.phase !== VETO_CONFIRM) throw new Error("GAME_NOT_RUNNING")
      if (playerId !== state.presidentId) throw new Error("AUTHZ_MISMATCH")
      if (state.vetoApproved !== null) throw new Error("INVALID_INPUT")
      if (typeof move.approve !== "boolean") throw new Error("INVALID_INPUT")
      return { ...state, vetoApproved: move.approve }
    }

    if (move.type === "investigate" || move.type === "specialElection" || move.type === "execute") {
      if (room.phase !== EXECUTIVE_ACTION) throw new Error("GAME_NOT_RUNNING")
      if (playerId !== state.presidentId) throw new Error("AUTHZ_MISMATCH")
      if (state.pendingPower !== move.type) throw new Error("INVALID_INPUT")
      if (state.executiveResolved) throw new Error("INVALID_INPUT")
      const targetId = typeof move.targetId === "string" ? move.targetId : ""
      if (!executiveEligibleIds(state, move.type).includes(targetId)) throw new Error("INVALID_INPUT")
      return resolvePower(state, move.type, targetId)
    }

    if (move.type === "peekAck") {
      if (room.phase !== EXECUTIVE_ACTION) throw new Error("GAME_NOT_RUNNING")
      if (playerId !== state.presidentId) throw new Error("AUTHZ_MISMATCH")
      if (state.pendingPower !== "peek") throw new Error("INVALID_INPUT")
      if (state.executiveResolved) throw new Error("INVALID_INPUT")
      return resolvePower(state, "peek", null)
    }

    throw new Error("INVALID_INPUT")
  },

  next(room, rng): Transition {
    const state = stateOf(room)
    const playerCount = state.order.length

    if (room.phase === ROLE_REVEAL) {
      return { phase: NOMINATION, state, ms: NOMINATION_MS }
    }

    if (room.phase === NOMINATION) {
      // Nobody nominated in time: fall back to the first eligible candidate,
      // deterministic and explainable rather than silently stalling the game.
      const nomineeId = state.chancellorNomineeId ?? eligibleChancellors(state)[0]
      if (nomineeId === undefined) return advanceToNextNomination(state)
      return { phase: VOTE_GOVERNMENT, state: { ...state, chancellorNomineeId: nomineeId }, ms: VOTE_MS }
    }

    if (room.phase === VOTE_GOVERNMENT) {
      const forCount = Object.values(state.ballots).filter(v => v === true).length
      const againstCount = Object.values(state.ballots).filter(v => v === false).length
      const approved = forCount > againstCount
      const chancellorId = state.chancellorNomineeId!
      const lastVote: PoliticianVoteSummary = {
        presidentId: state.presidentId, chancellorId, approved, ballots: state.ballots
      }

      if (!approved) {
        const tracker = state.tracker + 1
        const afterVote: PoliticianState = { ...state, tracker, chancellorNomineeId: null, chancellorId: null, ballots: {}, lastVote }
        if (tracker >= CHAOS_TRACKER) {
          const { cards, deck, discard } = drawHand(afterVote, 1, rng)
          return enactLaw({ ...afterVote, deck, tracker: 0, lastElected: null }, cards[0]!, discard, true)
        }
        return advanceToNextNomination(afterVote)
      }

      // Approved. Electing the leader as chancellor once three bad laws are
      // already up wins it for the traitors immediately — before any card is
      // even drawn.
      if (state.board.bad >= 3 && state.roles[chancellorId] === "leader") {
        return { phase: GAME_OVER, state: { ...state, chancellorId, lastVote, winner: "traitors" }, ms: null, winner: "traitors" }
      }

      const { cards, deck, discard } = drawHand(state, 3, rng)
      const next: PoliticianState = {
        ...state, chancellorId, lastElected: { presidentId: state.presidentId, chancellorId },
        ballots: {}, lastVote, hand: cards, deck, discard, vetoOffered: false, vetoApproved: null
      }
      return { phase: LEGISLATIVE_PRESIDENT, state: next, ms: PRESIDENT_HAND_MS }
    }

    if (room.phase === LEGISLATIVE_PRESIDENT) {
      // The president never chose: discard the first card, deterministic —
      // "the server discards the first card" beats a fairness debate nobody
      // can settle after the fact.
      const acted = state.hand.length === 2
      const hand = acted ? state.hand : state.hand.slice(1)
      const discard = acted ? state.discard : [...state.discard, state.hand[0]!]
      return { phase: LEGISLATIVE_CHANCELLOR, state: { ...state, hand, discard }, ms: CHANCELLOR_HAND_MS }
    }

    if (room.phase === LEGISLATIVE_CHANCELLOR) {
      if (state.vetoOffered) return { phase: VETO_CONFIRM, state, ms: VETO_MS }
      // A single card in hand means the chancellor already chose one; two
      // means the clock ran out and the first is enacted by default.
      const enacted = state.hand[0]!
      const discard = state.hand.length === 2 ? [...state.discard, state.hand[1]!] : state.discard
      return enactLaw(state, enacted, discard, false)
    }

    if (room.phase === VETO_CONFIRM) {
      // No decision in time: the veto is denied, and the law is forced through.
      const approved = state.vetoApproved ?? false
      if (approved) {
        const discard = [...state.discard, ...state.hand]
        const next: PoliticianState = {
          ...state, discard, hand: [], vetoOffered: false, vetoApproved: null,
          tracker: state.tracker + 1, chancellorNomineeId: null, chancellorId: null
        }
        return advanceToNextNomination(next)
      }
      const enacted = state.hand[0]!
      const discard = [...state.discard, state.hand[1]!]
      return enactLaw({ ...state, vetoOffered: false, vetoApproved: null }, enacted, discard, false)
    }

    if (room.phase === BOARD_UPDATE) {
      if (state.board.good >= GOOD_WIN) return { phase: GAME_OVER, state: { ...state, winner: "innocents" }, ms: null, winner: "innocents" }
      if (state.board.bad >= BAD_WIN) return { phase: GAME_OVER, state: { ...state, winner: "traitors" }, ms: null, winner: "traitors" }
      const leader = leaderOf(state)
      if (!state.alive.includes(leader)) return { phase: GAME_OVER, state: { ...state, winner: "innocents" }, ms: null, winner: "innocents" }

      if (state.lastEnactedCard === "bad" && !state.lastEnactedFromChaos) {
        const power = powerFor(state.board.bad, playerCount)
        if (power !== undefined) {
          // A peek's reshuffle-if-needed is a real state change even though
          // no card actually leaves the deck — persist it either way.
          const { cards, deck, discard } = power === "peek"
            ? peekTop3(state, rng)
            : { cards: null, deck: state.deck, discard: state.discard }
          return {
            phase: EXECUTIVE_ACTION,
            state: { ...state, deck, discard, pendingPower: power, executiveResolved: false, investigationResult: null, peekCards: cards },
            ms: EXECUTIVE_MS
          }
        }
      }
      return advanceToNextNomination(state)
    }

    if (room.phase === EXECUTIVE_ACTION) {
      const resolved = state.executiveResolved ? state : applyDefaultExecutiveAction(state)
      const leader = leaderOf(resolved)
      if (!resolved.alive.includes(leader)) {
        return { phase: GAME_OVER, state: { ...resolved, winner: "innocents" }, ms: null, winner: "innocents" }
      }
      return advanceToNextNomination(resolved)
    }

    return { phase: GAME_OVER, state, ms: null, winner: state.winner }
  },

  pending(room): string[] {
    const state = stateOf(room)
    const connected = (id: string): boolean => room.players.some(p => p.id === id && p.connected)

    if (room.phase === NOMINATION) {
      return state.chancellorNomineeId === null ? [state.presidentId] : []
    }
    if (room.phase === VOTE_GOVERNMENT) {
      return state.alive.filter(id => connected(id) && state.ballots[id] === undefined)
    }
    if (room.phase === LEGISLATIVE_PRESIDENT) {
      // The president waits out the full clock even if disconnected — see
      // the module doc: a rushed high-stakes decision is worse than a wait.
      return state.hand.length === 3 ? [state.presidentId] : []
    }
    if (room.phase === LEGISLATIVE_CHANCELLOR) {
      return (state.hand.length === 2 && !state.vetoOffered) ? [state.chancellorId!] : []
    }
    if (room.phase === VETO_CONFIRM) {
      return state.vetoApproved === null ? [state.presidentId] : []
    }
    if (room.phase === EXECUTIVE_ACTION) {
      return state.executiveResolved ? [] : [state.presidentId]
    }
    // BOARD_UPDATE has nothing to act on — it is a reading clock, not a wait
    // for moves — so a disconnect must never cut its six seconds short.
    if (room.phase === BOARD_UPDATE) {
      return room.players.filter(p => p.connected).map(p => p.id)
    }
    return []
  },

  view(room, playerId): PoliticianView {
    const state = stateOf(room)
    const r = roster(room, state)

    if (room.phase === ROLE_REVEAL) {
      const myRole = state.roles[playerId] ?? "innocent"
      return { kind: "politician-role-reveal", roundNumber: room.round, roster: r, myRole, allies: alliesFor(room, state, playerId, myRole) }
    }

    if (room.phase === NOMINATION) {
      return {
        kind: "politician-nomination", roundNumber: room.round, roster: r,
        board: state.board, tracker: state.tracker, presidentId: state.presidentId,
        eligibleIds: eligibleChancellors(state), chancellorNomineeId: state.chancellorNomineeId,
        lastVote: state.lastVote, lastExecutive: state.lastExecutive
      }
    }

    if (room.phase === VOTE_GOVERNMENT) {
      const connectedAlive = state.alive.filter(id => room.players.some(p => p.id === id && p.connected))
      return {
        kind: "politician-vote", roundNumber: room.round, roster: r, board: state.board,
        presidentId: state.presidentId, chancellorNomineeId: state.chancellorNomineeId ?? "",
        myVote: state.ballots[playerId] ?? null,
        votedCount: connectedAlive.filter(id => state.ballots[id] !== undefined).length,
        totalVoters: connectedAlive.length
      }
    }

    if (room.phase === LEGISLATIVE_PRESIDENT || room.phase === LEGISLATIVE_CHANCELLOR) {
      const actingRole = room.phase === LEGISLATIVE_PRESIDENT ? "president" as const : "chancellor" as const
      const actorId = actingRole === "president" ? state.presidentId : state.chancellorId
      return {
        kind: "politician-legislative", roundNumber: room.round, roster: r, board: state.board,
        presidentId: state.presidentId, chancellorId: state.chancellorId ?? "", actingRole,
        hand: playerId === actorId ? state.hand : null,
        vetoAvailable: actingRole === "chancellor" && state.board.bad >= VETO_UNLOCK_BAD,
        vetoOffered: state.vetoOffered
      }
    }

    if (room.phase === VETO_CONFIRM) {
      return {
        kind: "politician-veto-confirm", roundNumber: room.round, roster: r, board: state.board,
        presidentId: state.presidentId, chancellorId: state.chancellorId ?? "", myDecision: state.vetoApproved
      }
    }

    if (room.phase === BOARD_UPDATE) {
      return { kind: "politician-board-update", roundNumber: room.round, roster: r, board: state.board, enacted: state.lastEnactedCard ?? "good" }
    }

    if (room.phase === EXECUTIVE_ACTION) {
      const power = state.pendingPower ?? "peek"
      return {
        kind: "politician-executive-action", roundNumber: room.round, roster: r, board: state.board,
        presidentId: state.presidentId, power, eligibleIds: executiveEligibleIds(state, power),
        resolved: state.executiveResolved,
        peekCards: playerId === state.presidentId ? state.peekCards : null,
        investigationResult: playerId === state.presidentId ? state.investigationResult : null
      }
    }

    // GAME_OVER — the one moment every role is public.
    return { kind: "politician-over", roundNumber: room.round, roster: r, board: state.board, winner: state.winner ?? "innocents", roles: state.roles }
  }
}
