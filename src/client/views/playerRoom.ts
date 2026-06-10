import { $, clear, el } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { socket } from "../services/socket.js"
import { applyTheme } from "../themes/loader.js"
import { showReveal } from "../ui/roleReveal.js"
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
      cardEl.classList.toggle("revealed", Boolean(myRole))
      cardEl.classList.toggle("locked", !myRole)
      if (myRole) cardEl.classList.add("assigned-once")

      const back = el("div", { class: "role-card-back", "aria-hidden": "true" })

      const face = el("div", { class: "role-card-face" })
      if (!myRole || !myRoleData) {
        face.append(
          el("div", { class: "role-glow" }),
          el("div", { class: "role-lock" }, ["?"]),
          el("h3", {}, [t("roleNotAssigned")]),
          el("p", {}, [t("waitAdmin")])
        )
        statusEl.textContent = t("waitAdmin")
      } else {
        face.append(
          el("div", { class: "role-glow" }),
          el("div", { class: "role-icon big" }, [myRoleData.icon]),
          el("h3", {}, [myRoleData.name[lang]]),
          el("p", {}, [myRoleData.desc[lang]])
        )
        statusEl.textContent = ""
      }
      cardEl.append(back, face)
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

    renderHeader()
    renderSettled()

    return () => {
      socket.off("player:role-assigned", onAssigned)
      socket.off("player:role-cleared",  onCleared)
    }
  }
}
