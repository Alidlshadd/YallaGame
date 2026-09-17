import { defineConfig, devices } from "@playwright/test"

const port = process.env.E2E_PORT ?? "3100"
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  // Room specs each open several browsers; cap concurrency to avoid CPU contention.
  workers: 2,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run build && npm start",
    url: baseURL,
    timeout: 60_000,
    // Never run mutation tests against an existing developer or production database.
    reuseExistingServer: false,
    env: { NODE_ENV: "production", DB_PATH: ":memory:", PORT: port }
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
})
