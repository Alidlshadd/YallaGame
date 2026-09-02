import { showToast } from "../ui/toast.js"
import { t } from "./i18n.js"

/**
 * Home-screen install support.
 *
 * The service worker only caches the app shell and build assets, so opening
 * the game is instant on a phone and Local Play (which never touches the
 * server) keeps working with no signal. Room traffic is always live.
 */

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return
  // Dev is served by Vite with its own module graph; a worker there would only
  // serve stale bundles.
  if (!import.meta.env.PROD) return

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* An unavailable worker just means no offline support. */
    })
  })

  let hadController = Boolean(navigator.serviceWorker.controller)
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // First install: nothing to tell the user. A later swap means a new
    // version is live, and the running page is the old one.
    if (!hadController) { hadController = true; return }
    showToast(t("updateReady"), 5000)
  })
}

/**
 * Warm the Local Play bundle once the app is idle.
 *
 * Local Play is the one flow that needs no server, so it is the flow that has
 * to survive a dead spot — but its chunk is lazy, and a chunk that was never
 * fetched cannot be served from the cache. Fetching it while the phone is
 * sitting on the home screen makes the offline promise real and the first tap
 * instant. Skipped on metered or slow connections, where the download costs
 * more than it saves.
 */
export function prefetchOfflineBundles(): void {
  type Connection = { saveData?: boolean; effectiveType?: string }
  const connection = (navigator as Navigator & { connection?: Connection }).connection
  if (connection?.saveData) return
  if (connection?.effectiveType && /(^|-)2g$/.test(connection.effectiveType)) return

  const warm = (): void => { void import("../views/localPlay.js").catch(() => {}) }
  const idle = (window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  }).requestIdleCallback
  if (idle) idle(warm, { timeout: 4000 })
  else window.setTimeout(warm, 3000)
}
