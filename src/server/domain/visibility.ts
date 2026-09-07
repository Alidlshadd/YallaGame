import type { Game, GameId, Room, RoomSummary, VisibleRoom, Viewer } from "@shared/types.js"

export type GameResolver = (id: GameId) => Game | undefined

export function projectRoomFor(room: Room, viewer: Viewer, resolveGame: GameResolver): VisibleRoom {
  const game = resolveGame(room.gameId)
  if (!game) throw new Error("UNKNOWN_GAME")

  const shared = {
    code: room.code, gameId: room.gameId, game,
    assigned: room.assigned, settings: room.settings,
    hostPlayerId: room.hostPlayerId,
    isPublic: room.isPublic,
    requireApproval: room.requireApproval
  }

  if (viewer.kind === "admin") {
    if (viewer.adminSecret !== room.adminSecret) throw new Error("AUTHZ_MISMATCH")
    return {
      ...shared,
      players: room.players.map(p => ({
        id: p.id, name: p.name, connected: p.connected, role: p.role, character: p.character, accessory: p.accessory ?? ""
      })),
      // Only the host decides who gets in, so only the host sees the queue.
      pending: room.pending.map(r => ({ ...r }))
    }
  }

  const me = room.players.find(p => p.id === viewer.playerId)
  if (!me) throw new Error("AUTHZ_MISMATCH")

  return {
    ...shared,
    players: room.players.map(p => ({
      id: p.id, name: p.name, connected: p.connected,
      role: p.id === viewer.playerId ? p.role : null,
      character: p.character, accessory: p.accessory ?? ""
    })),
    pending: []
  }
}

/**
 * The row shown in the public room browser. Nothing here is secret: no admin
 * secret, no roles, no player names — just enough to decide whether to knock.
 */
export function summarizeRoom(room: Room, resolveGame: GameResolver): RoomSummary | null {
  const game = resolveGame(room.gameId)
  if (!game) return null
  const host = room.players.find(p => p.id === room.hostPlayerId)
  return {
    code: room.code,
    gameId: room.gameId,
    gameTitle: game.title,
    gameIcon: game.icon,
    theme: game.theme,
    hostName: host?.name ?? "",
    playerCount: room.players.filter(p => p.connected).length,
    requireApproval: room.requireApproval,
    assigned: room.assigned,
    createdAt: room.createdAt,
    takenCharacters: takenCharacters(room)
  }
}

/**
 * Characters already claimed in a room — by a seated player or by somebody
 * still waiting in the queue, since letting two people queue for the same one
 * only defers the clash to the moment the host accepts them both.
 */
export function takenCharacters(room: Room): string[] {
  const taken = new Set<string>()
  for (const p of room.players) if (p.character) taken.add(p.character)
  for (const r of room.pending) if (r.character) taken.add(r.character)
  return [...taken]
}
