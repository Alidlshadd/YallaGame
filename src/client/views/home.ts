import type { Game } from "@shared/types.js"
import { $, el, clear } from "../ui/dom.js"
import { buildThemeFx } from "../ui/character.js"
import { getLang, t } from "../services/i18n.js"
import { setView } from "../router.js"
import { showToast } from "../ui/toast.js"
import { play } from "../services/sound.js"
import { clearTheme } from "../themes/loader.js"
// Eagerly load theme CSS so per-game zone colors work on home (no global theme applied)
import "../themes/vampire-village.css"
import "../themes/mafia-classic.css"
import "../themes/spy-game.css"

let games: readonly Game[] = []

export async function loadCatalog(): Promise<void> {
  const res = await fetch("/api/games")
  games = await res.json()
}

export function getGames(): readonly Game[] { return games }

function findGame(id: string): Game | undefined {
  return games.find(g => g.id === id)
}

function buildWorldZone(game: Game, lang: ReturnType<typeof getLang>, idx: number): HTMLElement {
  const zone = el(
    "button",
    {
      class: "zone game-card world-zone",
      type: "button",
      "data-game": game.id,
      "data-theme": game.theme,
      "data-position": String(idx)
    },
    [el("img", { src: `/characters/${game.theme}.png`, alt: game.title[lang] })]
  )
  const fx = buildThemeFx(game.theme)
  if (fx) zone.appendChild(fx)
  zone.appendChild(el("div", { class: "zone-content" }, [
    el("span", { class: "zone-kicker" }, [`World 0${idx + 1}`]),
    el("h2", { class: "zone-title" }, [game.title[lang]]),
    el("p", { class: "zone-desc" }, [game.subtitle[lang]]),
    el("span", { class: "zone-enter" }, ["Enter ▸"])
  ]))
  zone.addEventListener("click", () => {
    void play("transition")
    sessionStorage.setItem("role-room:selectedGame", game.id)
    setView("gameInfoView")
  })
  return zone
}

function buildBrandHub(mafiaGame: Game | undefined, lang: ReturnType<typeof getLang>): HTMLElement {
  const badge = el("span", { class: "hero-badge" }, [
    el("span", { class: "live-dot" }),
    el("span", { "data-i18n": "liveRoom" }, [t("liveRoom")])
  ])

  const title = el("h1", { class: "mega-title", "data-i18n": "brand" }, [t("brand")])
  const subtitle = el("p", { class: "mega-subtitle" }, ["A Cinematic Stage For Hidden Roles"])

  const createBtn = el("button", {
    class: "cta-create",
    type: "button"
  }, [el("span", {}, ["Create Room"])])
  createBtn.addEventListener("click", () => {
    void play("click")
    // Pulse the worlds to instruct user to pick one
    document.querySelectorAll<HTMLElement>(".world-zone").forEach(z => {
      z.classList.remove("attention-pulse")
      // restart animation
      void z.offsetWidth
      z.classList.add("attention-pulse")
    })
    showToast("Pick a world to enter")
  })

  const joinBtn = el("button", {
    id: "showJoinBtn",
    class: "cta-join",
    type: "button",
    "data-i18n": "joinRoom"
  }, [t("joinRoom")])
  joinBtn.addEventListener("click", () => {
    void play("click")
    setView("joinView")
  })

  const ctaRow = el("div", { class: "cta-row" }, [createBtn, joinBtn])

  // Local Play tertiary CTA — "pass-and-play" mode on a single device
  const localBtn = el("button", {
    class: "cta-local",
    type: "button",
    "aria-label": "Local Play — one device, pass and play"
  }, [
    el("span", { class: "cta-local-icon" }, ["🎲"]),
    el("span", { class: "cta-local-text" }, [
      el("strong", {}, ["Local Play"]),
      el("span", {}, ["One device · Pass and play"])
    ])
  ])
  localBtn.addEventListener("click", () => {
    void play("click")
    setView("localPlayView")
  })

  const hub = el("div", { class: "brand-hub" }, [badge, title, subtitle, ctaRow, localBtn])

  if (mafiaGame) {
    const mafiaTrigger = el("button", {
      class: "mafia-trigger",
      type: "button",
      "data-game": mafiaGame.id,
      "data-theme": mafiaGame.theme
    }, [
      el("img", { src: `/characters/${mafiaGame.theme}.png`, alt: mafiaGame.title[lang], class: "mafia-trigger-img" }),
      el("div", { class: "mafia-trigger-text" }, [
        el("span", { class: "trigger-kicker" }, ["+ Third World"]),
        el("strong", {}, [mafiaGame.title[lang]])
      ]),
      el("span", { class: "trigger-arrow" }, ["→"])
    ])
    mafiaTrigger.addEventListener("click", () => {
      void play("transition")
      sessionStorage.setItem("role-room:selectedGame", mafiaGame.id)
      setView("gameInfoView")
    })
    hub.appendChild(mafiaTrigger)
  }

  // Decorative center atmosphere layers
  const fog = el("div", { class: "center-fog" })
  const particles = el("div", { class: "center-particles" })
  for (let i = 0; i < 12; i++) {
    particles.appendChild(el("span", { class: "center-particle" }))
  }

  const centerZone = el("div", { class: "center-zone" }, [fog, particles, hub])
  return centerZone
}

function buildMafiaWorldZone(mafiaGame: Game, lang: ReturnType<typeof getLang>): HTMLElement {
  const zone = el(
    "button",
    {
      class: "zone game-card mafia-zone",
      type: "button",
      "data-game": mafiaGame.id,
      "data-theme": mafiaGame.theme
    },
    [el("img", { src: `/characters/${mafiaGame.theme}.png`, alt: mafiaGame.title[lang] })]
  )
  const fx = buildThemeFx(mafiaGame.theme)
  if (fx) zone.appendChild(fx)
  zone.appendChild(el("div", { class: "zone-content" }, [
    el("span", { class: "zone-kicker" }, ["World 02 · Noir"]),
    el("h2", { class: "zone-title" }, [mafiaGame.title[lang]]),
    el("p", { class: "zone-desc" }, [mafiaGame.subtitle[lang]]),
    el("span", { class: "zone-enter" }, ["Enter ▸"])
  ]))
  zone.addEventListener("click", () => {
    void play("transition")
    sessionStorage.setItem("role-room:selectedGame", mafiaGame.id)
    setView("gameInfoView")
  })
  return zone
}

export const homeView = {
  id: "homeView" as const,
  mount() {
    clearTheme()
    const stage = $<HTMLDivElement>("#gamesStage")
    clear(stage)
    const lang = getLang()

    const vampire = findGame("vampire-village")
    const mafia = findGame("mafia-classic")
    const spy = findGame("spy-game")

    if (vampire) stage.appendChild(buildWorldZone(vampire, lang, 0))

    const centerZone = buildBrandHub(mafia, lang)
    if (mafia) centerZone.appendChild(buildMafiaWorldZone(mafia, lang))
    stage.appendChild(centerZone)

    if (spy) stage.appendChild(buildWorldZone(spy, lang, 2))

    return () => {
      // No global listeners to clean up; per-element listeners removed when nodes are cleared
    }
  }
}
