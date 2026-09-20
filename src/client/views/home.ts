import type { Game } from "@shared/types.js"
import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { setView } from "../router.js"
import { dismissLayer, pushLayer, type LayerHandle } from "../services/navigation.js"
import { showToast } from "../ui/toast.js"
import { clearTheme } from "../themes/loader.js"
import { worldCoverPath } from "../data/assets.js"
import { brandLogo } from "../services/publicConfig.js"
import { buildBookCover } from "../ui/bookCover.js"
// Per-theme CSS is loaded lazily by applyTheme() (themes/loader.ts) when a
// world is opened — every .theme-fx rule is gated by [data-theme="..."], so
// nothing visible on the home page depends on them being preloaded.

let games: readonly Game[] = []
let catalogLoadFailed = false

/* The catalog is deploy-time data, not live room state, so the last copy is
   kept on the device. That is what makes Local Play work with no signal at
   all: the games, roles and settings are all the offline flow needs. */
const CATALOG_CACHE_KEY = "role-room:catalog"

function readCachedCatalog(): readonly Game[] | null {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as Game[]) : null
  } catch { return null }
}

export async function loadCatalog(): Promise<void> {
  // Make the last catalog usable before the network responds.
  const cached = readCachedCatalog()
  if (cached) {
    games = cached
    catalogLoadFailed = false
  }
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch("/api/games", { signal: controller.signal })
    if (!res.ok) throw new Error(`Game catalog request failed: ${res.status}`)
    games = await res.json()
    catalogLoadFailed = false
    try { localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(games)) } catch { /* quota */ }
  } catch (error) {
    if (cached) {
      games = cached
      catalogLoadFailed = false
      return
    }
    console.error("Unable to load game catalog", error)
    games = []
    catalogLoadFailed = true
  } finally {
    window.clearTimeout(timeout)
  }
}

export function getGames(): readonly Game[] { return games }
export function isCatalogLoadFailed(): boolean { return catalogLoadFailed }

export function routeToGame(gameId: string): void {
  sessionStorage.setItem("role-room:selectedGame", gameId)
  setView("gameInfoView")
}

/* Build the "5" face die icon for the Local Play card without innerHTML. */
function buildDiceSvg(): SVGSVGElement {
  const SVG_NS = "http://www.w3.org/2000/svg"
  const svg = document.createElementNS(SVG_NS, "svg")
  svg.setAttribute("viewBox", "0 0 24 24")
  svg.setAttribute("fill", "none")
  svg.setAttribute("stroke", "currentColor")
  svg.setAttribute("stroke-width", "1.6")
  svg.setAttribute("stroke-linecap", "round")
  svg.setAttribute("stroke-linejoin", "round")
  svg.setAttribute("aria-hidden", "true")
  const rect = document.createElementNS(SVG_NS, "rect")
  rect.setAttribute("x", "3"); rect.setAttribute("y", "3")
  rect.setAttribute("width", "18"); rect.setAttribute("height", "18")
  rect.setAttribute("rx", "3.5")
  svg.appendChild(rect)
  const pips: Array<[number, number]> = [[8,8],[16,8],[12,12],[8,16],[16,16]]
  for (const [cx, cy] of pips) {
    const dot = document.createElementNS(SVG_NS, "circle")
    dot.setAttribute("cx", String(cx)); dot.setAttribute("cy", String(cy))
    dot.setAttribute("r", "1.2")
    dot.setAttribute("fill", "currentColor")
    dot.setAttribute("stroke", "none")
    svg.appendChild(dot)
  }
  return svg
}

/* ─── HOME PAGE: brand hero only. Worlds / How to Play / Features / About
   each live on their own routed page now (views/worlds.ts, howToPlay.ts,
   features.ts, about.ts) so the top nav goes somewhere real instead of
   scrolling within one long page. ─────────────────────────────────── */

function buildHeroSlide(lang: ReturnType<typeof getLang>, hasGames: boolean): HTMLElement {
  const slide = el("section", { class: "home-slide hero-slide", "data-slide": "hero" })

  const fog = el("div", { class: "center-fog" })
  const particles = el("div", { class: "center-particles" })
  for (let i = 0; i < 12; i++) particles.appendChild(el("span", { class: "center-particle" }))

  /* LEFT column: brand-mark, title, tagline, body, CTAs, hint */
  const brandRow = el("div", { class: "hero-brand-row" }, [
    el("img", {
      src: brandLogo(true),
      alt: "",
      loading: "eager",
      decoding: "async",
      fetchpriority: "high",
      class: "hero-brand-mark"
    }),
    el("h1", { class: "mega-title", "data-i18n": "brand", dir: "ltr" }, [t("brand")])
  ])
  const tagline = el("p", { class: "hero-tagline" }, [t("heroTagline")])
  const body = el("p", { class: "hero-body" }, [t("heroBody")])

  const createBtn = el("button", { class: "cta-create", type: "button" }, [
    el("span", { class: "cta-icon", "aria-hidden": "true" }, ["+"]),
    el("span", {}, [t("createRoom")])
  ])
  createBtn.addEventListener("click", () => {
    if (hasGames) openCreatePicker(lang)
    else showToast(t("catalogUnavailableToast"))
  })

  const joinBtn = el("button", {
    id: "showJoinBtn",
    class: "cta-join",
    type: "button"
  }, [
    el("span", { class: "cta-icon", "aria-hidden": "true" }, ["▢"]),
    el("span", { "data-i18n": "joinRoom" }, [t("joinRoom")])
  ])
  joinBtn.addEventListener("click", () => {
    setView("joinView")
  })

  const ctaRow = el("div", { class: "cta-row" }, [createBtn, joinBtn])

  const noDownload = el("p", { class: "hero-hint" }, [
    el("span", { class: "hero-hint-icon", "aria-hidden": "true" }, ["▣"]),
    el("span", {}, [t("noDownloadHint")])
  ])

  const localBtn = el("button", {
    class: "cta-local",
    type: "button",
    "aria-label": t("localPlayAria")
  })
  const localIcon = el("span", { class: "cta-local-icon", "aria-hidden": "true" })
  localIcon.appendChild(buildDiceSvg())
  const localText = el("span", { class: "cta-local-text" }, [
    el("strong", {}, [t("localPlay")]),
    el("span", {}, [t("localPlayHint")])
  ])
  const offlineTag = el("span", { class: "cta-local-tag" }, [
    el("span", { class: "cta-local-tag-dot", "aria-hidden": "true" }),
    el("span", {}, [t("offlineMode")])
  ])
  localBtn.append(localIcon, localText, offlineTag)
  localBtn.addEventListener("click", () => {
    setView("localPlayView")
  })

  // Wrap Local Play + CTA row in a centered column container so Local Play
  // aligns to the CTA group's center axis (not the whole hero column).
  const heroActions = el("div", { class: "hero-actions" }, [localBtn, ctaRow])

  const heroLeft = el("div", { class: "hero-left" }, [
    brandRow,
    tagline,
    body,
    heroActions,
    noDownload
  ])

  const heroGrid = el("div", { class: "hero-grid" }, [heroLeft])

  slide.append(fog, particles, heroGrid)
  return slide
}

/* ─── FEATURED WORLDS teaser — first 3 games in the admin's own display
   order (the same order the Worlds page uses), with a link to the rest.
   Keeps the home page from ending abruptly after the hero. ─────────── */

function buildFeaturedSlide(lang: ReturnType<typeof getLang>): HTMLElement {
  const slide = el("section", { class: "home-slide featured-slide", "data-slide": "featured" })
  const atmosphere = el("div", { class: "how-atmosphere", "aria-hidden": "true" })

  const header = el("header", { class: "how-header" }, [
    el("p", { class: "how-eyebrow" }, [
      el("span", { class: "how-ornament", "aria-hidden": "true" }, ["◆"]),
      el("span", {}, [t("featuredEyebrow").toUpperCase()]),
      el("span", { class: "how-ornament", "aria-hidden": "true" }, ["◆"])
    ]),
    el("h2", { class: "how-title" }, [t("featuredTitle")]),
    el("p", { class: "how-sub" }, [t("featuredSub")])
  ])

  const rail = el("div", { class: "featured-rail" })
  games.slice(0, 3).forEach((g, i) => rail.appendChild(buildBookCover(g, lang, i, routeToGame)))

  const viewAll = el("button", { class: "view-all-link", type: "button" }, [
    el("span", {}, [t("viewAllWorlds")]),
    el("span", { "aria-hidden": "true" }, ["→"])
  ])
  viewAll.addEventListener("click", () => { void setView("worldsView") })

  slide.append(atmosphere, header, rail, viewAll)
  return slide
}

/* ─── CREATE-ROOM WORLD PICKER MODAL ──────────────────────── */

function buildCreatePicker(lang: ReturnType<typeof getLang>, close: () => void): HTMLElement {
  const grid = el("div", { class: "create-picker-grid" })
  for (const g of games) {
    const option = el("button", {
      class: "create-picker-option",
      type: "button",
      "data-theme": g.theme
    }, [
      el("img", {
        src: worldCoverPath(g.theme),
        alt: g.title[lang],
        loading: "lazy",
        decoding: "async",
        width: "120",
        height: "120"
      }),
      el("div", { class: "create-picker-option-text" }, [
        el("strong", {}, [g.title[lang]]),
        el("span", {}, [g.subtitle[lang]])
      ])
    ])
    option.addEventListener("click", () => {
      close()
      routeToGame(g.id)
    })
    grid.appendChild(option)
  }

  const panel = el("div", {
    class: "create-picker",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "createPickerTitle"
  }, [
    el("button", { class: "modal-close", type: "button", "aria-label": t("close"), title: t("close") }, ["✕"]),
    el("p", { class: "create-picker-eyebrow" }, [t("createRoom")]),
    el("h2", { id: "createPickerTitle", class: "create-picker-title" }, [t("chooseWorldToCreate")]),
    grid,
    el("button", { class: "create-picker-cancel", type: "button" }, [t("cancel")])
  ])

  panel.querySelector<HTMLButtonElement>(".create-picker-cancel")?.addEventListener("click", close)
  panel.querySelector<HTMLButtonElement>(".modal-close")?.addEventListener("click", close)
  return panel
}

/** Also opened from the room browser's Create Room button. */
export function openCreatePicker(lang: ReturnType<typeof getLang>): void {
  if (document.getElementById("createPickerOverlay")) return

  const overlay = el("div", {
    id: "createPickerOverlay",
    class: "create-picker-overlay"
  })

  // Registered as a back-stack layer so the phone's back gesture (and Escape,
  // handled globally by the same stack) closes the picker instead of the page.
  let handle: LayerHandle | null = null
  let closed = false
  const close = (): void => {
    if (closed) return
    closed = true
    dismissLayer(handle)
    overlay.removeAttribute("id")
    overlay.classList.remove("visible")
    overlay.classList.add("closing")
    window.setTimeout(() => overlay.remove(), 300)
    document.querySelector<HTMLButtonElement>(".cta-create")?.focus()
  }

  overlay.addEventListener("click", (e) => { if (e.target === overlay) close() })

  const panel = buildCreatePicker(lang, close)
  overlay.appendChild(panel)
  document.body.appendChild(overlay)

  handle = pushLayer(close, "create-picker")
  requestAnimationFrame(() => {
    overlay.classList.add("visible")
    panel.querySelector<HTMLButtonElement>(".create-picker-option")?.focus()
  })
}

/* ─── VIEW MOUNT ──────────────────────────────────────────── */

export const homeView = {
  id: "homeView" as const,
  mount() {
    clearTheme()
    const stage = $<HTMLDivElement>("#gamesStage")
    clear(stage)
    const lang = getLang()
    const hasGames = games.length > 0

    stage.appendChild(buildHeroSlide(lang, hasGames))
    if (hasGames) stage.appendChild(buildFeaturedSlide(lang))

    return () => {
      clear(stage)
      document.getElementById("createPickerOverlay")?.remove()
    }
  }
}
