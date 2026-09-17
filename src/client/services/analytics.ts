let currentView = "homeView"
export function trackView(view: string, heartbeat = false): void {
  currentView = view
  if (!navigator.onLine || document.visibilityState === "hidden") return
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ view, heartbeat }),
    keepalive: true
  }).catch(() => {})
}
export function initAnalytics(): void {
  window.setInterval(() => trackView(currentView, true), 30_000)
}
