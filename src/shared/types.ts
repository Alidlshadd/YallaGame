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

export interface Game {
  id: GameId
  icon: string
  theme: string
  minPlayers: number
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

export interface SocketData {
  roomCode?: string
  playerId?: string
  adminSecret?: string
  adminRoomCount?: number
  rateBag?: Map<string, number>
  /** Set while this socket is waiting on the host's decision. */
  pendingRequestId?: string
}
