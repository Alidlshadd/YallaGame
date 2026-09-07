import { $ } from "../ui/dom.js"
import { t } from "../services/i18n.js"
import { socket, emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { setView, setViewBackHandler } from "../router.js"
import { showToast } from "../ui/toast.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { watchConnection } from "../services/connection.js"
import { holdWakeLock } from "../services/wakeLock.js"
import { vibrate } from "../ui/haptics.js"
import type { JoinedData } from "@shared/events.js"

/**
 * The knock-at-the-door screen: the room has approval turned on, so the player
 * sits here until the host accepts or rejects. Nothing else can happen from
 * here — leaving withdraws the request rather than abandoning it in the host's
 * queue.
 */
export const pendingView = {
  id: "pendingView" as const,
  mount(ctx: { requestId?: string; code?: string; name?: string; theme?: string }) {
    const codeEl = $<HTMLElement>("#pendingRoomCode")
    const cancelBtn = $<HTMLButtonElement>("#cancelRequestBtn")

    const requestId = ctx.requestId ?? ""
    const roomCode = ctx.code ?? ""
    codeEl.textContent = roomCode

    if (ctx.theme) void applyTheme(ctx.theme).catch(() => {})

    // The player is staring at a screen that only changes when somebody else
    // acts, so keep it awake and make a dropped socket visible.
    const releaseWakeLock = holdWakeLock()
    const stopWatchingConnection = watchConnection()

    let settled = false

    const onApproved = async (data: JoinedData) => {
      settled = true
      session.save({ kind: "player", code: roomCode, playerId: data.player.id, name: data.player.name })
      vibrate("reveal")
      showToast(t("joinApproved"))
      await applyTheme(data.room.game.theme)
      await setView("playerRoomView", { initial: data }, { mode: "root" })
    }

    const onRejected = () => {
      settled = true
      clearTheme()
      showToast(t("joinRejected"))
      void setView("joinView", {}, { mode: "root" })
    }

    socket.on("player:join-approved", onApproved)
    socket.on("player:join-rejected", onRejected)

    const withdraw = (): void => {
      if (settled) return
      settled = true
      // Fire and forget: the server also drops the request when this socket
      // disconnects, so a failed call cannot strand anyone.
      if (roomCode && requestId) void emit("player:cancel-request", { code: roomCode, requestId })
      clearTheme()
      void setView("joinView", {}, { mode: "root" })
    }

    const onCancel = () => withdraw()
    cancelBtn.addEventListener("click", onCancel)
    setViewBackHandler(() => { withdraw(); return true })

    return () => {
      setViewBackHandler(null)
      releaseWakeLock()
      stopWatchingConnection()
      socket.off("player:join-approved", onApproved)
      socket.off("player:join-rejected", onRejected)
      cancelBtn.removeEventListener("click", onCancel)
    }
  }
}
