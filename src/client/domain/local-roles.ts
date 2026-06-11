import type { Game, RoleId, Settings } from "@shared/types.js"

export function buildRolePool(game: Game, settings: Settings, playerCount: number): RoleId[] {
  const filler = game.roles.find(r => r.filler)
  if (!filler) throw new Error("NO_FILLER_ROLE")

  const pool: RoleId[] = []
  for (const role of game.roles) {
    if (role.filler) continue
    if (role.countSetting) {
      const count = Number(settings[role.countSetting] ?? 0)
      for (let i = 0; i < count; i++) pool.push(role.id)
    }
    if (role.enabledSetting && settings[role.enabledSetting]) pool.push(role.id)
  }

  if (pool.length > playerCount) throw new Error("TOO_MANY_SPECIAL_ROLES")
  while (pool.length < playerCount) pool.push(filler.id)
  return pool
}

function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export interface LocalAssignment {
  name: string
  roleId: RoleId
}

export function assignRolesLocally(
  playerNames: readonly string[],
  pool: readonly RoleId[],
  rng: () => number = Math.random
): LocalAssignment[] {
  if (pool.length !== playerNames.length) throw new Error("POOL_LENGTH_MISMATCH")
  const shuffled = shuffle(pool, rng)
  return playerNames.map((name, i) => ({ name, roleId: shuffled[i]! }))
}
