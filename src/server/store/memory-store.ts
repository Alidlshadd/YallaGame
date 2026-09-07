import type { Room } from "@shared/types.js"
import { RoomNotFoundError, type RoomStore } from "./store.js"

export class MemoryStore implements RoomStore {
  private readonly rooms = new Map<string, Room>()
  private readonly chains = new Map<string, Promise<unknown>>()

  async create(room: Room): Promise<void> {
    if (this.rooms.has(room.code)) throw new Error("ROOM_EXISTS")
    this.rooms.set(room.code, structuredClone(room))
  }

  async get(code: string): Promise<Room | null> {
    const r = this.rooms.get(code)
    return r ? structuredClone(r) : null
  }

  async update(code: string, updater: (room: Room) => Room): Promise<Room> {
    const prev = this.chains.get(code) ?? Promise.resolve()
    const next = prev.then(() => {
      const current = this.rooms.get(code)
      if (!current) throw new RoomNotFoundError(code)
      const updated = updater(structuredClone(current))
      updated.updatedAt = Date.now()
      this.rooms.set(code, structuredClone(updated))
      return updated
    }).finally(() => {
      if (this.chains.get(code) === next) this.chains.delete(code)
    })
    this.chains.set(code, next)
    return next as Promise<Room>
  }

  async delete(code: string): Promise<void> {
    this.rooms.delete(code)
  }

  async deleteOlderThan(cutoffMs: number): Promise<number> {
    let n = 0
    for (const [code, room] of this.rooms) {
      if (room.createdAt < cutoffMs) { this.rooms.delete(code); n++ }
    }
    return n
  }

  async countActiveRooms(): Promise<number> {
    return this.rooms.size
  }

  async listPublic(limit: number): Promise<Room[]> {
    return [...this.rooms.values()]
      .filter(r => r.isPublic)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map(r => structuredClone(r))
  }

  async close(): Promise<void> { /* nothing to close */ }
}
