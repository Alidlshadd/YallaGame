import type { Server, Socket } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@shared/events.js"
import type { SocketData } from "@shared/types.js"
import type { RoomStore } from "../store/store.js"
import type { GameResolver } from "../domain/visibility.js"
import type { EngineDeps, EngineResolver } from "../domain/engine.js"
import { hostAdvance, startGame, stopGame, submitAction } from "../domain/engine.js"
import { bind } from "./bind.js"
import { IDLE_PHASE } from "../../shared/types.js"
import { normalizeSettings } from "../domain/settings.js"
import { SPY_GAME_ID } from "../domain/spyWords.js"
import {
  GameStartPayload,
  GameActionPayload,
  GameAdvancePayload,
  GameEndPayload,
  TimeSyncPayload
} from "./schemas.js"
import { logger } from "../logger.js"
import { emitGameFinished } from "./completion.js"

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>

export interface GameDeps {
  io: TypedServer
  store: RoomStore
  resolveGame: GameResolver
  resolveEngine: EngineResolver
  rng: () => number
}

/**
 * Hands the pure engine its two ways out. Each player's phase goes to that
 * player's own socket room, which is what keeps one person's cards off
 * everybody else's phone.
 */
export function engineDeps(deps: GameDeps): EngineDeps {
  return {
    store: deps.store,
    resolveEngine: deps.resolveEngine,
    rng: deps.rng,
    emitPhase(code, playerId, payload) {
      deps.io.to(`p:${code}:${playerId}`).emit("game:phase", payload)
    },
    emitOver(code, payload) {
      deps.io.to(`room:${code}`).emit("game:over", payload)
    },
    emitFinished(room) {
      emitGameFinished(deps.io, room)
    }
  }
}

const SPY_VOTE_SETTINGS = ["spyVoteSeconds", "spyShowVoters"] as const

/**
 * The host's form goes in with Start, so a setting changed without pressing
 * Save (60 rounds, player-written questions) is the game that gets played.
 * Spy Game's cards are already dealt by then: only the vote's own settings
 * are taken, never ones the deal was made from.
 */
async function applyStartSettings(deps: GameDeps, code: string, adminSecret: string, incoming: Record<string, unknown>): Promise<void> {
  await deps.store.update(code, room => {
    if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")
    const game = deps.resolveGame(room.gameId)
    if (game === undefined || room.phase !== IDLE_PHASE) return room
    let picked: Record<string, unknown> = incoming
    if (room.gameId === SPY_GAME_ID) {
      picked = {}
      for (const key of SPY_VOTE_SETTINGS) if (key in incoming) picked[key] = incoming[key]
    }
    return { ...room, settings: normalizeSettings(game, { ...room.settings, ...picked }) }
  })
}

export function registerGameHandlers(socket: TypedSocket, deps: GameDeps): void {
  const engine = engineDeps(deps)

  bind(socket, "game:start", GameStartPayload, async ({ code, adminSecret, settings }) => {
    if (settings !== undefined) await applyStartSettings(deps, code, adminSecret, settings)
    const room = await deps.store.get(code)
    if (room === null) throw new Error("ROOM_NOT_FOUND")
    if (room.adminSecret !== adminSecret) throw new Error("INVALID_ADMIN")

    const game = deps.resolveGame(room.gameId)
    if (game === undefined) throw new Error("UNKNOWN_GAME")
    // A game with no engine is one the table runs itself; there is no turn to start.
    if (deps.resolveEngine(room.gameId) === undefined) throw new Error("UNKNOWN_GAME")

    const seated = room.players.filter(p => p.connected).length
    if (seated < game.minPlayers) throw new Error("NEED_MORE_PLAYERS")

    const started = await startGame(engine, code, adminSecret)
    logger.info({ code, gameId: room.gameId, players: seated }, "game started")
    return { phase: started.phase, seq: started.phaseSeq }
  })

  bind(socket, "game:action", GameActionPayload, async ({ code, seq, action }) => {
    // Who is acting comes from the socket, never from the payload: otherwise
    // one player could vote, write, or play a card as somebody else.
    const playerId = socket.data.playerId
    if (playerId === undefined || socket.data.roomCode !== code || !socket.rooms.has(`p:${code}:${playerId}`)) throw new Error("AUTHZ_MISMATCH")
    await submitAction(engine, code, playerId, seq, action)
    return { accepted: true as const }
  })

  bind(socket, "game:advance", GameAdvancePayload, async ({ code, adminSecret, seq }) => {
    const moved = await hostAdvance(engine, code, adminSecret, seq)
    // A stale seq is not an error: the host tapped a screen that had already
    // moved on, and the phase they wanted is the phase they are now in.
    return { moved: moved !== null }
  })

  bind(socket, "game:end", GameEndPayload, async ({ code, adminSecret }) => {
    const room = await stopGame(engine, code, adminSecret)
    logger.info({ code }, "game stopped by host")
    return { phase: room.phase }
  })

  bind(socket, "time:sync", TimeSyncPayload, async () => ({ now: Date.now() }))
}
