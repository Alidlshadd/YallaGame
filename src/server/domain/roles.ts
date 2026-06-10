import type { Game, Player, RoleId, Settings } from "@shared/types.js"

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

export function assignRolesToPlayers(
  players: readonly Player[],
  pool: readonly RoleId[],
  rng: () => number
): Player[] {
  if (pool.length !== players.length) throw new Error("POOL_LENGTH_MISMATCH")
  const shuffled = shuffle(pool, rng)
  return players.map((p, i) => ({ ...p, role: shuffled[i]! }))
}
