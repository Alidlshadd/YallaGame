import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { socket } from "../services/socket.js"
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

    function render() {
      if (ctx.initial) {
        gameNameEl.textContent = ctx.initial.room.game.title[lang]
        welcomeEl.textContent  = ctx.initial.player.name
      }
      clear(cardEl)
      cardEl.classList.toggle("locked", !myRole)

      if (!myRole || !myRoleData) {
        cardEl.append(
          el("div", { class: "role-glow" }),
          el("div", { class: "role-lock" }, ["?"]),
          el("h3", {}, [t("roleNotAssigned")]),
          el("p", {}, [t("waitAdmin")])
        )
        statusEl.textContent = t("waitAdmin")
        return
      }

      cardEl.append(
        el("div", { class: "role-glow" }),
        el("div", { class: "role-icon big" }, [myRoleData.icon]),
        el("h3", {}, [myRoleData.name[lang]]),
        el("p", {}, [myRoleData.desc[lang]])
      )
      statusEl.textContent = ""
    }

    const onAssigned = (payload: RoleAssignedPayload) => {
      myRole = payload.role
      myRoleData = payload.roleData
      render()
    }
    const onCleared = () => { myRole = null; myRoleData = null; render() }

    socket.on("player:role-assigned", onAssigned)
    socket.on("player:role-cleared",  onCleared)
    render()

    return () => {
      socket.off("player:role-assigned", onAssigned)
      socket.off("player:role-cleared",  onCleared)
    }
  }
}
