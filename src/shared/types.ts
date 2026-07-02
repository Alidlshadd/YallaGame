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
}

export type Viewer =
  | { kind: "admin"; adminSecret: string }
  | { kind: "player"; playerId: string }

export interface VisiblePlayer {
  id: string
  name: string
  connected: boolean
  role: RoleId | null
}

export interface VisibleRoom {
  code: string
  gameId: GameId
  game: Game
  assigned: boolean
  settings: Settings
  players: VisiblePlayer[]
}

export interface SelfPlayer {
  id: string
  name: string
  role: RoleId | null
  roleData: Role | null
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

export interface SocketData {
  roomCode?: string
  playerId?: string
  adminSecret?: string
  adminRoomCount?: number
  rateBag?: Map<string, number>
}
