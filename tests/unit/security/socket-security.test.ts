import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createServer, type IncomingMessage } from "node:http"
import { Server } from "socket.io"
import { io as connect, type Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents, CreateRoomData, JoinedData, PendingData } from "../../../src/shared/events.js"
import type { SocketData } from "../../../src/shared/types.js"
import { registerHandlers } from "../../../src/server/sockets/index.js"
import { MemoryStore } from "../../../src/server/store/memory-store.js"
import { resolveGame } from "../../../src/server/games/catalog.js"
import { resolveEngine } from "../../../src/server/games/engines.js"
import { config } from "../../../src/server/config.js"
import { AddressLimits, allowedSocketOrigin } from "../../../src/server/sockets/security.js"
import { playerResumeToken, validResumeToken } from "../../../src/server/domain/codes.js"
import * as codes from "../../../src/server/domain/codes.js"
import { cancelAllTimers } from "../../../src/server/domain/scheduler.js"

describe("socket security regressions", () => {
  let io: Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>
  let store: MemoryStore
  let base: string
  let clients: Socket[]
  beforeEach(async () => {
    const http = createServer()
    io = new Server(http, {
      maxHttpBufferSize: 16 * 1024,
      allowRequest: (req, done) => done(null, allowedSocketOrigin(req, "https://games.example.com"))
    })
    store = new MemoryStore()
    clients = []
    registerHandlers(io, { io, store, resolveGame, resolveEngine, config: { ...config, MAX_TOTAL_ROOMS: 2 }, rng: Math.random })
    await new Promise<void>(resolve => http.listen(0, "127.0.0.1", resolve))
    base = `http://127.0.0.1:${(http.address() as { port: number }).port}`
  })
  afterEach(async () => {
    vi.restoreAllMocks()
    cancelAllTimers()
    clients.forEach(client => client.disconnect())
    await new Promise<void>(resolve => io.close(() => resolve()))
  })
  async function client() {
    const socket = connect(base, { transports: ["websocket"], forceNew: true, reconnection: false })
    clients.push(socket)
    await new Promise<void>((resolve, reject) => { socket.once("connect", resolve); socket.once("connect_error", reject) })
    return socket
  }
  async function send(socket: Socket, event: string, data: unknown, timeout = 2000) {
    // These tests isolate authorization; cooldown behavior has separate coverage below.
    io.sockets.sockets.get(socket.id!)!.data.rateBag?.clear()
    return socket.timeout(timeout).emitWithAck(event, data)
  }
  async function room(host: Socket, approval = false, gameId = "spy-game"): Promise<CreateRoomData> {
    const result = await send(host, "admin:create-room", { gameId, hostName: "Host", hostCharacter: "ace", isPublic: true, requireApproval: approval })
    expect(result.ok).toBe(true)
    return result.data as CreateRoomData
  }
  async function join(socket: Socket, code: string, name = "Alice"): Promise<JoinedData> {
    const result = await send(socket, "player:join", { code, name })
    expect(result.ok).toBe(true)
    return result.data as JoinedData
  }

  it("deals the selected two vampires to players and keeps the host a moderator on reconnect", async () => {
    const host = await client(), created = await room(host, false, "vampire-village")
    const credentials = { code: created.code, adminSecret: created.adminSecret }
    const hostReveal = vi.fn()
    host.on("player:role-assigned", hostReveal)
    expect(created.room.players).toEqual([])
    const listing = await send(host, "rooms:list", {})
    expect(listing.data.rooms).toEqual([expect.objectContaining({ hostName: "Host", playerCount: 0, takenCharacters: [] })])
    for (let i = 0; i < 4; i++) await join(await client(), created.code, `Player ${i}`)
    const dealt = await send(host, "admin:assign-roles", { ...credentials, settings: { vampireCount: 2, doctor: true, detective: true } })
    expect(dealt.ok).toBe(true)
    expect(dealt.data.room.players).toHaveLength(4)
    expect(dealt.data.room.players.map((p: { role: string }) => p.role).sort()).toEqual(["detective", "doctor", "vampire", "vampire"])
    expect(dealt.data.room.settings.vampireCount).toBe(2)
    expect((await store.get(created.code))!.players.find(p => p.id === created.hostPlayerId)?.role).toBeNull()
    const reconnected = await send(host, "admin:reconnect", credentials)
    expect(reconnected.data.room.players).toEqual(dealt.data.room.players)
    expect(hostReveal).not.toHaveBeenCalled()
    expect(await send(host, "player:join", {
      code: created.code, name: "Host", playerId: created.hostPlayerId,
      resumeToken: playerResumeToken(created.adminSecret, created.hostPlayerId)
    })).toMatchObject({ ok: false, error: "AUTHZ_MISMATCH" })
    // Older clients can still redeal using the saved settings.
    expect((await send(host, "admin:assign-roles", credentials)).data.room.players
      .filter((p: { role: string }) => p.role === "vampire")).toHaveLength(2)
  })

  it("asks every player for feedback on explicit completion, not on an ordinary role reset", async () => {
    const host = await client(), created = await room(host, false, "vampire-village")
    const credentials = { code: created.code, adminSecret: created.adminSecret }
    const players = [await client(), await client(), await client()]
    const moderatorFinished = vi.fn()
    host.on("game:finished", moderatorFinished)
    const received = players.map(player => { const fn = vi.fn(); player.on("game:finished", fn); return fn })
    for (let i = 0; i < players.length; i++) await join(players[i]!, created.code, `Player ${i}`)
    await send(host, "admin:assign-roles", credentials)
    await send(host, "admin:clear-roles", credentials)
    expect(received.every(fn => fn.mock.calls.length === 0)).toBe(true)
    await send(host, "admin:assign-roles", credentials)
    const finished = players.map(player => new Promise(resolve => player.once("game:finished", resolve)))
    expect((await send(host, "admin:clear-roles", { ...credentials, finished: true })).ok).toBe(true)
    expect(await Promise.all(finished)).toEqual(players.map(() => ({ code: created.code, gameId: "vampire-village" })))
    expect(moderatorFinished).not.toHaveBeenCalled()
    await send(host, "admin:clear-roles", { ...credentials, finished: true })
    expect(received.every(fn => fn.mock.calls.length === 1)).toBe(true)
  })

  it("does not use the vampire moderator to satisfy minimum players or fit excess roles", async () => {
    const host = await client(), created = await room(host, false, "vampire-village")
    const credentials = { code: created.code, adminSecret: created.adminSecret }
    await join(await client(), created.code, "Ada")
    await join(await client(), created.code, "Bea")
    expect(await send(host, "admin:assign-roles", credentials)).toMatchObject({ ok: false, error: "NEED_MORE_PLAYERS" })
    await join(await client(), created.code, "Cem")
    expect(await send(host, "admin:assign-roles", { ...credentials, settings: { vampireCount: 2 } }))
      .toMatchObject({ ok: false, error: "TOO_MANY_SPECIAL_ROLES" })
    const unchanged = (await store.get(created.code))!
    expect(unchanged.assigned).toBe(false)
    expect(unchanged.settings.vampireCount).toBe(1)
    expect(unchanged.players.every(p => p.role === null)).toBe(true)
    const result = await send(host, "admin:assign-roles", { ...credentials, settings: { vampireCount: 2, detective: false } })
    expect(result.data.room.players.map((p: { role: string }) => p.role).sort()).toEqual(["doctor", "vampire", "vampire"])
  })

  it("keeps the vampire moderator outside the player list when approving joins", async () => {
    const host = await client(), created = await room(host, true, "vampire-village")
    const credentials = { code: created.code, adminSecret: created.adminSecret }
    const requests: string[] = []
    for (let i = 0; i < 4; i++) {
      const response = await send(await client(), "player:join", { code: created.code, name: `Player ${i}` })
      expect(response).toMatchObject({ ok: true, data: { status: "pending" } })
      requests.push(response.data.requestId)
    }
    expect(await send(await client(), "player:join", { code: created.code, name: "Another player" })).toMatchObject({ ok: true, data: { status: "pending" } })
    expect((await send(host, "admin:approve-join", { ...credentials, requestId: requests[0] })).ok).toBe(true)
    const admitted = await send(host, "admin:update-room", { ...credentials, requireApproval: false })
    expect(admitted.data.room.players).toHaveLength(5)
    expect(admitted.data.room.pending).toEqual([])
  })

  it("rejects public player IDs and name-only takeover, even after disconnection", async () => {
    const host = await client(), victim = await client(), attacker = await client()
    const created = await room(host)
    const seat = await join(victim, created.code)
    await store.update(created.code, r => ({ ...r, players: r.players.map(p => p.id === seat.player.id ? { ...p, role: "spy" } : p) }))
    expect(await send(attacker, "player:join", { code: created.code, name: "Mallory", playerId: seat.player.id })).toMatchObject({ ok: false, error: "AUTHZ_MISMATCH" })
    expect(await send(attacker, "player:join", { code: created.code, name: "Mallory", playerId: created.hostPlayerId })).toMatchObject({ ok: false, error: "AUTHZ_MISMATCH" })
    const left = new Promise<void>(resolve => io.sockets.sockets.get(victim.id!)!.once("disconnect", () => resolve()))
    victim.disconnect()
    await left
    await expect.poll(async () => (await store.get(created.code))!.players.find(p => p.id === seat.player.id)!.connected).toBe(false)
    expect(await send(attacker, "player:join", { code: created.code, name: "Alice" })).toMatchObject({ ok: false, error: "NAME_TAKEN" })
    const returning = await client()
    const result = await send(returning, "player:join", { code: created.code, name: "Alice", playerId: seat.player.id, resumeToken: seat.resumeToken })
    expect(result).toMatchObject({ ok: true, data: { player: { id: seat.player.id, role: "spy" } } })
    expect(JSON.stringify(result.data.room)).not.toContain(seat.resumeToken)
  })

  it("rejects another player's token and credentials for removed seats", async () => {
    const host = await client(), a = await client(), b = await client()
    const created = await room(host), alice = await join(a, created.code), bob = await join(b, created.code, "Bob")
    expect(await send(b, "player:join", { code: created.code, name: "Alice", playerId: alice.player.id, resumeToken: bob.resumeToken })).toMatchObject({ ok: false, error: "AUTHZ_MISMATCH" })
    expect((await send(host, "admin:kick-player", { code: created.code, adminSecret: created.adminSecret, playerId: alice.player.id })).ok).toBe(true)
    expect(await send(a, "player:join", { code: created.code, name: "Alice", playerId: alice.player.id, resumeToken: alice.resumeToken })).toMatchObject({ ok: false, error: "AUTHZ_MISMATCH" })
    expect(await send(a, "game:action", { code: created.code, seq: 0, action: { type: "vote" } })).toMatchObject({ ok: false, error: "AUTHZ_MISMATCH" })
  })

  it("requires the private token to resume a pending request and never projects it", async () => {
    const host = await client(), waiting = await client(), other = await client()
    const created = await room(host, true)
    const response = await send(waiting, "player:join", { code: created.code, name: "Alice" })
    const queued = response.data as PendingData
    expect(response.ok).toBe(true)
    expect(await send(other, "player:join", { code: created.code, name: "Alice", playerId: queued.requestId })).toMatchObject({ ok: false, error: "AUTHZ_MISMATCH" })
    expect(await send(other, "player:join", { code: created.code, name: "Alice", playerId: queued.requestId, resumeToken: queued.resumeToken })).toMatchObject({ ok: true, data: { status: "pending" } })
    const approval = new Promise<JoinedData>(resolve => waiting.once("player:join-approved", resolve))
    const result = await send(host, "admin:approve-join", { code: created.code, adminSecret: created.adminSecret, requestId: queued.requestId })
    expect(result.ok).toBe(true)
    expect(JSON.stringify(result.data.room)).not.toContain(queued.resumeToken)
    expect((await approval).resumeToken).toBe(queued.resumeToken)
    expect(io.sockets.sockets.get(waiting.id!)!.data.playerId).toBe(queued.requestId)
    expect(io.sockets.sockets.get(waiting.id!)!.data.pendingRequestId).toBeUndefined()
  })

  it("admits everyone in the approval queue when approval is disabled", async () => {
    const host = await client(), created = await room(host, true)
    for (let i = 0; i < 3; i++) expect((await send(await client(), "player:join", { code: created.code, name: `Player ${i}` })).ok).toBe(true)
    expect(await send(await client(), "player:join", { code: created.code, name: "Another player" })).toMatchObject({ ok: true, data: { status: "pending" } })
    expect((await send(host, "admin:update-room", { code: created.code, adminSecret: created.adminSecret, requireApproval: false })).ok).toBe(true)
    expect((await store.get(created.code))!.players).toHaveLength(5)
  })

  it.each(["vampire-village", "spy-game"])("allows direct joins beyond 500 existing players in %s", async gameId => {
    const host = await client(), created = await room(host, false, gameId)
    await store.update(created.code, r => ({
      ...r,
      players: [...r.players, ...Array.from({ length: 500 }, (_, i) => ({
        id: `existing-${i}`, name: `Existing ${i}`, role: null, connected: true, character: ""
      }))]
    }))
    const newcomer = await client()
    const result = await join(newcomer, created.code, "Newcomer")
    expect(result.room.players).toHaveLength(gameId === "vampire-village" ? 501 : 502)
    expect(result.player.name).toBe("Newcomer")
    const resumed = await send(newcomer, "player:join", {
      code: created.code, name: "Newcomer", playerId: result.player.id, resumeToken: result.resumeToken
    })
    expect(resumed).toMatchObject({ ok: true, data: { player: { id: result.player.id } } })
  })

  it("accepts and approves joins beyond 500 players and 500 pending requests", async () => {
    const host = await client(), created = await room(host, true, "vampire-village")
    const credentials = { code: created.code, adminSecret: created.adminSecret }
    // Seed a large room, then exercise the real socket join and approval paths.
    await store.update(created.code, r => ({
      ...r,
      players: [...r.players, ...Array.from({ length: 500 }, (_, i) => ({
        id: `existing-${i}`, name: `Existing ${i}`, role: null, connected: true, character: ""
      }))],
      pending: Array.from({ length: 500 }, (_, i) => ({
        id: `pending-${i}`, name: `Waiting ${i}`, requestedAt: Date.now(), character: ""
      }))
    }))
    const newcomer = await client()
    const queued = await send(newcomer, "player:join", { code: created.code, name: "Newcomer" })
    expect(queued).toMatchObject({ ok: true, data: { status: "pending" } })
    expect((await store.get(created.code))!.pending).toHaveLength(501)
    const approvedEvent = new Promise<JoinedData>(resolve => newcomer.once("player:join-approved", resolve))
    const approved = await send(host, "admin:approve-join", { ...credentials, requestId: queued.data.requestId })
    expect(approved.ok).toBe(true)
    expect(approved.data.room.players).toHaveLength(501)
    expect((await approvedEvent).player.name).toBe("Newcomer")
    const admitted = await send(host, "admin:update-room", { ...credentials, requireApproval: false }, 5000)
    expect(admitted.ok).toBe(true)
    expect(admitted.data.room.players).toHaveLength(1001)
    expect(admitted.data.room.pending).toEqual([])
  }, 10000)

  it("drops old admin and private player subscriptions when switching rooms", async () => {
    const host = await client(), other = await client()
    const a = await room(host), b = await room(other)
    await join(host, b.code, "Visitor")
    const peer = io.sockets.sockets.get(host.id!)!
    expect(peer.rooms.has(`admin:${a.code}`)).toBe(false)
    expect(peer.rooms.has(`p:${a.code}:${a.hostPlayerId}`)).toBe(false)
    expect(peer.data.adminSecret).toBeUndefined()
    expect((await store.get(a.code))!.players[0]!.connected).toBe(false)
  })

  it("revokes every channel and identity when closing a room", async () => {
    const host = await client(), player = await client()
    const created = await room(host)
    await join(player, created.code)
    expect((await send(host, "admin:close-room", { code: created.code, adminSecret: created.adminSecret })).ok).toBe(true)
    for (const socket of [host, player]) {
      const peer = io.sockets.sockets.get(socket.id!)!
      expect([...peer.rooms]).toEqual([socket.id])
      expect(peer.data.roomCode).toBeUndefined()
    }
  })

  it("keeps a seat online while a second authenticated connection is still present", async () => {
    const host = await client(), first = await client(), second = await client()
    const created = await room(host), seat = await join(first, created.code)
    expect((await send(second, "player:join", { code: created.code, name: "Alice", playerId: seat.player.id, resumeToken: seat.resumeToken })).ok).toBe(true)
    const left = new Promise<void>(resolve => io.sockets.sockets.get(first.id!)!.once("disconnect", () => resolve()))
    first.disconnect()
    await left
    expect((await store.get(created.code))!.players.find(p => p.id === seat.player.id)!.connected).toBe(true)
  })

  it("revokes expired room subscriptions before a room code is reused", async () => {
    vi.spyOn(codes, "makeRoomCode").mockReturnValue("ABCDE")
    const oldHost = await client(), oldPlayer = await client(), newHost = await client()
    const old = await room(oldHost)
    await join(oldPlayer, old.code)
    await store.deleteOlderThan(Date.now() + 1)
    const fresh = await room(newHost)
    expect(fresh.code).toBe(old.code)
    expect(fresh.adminSecret).not.toBe(old.adminSecret)
    for (const socket of [oldHost, oldPlayer]) expect([...io.sockets.sockets.get(socket.id!)!.rooms]).toEqual([socket.id])
  })

  it("cannot exceed the room cap through concurrent creation requests", async () => {
    const hosts = await Promise.all([client(), client(), client()])
    const results = await Promise.all(hosts.map(host => send(host, "admin:create-room", {
      gameId: "spy-game", hostName: "Host", hostCharacter: "ace", isPublic: false, requireApproval: false
    })))
    expect(results.filter(result => result.ok)).toHaveLength(2)
    expect(results.filter(result => !result.ok)).toEqual([{ ok: false, error: "SERVER_BUSY" }])
    expect(await store.countActiveRooms()).toBe(2)
  })

  it.each(["polling", "websocket"])("denies hostile origins over %s", async transport => {
    const socket = connect(base, { transports: [transport], reconnection: false, extraHeaders: { origin: "https://evil.example" } })
    clients.push(socket)
    await expect(new Promise<void>((resolve, reject) => { socket.once("connect", resolve); socket.once("connect_error", reject) })).rejects.toThrow()
  })
  it("accepts the exact allowed browser origin", async () => {
    const socket = connect(base, { transports: ["websocket"], reconnection: false, extraHeaders: { origin: "https://games.example.com" } })
    clients.push(socket)
    await new Promise<void>((resolve, reject) => { socket.once("connect", resolve); socket.once("connect_error", reject) })
    expect(socket.connected).toBe(true)
  })
  it("disconnects oversized packets before handlers can create rooms", async () => {
    const socket = await client()
    const disconnected = new Promise<void>(resolve => socket.once("disconnect", () => resolve()))
    socket.emit("admin:create-room", { junk: "x".repeat(20_000) }, () => {})
    await disconnected
    expect(await store.countActiveRooms()).toBe(0)
  })
})

describe("security primitives", () => {
  it("binds resume tokens to both the room secret and player", () => {
    const token = playerResumeToken("secret-a", "alice")
    expect(validResumeToken("secret-a", "alice", token)).toBe(true)
    expect(validResumeToken("secret-b", "alice", token)).toBe(false)
    expect(validResumeToken("secret-a", "bob", token)).toBe(false)
    expect(validResumeToken("secret-a", "alice", "invalid")).toBe(false)
  })
  it("shares rate limits across calls, expires windows and bounds memory", () => {
    const limits = new AddressLimits(2)
    expect(limits.consume("ip-a", 2, 100, 1)).toBe(true)
    expect(limits.consume("ip-a", 2, 100, 2)).toBe(true)
    expect(limits.consume("ip-a", 2, 100, 3)).toBe(false)
    expect(limits.consume("ip-b", 2, 100, 3)).toBe(true)
    expect(limits.consume("ip-c", 2, 100, 4)).toBe(false)
    expect(limits.consume("ip-c", 2, 100, 104)).toBe(true)
  })
  it("rejects deceptive, null and cross-site origins", () => {
    const request = (origin?: string, site?: string) => ({ headers: { host: "localhost:3000", origin, "sec-fetch-site": site } }) as IncomingMessage
    expect(allowedSocketOrigin(request("http://localhost:3000"))).toBe(true)
    for (const origin of ["null", "https://evil.test", "http://localhost:3000.evil.test", "http://localhost:3000/path"]) expect(allowedSocketOrigin(request(origin))).toBe(false)
    expect(allowedSocketOrigin(request(undefined, "cross-site"))).toBe(false)
  })
})
