import { socket } from "./socket.js"
import { t } from "./i18n.js"

/**
 * Live connection state for the room screens.
 *
 * A phone drops the socket constantly — the screen locks, wifi hands over to
 * mobile data, the browser backgrounds the tab. The room used to claim
 * "Online" in static markup no matter what, so players had no idea why the
 * host's actions were not arriving. This shows the truth and gets out of the
 * way once the socket is back.
 */

type State = "online" | "offline"

let watchers = 0
let state: State = socket.connected && navigator.onLine ? "online" : "offline"
let hideTimer: number | undefined

function banner(): HTMLElement | null {
  return document.getElementById("connBanner")
}

function render(): void {
  const el = banner()
  if (!el) return
  const indicator = document.querySelector<HTMLElement>("#playerRoomView .conn-indicator span:last-child")

  if (watchers === 0 || state === "online") {
    el.classList.remove("visible")
    if (indicator) indicator.textContent = t("connected")
    document.querySelector("#playerRoomView .conn-indicator")?.classList.remove("off")
    return
  }

  el.textContent = t("connectionLost")
  el.classList.add("visible")
  if (indicator) indicator.textContent = t("offline")
  document.querySelector("#playerRoomView .conn-indicator")?.classList.add("off")
}

function flashBackOnline(): void {
  const el = banner()
  if (!el || watchers === 0) return
  el.textContent = t("connectionBack")
  el.classList.add("visible", "ok")
  window.clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => {
    el.classList.remove("visible", "ok")
  }, 1800)
}

const onConnect = (): void => {
  const wasOffline = state === "offline"
  state = "online"
  render()
  if (wasOffline) flashBackOnline()
}

const onDisconnect = (): void => {
  state = "offline"
  window.clearTimeout(hideTimer)
  banner()?.classList.remove("ok")
  render()
}

socket.on("connect", onConnect)
socket.on("disconnect", onDisconnect)

// The radio dropping is reported to the page instantly, while socket.io only
// notices when a heartbeat times out - on a phone that gap is the difference
// between "it told me" and "it froze".
window.addEventListener("offline", onDisconnect)
window.addEventListener("online", () => {
  if (socket.connected) onConnect()
  else render()
})

/** Show connection trouble while a room screen is open. Returns a stop function. */
export function watchConnection(): () => void {
  watchers += 1
  state = socket.connected && navigator.onLine ? "online" : "offline"
  render()

  let stopped = false
  return () => {
    if (stopped) return
    stopped = true
    watchers = Math.max(0, watchers - 1)
    if (watchers === 0) {
      window.clearTimeout(hideTimer)
      const el = banner()
      el?.classList.remove("visible", "ok")
    }
  }
}

export function isOnline(): boolean {
  return socket.connected
}
