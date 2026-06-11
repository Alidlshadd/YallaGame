import { $, el, clear } from "../ui/dom.js"
import { buildCharacterFrame } from "../ui/character.js"
import { getLang, t } from "../services/i18n.js"
import { setView } from "../router.js"
import { emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { showToast } from "../ui/toast.js"
import { getGames } from "./home.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { play } from "../services/sound.js"
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

    void applyTheme(game.theme).catch(() => {})

    const hero = el("div", { class: "character-hero" })
    hero.appendChild(buildCharacterFrame(game.theme, game.title[lang]))

    const headline = el("div", { class: "game-headline" }, [
      hero,
      el("h2", { class: "display" }, [game.title[lang]]),
      el("p", { class: "subtitle" }, [game.subtitle[lang]])
    ])

    const rulesH = el("h3", { class: "section-title" }, [t("rulesTitle")])
    const rulesUl = el("ul", { class: "rules-list" })
    for (const line of game.rules[lang]) rulesUl.appendChild(el("li", {}, [line]))

    const rolesH = el("h3", { class: "section-title" }, [t("rolesTitle")])
    const rolesUl = el("ul", { class: "roles-list" })
    for (const role of game.roles) {
      rolesUl.appendChild(el("li", {}, [
        el("span", { class: "role-icon" }, [role.icon]),
        el("strong", {}, [role.name[lang]]),
        el("span", { class: "muted" }, [role.desc[lang]])
      ]))
    }

    content.append(headline, rulesH, rulesUl, rolesH, rolesUl)

    const onCreate = async () => {
      void play("click")
      const r = await emit("admin:create-room", { gameId: game.id })
      if (!r.ok) { showToast(t("errorGeneric")); return }
      const data = r.data as CreateRoomData
      session.save({ kind: "admin", code: data.code, adminSecret: data.adminSecret })
      await applyTheme(game.theme)
      void play("transition")
      setView("adminView", { initial: data.room })
    }
    const createBtn = $<HTMLButtonElement>("#createSelectedRoomBtn")
    createBtn.addEventListener("click", onCreate)

    const onBack = () => {
      clearTheme()
      setView("homeView")
    }
    const backs = document.querySelectorAll<HTMLButtonElement>(".backHome")
    backs.forEach(b => b.addEventListener("click", onBack))

    return () => {
      createBtn.removeEventListener("click", onCreate)
      backs.forEach(b => b.removeEventListener("click", onBack))
    }
  }
}
