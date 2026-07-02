const COOLDOWNS_MS: Record<string, number> = {
  "admin:create-room":     2000,
  "player:join":           500,
  "admin:update-settings": 200,
  "admin:assign-roles":    200,
  "admin:clear-roles":     200,
  "admin:kick-player":     200,
  "admin:reconnect":       200
}

type Bag = Map<string, number>

export function checkRateLimit(socket: { data: { rateBag?: Bag } }, event: string): boolean {
  if (!socket.data.rateBag) socket.data.rateBag = new Map()
  const now = Date.now()
  const cooldown = COOLDOWNS_MS[event] ?? 100
  const last = socket.data.rateBag.get(event) ?? 0
  if (now - last < cooldown) return false
  socket.data.rateBag.set(event, now)
  return true
}
