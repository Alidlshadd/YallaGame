import type { VisibleRoom, SelfPlayer, Settings, Role, Game, ErrorCode } from "./types.js"

export type Ack<T> = (r: AckResult<T>) => void
export type AckResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorCode }

export interface CreateRoomData    { code: string; adminSecret: string; room: VisibleRoom }
export interface AdminRoomData     { room: VisibleRoom }
export interface PlayerJoinData    { room: VisibleRoom; player: SelfPlayer }
export interface RoleAssignedPayload {
  role: string
  roleData: Role
  name: string
  code: string
  game: Game
}

export interface ClientToServerEvents {
  "admin:create-room":     (p: { gameId: string },                                                   cb: Ack<CreateRoomData>) => void
  "admin:reconnect":       (p: { code: string; adminSecret: string },                               cb: Ack<AdminRoomData>)  => void
  "admin:update-settings": (p: { code: string; adminSecret: string; settings: Partial<Settings> },  cb: Ack<AdminRoomData>)  => void
  "admin:assign-roles":    (p: { code: string; adminSecret: string },                               cb: Ack<AdminRoomData>)  => void
  "admin:clear-roles":     (p: { code: string; adminSecret: string },                               cb: Ack<AdminRoomData>)  => void
  "player:join":           (p: { code: string; name: string; playerId?: string },                   cb: Ack<PlayerJoinData>) => void
}

export interface ServerToClientEvents {
  "admin:room-updated":   (room: VisibleRoom) => void
  "room:status":          (room: VisibleRoom) => void
  "player:role-assigned": (payload: RoleAssignedPayload) => void
  "player:role-cleared":  () => void
}

export type InterServerEvents = Record<string, never>
