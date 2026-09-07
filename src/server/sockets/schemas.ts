import { z } from "zod"

export const RoomCode = z.string().regex(/^[A-Z2-9]{5}$/, "invalid room code")

/** Same shape everywhere a person types their name: trimmed, 1-24 chars. */
export const PlayerName = z.string().trim().min(1).max(24)

export const CreateRoomPayload    = z.object({
  gameId: z.string().min(1).max(64),
  hostName: PlayerName,
  isPublic: z.boolean(),
  requireApproval: z.boolean()
})
export const ReconnectPayload     = z.object({ code: RoomCode, adminSecret: z.string().min(1).max(64) })
export const UpdateSettingsPayload = z.object({
  code: RoomCode,
  adminSecret: z.string().min(1).max(64),
  settings: z.record(z.string(), z.union([z.number(), z.boolean(), z.string()]))
})
export const AssignRolesPayload   = ReconnectPayload
export const ClearRolesPayload    = ReconnectPayload
export const KickPlayerPayload    = z.object({
  code: RoomCode,
  adminSecret: z.string().min(1).max(64),
  playerId: z.string().min(1).max(64)
})
export const JoinPayload          = z.object({
  code: RoomCode,
  name: PlayerName,
  playerId: z.string().min(1).max(64).optional()
})
export const UpdateRoomPayload    = z.object({
  code: RoomCode,
  adminSecret: z.string().min(1).max(64),
  isPublic: z.boolean().optional(),
  requireApproval: z.boolean().optional()
})
export const JoinDecisionPayload  = z.object({
  code: RoomCode,
  adminSecret: z.string().min(1).max(64),
  requestId: z.string().min(1).max(64)
})
export const CloseRoomPayload     = ReconnectPayload
export const CancelRequestPayload = z.object({
  code: RoomCode,
  requestId: z.string().min(1).max(64)
})
/** The room browser takes no arguments; the schema exists so bind() can parse it. */
export const ListRoomsPayload     = z.object({}).strict()
