import type { Game } from "@shared/types.js"
import { $, el, clear } from "../ui/dom.js"
import { getLang } from "../services/i18n.js"
import { setView } from "../router.js"

let games: readonly Game[] = []

export async function loadCatalog(): Promise<void> {
  const res = await fetch("/api/games")
  games = await res.json()
}

export function getGames(): readonly Game[] { return games }

export const homeView = {
  id: "homeView" as const,
  mount() {
    const grid = $<HTMLDivElement>("#gamesGrid")
    clear(grid)
    const lang = getLang()

    for (const game of games) {
      const card = el("button", { class: `game-card theme-${game.theme}`, type: "button", "data-game": game.id }, [
        el("div", { class: "game-icon" }, [game.icon]),
        el("strong", {}, [game.title[lang]]),
        el("span", { class: "muted" }, [game.subtitle[lang]])
      ])
      card.addEventListener("click", () => {
        sessionStorage.setItem("role-room:selectedGame", game.id)
        setView("gameInfoView")
      })
      grid.appendChild(card)
    }

    const onShowJoin = () => setView("joinView")
    $<HTMLButtonElement>("#showJoinBtn").addEventListener("click", onShowJoin)

    return () => {
      $<HTMLButtonElement>("#showJoinBtn").removeEventListener("click", onShowJoin)
    }
  }
}
