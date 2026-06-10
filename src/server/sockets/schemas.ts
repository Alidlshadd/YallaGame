import { z } from "zod"

export const RoomCode = z.string().regex(/^[A-Z2-9]{5}$/, "invalid room code")

export const CreateRoomPayload    = z.object({ gameId: z.string().min(1).max(64) })
export const ReconnectPayload     = z.object({ code: RoomCode, adminSecret: z.string().min(1).max(64) })
export const UpdateSettingsPayload = z.object({
  code: RoomCode,
  adminSecret: z.string().min(1).max(64),
  settings: z.record(z.string(), z.union([z.number(), z.boolean(), z.string()]))
})
export const AssignRolesPayload   = ReconnectPayload
export const ClearRolesPayload    = ReconnectPayload
export const JoinPayload          = z.object({
  code: RoomCode,
  name: z.string().trim().min(1).max(24),
  playerId: z.string().min(1).max(64).optional()
})
