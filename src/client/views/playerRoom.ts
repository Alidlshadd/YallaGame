import { $, clear, el } from "../ui/dom.js"
import { buildCharacterFrame } from "../ui/character.js"
import { buildAvatar } from "../ui/avatar.js"
import { getLang, t } from "../services/i18n.js"
import { socket } from "../services/socket.js"
import * as session from "../services/session.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { showReveal } from "../ui/roleReveal.js"
import { setView, setViewBackHandler } from "../router.js"
import { showToast } from "../ui/toast.js"
import { confirmDialog } from "../ui/confirm.js"
import { watchConnection } from "../services/connection.js"
import { holdWakeLock } from "../services/wakeLock.js"
import { vibrate } from "../ui/haptics.js"
import type { JoinedData, RoleAssignedPayload } from "@shared/events.js"

export const playerRoomView = {
  id: "playerRoomView" as const,
  mount(ctx: { initial?: JoinedData }) {
    const gameNameEl = $<HTMLElement>("#playerGameName")
    const welcomeEl  = $<HTMLElement>("#playerWelcome")
    const statusEl   = $<HTMLElement>("#playerStatus")
    const cardEl     = $<HTMLDivElement>("#playerRoleCard")

    const lang = getLang()
    let myRole = ctx.initial?.player.role ?? null
    let myRoleData = ctx.initial?.player.roleData ?? null

    if (ctx.initial) void applyTheme(ctx.initial.room.game.theme).catch(() => {})

    function renderHeader() {
      if (!ctx.initial) return
      gameNameEl.textContent = ctx.initial.room.game.title[lang]
      clear(welcomeEl)
      welcomeEl.append(
        buildAvatar(ctx.initial.player.character, ctx.initial.player.name, lang, { size: 40, lazy: false }),
        el("span", {}, [ctx.initial.player.name])
      )
    }

    function renderSettled() {
      clear(cardEl)
      const isAssigned = Boolean(myRole)
      cardEl.classList.toggle("revealed", isAssigned)
      cardEl.classList.toggle("locked", !isAssigned)
      if (isAssigned) cardEl.classList.add("assigned-once")

      const game = ctx.initial?.room.game
      if (game) cardEl.appendChild(buildCharacterFrame(game.theme, game.title[lang]))

      const info = el("div", { class: "role-card-info" })
      if (!myRole || !myRoleData) {
        info.append(
          el("div", { class: "role-lock" }, ["?"]),
          el("h3", {}, [t("roleNotAssigned")]),
          el("p", {}, [t("waitAdmin")])
        )
        statusEl.textContent = t("waitAdmin")
      } else {
        info.append(
          el("div", { class: "role-icon-small" }, [myRoleData.icon]),
          el("h3", {}, [myRoleData.name[lang]]),
          el("p", {}, [myRoleData.desc[lang]])
        )
        statusEl.textContent = ""
      }
      cardEl.appendChild(info)
    }

    const onAssigned = async (payload: RoleAssignedPayload) => {
      myRole = payload.role
      myRoleData = payload.roleData
      renderSettled()
      // The phone is usually face down on the table when the host deals.
      vibrate("reveal")
      await showReveal({ payload, lang })
    }

    const onCleared = () => {
      myRole = null
      myRoleData = null
      renderSettled()
    }

    const onKicked = () => {
      session.clear()
      clearTheme()
      showToast(t("kickedFromRoom"))
      void setView("homeView", {}, { mode: "root" })
    }

    // Players sit and wait for the host, so the screen must not sleep, and a
    // dropped socket has to be visible rather than silently swallowed.
    const releaseWakeLock = holdWakeLock()
    const stopWatchingConnection = watchConnection()

    socket.on("player:role-assigned", onAssigned)
    socket.on("player:role-cleared",  onCleared)
    socket.on("player:kicked",        onKicked)

    // Both the Leave button and the phone's back gesture ask the same
    // localized question before dropping the player out of the room.
    let asking = false
    const requestLeave = (): void => {
      if (asking) return
      asking = true
      void confirmDialog({
        title: "leaveRoomTitle",
        body: "leaveRoomBody",
        confirmKey: "dialogLeave",
        cancelKey: "dialogStay",
        danger: true
      }).then(confirmed => {
        asking = false
        if (!confirmed) return
        session.clear()
        clearTheme()
        void setView("homeView", {}, { mode: "root" })
      })
    }
    const onLeave = () => requestLeave()
    setViewBackHandler(() => { requestLeave(); return true })
    const leaveBtn = $<HTMLButtonElement>("#playerLeaveBtn")
    leaveBtn.addEventListener("click", onLeave)

    renderHeader()
    renderSettled()

    return () => {
      setViewBackHandler(null)
      releaseWakeLock()
      stopWatchingConnection()
      socket.off("player:role-assigned", onAssigned)
      socket.off("player:role-cleared",  onCleared)
      socket.off("player:kicked",        onKicked)
      leaveBtn.removeEventListener("click", onLeave)
    }
  }
}
