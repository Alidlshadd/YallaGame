import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  // Room specs each open several browsers; cap concurrency to avoid CPU contention.
  workers: 2,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run build && npm start",
    url: "http://localhost:3000",
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
    env: { NODE_ENV: "production", DB_PATH: ":memory:" }
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
})
