import type { Room } from "@shared/types.js"

export interface RoomStore {
  create(room: Room): Promise<void>
  get(code: string): Promise<Room | null>
  update(code: string, updater: (room: Room) => Room): Promise<Room>
  delete(code: string): Promise<void>
  deleteOlderThan(cutoffMs: number): Promise<number>
  countActiveRooms(): Promise<number>
  close(): Promise<void>
}

export class RoomNotFoundError extends Error {
  constructor(public readonly code: string) { super(`ROOM_NOT_FOUND: ${code}`) }
}
