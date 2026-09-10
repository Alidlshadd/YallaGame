import { defineConfig, devices } from "@playwright/test"

const port = process.env.PORT ?? "3000"
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
    reuseExistingServer: !process.env.CI,
    env: { NODE_ENV: "production", DB_PATH: ":memory:", PORT: port }
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
})
