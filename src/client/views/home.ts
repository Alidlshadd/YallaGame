import type { Game } from "@shared/types.js"
import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { setView } from "../router.js"
import { dismissLayer, pushLayer, type LayerHandle } from "../services/navigation.js"
import { showToast } from "../ui/toast.js"
import { clearTheme } from "../themes/loader.js"
import { worldCoverPath } from "../data/assets.js"
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
  try {
    const res = await fetch("/api/games")
    if (!res.ok) throw new Error(`Game catalog request failed: ${res.status}`)
    games = await res.json()
    catalogLoadFailed = false
    try { localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(games)) } catch { /* quota */ }
  } catch (error) {
    const cached = readCachedCatalog()
    if (cached) {
      games = cached
      catalogLoadFailed = false
      return
    }
    console.error("Unable to load game catalog", error)
    games = []
    catalogLoadFailed = true
  }
}

export function getGames(): readonly Game[] { return games }

function routeToGame(gameId: string): void {
  sessionStorage.setItem("role-room:selectedGame", gameId)
  setView("gameInfoView")
}

/* Short, dramatic taglines shown on each book cover (poster-style). */
const GAME_TAGLINES: Record<string, string> = {
  "vampire-village": "LIE. SEDUCE. SURVIVE.",
  "mafia-classic":   "TRUST IS A WEAPON.",
  "spy-game":        "SECRETS. MISSIONS. DECEPTION.",
  "who-am-i":        "ASK. GUESS. LAUGH.",
  "football-player-guess": "ASK. DRIBBLE. GUESS."
}

function taglineFor(game: Game, lang: ReturnType<typeof getLang>): string {
  return GAME_TAGLINES[game.id] ?? game.subtitle[lang]
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

/* ─── Slide 1: BRAND HERO (split layout) ──────────────────── */

function buildFeatureCard(icon: string, title: string, desc: string, accent: string): HTMLElement {
  return el("div", { class: "feat-card", "data-accent": accent }, [
    el("div", { class: "feat-icon" }, [icon]),
    el("div", { class: "feat-text" }, [
      el("strong", {}, [title]),
      el("span", {}, [desc])
    ])
  ])
}

function buildHeroEmblemPanel(): HTMLElement {
  // Floating transparent-PNG emblem composited over the hero background.
  const panel = el("div", { class: "hero-emblem-panel", "aria-hidden": "true" })
  panel.appendChild(el("div", { class: "hero-emblem-glow" }))
  panel.appendChild(el("div", { class: "hero-emblem-ring" }))
  panel.appendChild(el("img", {
    src: "/assets/logo/yalla-game-mark.webp",
    alt: "",
    loading: "eager",
    decoding: "async",
    fetchpriority: "high",
    class: "hero-emblem-mark"
  }))

  // 3 banner accents — vampire (red), mafia (gold), spy (cyan)
  const banners = el("div", { class: "hero-banners" })
  banners.appendChild(el("div", { class: "hero-banner", "data-theme": "vampire-village" }, ["✶"]))
  banners.appendChild(el("div", { class: "hero-banner", "data-theme": "mafia-classic" }, ["✦"]))
  banners.appendChild(el("div", { class: "hero-banner", "data-theme": "spy-game" }, ["✸"]))
  panel.appendChild(banners)

  // Floating embers
  const embers = el("div", { class: "hero-embers" })
  for (let i = 0; i < 10; i++) embers.appendChild(el("span", { class: "hero-ember" }))
  panel.appendChild(embers)

  return panel
}

function buildHeroSlide(lang: ReturnType<typeof getLang>, hasGames: boolean): HTMLElement {
  const slide = el("section", { class: "home-slide hero-slide", "data-slide": "hero" })

  const fog = el("div", { class: "center-fog" })
  const particles = el("div", { class: "center-particles" })
  for (let i = 0; i < 12; i++) particles.appendChild(el("span", { class: "center-particle" }))

  /* LEFT column: brand-mark, title, tagline, body, CTAs, hint */
  const brandRow = el("div", { class: "hero-brand-row" }, [
    el("img", {
      src: "/assets/logo/yalla-game-mark.webp",
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

  /* RIGHT column: cinematic emblem panel */
  const heroRight = el("div", { class: "hero-right" }, [buildHeroEmblemPanel()])

  const heroGrid = el("div", { class: "hero-grid" }, [heroLeft, heroRight])

  /* Feature cards row */
  const featRow = el("div", { class: "feat-row" }, [
    buildFeatureCard("⬡", t("featRoomCode"),    t("featRoomCodeDesc"),    "violet"),
    buildFeatureCard("♛", t("featHostControl"), t("featHostControlDesc"), "gold"),
    buildFeatureCard("◈", t("featSecretRoles"), t("featSecretRolesDesc"), "red"),
    buildFeatureCard("✦", t("featMultiLang"),   t("featMultiLangDesc"),   "cyan")
  ])

  slide.append(fog, particles, heroGrid)
  if (hasGames) slide.append(featRow)
  return slide
}

/* ─── Slide 2: GAMES SHELF (book covers) ─────────────────── */

function buildBookCover(game: Game, lang: ReturnType<typeof getLang>, idx: number): HTMLElement {
  const card = el("button", {
    class: "shelf-card game-card",
    type: "button",
    "data-game": game.id,
    "data-theme": game.theme,
    "data-position": String(idx),
    "aria-label": game.title[lang]
  })

  const frame = el("div", { class: "book-frame" })

  // TOP ornament header
  const top = el("div", { class: "book-top" }, [
    el("span", { class: "book-ornament" }, ["❖"]),
    el("span", { class: "book-kicker" }, [t("worldLabel").toUpperCase()]),
    el("span", { class: "book-ornament" }, ["❖"])
  ])

  // COVER artwork — only the first cover loads eagerly (LCP candidate);
  // the rest defer until they're scrolled into view to spare initial bandwidth.
  const cover = el("div", { class: "book-cover" })
  const backdrop = el("div", { class: "book-backdrop", "aria-hidden": "true" })
  const isFirst = idx === 0
  const img = el("img", {
    src: worldCoverPath(game.theme),
    alt: game.title[lang],
    loading: isFirst ? "eager" : "lazy",
    decoding: "async",
    fetchpriority: isFirst ? "high" : "low",
    width: "320",
    height: "480",
    class: "book-image"
  }) as HTMLImageElement
  if (img.complete) img.classList.add("loaded")
  else img.addEventListener("load", () => img.classList.add("loaded"), { once: true })
  cover.append(backdrop, img)
  // No per-theme FX layer on shelf cards. The home page never activates a
  // [data-theme] on <html>, so theme-fx CSS (which is gated by that
  // selector) wouldn't apply anyway. Worse, spy-game's FX builder emits
  // raw HUD/binary text nodes that would appear unstyled and leak across
  // the cover. FX still runs on gameInfo + playerRoom where the theme IS
  // active.

  // BOTTOM title/tagline — tagline is always English poster art, wrap with
  // <bdi dir="ltr"> so adjacent RTL glyphs don't interleave with its punctuation.
  const bottom = el("div", { class: "book-bottom" }, [
    el("h3", { class: "book-title" }, [game.title[lang]]),
    el("p", { class: "book-tagline" }, [
      el("bdi", { dir: "ltr" }, [taglineFor(game, lang)])
    ]),
    el("span", { class: "book-emblem" }, ["✦"])
  ])

  frame.append(top, cover, bottom)
  card.appendChild(frame)

  card.addEventListener("click", () => {
    routeToGame(game.id)
  })

  return card
}

function buildShelfSlide(lang: ReturnType<typeof getLang>): HTMLElement {
  const slide = el("section", { class: "home-slide shelf-slide", "data-slide": "shelf" })

  const header = el("header", { class: "shelf-header" }, [
    el("p", { class: "shelf-eyebrow" }, [
      el("span", { class: "shelf-ornament" }, ["❖"]),
      el("span", {}, [t("exploreEyebrow").toUpperCase()]),
      el("span", { class: "shelf-ornament" }, ["❖"])
    ]),
    el("h2", { class: "shelf-title" }, [t("exploreWorlds")]),
    el("p", { class: "shelf-subtitle" }, [t("exploreWorldsSub")])
  ])

  const rail = el("div", { class: "shelf-rail" })
  games.forEach((g, i) => rail.appendChild(buildBookCover(g, lang, i)))

  const shelfFloor = el("div", { class: "shelf-floor", "aria-hidden": "true" })

  const footer = el("footer", { class: "shelf-footer" }, [
    el("span", { class: "shelf-footer-star", "aria-hidden": "true" }, ["✦"]),
    el("h3", { class: "shelf-footer-title" }, [t("moreWorlds")]),
    el("p", { class: "shelf-footer-sub" }, [t("moreWorldsSub")])
  ])

  const backTop = el("button", {
    class: "shelf-back-top",
    type: "button",
    "aria-label": "Back to top"
  }, [el("span", { "aria-hidden": "true" }, ["⌃"]), el("span", {}, [t("brand")])])
  backTop.addEventListener("click", () => {
    document.querySelector<HTMLElement>(".hero-slide")?.scrollIntoView({ behavior: "smooth" })
  })

  slide.append(header, rail, shelfFloor, footer, backTop)
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
    if (hasGames) {
      stage.appendChild(buildShelfSlide(lang))
    } else if (catalogLoadFailed) {
      const msg = el("section", { class: "home-slide shelf-slide" }, [
        el("p", { class: "shelf-subtitle" }, [t("catalogUnavailable")])
      ])
      stage.appendChild(msg)
    }

    return () => {
      clear(stage)
      document.getElementById("createPickerOverlay")?.remove()
    }
  }
}
