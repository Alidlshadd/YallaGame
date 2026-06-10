import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { setView } from "../router.js"
import { emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { showToast } from "../ui/toast.js"
import { getGames } from "./home.js"
import type { CreateRoomData } from "@shared/events.js"

export const gameInfoView = {
  id: "gameInfoView" as const,
  mount() {
    const content = $<HTMLDivElement>("#gameInfoContent")
    const lang = getLang()
    const gameId = sessionStorage.getItem("role-room:selectedGame")
    const game = getGames().find(g => g.id === gameId)
    clear(content)
    if (!game) { setView("homeView"); return () => {} }

    content.appendChild(el("h2", {}, [game.title[lang]]))
    content.appendChild(el("p", { class: "muted" }, [game.subtitle[lang]]))

    const rulesH = el("h3", { class: "section-title" }, [t("rulesTitle")])
    const rulesUl = el("ul", { class: "rules-list" })
    for (const line of game.rules[lang]) rulesUl.appendChild(el("li", {}, [line]))
    content.append(rulesH, rulesUl)

    const rolesH = el("h3", { class: "section-title" }, [t("rolesTitle")])
    const rolesUl = el("ul", { class: "roles-list" })
    for (const role of game.roles) {
      rolesUl.appendChild(el("li", {}, [
        el("span", { class: "role-icon" }, [role.icon]),
        el("strong", {}, [role.name[lang]]),
        el("span", { class: "muted" }, [role.desc[lang]])
      ]))
    }
    content.append(rolesH, rolesUl)

    const onCreate = async () => {
      const r = await emit("admin:create-room", { gameId: game.id })
      if (!r.ok) { showToast(t("errorGeneric")); return }
      const data = r.data as CreateRoomData
      session.save({ kind: "admin", code: data.code, adminSecret: data.adminSecret })
      const { applyTheme } = await import("../themes/loader.js")
      await applyTheme(game.theme)
      setView("adminView", { initial: data.room })
    }
    const createBtn = $<HTMLButtonElement>("#createSelectedRoomBtn")
    createBtn.addEventListener("click", onCreate)

    const onBack = () => setView("homeView")
    const backs = document.querySelectorAll<HTMLButtonElement>(".backHome")
    backs.forEach(b => b.addEventListener("click", onBack))

    return () => {
      createBtn.removeEventListener("click", onCreate)
      backs.forEach(b => b.removeEventListener("click", onBack))
    }
  }
}
