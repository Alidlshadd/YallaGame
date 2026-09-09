const COOLDOWNS_MS: Record<string, number> = {
  "admin:create-room":     2000,
  "player:join":           500,
  "admin:update-settings": 200,
  "admin:assign-roles":    200,
  "admin:clear-roles":     200,
  "admin:kick-player":     200,
  "admin:reconnect":       200,
  // The lobby polls every 15s; this only has to stop the Refresh button being
  // hammered, and a person who taps it twice in a second means it.
  "rooms:list":            500,
  "rooms:peek":            500,
  "admin:approve-join":    150,
  "admin:reject-join":     150,
  "admin:update-room":     300,
  "admin:close-room":      500,
  "player:cancel-request": 300,
  "game:start":            1000,
  // Changing a vote is a normal thing to do on a phone, and the phase's own
  // clock is the real limit here — this only stops a stuck finger.
  "game:action":           150,
  "game:advance":          300,
  "game:end":              500,
  // Three probes back to back is how the clock offset is measured.
  "time:sync":             40
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
