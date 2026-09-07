import { describe, it, expect } from "vitest"
import { projectRoomFor, summarizeRoom } from "@server/domain/visibility.js"
import type { Room, Game, Viewer } from "@shared/types.js"

const game: Game = {
  id: "g", icon: "x", theme: "x", minPlayers: 3,
  defaultSettings: {},
  title: { ku: "", ar: "", en: "", tr: "" },
  subtitle: { ku: "", ar: "", en: "", tr: "" },
  rules: { ku: [], ar: [], en: [], tr: [] },
  settings: [],
  roles: [
    { id: "vampire",  icon: "v", name: { ku: "", ar: "", en: "", tr: "" }, desc: { ku: "", ar: "", en: "", tr: "" } },
    { id: "villager", icon: "u", filler: true, name: { ku: "", ar: "", en: "", tr: "" }, desc: { ku: "", ar: "", en: "", tr: "" } }
  ]
}

const room: Room = {
  code: "ABCDE", gameId: "g", adminSecret: "admin-secret",
  assigned: true, settings: {},
  players: [
    { id: "p1", name: "A", role: "vampire",  connected: true,  character: "owl" },
    { id: "p2", name: "B", role: "villager", connected: true,  character: "fox" },
    { id: "p3", name: "C", role: "villager", connected: false, character: "wolf" }
  ],
  createdAt: 0, updatedAt: 0,
  hostPlayerId: "p1", isPublic: true, requireApproval: true,
  pending: [{ id: "req1", name: "D", requestedAt: 0, character: "raven" }]
}

const games = new Map([[game.id, game]])
const resolveGame = (id: string) => games.get(id)!

describe("projectRoomFor", () => {
  it("admin viewer sees every player's role", () => {
    const v: Viewer = { kind: "admin", adminSecret: "admin-secret" }
    const out = projectRoomFor(room, v, resolveGame)
    expect(out.players.map(p => p.role)).toEqual(["vampire", "villager", "villager"])
  })

  it("player viewer sees only their own role; others null", () => {
    const v: Viewer = { kind: "player", playerId: "p2" }
    const out = projectRoomFor(room, v, resolveGame)
    const byId = Object.fromEntries(out.players.map(p => [p.id, p.role]))
    expect(byId).toEqual({ p1: null, p2: "villager", p3: null })
  })

  it("admin viewer sees the pending join queue", () => {
    const out = projectRoomFor(room, { kind: "admin", adminSecret: "admin-secret" }, resolveGame)
    expect(out.pending.map(r => r.name)).toEqual(["D"])
  })

  it("player viewer never sees who else is waiting to be let in", () => {
    const out = projectRoomFor(room, { kind: "player", playerId: "p2" }, resolveGame)
    expect(out.pending).toEqual([])
  })

  it("throws AUTHZ_MISMATCH on bad adminSecret", () => {
    expect(() => projectRoomFor(room, { kind: "admin", adminSecret: "wrong" }, resolveGame)).toThrow(/AUTHZ_MISMATCH/)
  })

  it("throws AUTHZ_MISMATCH when playerId is not in the room", () => {
    expect(() => projectRoomFor(room, { kind: "player", playerId: "nobody" }, resolveGame)).toThrow(/AUTHZ_MISMATCH/)
  })

  it("does not mutate the input room", () => {
    const snapshot = JSON.stringify(room)
    projectRoomFor(room, { kind: "admin", adminSecret: "admin-secret" }, resolveGame)
    expect(JSON.stringify(room)).toBe(snapshot)
  })

  it("throws UNKNOWN_GAME when resolveGame returns null/undefined", () => {
    const v: Viewer = { kind: "admin", adminSecret: "admin-secret" }
    expect(() => projectRoomFor(room, v, () => undefined as unknown as Game)).toThrow(/UNKNOWN_GAME/)
  })
})

describe("summarizeRoom", () => {
  it("names the host and counts only connected players", () => {
    const out = summarizeRoom(room, resolveGame)
    expect(out?.hostName).toBe("A")
    // p3 is disconnected, so the browser must not advertise them as present.
    expect(out?.playerCount).toBe(2)
  })

  it("leaks no secret: no admin secret, no roles, no player names", () => {
    const out = summarizeRoom(room, resolveGame)
    const serialized = JSON.stringify(out)
    expect(serialized).not.toContain("admin-secret")
    expect(serialized).not.toContain("vampire")
    expect(serialized).not.toContain("\"B\"")
  })

  it("returns null for a room whose game is gone", () => {
    expect(summarizeRoom(room, () => undefined)).toBeNull()
  })

  it("lists every character already spoken for, seated or queued", () => {
    const out = summarizeRoom(room, resolveGame)
    // p3 is disconnected but still holds their seat, so their face is not free;
    // the queued request's pick is reserved for the same reason.
    expect(out?.takenCharacters.sort()).toEqual(["fox", "owl", "raven", "wolf"])
  })

  it("counts a seat with no character as taking nothing", () => {
    const legacy = { ...room, players: room.players.map(p => ({ ...p, character: "" })), pending: [] }
    expect(summarizeRoom(legacy, resolveGame)?.takenCharacters).toEqual([])
  })
})
