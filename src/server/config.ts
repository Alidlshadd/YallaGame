import { z } from "zod"

const Schema = z.object({
  NODE_ENV:              z.enum(["development", "test", "production"]).default("development"),
  PORT:                  z.coerce.number().int().min(1).max(65535).default(3000),
  DB_PATH:               z.string().optional(),
  ALLOWED_ORIGIN:        z.string().optional(),
  ROOM_TTL_HOURS:        z.coerce.number().positive().default(8),
  LOG_LEVEL:             z.enum(["fatal","error","warn","info","debug","trace"]).default("info"),
  MAX_ROOMS_PER_SOCKET:  z.coerce.number().int().positive().default(5),
  MAX_TOTAL_ROOMS:       z.coerce.number().int().positive().default(10_000)
}).superRefine((v, ctx) => {
  if (v.NODE_ENV === "production" && !v.DB_PATH) {
    ctx.addIssue({
      code: "custom", path: ["DB_PATH"],
      message: "DB_PATH is required when NODE_ENV=production (no silent fallback to memory store)"
    })
  }
})

export const config = Schema.parse(process.env)
export type Config = z.infer<typeof Schema>
