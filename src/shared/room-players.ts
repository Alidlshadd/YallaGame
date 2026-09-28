import type { Room } from "./types.js"

/** Vampire hosts moderate the table; their stored identity only tracks the room owner. */
export function isModerator(room: Pick<Room, "gameId" | "hostPlayerId">, playerId: string): boolean {
  return room.gameId === "vampire-village" && playerId === room.hostPlayerId
}

export function playingPlayers<T extends { id: string }>(
  room: Pick<Room, "gameId" | "hostPlayerId"> & { players: T[] }
): T[] {
  return room.players.filter(p => !isModerator(room, p.id))
}
