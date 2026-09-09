import { z } from "zod"
import { isAccessoryId } from "../../shared/accessories.js"

export const RoomCode = z.string().regex(/^[A-Z2-9]{5}$/, "invalid room code")

/** Same shape everywhere a person types their name: trimmed, 1-24 chars. */
export const PlayerName = z.string().trim().min(1).max(24)

/** Shape only; whether the id is real is checked against the catalogue. */
export const CharacterId = z.string().trim().min(1).max(32)
export const AccessoryId = z.string().max(32).refine(isAccessoryId, "unknown accessory")

export const CreateRoomPayload    = z.object({
  gameId: z.string().min(1).max(64),
  hostName: PlayerName,
  hostCharacter: CharacterId,
  hostAccessory: AccessoryId.optional(),
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
  // Optional so a rebinding player keeps the character they already hold.
  character: CharacterId.optional(),
  accessory: AccessoryId.optional(),
  playerId: z.string().min(1).max(64).optional()
})
export const PeekRoomPayload      = z.object({ code: RoomCode })
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

export const GameStartPayload     = ReconnectPayload
export const GameEndPayload       = ReconnectPayload
/** Phase counter the caller was looking at. Never negative, never fractional. */
const PhaseSeq = z.number().int().nonnegative().max(1_000_000)
export const GameAdvancePayload   = z.object({
  code: RoomCode,
  adminSecret: z.string().min(1).max(64),
  seq: PhaseSeq
})
/**
 * A move. The engine decides what the fields mean, but the shape is pinned
 * here: flat, and every value bounded. `passthrough()` would let a client post
 * a deeply nested megabyte that the server then stores in the room row.
 */
export const GameActionPayload    = z.object({
  code: RoomCode,
  seq: PhaseSeq,
  action: z.object({ type: z.string().min(1).max(32) })
    .catchall(z.union([z.string().max(200), z.number().finite(), z.boolean()]))
})
export const TimeSyncPayload      = z.object({}).strict()
