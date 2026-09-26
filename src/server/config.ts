import { z } from "zod"

export const Schema = z.object({
  NODE_ENV:              z.enum(["development", "test", "production"]).default("development"),
  PORT:                  z.coerce.number().int().min(1).max(65535).default(3000),
  DB_PATH:               z.string().optional(),
  ALLOWED_ORIGIN:        z.string().url().refine(value => {
    try {
      const url = new URL(value)
      return ["http:", "https:"].includes(url.protocol) && url.origin === value
    } catch { return false }
  }, "Use one exact HTTP(S) origin without a path or trailing slash").optional(),
  ROOM_TTL_HOURS:        z.coerce.number().positive().default(8),
  LOG_LEVEL:             z.enum(["fatal","error","warn","info","debug","trace"]).default("info"),
  MAX_ROOMS_PER_SOCKET:  z.coerce.number().int().positive().default(5),
  MAX_TOTAL_ROOMS:       z.coerce.number().int().positive().default(10_000),
  MAX_PLAYERS_PER_ROOM:  z.coerce.number().int().positive().default(30),
  /** How many public rooms the browser returns per refresh. */
  ROOM_LIST_LIMIT:       z.coerce.number().int().positive().max(200).default(40)
}).superRefine((v, ctx) => {
  if (v.NODE_ENV === "production" && !v.DB_PATH) {
    ctx.addIssue({
      code: "custom", path: ["DB_PATH"],
      message: "DB_PATH is required when NODE_ENV=production (no silent fallback to memory store)"
    })
  }
  const loopbackOrigin = v.ALLOWED_ORIGIN && /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(v.ALLOWED_ORIGIN)
  if (v.NODE_ENV === "production" && v.DB_PATH !== ":memory:" && !v.ALLOWED_ORIGIN?.startsWith("https://") && !loopbackOrigin) {
    ctx.addIssue({ code: "custom", path: ["ALLOWED_ORIGIN"], message: "Production requires an exact HTTPS ALLOWED_ORIGIN" })
  }
})

export const config = Schema.parse(process.env)
export type Config = z.infer<typeof Schema>
