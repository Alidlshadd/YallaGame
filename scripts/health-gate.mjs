// Read-only gate. It never changes PM2 or reverse-proxy state.
const target = process.argv[2]
if (!target) throw new Error("Usage: node scripts/health-gate.mjs http://127.0.0.1:3001/health")
const url = new URL(target)
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || url.pathname !== "/health")
  throw new Error("Health gate accepts only a loopback /health URL")
let success = false
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500), cache: "no-store" })
    if (response.ok && (await response.json()).ok === true) {
      success = true
      break
    }
  } catch {
    /* retry until the new process is ready */
  }
  await new Promise(resolve => setTimeout(resolve, 500))
}
if (!success)
  throw new Error(
    "Candidate health check failed. Keep the existing PM2 process and proxy upstream unchanged."
  )
console.log("Candidate is healthy. Existing process has not been touched.")
