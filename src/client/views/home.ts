import type { Game } from "@shared/types.js"
import { $, el, clear } from "../ui/dom.js"
import { getLang } from "../services/i18n.js"
import { setView } from "../router.js"
import { clearTheme } from "../themes/loader.js"

let games: readonly Game[] = []

export async function loadCatalog(): Promise<void> {
  const res = await fetch("/api/games")
  games = await res.json()
}

export function getGames(): readonly Game[] { return games }

export const homeView = {
  id: "homeView" as const,
  mount() {
    clearTheme()
    const grid = $<HTMLDivElement>("#gamesGrid")
    clear(grid)
    const lang = getLang()

    for (const game of games) {
      const card = el(
        "button",
        {
          class: "game-card",
          type: "button",
          "data-game": game.id,
          "data-theme": game.theme
        },
        [
          el("div", { class: "game-icon" }, [game.icon]),
          el("strong", {}, [game.title[lang]]),
          el("span", { class: "muted" }, [game.subtitle[lang]])
        ]
      )
      card.addEventListener("click", () => {
        sessionStorage.setItem("role-room:selectedGame", game.id)
        setView("gameInfoView")
      })
      grid.appendChild(card)
    }

    const onShowJoin = () => setView("joinView")
    const joinBtn = $<HTMLButtonElement>("#showJoinBtn")
    joinBtn.addEventListener("click", onShowJoin)

    return () => {
      joinBtn.removeEventListener("click", onShowJoin)
    }
  }
}
