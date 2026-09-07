import type { Game, Role } from "@shared/types.js"
import { $, el, clear } from "../ui/dom.js"
import { buildThemeFx } from "../ui/character.js"
import { getLang, t } from "../services/i18n.js"
import { goBack, setView } from "../router.js"
import { dismissLayer, pushLayer, type LayerHandle } from "../services/navigation.js"
import { emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { hostSetupDialog } from "../ui/hostSetup.js"
import { showToast } from "../ui/toast.js"
import { getGames } from "./home.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { worldCoverPath } from "../data/assets.js"
import { getWorldDetail } from "../data/worldDetails.js"
import type { CategoryDifficulty } from "../data/worldDetails.js"
import { buildCategoryIconSvg } from "../data/categoryIcons.js"

/* Localized label for a category difficulty enum value. */
function difficultyLabel(d: CategoryDifficulty): string {
  switch (d) {
    case "Easy":    return t("difficultyEasy")
    case "Medium":  return t("difficultyMedium")
    case "Hard":    return t("difficultyHard")
    case "Expert":  return t("difficultyExpert")
    case "Kids":    return t("difficultyKids")
    case "Adults":  return t("difficultyAdults")
    case "Quick":   return t("difficultyQuick")
    case "Long":    return t("difficultyLong")
  }
}
import type { CreateRoomData } from "@shared/events.js"

type BadgeKind = "evil" | "village" | "special" | "citizen"

function roleBadge(role: Role): BadgeKind {
  if (role.countSetting) return "evil"          // vampire / mafia / spy = the "bad" side
  if (role.filler) return "citizen"             // villager / citizen / normal player
  if (role.id === "doctor") return "village"
  if (role.id === "detective") return "special"
  return "citizen"
}

function badgeLabel(kind: BadgeKind): string {
  switch (kind) {
    case "evil":    return t("badgeEvil")
    case "special": return t("badgeSpecial")
    case "village": return t("badgeSupport")
    case "citizen": return t("badgeCitizen")
  }
}

/* Non-emoji fallback glyph for role icon when no role artwork is available
   (e.g. mafia + spy until artwork ships). Uses badge kind for distinction. */
function roleFallbackGlyph(kind: BadgeKind): string {
  switch (kind) {
    case "evil":    return "✦"
    case "special": return "◈"
    case "village": return "✚"
    case "citizen": return "◇"
  }
}

const STEP_ICONS = ["I", "II", "III", "IV"] as const
const STEP_SYMBOLS = ["⬡", "▢", "◈", "▶"] as const   // small premium symbol per step
const STEP_TITLE_KEYS = ["step1Title", "step2Title", "step3Title", "step4Title"] as const
type StepTitleKey = typeof STEP_TITLE_KEYS[number]

/* Premium theme icon for the hero eyebrow. SVG bat for the vampire world,
   clean Unicode geometric symbols for the rest — never emoji. */
const BAT_PATH = "M0 9 L4 4 L8 7 L12 2 L15 6 L18 2 L22 7 L26 4 L30 9 L26 11 L22 9 L18 12 L15 9 L12 12 L8 9 L4 11 Z"

function buildBatSvg(): SVGSVGElement {
  const SVG_NS = "http://www.w3.org/2000/svg"
  const svg = document.createElementNS(SVG_NS, "svg")
  svg.setAttribute("viewBox", "0 0 30 14")
  svg.setAttribute("aria-hidden", "true")
  svg.setAttribute("class", "gi-theme-icon gi-theme-icon--svg")
  const path = document.createElementNS(SVG_NS, "path")
  path.setAttribute("d", BAT_PATH)
  path.setAttribute("fill", "currentColor")
  svg.appendChild(path)
  return svg
}

function buildThemeIcon(theme: string): HTMLElement | SVGSVGElement {
  if (theme === "vampire-village") return buildBatSvg()
  if (theme === "football-player-guess") {
    return el("span", { class: "gi-theme-icon gi-theme-icon--glyph", "aria-hidden": "true" }, ["FC"])
  }
  const mark =
    theme === "mafia-classic" ? "♠" :
    theme === "spy-game"      ? "✦" :
    theme === "who-am-i"      ? "?" :
    "❖"
  return el("span", { class: "gi-theme-icon gi-theme-icon--glyph", "aria-hidden": "true" }, [mark])
}

/* ─── HERO ─────────────────────────────────────────────── */

function buildHero(
  game: Game,
  lang: ReturnType<typeof getLang>,
  detail: ReturnType<typeof getWorldDetail>,
  onCreate: () => void
): HTMLElement {
  const slogan = detail?.slogan ?? game.subtitle[lang]
  const description = detail?.description[lang] ?? game.subtitle[lang]
  const tags = detail?.tags ?? []

  // Right: framed poster using existing WebP cover
  const poster = el("div", { class: "gi-poster" })
  const posterFrame = el("div", { class: "gi-poster-frame" })
  const posterImg = el("img", {
    src: worldCoverPath(game.theme),
    alt: game.title[lang],
    loading: "eager",
    decoding: "async",
    fetchpriority: "high",
    class: "gi-poster-image"
  })
  posterFrame.appendChild(posterImg)
  const fx = buildThemeFx(game.theme)
  if (fx) posterFrame.appendChild(fx)
  poster.appendChild(posterFrame)

  // Left: premium theme glyph + WORLD eyebrow (no emoji)
  const titleRow = el("div", { class: "gi-title-row" }, [
    buildThemeIcon(game.theme),
    el("p", { class: "gi-eyebrow" }, [t("worldLabel").toUpperCase()])
  ])
  const title = el("h1", { class: "gi-title" }, [game.title[lang]])
  // Slogans are English poster lines. Wrap with <bdi dir="ltr"> so adjacent
  // RTL glyphs / punctuation don't interleave with them in Arabic/Kurdish pages.
  const sloganEl = el("p", { class: "gi-slogan" }, [
    el("bdi", { dir: "ltr" }, [slogan])
  ])
  const desc = el("p", { class: "gi-description" }, [description])

  const tagRow = el("div", { class: "gi-tags" })
  for (const tg of tags) {
    tagRow.appendChild(el("span", { class: "gi-tag" }, [tg[lang]]))
  }

  const createBtn = el("button", {
    id: "createSelectedRoomBtn",
    class: "gi-cta gi-cta-primary",
    type: "button"
  }, [
    el("span", { class: "gi-cta-icon", "aria-hidden": "true" }, ["+"]),
    el("span", {}, [t("createRoom")])
  ])
  createBtn.addEventListener("click", onCreate)

  const joinBtn = el("button", {
    class: "gi-cta gi-cta-secondary",
    type: "button"
  }, [
    el("span", { class: "gi-cta-icon", "aria-hidden": "true" }, ["▢"]),
    el("span", {}, [t("joinRoom")])
  ])
  joinBtn.addEventListener("click", () => {
    void setView("joinView")
  })

  const localBtn = el("button", {
    class: "gi-cta gi-cta-ghost",
    type: "button"
  }, [
    el("span", { class: "gi-cta-icon", "aria-hidden": "true" }, ["⬢"]),
    el("span", {}, [t("localPlay")])
  ])
  localBtn.addEventListener("click", () => {
    void setView("localPlayView", { gameId: game.id })
  })

  const actions = el("div", { class: "gi-actions" }, [createBtn, joinBtn, localBtn])

  const hint = el("p", { class: "gi-hint" }, [
    el("span", { class: "gi-hint-icon", "aria-hidden": "true" }, ["▣"]),
    el("span", {}, [t("noDownloadHint")])
  ])

  const left = el("div", { class: "gi-hero-left" }, [
    titleRow,
    title,
    sloganEl,
    desc,
    tagRow,
    actions,
    hint
  ])

  const hero = el("section", { class: "gi-hero" }, [
    el("div", { class: "gi-hero-bg" }),
    el("div", { class: "gi-hero-vignette" }),
    el("div", { class: "gi-hero-grid" }, [left, poster])
  ])
  // When a per-world cinematic backdrop is provided, hand the URL to CSS via
  // a CSS variable so the gi-hero-bg layer can pick it up while still composing
  // its theme gradients on top.
  if (detail?.detailBackground) {
    const styles = [`--gi-hero-bg-image: url("${detail.detailBackground}")`]
    if (detail.detailBackgroundMobile) {
      styles.push(`--gi-hero-bg-image-mobile: url("${detail.detailBackgroundMobile}")`)
    }
    hero.setAttribute("style", styles.join("; "))
    hero.classList.add("gi-hero--has-image")
  }
  return hero
}

/* ─── ABOUT + STATS ───────────────────────────────────── */

function buildAbout(
  lang: ReturnType<typeof getLang>,
  detail: ReturnType<typeof getWorldDetail>,
  fallbackDescription: string,
  gameTheme: string
): HTMLElement {
  const description = detail?.description[lang] ?? fallbackDescription

  const leftChildren: HTMLElement[] = []
  // Spy world wears a tactical "Mission Briefing" tag above the eyebrow.
  if (gameTheme === "spy-game") {
    leftChildren.push(el("span", { class: "gi-about-briefing" }, [
      el("span", { class: "gi-about-briefing-dot", "aria-hidden": "true" }),
      el("span", {}, [t("aboutBriefing")])
    ]))
  }
  leftChildren.push(
    el("p", { class: "gi-section-eyebrow" }, [
      el("span", { class: "gi-ornament" }, ["❖"]),
      el("span", {}, [t("aboutTitle").toUpperCase()]),
      el("span", { class: "gi-ornament" }, ["❖"])
    ]),
    el("h2", { class: "gi-section-title" }, [t("aboutTitle")]),
    el("div", { class: "gi-divider", "aria-hidden": "true" }),
    el("p", { class: "gi-about-body" }, [description])
  )

  const left = el("div", { class: "gi-about-left" }, leftChildren)

  const statValue = (icon: string, label: string, value: string): HTMLElement =>
    el("div", { class: "gi-stat" }, [
      el("div", { class: "gi-stat-icon", "aria-hidden": "true" }, [icon]),
      el("div", { class: "gi-stat-text" }, [
        el("span", { class: "gi-stat-label" }, [label]),
        el("strong", { class: "gi-stat-value" }, [value])
      ])
    ])

  const s = detail?.stats
  const right = el("div", { class: "gi-stats" }, [
    statValue("▥", t("recommendedPlayers"), s?.recommendedPlayers ?? "—"),
    statValue("⌛", t("sessionTime"),       s?.sessionTime[lang] ?? "—"),
    statValue("◈", t("difficultyLabel"),   s?.difficulty[lang]  ?? "—"),
    statValue("♛", t("bestForLabel"),      s?.bestFor[lang]     ?? "—")
  ])

  // Wrap content in a glass panel so the section reads as a premium card.
  const panel = el("div", { class: "gi-about-panel" }, [left, right])
  return el("section", { class: "gi-about" }, [panel])
}

/* ─── HOW TO PLAY ─────────────────────────────────────── */

function buildHowToPlay(game: Game, lang: ReturnType<typeof getLang>): HTMLElement {
  const stepDescriptions = game.rules[lang]
  const steps = el("div", { class: "gi-steps" })

  for (let i = 0; i < 4; i++) {
    const titleKey: StepTitleKey = STEP_TITLE_KEYS[i] ?? "step1Title"
    const stepDescText = stepDescriptions[i] ?? ""
    const stepCard = el("div", { class: "gi-step", "data-step": String(i + 1) }, [
      el("div", { class: "gi-step-number", "aria-hidden": "true" }, [STEP_ICONS[i] ?? String(i + 1)]),
      el("span", { class: "gi-step-symbol", "aria-hidden": "true" }, [STEP_SYMBOLS[i] ?? "✦"]),
      el("h3", { class: "gi-step-title" }, [t(titleKey)]),
      el("p", { class: "gi-step-desc" }, [stepDescText])
    ])
    steps.appendChild(stepCard)
    if (i < 3) {
      steps.appendChild(el("div", { class: "gi-step-arrow", "aria-hidden": "true" }, ["→"]))
    }
  }

  return el("section", { class: "gi-section" }, [
    el("header", { class: "gi-section-header" }, [
      el("p", { class: "gi-section-eyebrow" }, [
        el("span", { class: "gi-ornament" }, ["❖"]),
        el("span", {}, [t("howToPlayTitle").toUpperCase()]),
        el("span", { class: "gi-ornament" }, ["❖"])
      ]),
      el("h2", { class: "gi-section-title" }, [t("howToPlayTitle")])
    ]),
    steps
  ])
}

/* ─── ROLES ───────────────────────────────────────────── */

function buildRoles(
  game: Game,
  lang: ReturnType<typeof getLang>,
  detail: ReturnType<typeof getWorldDetail>
): HTMLElement {
  const grid = el("div", { class: "gi-roles" })

  for (const role of game.roles) {
    const kind = roleBadge(role)
    const imgPath = detail?.roleImages?.[role.id]

    let iconEl: HTMLElement
    if (imgPath) {
      // Real role artwork — sits in the icon box, the emoji becomes a fallback.
      iconEl = el("div", { class: "gi-role-icon gi-role-icon--image" }, [
        el("img", {
          src: imgPath,
          alt: role.name[lang],
          loading: "eager",
          decoding: "async",
          class: "gi-role-image"
        })
      ])
    } else {
      iconEl = el("div", { class: "gi-role-icon gi-role-icon--glyph", "aria-hidden": "true" }, [roleFallbackGlyph(kind)])
    }

    const bodyChildren: HTMLElement[] = [
      iconEl,
      el("div", { class: "gi-role-body" }, [
        el("h3", { class: "gi-role-name" }, [role.name[lang]]),
        el("p", { class: "gi-role-desc" }, [role.desc[lang]])
      ])
    ]
    // who-am-i uses category cards rather than factions — badge would be meaningless.
    if (game.theme !== "who-am-i") {
      bodyChildren.push(el("span", { class: "gi-role-badge" }, [badgeLabel(kind)]))
    }
    const card = el("div", { class: "gi-role", "data-badge": kind }, bodyChildren)
    grid.appendChild(card)
  }

  return el("section", { class: "gi-section" }, [
    el("header", { class: "gi-section-header" }, [
      el("p", { class: "gi-section-eyebrow" }, [
        el("span", { class: "gi-ornament" }, ["❖"]),
        el("span", {}, [t("rolesInGameTitle").toUpperCase()]),
        el("span", { class: "gi-ornament" }, ["❖"])
      ]),
      el("h2", { class: "gi-section-title" }, [t("rolesInGameTitle")])
    ]),
    grid
  ])
}

/* ─── CATEGORIES (for guessing/party games like Who Am I) ─ */

/* 6 featured categories surfaced on the detail page preview. */
const FEATURED_CATEGORY_KEYS = ["animals", "jobs", "food", "countries", "movies", "music"] as const

/* Curated groupings for the Category Setup modal. Categories may appear in
   more than one group (e.g. movies is both Popular and Entertainment). */
type CatGroupTitleKey =
  | "catGroupPopular" | "catGroupEveryday" | "catGroupEntertainment"
  | "catGroupKnowledge" | "catGroupFunny" | "catGroupAuto" | "catGroupModes"

const CATEGORY_GROUPS: Array<{ title: CatGroupTitleKey; keys: string[] }> = [
  { title: "catGroupPopular",       keys: ["animals", "jobs", "food", "movies", "countries", "sports", "music", "famous-people", "random"] },
  { title: "catGroupEveryday",      keys: ["objects", "home-items", "kitchen", "clothes", "school", "body-parts", "vehicles", "colors", "shapes", "daily-life", "hobbies", "nature"] },
  { title: "catGroupEntertainment", keys: ["movies", "tv-shows", "cartoons", "video-games", "music", "superheroes", "villains", "memes", "football"] },
  { title: "catGroupKnowledge",     keys: ["countries", "cities", "places", "historical", "famous-people", "brands", "technology", "apps-sites", "plants", "sea", "insects", "mythical"] },
  { title: "catGroupFunny",         keys: ["weird-objects", "funny-animals", "embarrassing", "memes", "inside-jokes", "family", "impossible", "hard-random", "kids-easy"] },
  { title: "catGroupAuto",          keys: ["car-brands", "car-models", "car-parts", "garage-tools", "mechanic-jobs", "road-signs", "car-problems", "engine-parts", "interior-car", "exterior-car", "tools"] },
  { title: "catGroupModes",         keys: ["mode-easy", "mode-medium", "mode-hard", "mode-expert", "mode-kids", "mode-adults", "mode-quick", "mode-long"] }
]

function buildCategoryCard(
  c: NonNullable<ReturnType<typeof getWorldDetail>>["categories"] extends Array<infer T> | undefined ? T : never,
  lang: ReturnType<typeof getLang>
): HTMLElement {
  const iconBox = el("span", { class: "gi-category-icon", "aria-hidden": "true" })
  iconBox.appendChild(buildCategoryIconSvg(c.icon))
  return el("div", {
    class: "gi-category",
    "data-difficulty": c.difficulty.toLowerCase()
  }, [
    iconBox,
    el("div", { class: "gi-category-text" }, [
      el("h3", { class: "gi-category-title" }, [c.title[lang]]),
      el("span", { class: "gi-category-diff" }, [difficultyLabel(c.difficulty)])
    ])
  ])
}

function buildCategories(
  lang: ReturnType<typeof getLang>,
  detail: ReturnType<typeof getWorldDetail>,
  onChoose: () => void
): HTMLElement | null {
  const cats = detail?.categories
  if (!cats || cats.length === 0) return null

  /* Preview: only the 6 featured cards. The full list lives in the setup modal. */
  let featured = FEATURED_CATEGORY_KEYS
    .map(k => cats.find(c => c.key === k))
    .filter((c): c is NonNullable<typeof c> => c != null)
  if (featured.length === 0) featured = cats.slice(0, 6)

  const grid = el("div", { class: "gi-categories gi-categories--preview" })
  for (const c of featured) grid.appendChild(buildCategoryCard(c, lang))

  const stats = el("p", { class: "gi-categories-stats" }, [
    el("strong", {}, [`${cats.length}+`]),
    el("span", {}, [" " + t("categoriesStats")])
  ])

  const cta = el("button", {
    class: "gi-cta gi-cta-secondary gi-cta-choose-cats",
    type: "button"
  }, [
    el("span", { class: "gi-cta-icon", "aria-hidden": "true" }, ["▦"]),
    el("span", {}, [t("chooseCategoriesBtn")])
  ])
  cta.addEventListener("click", onChoose)

  return el("section", { class: "gi-section" }, [
    el("header", { class: "gi-section-header" }, [
      el("p", { class: "gi-section-eyebrow" }, [
        el("span", { class: "gi-ornament" }, ["❖"]),
        el("span", {}, [t("categoriesTitle").toUpperCase()]),
        el("span", { class: "gi-ornament" }, ["❖"])
      ]),
      el("h2", { class: "gi-section-title" }, [t("categoriesTitle")])
    ]),
    grid,
    stats,
    cta
  ])
}

/* ─── CATEGORY SETUP MODAL (full category browser) ───────── */

function openCategorySetup(
  lang: ReturnType<typeof getLang>,
  detail: ReturnType<typeof getWorldDetail>,
  onCreate: () => void
): void {
  const cats = detail?.categories
  if (!cats || cats.length === 0) return
  if (document.getElementById("categorySetupOverlay")) return

  const overlay = el("div", {
    id: "categorySetupOverlay",
    class: "gi-setup-overlay"
  })

  // The modal is a back-stack layer: the phone's back gesture closes it
  // instead of leaving the page. Escape is handled globally by the same stack.
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
  }
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close() })

  const groups = el("div", { class: "gi-setup-groups" })
  const byKey = new Map(cats.map(c => [c.key, c]))
  for (const g of CATEGORY_GROUPS) {
    const grid = el("div", { class: "gi-categories gi-categories--setup" })
    for (const k of g.keys) {
      const c = byKey.get(k)
      if (c) grid.appendChild(buildCategoryCard(c, lang))
    }
    if (grid.children.length === 0) continue
    groups.appendChild(el("section", { class: "gi-setup-group" }, [
      el("h3", { class: "gi-setup-group-title" }, [
        el("span", { class: "gi-ornament" }, ["❖"]),
        el("span", {}, [t(g.title)])
      ]),
      grid
    ]))
  }

  if (groups.children.length === 0) {
    const grid = el("div", { class: "gi-categories gi-categories--setup" })
    for (const c of cats) grid.appendChild(buildCategoryCard(c, lang))
    groups.appendChild(el("section", { class: "gi-setup-group" }, [
      el("h3", { class: "gi-setup-group-title" }, [
        el("span", { class: "gi-ornament" }, ["FC"]),
        el("span", {}, [t("categoriesTitle")])
      ]),
      grid
    ]))
  }

  const startBtn = el("button", { class: "gi-cta gi-cta-primary", type: "button" }, [
    el("span", { class: "gi-cta-icon", "aria-hidden": "true" }, ["+"]),
    el("span", {}, [t("startWithSelection")])
  ])
  startBtn.addEventListener("click", () => {
    close()
    onCreate()
  })

  const cancelBtn = el("button", { class: "gi-cta gi-cta-ghost", type: "button" }, [t("cancel")])
  cancelBtn.addEventListener("click", close)

  const closeBtn = el("button", {
    class: "modal-close",
    type: "button",
    "aria-label": t("close"),
    title: t("close")
  }, ["✕"])
  closeBtn.addEventListener("click", close)

  const panel = el("div", {
    class: "gi-setup-panel",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "gi-setup-title"
  }, [
    closeBtn,
    el("header", { class: "gi-setup-header" }, [
      el("p", { class: "gi-section-eyebrow" }, [
        el("span", { class: "gi-ornament" }, ["❖"]),
        el("span", {}, [t("categorySetupTitle").toUpperCase()]),
        el("span", { class: "gi-ornament" }, ["❖"])
      ]),
      el("h2", { id: "gi-setup-title", class: "gi-section-title" }, [t("categorySetupTitle")])
    ]),
    groups,
    el("footer", { class: "gi-setup-footer" }, [cancelBtn, startBtn])
  ])
  overlay.appendChild(panel)
  document.body.appendChild(overlay)

  handle = pushLayer(close, "category-setup")
  requestAnimationFrame(() => overlay.classList.add("visible"))
}

/* ─── BOTTOM CTA ──────────────────────────────────────── */

function buildBottomCTA(
  game: Game,
  lang: ReturnType<typeof getLang>,
  detail: ReturnType<typeof getWorldDetail>,
  onCreate: () => void
): HTMLElement {
  const titleText = detail?.bottomCTA.title[lang] ?? game.title[lang]
  const subText = detail?.bottomCTA.subtitle[lang] ?? game.subtitle[lang]

  const createBtn = el("button", { class: "gi-cta gi-cta-primary", type: "button" }, [
    el("span", { class: "gi-cta-icon", "aria-hidden": "true" }, ["+"]),
    el("span", {}, [t("createRoom")])
  ])
  createBtn.addEventListener("click", onCreate)

  const joinBtn = el("button", { class: "gi-cta gi-cta-secondary", type: "button" }, [
    el("span", { class: "gi-cta-icon", "aria-hidden": "true" }, ["▢"]),
    el("span", {}, [t("joinRoom")])
  ])
  joinBtn.addEventListener("click", () => {
    void setView("joinView")
  })

  const bottom = el("section", { class: "gi-bottom" }, [
    el("div", { class: "gi-bottom-bg" }),
    el("div", { class: "gi-bottom-panel" }, [
      el("p", { class: "gi-bottom-star", "aria-hidden": "true" }, ["✦"]),
      el("h2", { class: "gi-bottom-title" }, [titleText]),
      el("p", { class: "gi-bottom-sub" }, [subText]),
      el("div", { class: "gi-actions gi-actions-center" }, [createBtn, joinBtn])
    ])
  ])
  // Prefer the dedicated ctaBackground; fall back to detailBackground if absent.
  const bottomBgImage = detail?.ctaBackground ?? detail?.detailBackground
  const bottomBgImageMobile = detail?.ctaBackgroundMobile ?? detail?.detailBackgroundMobile
  if (bottomBgImage) {
    const styles = [`--gi-bottom-bg-image: url("${bottomBgImage}")`]
    if (bottomBgImageMobile) {
      styles.push(`--gi-bottom-bg-image-mobile: url("${bottomBgImageMobile}")`)
    }
    bottom.setAttribute("style", styles.join("; "))
    bottom.classList.add("gi-bottom--has-image")
  }
  return bottom
}

/* ─── MOUNT ───────────────────────────────────────────── */

export const gameInfoView = {
  id: "gameInfoView" as const,
  mount() {
    const content = $<HTMLDivElement>("#gameInfoContent")
    const lang = getLang()
    const gameId = sessionStorage.getItem("role-room:selectedGame")
    const game = getGames().find(g => g.id === gameId)
    clear(content)
    if (!game) { void setView("homeView"); return () => {} }

    void applyTheme(game.theme).catch(() => {})
    content.setAttribute("data-theme", game.theme)   // enables per-game CSS scoping

    const detail = getWorldDetail(game.id)

    const onCreate = async () => {
      // The host is a player too now, so the room cannot be opened before we
      // know what to call them — and while we are asking, we may as well ask
      // who is allowed to find the room.
      const setup = await hostSetupDialog()
      if (!setup) return
      const r = await emit("admin:create-room", {
        gameId: game.id,
        hostName: setup.hostName,
        hostCharacter: setup.hostCharacter,
        hostAccessory: setup.hostAccessory,
        isPublic: setup.isPublic,
        requireApproval: setup.requireApproval
      })
      if (!r.ok) { showToast(t("errorGeneric")); return }
      const data = r.data as CreateRoomData
      session.save({ kind: "admin", code: data.code, adminSecret: data.adminSecret })
      await applyTheme(game.theme)
      void setView("adminView", { initial: data.room })
    }

    // Back to Worlds
    const back = el("button", {
      class: "gi-back",
      type: "button"
    }, [
      el("span", { class: "gi-back-arrow", "aria-hidden": "true" }, ["←"]),
      el("span", {}, [t("backToWorlds")])
    ])
    back.addEventListener("click", () => {
      clearTheme()
      goBack()
    })

    // Wrap the three middle sections so a single cinematic wallpaper sits behind
    // them continuously. For Who Am I (categories instead of factions), swap the
    // Roles section for the Categories preview (with Choose Categories CTA →
    // opens the Category Setup modal).
    const openSetup = (): void => openCategorySetup(lang, detail, onCreate)
    const categoriesSection = buildCategories(lang, detail, openSetup)
    const thirdSection = categoriesSection ?? buildRoles(game, lang, detail)
    const sectionsWrap = el("div", { class: "gi-sections-wrap" }, [
      buildAbout(lang, detail, game.subtitle[lang], game.theme),
      buildHowToPlay(game, lang),
      thirdSection
    ])
    if (detail?.sectionsBackground) {
      const styles = [`--gi-sections-bg-image: url("${detail.sectionsBackground}")`]
      if (detail.sectionsBackgroundMobile) {
        styles.push(`--gi-sections-bg-image-mobile: url("${detail.sectionsBackgroundMobile}")`)
      }
      sectionsWrap.setAttribute("style", styles.join("; "))
      sectionsWrap.classList.add("gi-sections-wrap--has-image")
    }

    content.append(
      back,
      buildHero(game, lang, detail, onCreate),
      sectionsWrap,
      buildBottomCTA(game, lang, detail, onCreate)
    )

    return () => {
      clear(content)
    }
  }
}
