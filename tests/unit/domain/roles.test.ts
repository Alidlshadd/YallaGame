import { describe, it, expect } from "vitest"
import { buildRolePool, assignRolesToConnected, fillerRoleId } from "@server/domain/roles.js"
import type { Game, Player } from "@shared/types.js"

const game: Game = {
  id: "g", icon: "x", theme: "x", minPlayers: 3,
  defaultSettings: { vampires: 1 },
  title: { ku: "", ar: "", en: "", tr: "" },
  subtitle: { ku: "", ar: "", en: "", tr: "" },
  rules: { ku: [], ar: [], en: [], tr: [] },
  settings: [{ type: "number", key: "vampires", min: 1, max: 3, label: { ku: "", ar: "", en: "", tr: "" } }],
  roles: [
    { id: "vampire", icon: "v", countSetting: "vampires", name: { ku: "", ar: "", en: "", tr: "" }, desc: { ku: "", ar: "", en: "", tr: "" } },
    { id: "villager", icon: "u", filler: true,            name: { ku: "", ar: "", en: "", tr: "" }, desc: { ku: "", ar: "", en: "", tr: "" } }
  ]
}

function mkPlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, role: null, connected: true, character: "" }))
}

const player = (id: string, connected: boolean): Player =>
  ({ id, name: id, role: null, connected, character: "" })

describe("fillerRoleId", () => {
  it("returns the filler role id", () => {
    expect(fillerRoleId(game)).toBe("villager")
  })

  it("throws NO_FILLER_ROLE when the game has no filler", () => {
    const broken = { ...game, roles: game.roles.filter(r => !r.filler) }
    expect(() => fillerRoleId(broken)).toThrow(/NO_FILLER_ROLE/)
  })
})

describe("buildRolePool", () => {
  it("adds countSetting roles N times and fills the rest with the filler", () => {
    const pool = buildRolePool(game, { vampires: 2 }, 6)
    expect(pool.filter(r => r === "vampire")).toHaveLength(2)
    expect(pool.filter(r => r === "villager")).toHaveLength(4)
    expect(pool).toHaveLength(6)
  })

  it("throws NO_FILLER_ROLE when no filler is defined", () => {
    const noFiller: Game = { ...game, roles: game.roles.filter(r => !r.filler) }
    expect(() => buildRolePool(noFiller, { vampires: 1 }, 5)).toThrow(/NO_FILLER_ROLE/)
  })

  it("throws TOO_MANY_SPECIAL_ROLES when count exceeds player count", () => {
    expect(() => buildRolePool(game, { vampires: 3 }, 2)).toThrow(/TOO_MANY_SPECIAL_ROLES/)
  })

  it("cycles through all filler roles when a game has several (who-am-i categories)", () => {
    const multiFiller: Game = {
      ...game,
      defaultSettings: {},
      settings: [],
      roles: [
        { id: "animal", icon: "a", filler: true, name: game.roles[0]!.name, desc: game.roles[0]!.desc },
        { id: "job",    icon: "j", filler: true, name: game.roles[0]!.name, desc: game.roles[0]!.desc },
        { id: "object", icon: "o", filler: true, name: game.roles[0]!.name, desc: game.roles[0]!.desc }
      ]
    }
    const pool = buildRolePool(multiFiller, {}, 7)
    expect(pool).toHaveLength(7)
    // every filler category appears; not everyone gets the same one
    expect(new Set(pool)).toEqual(new Set(["animal", "job", "object"]))
    expect(pool.filter(r => r === "animal").length).toBeLessThan(7)
  })
})

describe("assignRolesToConnected", () => {
  it("returns a new array with each connected player given a role from the pool", () => {
    const players = mkPlayers(4)
    const pool = ["vampire", "villager", "villager", "villager"]
    const out = assignRolesToConnected(players, pool, () => 0.5)
    expect(out).toHaveLength(4)
    const counts = out.reduce<Record<string, number>>((acc, p) => { acc[p.role!] = (acc[p.role!] ?? 0) + 1; return acc }, {})
    expect(counts).toEqual({ vampire: 1, villager: 3 })
  })

  it("gives every pool role to a connected player and null to disconnected ones", () => {
    const players = [player("a", true), player("b", false), player("c", true), player("d", true)]
    const pool = buildRolePool(game, { vampires: 1 }, 3)
    const out = assignRolesToConnected(players, pool, () => 0.42)

    expect(out.find(p => p.id === "b")!.role).toBeNull()
    const connectedRoles = out.filter(p => p.connected).map(p => p.role)
    expect(connectedRoles).toHaveLength(3)
    expect(connectedRoles.filter(r => r === "vampire")).toHaveLength(1)
    expect(connectedRoles.filter(r => r === "villager")).toHaveLength(2)
  })

  it("never places a special role on a disconnected player (many seeds)", () => {
    const players = [player("a", true), player("ghost", false), player("c", true), player("ghost2", false)]
    for (let seed = 0; seed < 50; seed++) {
      let s = seed
      const seededRng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
      const pool = buildRolePool(game, { vampires: 1 }, 2)
      const out = assignRolesToConnected(players, pool, seededRng)
      for (const p of out) {
        if (!p.connected) expect(p.role).toBeNull()
      }
      expect(out.filter(p => p.role === "vampire")).toHaveLength(1)
    }
  })

  it("does not mutate input players", () => {
    const players = mkPlayers(3)
    const snapshot = JSON.stringify(players)
    assignRolesToConnected(players, ["villager", "villager", "villager"], () => 0)
    expect(JSON.stringify(players)).toBe(snapshot)
  })

  it("is deterministic given a seeded rng", () => {
    const players = mkPlayers(5)
    const pool = ["vampire", "villager", "villager", "villager", "villager"]
    let seed = 1
    const rng = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
    const a = assignRolesToConnected(players, pool, rng).map(p => p.role)
    seed = 1
    const b = assignRolesToConnected(players, pool, rng).map(p => p.role)
    expect(a).toEqual(b)
  })

  it("preserves player order", () => {
    const players = [player("a", true), player("b", true), player("c", true)]
    const out = assignRolesToConnected(players, ["vampire", "villager", "villager"], () => 0.42)
    expect(out.map(p => p.id)).toEqual(["a", "b", "c"])
  })

  it("throws POOL_LENGTH_MISMATCH when pool size differs from connected count", () => {
    const players = [player("a", true), player("b", false)]
    expect(() => assignRolesToConnected(players, ["vampire", "villager"], () => 0)).toThrow(/POOL_LENGTH_MISMATCH/)
  })
})
