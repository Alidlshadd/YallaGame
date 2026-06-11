import { $, clear, el } from "../ui/dom.js"
import { buildCharacterFrame } from "../ui/character.js"
import { getLang, t } from "../services/i18n.js"
import { socket } from "../services/socket.js"
import * as session from "../services/session.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { showReveal } from "../ui/roleReveal.js"
import { setView } from "../router.js"
import { play } from "../services/sound.js"
import type { PlayerJoinData, RoleAssignedPayload } from "@shared/events.js"

export const playerRoomView = {
  id: "playerRoomView" as const,
  mount(ctx: { initial?: PlayerJoinData }) {
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
      welcomeEl.textContent  = ctx.initial.player.name
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
      await showReveal({ payload, lang })
    }

    const onCleared = () => {
      myRole = null
      myRoleData = null
      renderSettled()
    }

    socket.on("player:role-assigned", onAssigned)
    socket.on("player:role-cleared",  onCleared)

    const onLeave = () => {
      if (!confirm("Leave this room?")) return
      void play("click")
      session.clear()
      clearTheme()
      setView("homeView")
    }
    const leaveBtn = $<HTMLButtonElement>("#playerLeaveBtn")
    leaveBtn.addEventListener("click", onLeave)

    renderHeader()
    renderSettled()

    return () => {
      socket.off("player:role-assigned", onAssigned)
      socket.off("player:role-cleared",  onCleared)
      leaveBtn.removeEventListener("click", onLeave)
    }
  }
}
