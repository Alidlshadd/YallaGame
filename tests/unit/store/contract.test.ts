import { describe, it, expect, beforeEach, afterEach } from "vitest"
import type { RoomStore } from "@server/store/store.js"
import type { Room } from "@shared/types.js"
import { MemoryStore } from "@server/store/memory-store.js"
import { SqliteStore } from "@server/store/sqlite-store.js"

function mkRoom(code: string, createdAt = Date.now()): Room {
  return {
    code, gameId: "g", adminSecret: "a", assigned: false,
    settings: {}, players: [], createdAt, updatedAt: createdAt,
    hostPlayerId: "h", isPublic: false, requireApproval: false, pending: []
  }
}

const factories: Array<{ name: string; make: () => RoomStore }> = [
  { name: "MemoryStore",  make: () => new MemoryStore() },
  { name: "SqliteStore",  make: () => new SqliteStore(":memory:") }
]

for (const { name, make } of factories) {
  describe(`RoomStore contract: ${name}`, () => {
    let store: RoomStore
    beforeEach(() => { store = make() })
    afterEach(async () => { await store.close() })

    it("create then get round-trips", async () => {
      const r = mkRoom("AAAAA")
      await store.create(r)
      const got = await store.get("AAAAA")
      expect(got?.code).toBe("AAAAA")
    })

    it("get returns null for missing code", async () => {
      expect(await store.get("ZZZZZ")).toBeNull()
    })

    it("update applies the updater function and persists", async () => {
      await store.create(mkRoom("BBBBB"))
      const result = await store.update("BBBBB", r => ({ ...r, assigned: true }))
      expect(result.assigned).toBe(true)
      expect((await store.get("BBBBB"))?.assigned).toBe(true)
    })

    it("update updatesAt timestamp on success", async () => {
      await store.create(mkRoom("CCCCC", 1))
      const result = await store.update("CCCCC", r => r)
      expect(result.updatedAt).toBeGreaterThan(1)
    })

    it("update throws when room is missing", async () => {
      await expect(store.update("MISSY", r => r)).rejects.toThrow(/ROOM_NOT_FOUND/)
    })

    it("concurrent updates on the same code serialize without losing writes", async () => {
      await store.create(mkRoom("DDDDD"))
      const inc = (n: number) => store.update("DDDDD", r => ({ ...r, settings: { ...r.settings, c: (Number(r.settings.c) || 0) + n } }))
      await Promise.all([inc(1), inc(1), inc(1), inc(1), inc(1)])
      const final = await store.get("DDDDD")
      expect(final?.settings.c).toBe(5)
    })

    it("delete removes the room", async () => {
      await store.create(mkRoom("EEEEE"))
      await store.delete("EEEEE")
      expect(await store.get("EEEEE")).toBeNull()
    })

    it("deleteOlderThan respects cutoff", async () => {
      await store.create(mkRoom("OLD11", 100))
      await store.create(mkRoom("OLD22", 200))
      await store.create(mkRoom("NEW33", 5000))
      const removed = await store.deleteOlderThan(500)
      expect(removed).toBe(2)
      expect(await store.get("OLD11")).toBeNull()
      expect(await store.get("OLD22")).toBeNull()
      expect(await store.get("NEW33")).not.toBeNull()
    })

    it("listPublic returns only public rooms, newest first", async () => {
      await store.create({ ...mkRoom("PUB11", 100), isPublic: true })
      await store.create({ ...mkRoom("PRIV1", 200), isPublic: false })
      await store.create({ ...mkRoom("PUB22", 300), isPublic: true })
      const listed = await store.listPublic(10)
      expect(listed.map(r => r.code)).toEqual(["PUB22", "PUB11"])
    })

    it("listPublic honours the limit", async () => {
      await store.create({ ...mkRoom("PUB33", 100), isPublic: true })
      await store.create({ ...mkRoom("PUB44", 200), isPublic: true })
      expect((await store.listPublic(1)).map(r => r.code)).toEqual(["PUB44"])
    })

    it("listPublic round-trips the approval flag and the pending queue", async () => {
      await store.create({
        ...mkRoom("PUB55", 100),
        isPublic: true, requireApproval: true,
        pending: [{ id: "req1", name: "Ada", requestedAt: 42, character: "owl" }]
      })
      const listed = await store.listPublic(10)
      expect(listed).toHaveLength(1)
      expect(listed[0]?.requireApproval).toBe(true)
      expect(listed[0]?.pending).toEqual([{ id: "req1", name: "Ada", requestedAt: 42, character: "owl" }])
    })

    it("persists both seated and queued avatar accessories", async () => {
      await store.create({
        ...mkRoom("STYLE", 100),
        players: [{ id: "host", name: "Host", role: null, connected: true, character: "ace", accessory: "crown" }],
        pending: [{ id: "req", name: "Ada", requestedAt: 101, character: "wisp", accessory: "heart-glasses" }]
      })
      const saved = await store.get("STYLE")
      expect(saved?.players[0]).toMatchObject({ character: "ace", accessory: "crown" })
      expect(saved?.pending[0]).toMatchObject({ character: "wisp", accessory: "heart-glasses" })
      await store.update("STYLE", room => ({ ...room, players: room.players.map(p => ({ ...p, accessory: "" })) }))
      expect((await store.get("STYLE"))?.players[0]?.accessory).toBe("")
    })

    it("countActiveRooms reflects create/delete", async () => {
      expect(await store.countActiveRooms()).toBe(0)
      await store.create(mkRoom("F1111"))
      await store.create(mkRoom("F2222"))
      expect(await store.countActiveRooms()).toBe(2)
      await store.delete("F1111")
      expect(await store.countActiveRooms()).toBe(1)
    })
  })
}
