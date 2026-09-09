import type { GameOverEvent, PhaseEvent } from "@shared/events.js"
import type { GameState, Phase, Room, Scores } from "@shared/types.js"
import { IDLE_PHASE } from "../../shared/types.js"
import type { RoomStore } from "../store/store.js"
import { cancelTimer, hasTimer, scheduleAt } from "./scheduler.js"

/**
 * The turn engine. It owns exactly one thing: when a room's phase changes, and
 * who is told about it. What a phase *means* belongs to a `GameEngine`.
 *
 * Nothing here imports socket.io — delivery arrives as two callbacks, so the
 * whole state machine is testable without a server.
 */

/** What a game wants the room to look like after this phase ends. */
export interface Transition {
  phase: Phase
  state: GameState
  /** Milliseconds on the clock, or null for a phase the host closes by hand. */
  ms: number | null
  scores?: Scores
  /** Present once the game is decided. The room stops advancing on its own. */
  winner?: string | null
  nextRound?: boolean
}

export interface GameEngine {
  gameId: string
  /** The first phase, from a room sitting in the lobby. */
  start(room: Room, rng: () => number): Transition
  /**
   * Fold one player's move into the game state. Throw an `ErrorCode` string to
   * refuse it — an illegal move is a bug or a forged packet, never a phase change.
   */
  act(room: Room, playerId: string, action: unknown): GameState
  /** This phase is over: the clock ran out, everyone acted, or the host said so. */
  next(room: Room, rng: () => number): Transition
  /** Connected players who still owe a move. Empty means the phase can close early. */
  pending(room: Room): string[]
  /** Everything this one player is allowed to see right now, and nothing else. */
  view(room: Room, playerId: string): unknown
}

export type EngineResolver = (gameId: string) => GameEngine | undefined

export interface EngineDeps {
  store: RoomStore
  resolveEngine: EngineResolver
  rng: () => number
  emitPhase(code: string, playerId: string, payload: PhaseEvent): void
  emitOver(code: string, payload: GameOverEvent): void
}

/**
 * Breathing room after the last person acts, so the screen does not change
 * under the finger that just tapped it.
 */
const EARLY_CLOSE_MS = 1200

/**
 * How many expired phases one catch-up will walk through. A room that has been
 * dead longer than this is abandoned; the TTL sweep collects it rather than the
 * server silently playing several rounds to an empty living room.
 */
const MAX_CATCHUP_STEPS = 4

function applyTransition(room: Room, t: Transition): Room {
  return {
    ...room,
    phase: t.phase,
    phaseSeq: room.phaseSeq + 1,
    phaseEndsAt: t.ms === null ? null : Date.now() + t.ms,
    round: t.nextRound === true ? room.round + 1 : room.round,
    gameState: t.state,
    scores: t.scores ?? room.scores
  }
}

function arm(deps: EngineDeps, room: Room): void {
  cancelTimer(room.code)
  if (room.phaseEndsAt === null) return
  const { code, phase, phaseSeq } = room
  scheduleAt(code, room.phaseEndsAt - Date.now(), () => {
    void onDeadline(deps, code, phase, phaseSeq)
  })
}

async function onDeadline(deps: EngineDeps, code: string, phase: Phase, seq: number): Promise<void> {
  try {
    await advance(deps, code, { phase, seq }, (room, engine) => engine.next(room, deps.rng))
  } catch {
    // The room was closed or swept while its clock was running. Nothing to do.
  }
}

function broadcast(deps: EngineDeps, room: Room): void {
  const engine = deps.resolveEngine(room.gameId)
  for (const player of room.players) {
    deps.emitPhase(room.code, player.id, {
      code: room.code,
      phase: room.phase,
      seq: room.phaseSeq,
      round: room.round,
      endsAt: room.phaseEndsAt,
      scores: room.scores,
      // An idle room has no game to project, and asking an engine to describe
      // a phase it does not own is how leaks start.
      view: room.phase === IDLE_PHASE || engine === undefined
        ? null
        : engine.view(room, player.id)
    })
  }
}

/**
 * The one door a phase changes through.
 *
 * `expect` is what the caller believed the room was doing. If the room has
 * moved on — because the last vote landed a millisecond before the countdown,
 * or a restarted process re-armed a timer someone else already fired — the
 * call is a no-op and returns null. That guard is the whole reason a round
 * cannot be played twice.
 */
export async function advance(
  deps: EngineDeps,
  code: string,
  expect: { phase: Phase; seq: number },
  reduce: (room: Room, engine: GameEngine) => Transition
): Promise<Room | null> {
  const out: { moved: boolean; over: GameOverEvent | null } = { moved: false, over: null }

  const room = await deps.store.update(code, current => {
    if (current.phase !== expect.phase || current.phaseSeq !== expect.seq) return current
    const engine = deps.resolveEngine(current.gameId)
    if (engine === undefined) return current

    const transition = reduce(current, engine)
    const next = applyTransition(current, transition)
    out.moved = true
    if (transition.winner !== undefined) {
      out.over = { winner: transition.winner, scores: next.scores, round: next.round }
    }
    return next
  })

  if (!out.moved) return null

  if (out.over === null) arm(deps, room)
  else cancelTimer(code)   // a decided game keeps its final screen up

  broadcast(deps, room)
  if (out.over !== null) deps.emitOver(code, out.over)
  return room
}

/** Host starts the game. Round and scores reset here, not on the first turn. */
export async function startGame(deps: EngineDeps, code: string, adminSecret: string): Promise<Room> {
  const room = await deps.store.update(code, current => {
    if (current.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
    const engine = deps.resolveEngine(current.gameId)
    if (engine === undefined) throw new Error("UNKNOWN_GAME")
    const fresh = { ...current, round: 1, scores: {}, phaseSeq: current.phaseSeq }
    const transition = engine.start(fresh, deps.rng)
    return { ...applyTransition(fresh, transition), round: 1 }
  })
  arm(deps, room)
  broadcast(deps, room)
  return room
}

/**
 * A player moved. The action is folded in, everyone is told how far the phase
 * has got, and if nobody is left to act the countdown is cut short.
 */
export async function submitAction(
  deps: EngineDeps,
  code: string,
  playerId: string,
  seq: number,
  action: unknown
): Promise<Room> {
  await catchUp(deps, code)

  const room = await deps.store.update(code, current => {
    if (current.phase === IDLE_PHASE) throw new Error("GAME_NOT_RUNNING")
    // The tap came from a screen this room has already left.
    if (current.phaseSeq !== seq) throw new Error("PHASE_STALE")
    const engine = deps.resolveEngine(current.gameId)
    if (engine === undefined) throw new Error("UNKNOWN_GAME")
    if (!current.players.some(p => p.id === playerId)) throw new Error("AUTHZ_MISMATCH")
    return { ...current, gameState: engine.act(current, playerId, action) }
  })

  broadcast(deps, room)
  closeEarlyIfDone(deps, room)
  return room
}

/** Host closes a phase that has no clock of its own. */
export async function hostAdvance(
  deps: EngineDeps,
  code: string,
  adminSecret: string,
  seq: number
): Promise<Room | null> {
  const current = await deps.store.get(code)
  if (current === null) throw new Error("ROOM_NOT_FOUND")
  if (current.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
  if (current.phase === IDLE_PHASE) throw new Error("GAME_NOT_RUNNING")
  return advance(deps, code, { phase: current.phase, seq }, (room, engine) => engine.next(room, deps.rng))
}

/** Host stops the game. Scores stay up; the next start clears them. */
export async function stopGame(deps: EngineDeps, code: string, adminSecret: string): Promise<Room> {
  const room = await deps.store.update(code, current => {
    if (current.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
    return {
      ...current,
      phase: IDLE_PHASE,
      phaseSeq: current.phaseSeq + 1,
      phaseEndsAt: null,
      gameState: {}
    }
  })
  cancelTimer(code)
  broadcast(deps, room)
  return room
}

/**
 * Force through any deadline that has already passed, and re-arm one that has
 * not. Both halves matter after a restart: the timer map is empty, so a live
 * room would otherwise sit on a phase whose clock nobody is holding.
 */
export async function catchUp(deps: EngineDeps, code: string): Promise<void> {
  for (let step = 0; step < MAX_CATCHUP_STEPS; step++) {
    const room = await deps.store.get(code)
    if (room === null || room.phase === IDLE_PHASE || room.phaseEndsAt === null) return

    if (room.phaseEndsAt > Date.now()) {
      if (!hasTimer(code)) arm(deps, room)
      return
    }

    const moved = await advance(
      deps, code,
      { phase: room.phase, seq: room.phaseSeq },
      (r, engine) => engine.next(r, deps.rng)
    )
    if (moved === null) return
  }
}

/** Send one player the phase they are in — reconnect, or a late approval. */
export async function sendPhaseTo(deps: EngineDeps, code: string, playerId: string): Promise<void> {
  await catchUp(deps, code)
  const room = await deps.store.get(code)
  if (room === null || room.phase === IDLE_PHASE) return
  const engine = deps.resolveEngine(room.gameId)
  if (engine === undefined) return
  deps.emitPhase(code, playerId, {
    code,
    phase: room.phase,
    seq: room.phaseSeq,
    round: room.round,
    endsAt: room.phaseEndsAt,
    scores: room.scores,
    view: engine.view(room, playerId)
  })
}

/**
 * Somebody dropped out. A phase must never wait on a phone that is gone, so
 * the remaining players may already have finished it.
 */
export async function onPlayerLeft(deps: EngineDeps, code: string): Promise<void> {
  const room = await deps.store.get(code)
  if (room === null || room.phase === IDLE_PHASE) return
  closeEarlyIfDone(deps, room)
}

function closeEarlyIfDone(deps: EngineDeps, room: Room): void {
  // A phase with no clock belongs to the host; finishing early does not end it.
  if (room.phaseEndsAt === null) return
  const engine = deps.resolveEngine(room.gameId)
  if (engine === undefined) return
  if (engine.pending(room).length > 0) return

  // Shorten the wait, never lengthen it: near the end of a phase the grace
  // period would otherwise hand time back.
  const left = room.phaseEndsAt - Date.now()
  const { code, phase, phaseSeq } = room
  scheduleAt(code, Math.min(EARLY_CLOSE_MS, left), () => {
    void onDeadline(deps, code, phase, phaseSeq)
  })
}
