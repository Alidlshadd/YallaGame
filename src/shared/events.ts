import type { VisibleRoom, SelfPlayer, Settings, Role, Game, ErrorCode, RoomSummary, Phase, Scores } from "./types.js"

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

/**
 * The whole of a turn-based game's UI state, rebuilt from scratch on every
 * phase change. `view` is projected per player, so what reaches a phone is
 * only what that person is allowed to know.
 */
export interface PhaseEvent {
  phase: Phase
  seq: number
  round: number
  /** Absolute epoch ms; the phone draws the countdown, it never acts on it. */
  endsAt: number | null
  scores: Scores
  view: unknown
}

export interface GameOverEvent {
  /** Game-defined side or player id; null when a game just runs out of rounds. */
  winner: string | null
  scores: Scores
  round: number
}

export interface RoleAssignedPayload {
  role: string
  roleData: Role
  name: string
  code: string
  game: Game
}

export interface ClientToServerEvents {
  "admin:create-room":     (p: { gameId: string; hostName: string; hostCharacter: string; hostAccessory?: string; isPublic: boolean; requireApproval: boolean }, cb: Ack<CreateRoomData>) => void
  "admin:reconnect":       (p: { code: string; adminSecret: string },                               cb: Ack<AdminRoomData>)  => void
  "admin:update-settings": (p: { code: string; adminSecret: string; settings: Partial<Settings> },  cb: Ack<AdminRoomData>)  => void
  "admin:update-room":     (p: { code: string; adminSecret: string; isPublic?: boolean; requireApproval?: boolean }, cb: Ack<AdminRoomData>) => void
  "admin:assign-roles":    (p: { code: string; adminSecret: string },                               cb: Ack<AdminRoomData>)  => void
  "admin:clear-roles":     (p: { code: string; adminSecret: string },                               cb: Ack<AdminRoomData>)  => void
  "admin:kick-player":     (p: { code: string; adminSecret: string; playerId: string },             cb: Ack<AdminRoomData>)  => void
  "admin:approve-join":    (p: { code: string; adminSecret: string; requestId: string },            cb: Ack<AdminRoomData>)  => void
  "admin:reject-join":     (p: { code: string; adminSecret: string; requestId: string },            cb: Ack<AdminRoomData>)  => void
  "admin:close-room":      (p: { code: string; adminSecret: string },                               cb: Ack<{ closed: true }>) => void
  "player:join":           (p: { code: string; name: string; character?: string; accessory?: string; playerId?: string }, cb: Ack<PlayerJoinData>) => void
  "player:cancel-request": (p: { code: string; requestId: string },                                 cb: Ack<{ cancelled: true }>) => void
  "rooms:list":            (p: Record<string, never>,                                               cb: Ack<RoomListData>)   => void
  /** One room by code, for the join screen reached with a code rather than a list row. */
  "rooms:peek":            (p: { code: string },                                                    cb: Ack<{ room: RoomSummary }>) => void

  "game:start":            (p: { code: string; adminSecret: string },                    cb: Ack<{ phase: Phase; seq: number }>) => void
  /** `seq` is the phase the player was looking at; a stale one is refused. */
  "game:action":           (p: { code: string; seq: number; action: GameAction },        cb: Ack<{ accepted: true }>) => void
  /** Host closes a phase that has no countdown of its own. */
  "game:advance":          (p: { code: string; adminSecret: string; seq: number },       cb: Ack<{ moved: boolean }>) => void
  "game:end":              (p: { code: string; adminSecret: string },                    cb: Ack<{ phase: Phase }>) => void
  /** Measures the phone's clock offset so every table sees the same countdown. */
  "time:sync":             (p: Record<string, never>,                                    cb: Ack<{ now: number }>) => void
}

/**
 * One player's move. `type` says which move; the rest is validated by the game
 * engine, not here. Values are flat on purpose — see `GameActionPayload`.
 */
export interface GameAction {
  type: string
  [key: string]: string | number | boolean | undefined
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
  "game:phase":           (payload: PhaseEvent) => void
  "game:over":            (payload: GameOverEvent) => void
}

export type InterServerEvents = Record<string, never>
