const STORAGE_KEY = "role-room:session"

export type Session =
  | { kind: "admin";  code: string; adminSecret: string }
  | { kind: "player"; code: string; playerId: string; name: string }

export function load(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.kind === "admin"  && parsed.code && parsed.adminSecret) return parsed
    if (parsed?.kind === "player" && parsed.code && parsed.playerId && parsed.name) return parsed
    return null
  } catch { return null }
}

export function save(s: Session): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }
export function clear(): void { localStorage.removeItem(STORAGE_KEY) }
