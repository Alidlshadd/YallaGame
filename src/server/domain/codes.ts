import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto"

export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export const ROOM_CODE_LEN = 5

export function makeRoomCode(exists: (code: string) => boolean): string {
  for (let attempt = 0; attempt < 1000; attempt++) {
    let code = ""
    for (let i = 0; i < ROOM_CODE_LEN; i++) {
      code += ROOM_CODE_ALPHABET[randomInt(0, ROOM_CODE_ALPHABET.length)]
    }
    if (!exists(code)) return code
  }
  throw new Error("makeRoomCode: exhausted 1000 retries — alphabet/length too small for current room count")
}

export function makeSecret(): string {
  return randomBytes(16).toString("base64url")
}

/** The key resume tokens are signed with — see `Room.resumeSecret`. */
export function resumeKey(room: { adminSecret: string; resumeSecret?: string | undefined }): string {
  return room.resumeSecret ?? room.adminSecret
}

/** Player ids are public. Only this private, room-scoped credential permits resuming a seat. */
export function playerResumeToken(adminSecret: string, playerId: string): string {
  return createHmac("sha256", adminSecret).update(`player-resume:${playerId}`).digest("hex")
}

export function validResumeToken(adminSecret: string, playerId: string, candidate?: string): boolean {
  if (!candidate || !/^[a-f0-9]{64}$/.test(candidate)) return false
  return timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(playerResumeToken(adminSecret, playerId), "hex"))
}
