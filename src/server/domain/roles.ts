import type { Game, Player, RoleId, Settings } from "@shared/types.js"

export function fillerRoleId(game: Game): RoleId {
  const filler = game.roles.find(r => r.filler)
  if (!filler) throw new Error("NO_FILLER_ROLE")
  return filler.id
}

export function buildRolePool(game: Game, settings: Settings, playerCount: number): RoleId[] {
  const fillers = game.roles.filter(r => r.filler)
  if (fillers.length === 0) throw new Error("NO_FILLER_ROLE")

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
  // Cycle through fillers so games with several filler roles (who-am-i
  // categories) spread them across players instead of repeating the first.
  let next = 0
  while (pool.length < playerCount) pool.push(fillers[next++ % fillers.length]!.id)
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

/** Distributes the pool over connected players only; disconnected players end with role: null. */
export function assignRolesToConnected(
  players: readonly Player[],
  pool: readonly RoleId[],
  rng: () => number
): Player[] {
  const connectedCount = players.filter(p => p.connected).length
  if (pool.length !== connectedCount) throw new Error("POOL_LENGTH_MISMATCH")
  const shuffled = shuffle(pool, rng)
  let next = 0
  return players.map(p =>
    p.connected ? { ...p, role: shuffled[next++]! } : { ...p, role: null }
  )
}
