import { describe, it, expect } from "vitest"
import { buildRolePool, assignRolesToPlayers } from "@server/domain/roles.js"
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
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, role: null, connected: true }))
}

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
})

describe("assignRolesToPlayers", () => {
  it("returns a new array with each player given a role from the pool", () => {
    const players = mkPlayers(4)
    const pool = ["vampire", "villager", "villager", "villager"]
    const out = assignRolesToPlayers(players, pool, () => 0.5)
    expect(out).toHaveLength(4)
    const counts = out.reduce<Record<string, number>>((acc, p) => { acc[p.role!] = (acc[p.role!] ?? 0) + 1; return acc }, {})
    expect(counts).toEqual({ vampire: 1, villager: 3 })
  })

  it("does not mutate input players", () => {
    const players = mkPlayers(3)
    const snapshot = JSON.stringify(players)
    assignRolesToPlayers(players, ["villager", "villager", "villager"], () => 0)
    expect(JSON.stringify(players)).toBe(snapshot)
  })

  it("is deterministic given a seeded rng", () => {
    const players = mkPlayers(5)
    const pool = ["vampire", "villager", "villager", "villager", "villager"]
    let seed = 1
    const rng = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
    const a = assignRolesToPlayers(players, pool, rng).map(p => p.role)
    seed = 1
    const b = assignRolesToPlayers(players, pool, rng).map(p => p.role)
    expect(a).toEqual(b)
  })

  it("throws when pool length and players length disagree", () => {
    expect(() => assignRolesToPlayers(mkPlayers(3), ["villager"], () => 0)).toThrow(/POOL_LENGTH_MISMATCH/)
  })
})
