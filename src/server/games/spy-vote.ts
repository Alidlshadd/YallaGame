import type { GameState, Room } from "@shared/types.js"
import type { SpyVotePlayer, SpyVoteTally, SpyVoteView } from "@shared/spy-vote.js"
import type { GameEngine, Transition } from "../domain/engine.js"
import { readSpyWordPick, SPY_GAME_ID } from "../domain/spyWords.js"

/**
 * Spy Game's online vote. The game itself stays a deal of roles — the table
 * talks it out — and once the discussion is over the host opens this vote:
 *
 *   SPY_VOTING   one vote each for who the spy is, on the room's clock;
 *                closes early the moment every connected player has voted
 *   SPY_RESULT   the votes, the real spies and the word, all at once. No
 *                clock: the host takes the room back to the lobby
 *
 * The round's word and the repeat-avoidance history live in the same
 * `gameState`, so every phase carries them through untouched and `idleState`
 * hands them back when the vote ends.
 */

export const SPY_VOTING = "SPY_VOTING"
export const SPY_RESULT = "SPY_RESULT"

const DEFAULT_VOTE_SECONDS = 60

interface SpyVote {
  voterId: string
  targetId: string
  createdAt: number
}

function votesOf(room: Room): SpyVote[] {
  const raw = room.gameState["spyVotes"]
  return Array.isArray(raw) ? raw as SpyVote[] : []
}

/** Everything the vote does not own, so the deal survives it. */
function dealState(room: Room): GameState {
  const rest = { ...room.gameState }
  delete rest["spyVotes"]
  return rest
}

/** Only people who were dealt a card are in this round. */
function seated(room: Room): Room["players"] {
  return room.players.filter(p => p.role !== null)
}

function voteMs(room: Room): number {
  const value = room.settings["spyVoteSeconds"]
  return (typeof value === "number" && Number.isFinite(value) ? value : DEFAULT_VOTE_SECONDS) * 1000
}

function roster(room: Room): SpyVotePlayer[] {
  return seated(room).map(p => ({
    id: p.id, name: p.name, character: p.character, accessory: p.accessory ?? "", connected: p.connected
  }))
}

export function tallySpyVotes(room: Room): Omit<Extract<SpyVoteView, { kind: "spy-result" }>, "kind" | "roundNumber" | "roster"> {
  // Anonymous unless the host asked for names before the vote opened.
  const named = room.settings["spyShowVoters"] === true
  const players = seated(room)
  const byId = new Map(players.map(p => [p.id, { name: p.name, voteCount: 0, voters: [] as string[] }]))

  let totalVotes = 0
  for (const vote of votesOf(room)) {
    const target = byId.get(vote.targetId)
    if (target === undefined) continue
    target.voteCount++
    const voterName = room.players.find(p => p.id === vote.voterId)?.name
    if (voterName !== undefined) target.voters.push(voterName)
    totalVotes++
  }

  const results: SpyVoteTally[] = players
    .map(p => {
      const entry = byId.get(p.id)!
      return {
        playerId: p.id, playerName: p.name, voteCount: entry.voteCount,
        ...(named ? { voters: entry.voters } : {})
      }
    })
    .sort((a, b) => b.voteCount - a.voteCount || a.playerName.localeCompare(b.playerName))

  const top = results[0]?.voteCount ?? 0
  return {
    totalVotes,
    results,
    topPlayerIds: top === 0 ? [] : results.filter(r => r.voteCount === top).map(r => r.playerId),
    spyIds: players.filter(p => p.role === "spy").map(p => p.id),
    word: readSpyWordPick(room.gameState)?.word ?? null
  }
}

export const spyVoteEngine: GameEngine = {
  gameId: SPY_GAME_ID,

  start(room): Transition {
    // There is nobody to vote on until the cards are out.
    if (!room.assigned) throw new Error("INVALID_INPUT")
    return { phase: SPY_VOTING, state: { ...dealState(room), spyVotes: [] }, ms: voteMs(room), scores: {} }
  },

  act(room, playerId, action): GameState {
    if (room.phase !== SPY_VOTING) throw new Error("GAME_NOT_RUNNING")
    const move = action as { type?: unknown; target?: unknown }
    if (move.type !== "vote") throw new Error("INVALID_INPUT")
    const target = typeof move.target === "string" ? move.target : ""
    const players = seated(room)
    if (!players.some(p => p.id === playerId)) throw new Error("AUTHZ_MISMATCH")
    if (target === playerId || !players.some(p => p.id === target)) throw new Error("INVALID_INPUT")

    const votes = votesOf(room)
    // One vote each, so the live count never goes backwards.
    if (votes.some(v => v.voterId === playerId)) throw new Error("INVALID_INPUT")
    return { ...room.gameState, spyVotes: [...votes, { voterId: playerId, targetId: target, createdAt: Date.now() }] }
  },

  next(room): Transition {
    if (room.phase === SPY_VOTING) return { phase: SPY_RESULT, state: room.gameState, ms: null }
    return { phase: SPY_RESULT, state: room.gameState, ms: null, winner: null }
  },

  pending(room): string[] {
    if (room.phase !== SPY_VOTING) return []
    const votes = votesOf(room)
    return seated(room).filter(p => p.connected && !votes.some(v => v.voterId === p.id)).map(p => p.id)
  },

  view(room, playerId): SpyVoteView {
    if (room.phase === SPY_VOTING) {
      const votes = votesOf(room)
      const connected = seated(room).filter(p => p.connected)
      return {
        kind: "spy-voting",
        roundNumber: room.round,
        roster: roster(room),
        myVote: votes.find(v => v.voterId === playerId)?.targetId ?? null,
        votedCount: votes.filter(v => connected.some(p => p.id === v.voterId)).length,
        totalPlayers: connected.length
      }
    }
    return { kind: "spy-result", roundNumber: room.round, roster: roster(room), ...tallySpyVotes(room) }
  },

  idleState(room): GameState {
    return dealState(room)
  }
}
