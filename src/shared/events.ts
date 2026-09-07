import type { VisibleRoom, SelfPlayer, Settings, Role, Game, ErrorCode, RoomSummary } from "./types.js"

export type Ack<T> = (r: AckResult<T>) => void
export type AckResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorCode }

export interface CreateRoomData    { code: string; adminSecret: string; room: VisibleRoom; hostPlayerId: string }
export interface AdminRoomData     { room: VisibleRoom }
export interface RoomListData      { rooms: RoomSummary[] }

/** A seat in the room, handed out immediately or after the host accepts. */
export interface JoinedData        { status: "joined"; room: VisibleRoom; player: SelfPlayer }
/** The host has approval turned on: hold this id and wait for the decision. */
export interface PendingData       { status: "pending"; requestId: string; code: string; theme: string }
export type PlayerJoinData = JoinedData | PendingData

export interface RoleAssignedPayload {
  role: string
  roleData: Role
  name: string
  code: string
  game: Game
}

export interface ClientToServerEvents {
  "admin:create-room":     (p: { gameId: string; hostName: string; hostCharacter: string; isPublic: boolean; requireApproval: boolean }, cb: Ack<CreateRoomData>) => void
  "admin:reconnect":       (p: { code: string; adminSecret: string },                               cb: Ack<AdminRoomData>)  => void
  "admin:update-settings": (p: { code: string; adminSecret: string; settings: Partial<Settings> },  cb: Ack<AdminRoomData>)  => void
  "admin:update-room":     (p: { code: string; adminSecret: string; isPublic?: boolean; requireApproval?: boolean }, cb: Ack<AdminRoomData>) => void
  "admin:assign-roles":    (p: { code: string; adminSecret: string },                               cb: Ack<AdminRoomData>)  => void
  "admin:clear-roles":     (p: { code: string; adminSecret: string },                               cb: Ack<AdminRoomData>)  => void
  "admin:kick-player":     (p: { code: string; adminSecret: string; playerId: string },             cb: Ack<AdminRoomData>)  => void
  "admin:approve-join":    (p: { code: string; adminSecret: string; requestId: string },            cb: Ack<AdminRoomData>)  => void
  "admin:reject-join":     (p: { code: string; adminSecret: string; requestId: string },            cb: Ack<AdminRoomData>)  => void
  "admin:close-room":      (p: { code: string; adminSecret: string },                               cb: Ack<{ closed: true }>) => void
  "player:join":           (p: { code: string; name: string; character?: string; playerId?: string }, cb: Ack<PlayerJoinData>) => void
  "player:cancel-request": (p: { code: string; requestId: string },                                 cb: Ack<{ cancelled: true }>) => void
  "rooms:list":            (p: Record<string, never>,                                               cb: Ack<RoomListData>)   => void
  /** One room by code, for the join screen reached with a code rather than a list row. */
  "rooms:peek":            (p: { code: string },                                                    cb: Ack<{ room: RoomSummary }>) => void
}

export interface ServerToClientEvents {
  "admin:room-updated":   (room: VisibleRoom) => void
  "room:status":          (room: VisibleRoom) => void
  "player:role-assigned": (payload: RoleAssignedPayload) => void
  "player:role-cleared":  () => void
  "player:kicked":        () => void
  "player:join-approved": (data: JoinedData) => void
  "player:join-rejected": () => void
  "room:closed":          () => void
}

export type InterServerEvents = Record<string, never>
