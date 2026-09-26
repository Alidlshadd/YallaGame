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
    registerHandlers(io, { io, store, resolveGame, resolveEngine, config: { ...config, MAX_PLAYERS_PER_ROOM: 4, MAX_TOTAL_ROOMS: 2 }, rng: Math.random })
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
  async function send(socket: Socket, event: string, data: unknown) {
    // These tests isolate authorization; cooldown behavior has separate coverage below.
    io.sockets.sockets.get(socket.id!)!.data.rateBag?.clear()
    return socket.timeout(2000).emitWithAck(event, data)
  }
  async function room(host: Socket, approval = false): Promise<CreateRoomData> {
    const result = await send(host, "admin:create-room", { gameId: "spy-game", hostName: "Host", hostCharacter: "ace", isPublic: true, requireApproval: approval })
    expect(result.ok).toBe(true)
    return result.data as CreateRoomData
  }
  async function join(socket: Socket, code: string, name = "Alice"): Promise<JoinedData> {
    const result = await send(socket, "player:join", { code, name })
    expect(result.ok).toBe(true)
    return result.data as JoinedData
  }

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

  it("bounds the approval queue and safely admits its reserved seats", async () => {
    const host = await client(), created = await room(host, true)
    for (let i = 0; i < 3; i++) expect((await send(await client(), "player:join", { code: created.code, name: `Player ${i}` })).ok).toBe(true)
    expect(await send(await client(), "player:join", { code: created.code, name: "Overflow" })).toMatchObject({ ok: false, error: "ROOM_FULL" })
    expect((await send(host, "admin:update-room", { code: created.code, adminSecret: created.adminSecret, requireApproval: false })).ok).toBe(true)
    expect((await store.get(created.code))!.players).toHaveLength(4)
  })

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
