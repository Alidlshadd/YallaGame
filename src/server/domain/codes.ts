import { randomBytes, randomInt } from "node:crypto"

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
