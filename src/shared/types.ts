export type LangCode = "ku" | "ar" | "en" | "tr"
export type LocalizedText = Record<LangCode, string>
export type LocalizedList = Record<LangCode, string[]>

export type RoleId = string
export type GameId = string

export interface SettingNumber {
  type: "number"
  key: string
  min: number
  max: number
  label: LocalizedText
}
export interface SettingBoolean {
  type: "boolean"
  key: string
  label: LocalizedText
}
export type SettingDef = SettingNumber | SettingBoolean

export interface Role {
  id: RoleId
  icon: string
  countSetting?: string
  enabledSetting?: string
  filler?: boolean
  name: LocalizedText
  desc: LocalizedText
}

export type Settings = Record<string, number | boolean>

/**
 * Where a room sits inside its game. "idle" is every room that is not running
 * a turn-based game — the five role-distribution games never leave it, since
 * they hand out roles and let the table run the rest.
 *
 * Turn-based games name their own phases ("VOTING", "SUBMIT_LIES", ...); the
 * engine treats them as opaque strings and only ever compares them.
 */
export type Phase = string
export const IDLE_PHASE = "idle"

/** A game's private bookkeeping. Never sent to a client as-is — see `GameEngine.view`. */
export type GameState = Record<string, unknown>

/** playerId -> points. Games that do not score leave it empty. */
export type Scores = Record<string, number>

export interface Game {
  id: GameId
  icon: string
  theme: string
  minPlayers: number
  /**
   * The server runs this one turn by turn, so the host gets a Start button
   * instead of a deal. Absent on the games that only hand out roles.
   */
  turnBased?: boolean
  defaultSettings: Settings
  title: LocalizedText
  subtitle: LocalizedText
  rules: LocalizedList
  roles: Role[]
  settings: SettingDef[]
}

export interface Player {
  id: string
  name: string
  role: RoleId | null
  connected: boolean
  /** A character id from `shared/characters.ts`; "" for seats taken before characters existed. */
  character: string
  accessory?: string | undefined
}

/**
 * Somebody who asked to join a room whose host has approval turned on. They
 * hold no seat and no role until the host accepts; rejecting or disconnecting
 * drops the entry.
 */
export interface PendingJoin {
  id: string
  name: string
  requestedAt: number
  character: string
  accessory?: string | undefined
}

export interface Room {
  code: string
  gameId: GameId
  adminSecret: string
  assigned: boolean
  settings: Settings
  players: Player[]
  createdAt: number
  updatedAt: number
  /** The host plays too: this is their entry in `players`. */
  hostPlayerId: string
  /** Listed in the public room browser. Private rooms are code-only. */
  isPublic: boolean
  /** When on, `player:join` parks newcomers in `pending` for the host to accept. */
  requireApproval: boolean
  pending: PendingJoin[]
  /** `IDLE_PHASE` until a turn-based game starts. */
  phase: Phase
  /**
   * Bumped on every phase change. The guard that keeps a transition from being
   * applied twice when the last action and the countdown land together, and
   * that lets the server reject a tap sent from a screen that has moved on.
   */
  phaseSeq: number
  /** Absolute epoch ms. null means the phase ends when the host says so. */
  phaseEndsAt: number | null
  round: number
  gameState: GameState
  scores: Scores
}

export type Viewer =
  | { kind: "admin"; adminSecret: string }
  | { kind: "player"; playerId: string }

export interface VisiblePlayer {
  id: string
  name: string
  connected: boolean
  role: RoleId | null
  character: string
  accessory?: string | undefined
}

export interface VisibleRoom {
  code: string
  gameId: GameId
  game: Game
  assigned: boolean
  settings: Settings
  players: VisiblePlayer[]
  hostPlayerId: string
  isPublic: boolean
  requireApproval: boolean
  /** Only ever populated for the host; players receive an empty list. */
  pending: PendingJoin[]
}

/** One row of the public room browser. Deliberately thin: no secrets, no roles. */
export interface RoomSummary {
  code: string
  gameId: GameId
  gameTitle: LocalizedText
  gameIcon: string
  theme: string
  hostName: string
  playerCount: number
  requireApproval: boolean
  /** Roles are out — the game is already running. */
  assigned: boolean
  createdAt: number
  /** Characters already spoken for, so the join screen can grey them out. */
  takenCharacters: string[]
}

export interface SelfPlayer {
  id: string
  name: string
  role: RoleId | null
  roleData: Role | null
  character: string
  accessory?: string | undefined
}

export type ErrorCode =
  | "REQUEST_TIMEOUT"
  | "INVALID_ADMIN"
  | "ROOM_NOT_FOUND"
  | "NAME_REQUIRED"
  | "NAME_TAKEN"
  | "NEED_MORE_PLAYERS"
  | "TOO_MANY_SPECIAL_ROLES"
  | "INVALID_INPUT"
  | "RATE_LIMITED"
  | "SERVER_BUSY"
  | "AUTHZ_MISMATCH"
  | "NO_FILLER_ROLE"
  | "UNKNOWN_GAME"
  | "REQUEST_NOT_FOUND"
  | "JOIN_REJECTED"
  | "ROOM_FULL"
  | "CHARACTER_TAKEN"
  | "UNKNOWN_CHARACTER"
  /** The tap arrived from a screen the room has already moved past. */
  | "PHASE_STALE"
  | "GAME_NOT_RUNNING"

export interface SocketData {
  roomCode?: string
  playerId?: string
  adminSecret?: string
  adminRoomCount?: number
  rateBag?: Map<string, number>
  /** Set while this socket is waiting on the host's decision. */
  pendingRequestId?: string
}
