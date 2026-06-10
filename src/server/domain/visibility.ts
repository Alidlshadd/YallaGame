import type { Game, GameId, Room, VisibleRoom, Viewer } from "@shared/types.js"

export type GameResolver = (id: GameId) => Game | undefined

export function projectRoomFor(room: Room, viewer: Viewer, resolveGame: GameResolver): VisibleRoom {
  const game = resolveGame(room.gameId)
  if (!game) throw new Error("UNKNOWN_GAME")

  if (viewer.kind === "admin") {
    if (viewer.adminSecret !== room.adminSecret) throw new Error("AUTHZ_MISMATCH")
    return {
      code: room.code, gameId: room.gameId, game, assigned: room.assigned, settings: room.settings,
      players: room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected, role: p.role }))
    }
  }

  const me = room.players.find(p => p.id === viewer.playerId)
  if (!me) throw new Error("AUTHZ_MISMATCH")

  return {
    code: room.code, gameId: room.gameId, game, assigned: room.assigned, settings: room.settings,
    players: room.players.map(p => ({
      id: p.id, name: p.name, connected: p.connected,
      role: p.id === viewer.playerId ? p.role : null
    }))
  }
}
