import { pino } from "pino"

const isProd = process.env.NODE_ENV === "production"

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: { paths: ["adminSecret", "*.adminSecret", "playerId", "*.playerId"], remove: false, censor: "[REDACTED]" },
  ...(isProd ? {} : { transport: { target: "pino-pretty", options: { colorize: true } } })
})
