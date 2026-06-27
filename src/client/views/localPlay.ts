import type { Game, LangCode, Role } from "@shared/types.js"
import type { RoleAssignedPayload } from "@shared/events.js"
import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { setView } from "../router.js"
import { play } from "../services/sound.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { showReveal } from "../ui/roleReveal.js"
import { getGames } from "./home.js"
import { worldCoverPath } from "../data/assets.js"
import { buildRolePool, assignRolesLocally, type LocalAssignment } from "../domain/local-roles.js"
import { SPY_WORD_CATEGORIES, pickSpyWord } from "../domain/spy-data.js"
import {
  WHO_AM_I_CATEGORIES,
  RANDOM_MIX_KEY,
  pickWhoAmIWord,
  resolveCategoryLabel
} from "../domain/who-am-i-data.js"
import {
  FOOTBALL_CLUB_OPTIONS,
  FOOTBALL_DIFFICULTY_OPTIONS,
  FOOTBALL_EUROPE_LEAGUE_KEYS,
  FOOTBALL_LEAGUE_OPTIONS,
  FOOTBALL_MAX_HINTS,
  FOOTBALL_ROUND_SECONDS,
  FOOTBALL_STAR_CATEGORY_OPTIONS,
  footballLeagueLabel,
  pickFootballCards,
  type FootballCategoryKey,
  type FootballClubKey,
  type FootballDifficulty,
  type FootballLeagueKey,
  type FootballPlayerCard,
  type FootballStarCategoryKey
} from "../domain/football-player-data.js"
import "../themes/local-play.css"

const STORAGE_KEY = "role-room:local-play"
const SPY_GAME_ID = "spy-game"
const WHO_AM_I_GAME_ID = "who-am-i"
const FOOTBALL_GAME_ID = "football-player-guess"
/* After the unified word-categories.ts refactor: pick 4 broad categories
   that exist in the shared file and produce playable spy rounds out of the
   box. "iraq-kurdistan-cities" gives the audience a local hook. */
const DEFAULT_SPY_CATEGORIES = ["iraq-kurdistan-cities", "food-drinks", "jobs", "objects"]
const WHO_AM_I_RECENT_LIMIT = 8

type Step =
  | "game"
  | "names"
  | "settings"
  | "reveal"
  | "adminReview"
  | "discussion"
  | "vote"
  | "result"
  | "done"
  | "whoSetup"
  | "whoCountdown"
  | "whoRound"
  | "whoTimeUp"
  | "footballTurn"
  | "footballSummary"
type SpyResult = "citizens" | "spies"

interface FootballAssignment {
  name: string
  card: FootballPlayerCard
  hintsUsed: number
  solved: boolean
}

interface LocalState {
  step: Step
  gameId: string | null
  playerNames: string[]
  settings: Record<string, number | boolean>
  assignments: LocalAssignment[]
  currentRevealIndex: number
  spyCategoryIds: string[]
  customSpyWords: string
  spyWord: string | null
  roundEndsAt: number | null
  voteAttemptsLeft: number
  selectedSuspect: string | null
  lastVoteMessage: string | null
  result: SpyResult | null
  starterName: string | null
  whoCategoryKey: string
  whoCurrentWord: string | null
  whoCurrentWordCategory: string | null
  whoRecentWords: string[]
  footballCategoryKey: FootballCategoryKey
  footballLeagueKey: FootballLeagueKey
  footballStarCategoryKey: FootballStarCategoryKey
  footballClubKey: FootballClubKey
  footballDifficulty: FootballDifficulty
  footballRoundSeconds: number
  footballHintsEnabled: boolean
  footballMaxHints: number
  footballDuplicateCards: boolean
  footballAssignments: FootballAssignment[]
  footballCurrentIndex: number
  footballMessage: string | null
}

let state: LocalState = freshState()
let presetGameId: string | null = null

function freshState(): LocalState {
  return {
    step: "game",
    gameId: null,
    playerNames: [],
    settings: {},
    assignments: [],
    currentRevealIndex: 0,
    spyCategoryIds: [...DEFAULT_SPY_CATEGORIES],
    customSpyWords: "",
    spyWord: null,
    roundEndsAt: null,
    voteAttemptsLeft: 1,
    selectedSuspect: null,
    lastVoteMessage: null,
    result: null,
    starterName: null,
    whoCategoryKey: RANDOM_MIX_KEY,
    whoCurrentWord: null,
    whoCurrentWordCategory: null,
    whoRecentWords: [],
    footballCategoryKey: "mixed",
    footballLeagueKey: "mixed",
    footballStarCategoryKey: "all",
    footballClubKey: "all",
    footballDifficulty: "easy",
    footballRoundSeconds: 60,
    footballHintsEnabled: true,
    footballMaxHints: 1,
    footballDuplicateCards: false,
    footballAssignments: [],
    footballCurrentIndex: 0,
    footballMessage: null
  }
}

function saveState(): void {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* */ }
}

function loadState(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) state = { ...freshState(), ...JSON.parse(raw) }
  } catch { state = freshState() }
  migrateCategoryKeys()
}

/**
 * Map legacy category keys to their new equivalents after the unified
 * word-categories.ts refactor. Anything that has neither a remap nor a
 * matching current key is dropped — and if the resulting list is empty,
 * the Spy game falls back to its safe defaults so the user isn't stuck
 * with an unrunnable selection. Who Am I falls back to Random Mix.
 */
function migrateCategoryKeys(): void {
  const SPY_KEY_REMAP: Record<string, string> = {
    food: "food-drinks",
    school: "school-items",
    home: "home-items",
    entertainment: "movies-entertainment",
    city: "iraq-kurdistan-cities",
    famous_places: "famous-places",
    daily_actions: "movies-entertainment",
    famous: "movies-entertainment"
  }

  const validSpyIds = new Set(SPY_WORD_CATEGORIES.map(c => c.id))
  const remappedSpy: string[] = []
  for (const id of state.spyCategoryIds) {
    const next = SPY_KEY_REMAP[id] ?? id
    if (validSpyIds.has(next) && !remappedSpy.includes(next)) remappedSpy.push(next)
  }
  if (remappedSpy.length === 0) {
    state.spyCategoryIds = [...DEFAULT_SPY_CATEGORIES].filter(id => validSpyIds.has(id))
  } else {
    state.spyCategoryIds = remappedSpy
  }

  const WHO_KEY_REMAP: Record<string, string> = {
    famous: "movies-entertainment"
  }
  if (state.whoCategoryKey && state.whoCategoryKey !== RANDOM_MIX_KEY) {
    const next = WHO_KEY_REMAP[state.whoCategoryKey] ?? state.whoCategoryKey
    const valid = WHO_AM_I_CATEGORIES.some(c => c.key === next)
    state.whoCategoryKey = valid ? next : RANDOM_MIX_KEY
  }
}

function clearLocalState(): void {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* */ }
  state = freshState()
}

function findGame(id: string | null): Game | undefined {
  if (!id) return undefined
  return getGames().find(g => g.id === id)
}

function isSpyGame(game: Game): boolean {
  return game.id === SPY_GAME_ID
}

function isWhoAmIGame(game: Game): boolean {
  return game.id === WHO_AM_I_GAME_ID
}

function isFootballGame(game: Game): boolean {
  return game.id === FOOTBALL_GAME_ID
}

function buildErrorMessage(container: HTMLElement, text: string): void {
  const existing = container.querySelector(".lp-error") as HTMLElement | null
  if (existing) { existing.textContent = text; return }
  container.appendChild(el("div", { class: "lp-error" }, [text]))
}

function settingNumber(key: string, fallback: number): number {
  const value = Number(state.settings[key] ?? fallback)
  return Number.isFinite(value) ? value : fallback
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function spyText(lang: LangCode, key: "wordForPlayer" | "wordForSpy" | "citizensWin" | "spiesWin"): string {
  const text = {
    en: {
      wordForPlayer: "Secret word",
      wordForSpy: "The secret word is hidden from you. Blend in and avoid suspicion.",
      citizensWin: "The players found the spy.",
      spiesWin: "The spy won the game."
    },
    tr: {
      wordForPlayer: "Gizli kelime",
      wordForSpy: "Gizli kelime sana gösterilmiyor. Sorulara uyum sağla ve fark edilme.",
      citizensWin: "Oyuncular casusu buldu.",
      spiesWin: "Casus oyunu kazandı."
    },
    ar: {
      wordForPlayer: "الكلمة السرية",
      wordForSpy: "الكلمة السرية مخفية عنك. اندمج مع الباقين ولا تكشف نفسك.",
      citizensWin: "اللاعبون اكتشفوا الجاسوس.",
      spiesWin: "الجاسوس فاز باللعبة."
    },
    ku: {
      wordForPlayer: "وشەی نهێنی",
      wordForSpy: "وشە نهێنییەکە لێت شاراوەیە. لەگەڵ یاریزانانی تردا تێکەڵ بە و خۆت دەرمەخە.",
      citizensWin: "یاریزانان سیخوڕیان دۆزییەوە.",
      spiesWin: "سیخوڕ یارییەکەی بردەوە."
    }
  }
  return text[lang]?.[key] ?? text.en[key]
}

function localReviewText(
  lang: LangCode,
  key: "finishedTitle" | "finishedHint" | "adminButton" | "handoffHint" | "doneTitle" | "doneHint" | "doneBack" | "newGame"
): string {
  const text = {
    tr: {
      finishedTitle: "Bitti",
      finishedHint: "Tüm oyuncular kendi rolünü gördü. Şimdi cihazı admine geri ver.",
      adminButton: "Admin Rolleri Görsün",
      handoffHint: "Roller bu ekranda gizli tutulur. Admin butona basınca tüm liste açılır.",
      doneTitle: "Tüm Oyuncular Rollerini Aldı",
      doneHint: "Oyun başlayabilir. Gün, gece, konuşma ve oylama kurallarını grup içinde yönetin.",
      doneBack: "Bitti - Ana Sayfaya Dön",
      newGame: "Yeni Oyun"
    },
    en: {
      finishedTitle: "Done",
      finishedHint: "All players have seen their own role. Now hand the device back to the admin.",
      adminButton: "Admin: Show All Roles",
      handoffHint: "Roles stay hidden on this screen. The full list opens only after the admin continues.",
      doneTitle: "All Players Have Their Roles",
      doneHint: "The game can begin. Day phase, voting, and other rules happen in your group.",
      doneBack: "Done - Back to Home",
      newGame: "New Game"
    },
    ar: {
      finishedTitle: "انتهى",
      finishedHint: "كل اللاعبين شاهدوا أدوارهم. أعط الجهاز الآن للمدير.",
      adminButton: "المدير يرى كل الأدوار",
      handoffHint: "تبقى الأدوار مخفية هنا. تظهر القائمة الكاملة بعد متابعة المدير فقط.",
      doneTitle: "كل اللاعبين حصلوا على أدوارهم",
      doneHint: "يمكن أن تبدأ اللعبة. اليوم والليل والنقاش والتصويت تتم داخل المجموعة.",
      doneBack: "انتهى - العودة للرئيسية",
      newGame: "لعبة جديدة"
    },
    ku: {
      finishedTitle: "تەواو بوو",
      finishedHint: "هەموو یاریزانەکان ڕۆڵی خۆیان بینی. ئێستا ئامێرەکە بدەوە بە ئەدمین.",
      adminButton: "ئەدمین هەموو ڕۆڵەکان ببینێت",
      handoffHint: "ڕۆڵەکان لەم شاشەیەدا شاراوە دەمێننەوە. لیستی تەواو تەنها دوای بەردەوامبوونی ئەدمین دەکرێتەوە.",
      doneTitle: "هەموو یاریزانەکان ڕۆڵیان وەرگرت",
      doneHint: "یارییەکە دەتوانێت دەست پێ بکات. قۆناغەکان و دەنگدان لە ناو گرووپەکەتان بەڕێوە ببەن.",
      doneBack: "تەواو - گەڕانەوە بۆ سەرەکی",
      newGame: "یاری نوێ"
    }
  }
  return text[lang]?.[key] ?? text.en[key]
}

function prepareRound(game: Game, lang: LangCode): void {
  if (isSpyGame(game) && settingNumber("spyCount", 1) >= state.playerNames.length) {
    throw new Error("TOO_MANY_SPECIAL_ROLES")
  }

  const pool = buildRolePool(game, state.settings, state.playerNames.length)
  state.assignments = assignRolesLocally(state.playerNames, pool)
  state.currentRevealIndex = 0
  state.roundEndsAt = null
  state.selectedSuspect = null
  state.lastVoteMessage = null
  state.result = null
  state.starterName = null
  state.voteAttemptsLeft = Math.max(1, settingNumber("guessAttempts", 1))

  if (isSpyGame(game)) {
    state.spyWord = pickSpyWord(lang, state.spyCategoryIds, state.customSpyWords)
  } else {
    state.spyWord = null
  }

  state.step = "reveal"
}

function initialStepForGame(game: Game): Step {
  if (isFootballGame(game)) return "settings"
  return isWhoAmIGame(game) ? "whoSetup" : "names"
}

function seedStateForGame(gameId: string): boolean {
  const game = findGame(gameId)
  if (!game) return false
  state = {
    ...freshState(),
    gameId,
    settings: { ...game.defaultSettings },
    step: initialStepForGame(game)
  }
  return true
}

export const localPlayView = {
  id: "localPlayView" as const,
  mount(ctx: { gameId?: string } = {}) {
    const container = $<HTMLDivElement>("#localPlayContent")
    let activeTimer: number | undefined
    presetGameId = null
    loadState()

    if (typeof ctx.gameId === "string") {
      if (seedStateForGame(ctx.gameId)) presetGameId = ctx.gameId
    }

    function clearTimer(): void {
      if (activeTimer !== undefined) {
        window.clearInterval(activeTimer)
        activeTimer = undefined
      }
    }

    function render(): void {
      clearTimer()
      clear(container)
      const lang = getLang()
      const game = findGame(state.gameId)
      if (game) void applyTheme(game.theme).catch(() => {})
      else clearTheme()

      if (state.step === "game") renderGamePicker(container, lang, render)
      else if (state.step === "names" && game) renderNameEntry(container, lang, render, game)
      else if (state.step === "settings" && game) renderSettings(container, lang, render, game)
      else if (state.step === "reveal" && game) renderReveal(container, lang, render, game)
      else if (state.step === "adminReview" && game) renderAdminReview(container, lang, render)
      else if (state.step === "discussion" && game) renderDiscussion(container, render, id => { activeTimer = id })
      else if (state.step === "vote" && game) renderVote(container, render)
      else if (state.step === "result" && game) renderSpyResult(container, lang, render, game)
      else if (state.step === "done" && game) renderDone(container, lang, render, game)
      else if (state.step === "whoSetup" && game) renderWhoAmISetup(container, lang, render)
      else if (state.step === "whoCountdown" && game) renderWhoAmICountdown(container, lang, render, id => { activeTimer = id })
      else if (state.step === "whoRound" && game) renderWhoAmIRound(container, lang, render, id => { activeTimer = id })
      else if (state.step === "whoTimeUp" && game) renderWhoAmITimeUp(container, lang, render)
      else if (state.step === "footballTurn" && game) renderFootballTurn(container, render, id => { activeTimer = id })
      else if (state.step === "footballSummary" && game) renderFootballSummary(container, lang, render, game)
      else {
        state.step = "game"
        renderGamePicker(container, lang, render)
      }
      saveState()
    }

    render()

    const onBack = () => {
      clearTimer()
      const returnToGameId = presetGameId
      clearLocalState()
      if (returnToGameId) {
        sessionStorage.setItem("role-room:selectedGame", returnToGameId)
        void setView("gameInfoView")
      } else {
        clearTheme()
        void setView("homeView")
      }
    }
    const back = $<HTMLButtonElement>("#localPlayBack")
    back.addEventListener("click", onBack)

    return () => {
      clearTimer()
      back.removeEventListener("click", onBack)
    }
  }
}

function renderProgressBar(stepIdx: number, totalSteps: number): HTMLElement {
  const bar = el("div", { class: "lp-progress" })
  for (let i = 0; i < totalSteps; i++) {
    bar.appendChild(el("span", { class: i <= stepIdx ? "lp-progress-step done" : "lp-progress-step" }))
  }
  return bar
}

function renderGamePicker(container: HTMLDivElement, lang: LangCode, render: () => void): void {
  const games = getGames()

  const grid = el("div", { class: "lp-game-grid" })
  for (const game of games) {
    const card = el(
      "button",
      {
        class: "lp-game-card",
        "data-theme": game.theme,
        type: "button"
      },
      [
        el("img", {
          src: worldCoverPath(game.theme),
          alt: game.title[lang],
          loading: "lazy",
          decoding: "async",
          width: "200",
          height: "200"
        }),
        el("div", { class: "lp-game-info" }, [
          el("strong", {}, [game.title[lang]]),
          el("span", { class: "muted" }, [`Minimum ${game.minPlayers} players`])
        ])
      ]
    )
    card.addEventListener("click", () => {
      void play("click")
      const nextStep = initialStepForGame(game)
      state = { ...freshState(), gameId: game.id, settings: { ...game.defaultSettings }, step: nextStep }
      render()
    })
    grid.appendChild(card)
  }

  container.append(
    renderProgressBar(0, 4),
    buildSetupHeader("Local Play · Step 1 of 4", "Choose Your Game", "Pick a game everyone wants to play"),
    grid
  )
}

function renderNameEntry(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const list: string[] = state.playerNames.length > 0
    ? [...state.playerNames]
    : Array.from({ length: Math.max(game.minPlayers, 3) }, () => "")

  function renderList(): void {
    const listEl = container.querySelector(".lp-name-list") as HTMLDivElement | null
    if (!listEl) return
    clear(listEl)
    list.forEach((name, idx) => {
      const input = el("input", {
        type: "text",
        maxlength: "24",
        placeholder: `Player ${idx + 1}`,
        autocomplete: "off"
      }) as HTMLInputElement
      input.value = name
      input.addEventListener("input", () => { list[idx] = input.value })

      const row = el("div", { class: "lp-name-row" }, [
        el("span", { class: "lp-name-num" }, [String(idx + 1)]),
        input
      ])

      if (list.length > game.minPlayers) {
        const remove = el("button", { class: "lp-name-remove", type: "button", "aria-label": "Remove player" }, ["x"])
        remove.addEventListener("click", () => {
          list.splice(idx, 1)
          renderList()
        })
        row.appendChild(remove)
      }

      listEl.appendChild(row)
    })
  }

  const addBtn = el("button", { class: "lp-secondary", type: "button" }, ["+ Add Player"])
  addBtn.addEventListener("click", () => {
    void play("click", 0.3)
    list.push("")
    renderList()
  })

  const continueBtn = el("button", { class: "lp-primary", type: "button" }, ["Continue ->"])
  continueBtn.addEventListener("click", () => {
    void play("click")
    const validNames = list.map(n => n.trim()).filter(n => n.length > 0)
    const seen = new Set<string>()
    const duplicates = validNames.filter(n => {
      const lower = n.toLowerCase()
      if (seen.has(lower)) return true
      seen.add(lower)
      return false
    })
    if (validNames.length < game.minPlayers) {
      buildErrorMessage(container, `Need at least ${game.minPlayers} players (you have ${validNames.length})`)
      return
    }
    if (duplicates.length > 0) {
      buildErrorMessage(container, `Duplicate names: ${duplicates.join(", ")}`)
      return
    }
    state.playerNames = validNames
    state.step = "settings"
    render()
  })

  const backBtn = el("button", { class: "lp-back", type: "button" }, ["<- Back"])
  backBtn.addEventListener("click", () => {
    if (presetGameId) {
      clearLocalState()
      sessionStorage.setItem("role-room:selectedGame", presetGameId)
      void setView("gameInfoView")
      return
    }
    state.step = "game"
    render()
  })

  const totalSteps = isSpyGame(game) ? 6 : 4
  const stepNum = presetGameId ? 1 : 2
  container.append(
    renderProgressBar(presetGameId ? 0 : 1, totalSteps),
    presetGameId ? buildSelectedGameSummary(game, lang) : el("div", { class: "lp-selected-empty" }),
    buildSetupHeader(
      `Setup · Step ${stepNum} of ${totalSteps}`,
      "Player Names",
      `Enter the players joining this ${game.title[lang]} session (min ${game.minPlayers}).`
    ),
    el("div", { class: "lp-name-list" }),
    el("div", { class: "lp-actions" }, [addBtn]),
    el("div", { class: "lp-error" }, []),
    el("div", { class: "lp-actions" }, [backBtn, continueBtn])
  )
  renderList()
}

function buildSelectedGameSummary(game: Game, lang: LangCode): HTMLElement {
  return el("div", { class: "lp-selected-game" }, [
    el("span", { class: "lp-selected-game-badge", "aria-hidden": "true" }, [game.icon ?? "❖"]),
    el("div", { class: "lp-selected-game-text" }, [
      el("span", { class: "lp-selected-game-label" }, [t("whoAmISelectedGame")]),
      el("strong", {}, [game.title[lang]])
    ]),
    el("span", { class: "lp-selected-game-mode" }, [t("whoAmIPlayModeLocal")])
  ])
}

function buildSetupHeader(eyebrow: string, title: string, subtitle?: string): HTMLElement {
  const children: Array<HTMLElement | Node> = [
    el("p", { class: "lp-eyebrow" }, [eyebrow]),
    el("h2", { class: "lp-title" }, [title])
  ]
  if (subtitle) children.push(el("p", { class: "lp-sub" }, [subtitle]))
  return el("div", { class: "lp-header" }, children)
}

function renderSettings(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  if (isFootballGame(game)) {
    renderFootballSettings(container, lang, render, game)
    return
  }

  const settingsEl = el("div", { class: "lp-settings" })

  if (isSpyGame(game)) {
    settingsEl.appendChild(renderSpyWordSettings(lang))
  }

  for (const def of game.settings) {
    const id = `lp-setting-${def.key}`
    const labelText = def.label[lang]
    const value = state.settings[def.key]
    const row = el("label", { class: "lp-setting-row", for: id }, [el("span", {}, [labelText])])
    if (def.type === "number") {
      const input = el("input", {
        id, type: "number",
        min: String(def.min), max: String(def.max),
        value: String(value ?? def.min)
      }) as HTMLInputElement
      input.addEventListener("input", () => {
        state.settings[def.key] = Math.max(def.min, Math.min(def.max, Number(input.value) || def.min))
      })
      row.appendChild(input)
    } else {
      const input = el("input", { id, type: "checkbox" }) as HTMLInputElement
      input.checked = Boolean(value)
      input.addEventListener("change", () => { state.settings[def.key] = input.checked })
      row.appendChild(input)
    }
    settingsEl.appendChild(row)
  }

  const assignBtn = el("button", { class: "lp-primary", type: "button" }, [isSpyGame(game) ? "Start Spy Game" : "Assign Roles"])
  assignBtn.addEventListener("click", () => {
    void play("transition")
    try {
      prepareRound(game, lang)
      render()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to assign roles"
      if (msg === "NO_FILLER_ROLE") buildErrorMessage(container, "Game configuration is broken (no filler role).")
      else if (msg === "TOO_MANY_SPECIAL_ROLES") buildErrorMessage(container, "Too many spies for this player count.")
      else if (msg === "NO_SPY_WORDS") buildErrorMessage(container, "Choose at least one word category or add custom words.")
      else buildErrorMessage(container, msg)
    }
  })

  const backBtn = el("button", { class: "lp-back", type: "button" }, ["<- Back"])
  backBtn.addEventListener("click", () => {
    state.step = "names"
    render()
  })

  const totalSteps = isSpyGame(game) ? 6 : 4
  const stepNum = presetGameId ? 2 : 3
  container.append(
    renderProgressBar(presetGameId ? 1 : 2, totalSteps),
    presetGameId ? buildSelectedGameSummary(game, lang) : el("div", { class: "lp-selected-empty" }),
    buildSetupHeader(
      `Setup · Step ${stepNum} of ${totalSteps}`,
      isSpyGame(game) ? "Spy Setup" : "Configure",
      `${state.playerNames.length} players · customise ${game.title[lang]}`
    ),
    settingsEl,
    el("div", { class: "lp-error" }, []),
    el("div", { class: "lp-actions" }, [backBtn, assignBtn])
  )
}

function renderSpyWordSettings(lang: LangCode): HTMLElement {
  const selected = new Set(state.spyCategoryIds)
  const grid = el("div", { class: "lp-category-grid" })

  for (const category of SPY_WORD_CATEGORIES) {
    const checkbox = el("input", { type: "checkbox", value: category.id }) as HTMLInputElement
    checkbox.checked = selected.has(category.id)
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selected.add(category.id)
      else selected.delete(category.id)
      state.spyCategoryIds = [...selected]
    })

    grid.appendChild(el("label", { class: "lp-category-card" }, [
      checkbox,
      el("span", {}, [category.label[lang]])
    ]))
  }

  const custom = el("textarea", {
    class: "lp-custom-words",
    rows: "4",
    placeholder: "Custom words, comma or line separated"
  }) as HTMLTextAreaElement
  custom.value = state.customSpyWords
  custom.addEventListener("input", () => { state.customSpyWords = custom.value })

  return el("div", { class: "lp-spy-words" }, [
    el("h3", { class: "lp-section-title" }, ["Word categories"]),
    el("p", { class: "lp-sub" }, ["Pick one or more topics. Normal players see the secret word; spies do not."]),
    grid,
    el("label", { class: "lp-custom-label" }, [
      el("span", {}, ["Custom words"]),
      custom
    ])
  ])
}

function renderReveal(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const player = state.assignments[state.currentRevealIndex]
  if (!player) {
    state.step = isSpyGame(game) ? "discussion" : "done"
    render()
    return
  }
  const total = state.assignments.length
  const playerNumber = state.currentRevealIndex + 1

  const card = el("div", { class: "lp-reveal-stage" }, [
    el("p", { class: "lp-reveal-progress" }, [`Player ${playerNumber} of ${total}`]),
    el("h1", { class: "lp-reveal-name" }, [player.name]),
    el("p", { class: "lp-reveal-instruction" }, ["Make sure only you can see the screen"])
  ])

  const revealBtn = el("button", { class: "lp-primary lp-reveal-cta", type: "button" }, ["Tap to See Your Role"])
  revealBtn.addEventListener("click", async () => {
    void play("transition")
    const roleData = game.roles.find(r => r.id === player.roleId)
    if (!roleData) {
      buildErrorMessage(container, "Role data missing")
      return
    }
    const payload: RoleAssignedPayload = {
      role: player.roleId,
      roleData: isSpyGame(game) ? buildSpyRevealRole(roleData, player.roleId, lang) : roleData,
      name: player.name,
      code: "LOCAL",
      game
    }
    await showReveal({ payload, lang, onClose: () => {
      state.currentRevealIndex += 1
      if (state.currentRevealIndex >= state.assignments.length) {
        if (isSpyGame(game)) {
          state.roundEndsAt = Date.now() + settingNumber("roundMinutes", 5) * 60_000
          if (state.assignments.length > 0) {
            const pick = state.assignments[Math.floor(Math.random() * state.assignments.length)]!
            state.starterName = pick.name
          }
          state.step = "discussion"
        } else {
          state.step = "adminReview"
        }
      }
      render()
    }})
  })

  card.appendChild(revealBtn)

  container.append(
    renderProgressBar(3, isSpyGame(game) ? 6 : 4),
    card
  )
}

function renderAdminReview(container: HTMLDivElement, lang: LangCode, render: () => void): void {
  const continueBtn = el("button", { class: "lp-primary lp-reveal-cta", type: "button" }, [
    localReviewText(lang, "adminButton")
  ])
  continueBtn.addEventListener("click", () => {
    void play("click")
    state.step = "done"
    render()
  })

  container.append(
    renderProgressBar(4, 4),
    el("div", { class: "lp-reveal-stage lp-admin-review" }, [
      el("p", { class: "lp-reveal-progress" }, [localReviewText(lang, "finishedTitle")]),
      el("h1", { class: "lp-reveal-name" }, [localReviewText(lang, "finishedTitle")]),
      el("p", { class: "lp-reveal-instruction" }, [localReviewText(lang, "finishedHint")]),
      el("p", { class: "lp-reveal-instruction" }, [localReviewText(lang, "handoffHint")]),
      continueBtn
    ])
  )
}

function buildSpyRevealRole(role: Role, roleId: string, lang: LangCode): Role {
  const desc = { ...role.desc }
  desc[lang] = roleId === "spy"
    ? spyText(lang, "wordForSpy")
    : `${spyText(lang, "wordForPlayer")}: ${state.spyWord ?? "-"}`
  return { ...role, desc }
}

function renderDiscussion(container: HTMLDivElement, render: () => void, setTimer: (id: number) => void): void {
  if (!state.roundEndsAt) {
    state.roundEndsAt = Date.now() + settingNumber("roundMinutes", 5) * 60_000
  }
  if (!state.starterName && state.assignments.length > 0) {
    const pick = state.assignments[Math.floor(Math.random() * state.assignments.length)]!
    state.starterName = pick.name
  }

  const timer = el("div", { class: "lp-timer" }, ["00:00"])
  const firstQuestioner = state.starterName ?? state.assignments[0]?.name ?? "Player 1"
  const endBtn = el("button", { class: "lp-primary", type: "button" }, ["End Discussion"])
  endBtn.addEventListener("click", () => {
    state.step = "vote"
    render()
  })

  const updateTimer = () => {
    const remaining = (state.roundEndsAt ?? Date.now()) - Date.now()
    timer.textContent = formatTime(remaining)
    if (remaining <= 0) {
      state.step = "vote"
      render()
    }
  }
  updateTimer()
  setTimer(window.setInterval(updateTimer, 1000))

  container.append(
    renderProgressBar(4, 6),
    el("h2", { class: "lp-title" }, ["Discussion Time"]),
    timer,
    el("p", { class: "lp-sub" }, [`Ask each other questions without revealing the word. First question: ${firstQuestioner}`]),
    el("div", { class: "lp-actions" }, [endBtn])
  )
}

function renderVote(container: HTMLDivElement, render: () => void): void {
  const list = el("div", { class: "lp-suspect-grid" })
  for (const player of state.assignments) {
    const selected = state.selectedSuspect === player.name
    const button = el("button", {
      class: selected ? "lp-suspect selected" : "lp-suspect",
      type: "button"
    }, [player.name])
    button.addEventListener("click", () => {
      state.selectedSuspect = player.name
      render()
    })
    list.appendChild(button)
  }

  const submitBtn = el("button", { class: "lp-primary", type: "button" }, ["Send Vote"])
  submitBtn.addEventListener("click", () => {
    if (!state.selectedSuspect) {
      buildErrorMessage(container, "Choose a suspected spy.")
      return
    }
    const suspect = state.assignments.find(a => a.name === state.selectedSuspect)
    if (suspect?.roleId === "spy") {
      state.result = "citizens"
      state.step = "result"
    } else {
      state.voteAttemptsLeft -= 1
      if (state.voteAttemptsLeft <= 0) {
        state.result = "spies"
        state.step = "result"
      } else {
        state.lastVoteMessage = `Wrong guess. ${state.voteAttemptsLeft} attempt left.`
        state.selectedSuspect = null
      }
    }
    render()
  })

  container.append(
    renderProgressBar(5, 6),
    el("h2", { class: "lp-title" }, ["Who is the Spy?"]),
    el("p", { class: "lp-sub" }, [`Choose one suspect. Attempts left: ${state.voteAttemptsLeft}`]),
    list,
    el("div", { class: "lp-error" }, [state.lastVoteMessage ?? ""]),
    el("div", { class: "lp-actions" }, [submitBtn])
  )
}

function renderSpyResult(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const result = state.result ?? "spies"
  const spies = state.assignments.filter(a => a.roleId === "spy").map(a => a.name)
  const list = el("div", { class: "lp-done-list" })
  for (const a of state.assignments) {
    const role = game.roles.find(r => r.id === a.roleId)
    list.appendChild(el("div", { class: "lp-done-row" }, [
      el("span", { class: "lp-done-icon" }, [role?.icon ?? "?"]),
      el("span", { class: "lp-done-name" }, [a.name]),
      el("span", { class: "lp-done-role" }, [role?.name[lang] ?? a.roleId])
    ]))
  }

  const sameGroupBtn = el("button", { class: "lp-primary", type: "button" }, ["New Game (Same Group)"])
  sameGroupBtn.addEventListener("click", () => {
    void play("click")
    try {
      prepareRound(game, lang)
      render()
    } catch (err) {
      buildErrorMessage(container, err instanceof Error ? err.message : "Failed to start")
    }
  })

  const settingsBtn = el("button", { class: "lp-secondary", type: "button" }, ["Settings"])
  settingsBtn.addEventListener("click", () => {
    state.step = "settings"
    render()
  })

  const homeBtn = el("button", { class: "lp-back", type: "button" }, ["Back to Home"])
  homeBtn.addEventListener("click", () => {
    void play("click")
    clearLocalState()
    clearTheme()
    setView("homeView")
  })

  container.append(
    renderProgressBar(6, 6),
    el("h2", { class: "lp-title" }, [result === "citizens" ? spyText(lang, "citizensWin") : spyText(lang, "spiesWin")]),
    el("div", { class: "lp-result-card" }, [
      el("span", { class: "lp-result-label" }, ["Secret word"]),
      el("strong", {}, [state.spyWord ?? "-"]),
      el("span", { class: "lp-result-label" }, ["Spies"]),
      el("strong", {}, [spies.join(", ") || "-"])
    ]),
    list,
    el("div", { class: "lp-error" }, []),
    el("div", { class: "lp-actions" }, [homeBtn, settingsBtn, sameGroupBtn])
  )
}

function renderDone(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const list = el("div", { class: "lp-done-list" })
  for (const a of state.assignments) {
    const role = game.roles.find(r => r.id === a.roleId)
    list.appendChild(el("div", { class: "lp-done-row" }, [
      el("span", { class: "lp-done-icon" }, [role?.icon ?? "?"]),
      el("span", { class: "lp-done-name" }, [a.name]),
      el("span", { class: "lp-done-role" }, [role?.name[lang] ?? a.roleId])
    ]))
  }

  const restartBtn = el("button", { class: "lp-primary", type: "button" }, [localReviewText(lang, "newGame")])
  restartBtn.addEventListener("click", () => {
    void play("click")
    clearLocalState()
    render()
  })

  const homeBtn = el("button", { class: "lp-back", type: "button" }, [localReviewText(lang, "doneBack")])
  homeBtn.addEventListener("click", () => {
    void play("click")
    clearLocalState()
    clearTheme()
    setView("homeView")
  })

  container.append(
    renderProgressBar(4, 4),
    el("h2", { class: "lp-title" }, [localReviewText(lang, "doneTitle")]),
    el("p", { class: "lp-sub" }, [localReviewText(lang, "doneHint")]),
    list,
    el("div", { class: "lp-actions" }, [homeBtn, restartBtn])
  )
}

/* ────────────────────────────────────────────────────────────────
   WHO AM I — single-device flow (no names, countdown, seconds timer)
   ──────────────────────────────────────────────────────────────── */

/* Football Player Guess - named local flow with hidden football cards. */

function footballOptionButton(
  label: string,
  selected: boolean,
  onClick: () => void
): HTMLButtonElement {
  const btn = el("button", {
    class: selected ? "lp-football-option selected" : "lp-football-option",
    type: "button",
    "aria-pressed": selected ? "true" : "false"
  }, [label]) as HTMLButtonElement
  btn.addEventListener("click", () => {
    void play("click", 0.3)
    onClick()
  })
  return btn
}

function renderFootballSettings(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const settingsEl = el("div", { class: "lp-football-settings" })

  const buildLeagueButton = (opt: (typeof FOOTBALL_LEAGUE_OPTIONS)[number]): HTMLButtonElement =>
    footballOptionButton(opt.label, state.footballLeagueKey === opt.key, () => {
      state.footballLeagueKey = opt.key
      render()
    })

  const leagueMainRow = el("div", { class: "lp-football-options" })
  const leagueEuropeRow = el("div", { class: "lp-football-options" })
  const europeanKeys = new Set<string>(["european-mixed", ...FOOTBALL_EUROPE_LEAGUE_KEYS])
  for (const opt of FOOTBALL_LEAGUE_OPTIONS) {
    if (europeanKeys.has(opt.key)) leagueEuropeRow.appendChild(buildLeagueButton(opt))
    else leagueMainRow.appendChild(buildLeagueButton(opt))
  }

  const starCategoryRow = el("div", { class: "lp-football-options" })
  for (const opt of FOOTBALL_STAR_CATEGORY_OPTIONS) {
    starCategoryRow.appendChild(footballOptionButton(opt.label, state.footballStarCategoryKey === opt.key, () => {
      state.footballStarCategoryKey = opt.key
      render()
    }))
  }

  const clubMainRow = el("div", { class: "lp-football-options" })
  const clubPopularRow = el("div", { class: "lp-football-options" })
  const virtualClubKeys = new Set<FootballClubKey>(["all", "mixed-clubs", "world-popular-clubs"])
  for (const opt of FOOTBALL_CLUB_OPTIONS) {
    const row = virtualClubKeys.has(opt.key) ? clubMainRow : clubPopularRow
    row.appendChild(footballOptionButton(opt.label, state.footballClubKey === opt.key, () => {
      state.footballClubKey = opt.key
      render()
    }))
  }

  const difficultyRow = el("div", { class: "lp-football-options" })
  for (const opt of FOOTBALL_DIFFICULTY_OPTIONS) {
    difficultyRow.appendChild(footballOptionButton(opt.label, state.footballDifficulty === opt.key, () => {
      state.footballDifficulty = opt.key
      render()
    }))
  }

  const timeRow = el("div", { class: "lp-football-options" })
  for (const seconds of FOOTBALL_ROUND_SECONDS) {
    const label = seconds === 0 ? "No time" : `${seconds}s`
    timeRow.appendChild(footballOptionButton(label, state.footballRoundSeconds === seconds, () => {
      state.footballRoundSeconds = seconds
      render()
    }))
  }

  const hintsToggle = el("label", { class: "lp-football-toggle" }, [
    el("span", {}, ["Hints"]),
    el("input", { type: "checkbox" })
  ])
  const hintsInput = hintsToggle.querySelector("input") as HTMLInputElement
  hintsInput.checked = state.footballHintsEnabled
  hintsInput.addEventListener("change", () => {
    state.footballHintsEnabled = hintsInput.checked
    render()
  })

  const hintsRow = el("div", { class: "lp-football-options" })
  for (const count of FOOTBALL_MAX_HINTS) {
    hintsRow.appendChild(footballOptionButton(String(count), state.footballMaxHints === count, () => {
      state.footballMaxHints = count
      render()
    }))
  }

  const duplicateToggle = el("label", { class: "lp-football-toggle" }, [
    el("span", {}, ["Duplicate cards"]),
    el("input", { type: "checkbox" })
  ])
  const duplicateInput = duplicateToggle.querySelector("input") as HTMLInputElement
  duplicateInput.checked = state.footballDuplicateCards
  duplicateInput.addEventListener("change", () => {
    state.footballDuplicateCards = duplicateInput.checked
    saveState()
  })

  settingsEl.append(
    el("section", { class: "lp-football-fieldset" }, [
      el("h3", { class: "lp-section-title" }, ["League Category"]),
      el("p", { class: "lp-football-group-label" }, ["All"]),
      leagueMainRow,
      el("p", { class: "lp-football-group-label" }, ["Europe"]),
      leagueEuropeRow
    ]),
    el("section", { class: "lp-football-fieldset" }, [
      el("h3", { class: "lp-section-title" }, ["Star Category"]),
      starCategoryRow
    ]),
    el("section", { class: "lp-football-fieldset" }, [
      el("h3", { class: "lp-section-title" }, ["Club Filter"]),
      el("p", { class: "lp-football-group-label" }, ["Groups"]),
      clubMainRow,
      el("p", { class: "lp-football-group-label" }, ["Club Popular XI"]),
      clubPopularRow
    ]),
    el("section", { class: "lp-football-fieldset" }, [
      el("h3", { class: "lp-section-title" }, ["Difficulty"]),
      difficultyRow
    ]),
    el("section", { class: "lp-football-fieldset" }, [
      el("h3", { class: "lp-section-title" }, ["Round time"]),
      timeRow
    ]),
    el("section", { class: "lp-football-fieldset" }, [
      hintsToggle,
      hintsRow
    ]),
    el("section", { class: "lp-football-fieldset" }, [
      duplicateToggle
    ])
  )

  const startBtn = el("button", { class: "lp-primary", type: "button" }, ["Start Football Guess"])
  startBtn.addEventListener("click", () => {
    void play("transition")
    try {
      prepareFootballRound()
      render()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to assign football cards"
      if (msg === "NOT_ENOUGH_FOOTBALL_CARDS") {
        buildErrorMessage(container, "Not enough unique cards in this league, star, or club filter. Enable duplicate cards, choose broader filters, or use easier difficulty.")
      } else if (msg === "NO_FOOTBALL_CARDS") {
        buildErrorMessage(container, "No football cards match this league, star, and club filter.")
      } else {
        buildErrorMessage(container, msg)
      }
    }
  })

  const backBtn = el("button", { class: "lp-back", type: "button" }, ["<- Back"])
  backBtn.addEventListener("click", () => {
    if (presetGameId) {
      clearLocalState()
      sessionStorage.setItem("role-room:selectedGame", presetGameId)
      void setView("gameInfoView")
      return
    }
    state.step = "game"
    render()
  })

  const totalSteps = 3
  container.append(
    renderProgressBar(0, totalSteps),
    presetGameId ? buildSelectedGameSummary(game, lang) : el("div", { class: "lp-selected-empty" }),
    buildSetupHeader(
      `Setup - Step 1 of ${totalSteps}`,
      "Football Setup",
      "No player names needed. Pick options and start guessing."
    ),
    settingsEl,
    el("div", { class: "lp-error" }, []),
    el("div", { class: "lp-actions" }, [backBtn, startBtn])
  )
}

function prepareFootballRound(): void {
  const names = state.playerNames.length > 0 ? state.playerNames : ["Player"]
  const cards = pickFootballCards(
    names.length,
    state.footballCategoryKey,
    state.footballLeagueKey,
    state.footballStarCategoryKey,
    state.footballClubKey,
    state.footballDifficulty,
    state.footballDuplicateCards
  )
  state.footballAssignments = names.map((name, idx) => ({
    name,
    card: cards[idx]!,
    hintsUsed: 0,
    solved: false
  }))
  state.footballCurrentIndex = 0
  state.footballMessage = null
  state.roundEndsAt = null
  state.step = "footballTurn"
}

function normalizeGuess(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function advanceFootballTurn(render: () => void): void {
  if (state.playerNames.length === 0) {
    prepareFootballRound()
    render()
    return
  }
  state.footballCurrentIndex += 1
  state.footballMessage = null
  state.roundEndsAt = null
  if (state.footballCurrentIndex >= state.footballAssignments.length) {
    state.step = "footballSummary"
  }
  render()
}

function renderFootballTurn(container: HTMLDivElement, render: () => void, setTimer: (id: number) => void): void {
  const current = state.footballAssignments[state.footballCurrentIndex]
  if (!current) {
    state.step = "footballSummary"
    render()
    return
  }

  if (state.footballRoundSeconds > 0 && !state.roundEndsAt && !current.solved) {
    state.roundEndsAt = Date.now() + state.footballRoundSeconds * 1000
  }

  const timer = el("div", { class: "lp-timer lp-football-timer" }, [state.footballRoundSeconds === 0 ? "NO TIME" : "00"])
  if (state.footballRoundSeconds > 0) {
    const updateTimer = () => {
      const remainingMs = (state.roundEndsAt ?? Date.now()) - Date.now()
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000))
      timer.textContent = String(remaining)
      timer.classList.toggle("danger", remaining <= 5 && remaining > 0)
      if (remainingMs <= 0 && !current.solved) {
        state.footballMessage = `Time is up. The card was ${current.card.name}.`
        if (state.playerNames.length === 0) {
          current.solved = true
          state.roundEndsAt = null
          render()
        } else {
          advanceFootballTurn(render)
        }
      }
    }
    updateTimer()
    setTimer(window.setInterval(updateTimer, 250))
  }

  const hints = current.card.hints.slice(0, current.hintsUsed)
  const hintList = el("div", { class: "lp-football-hints" })
  if (hints.length === 0) {
    hintList.appendChild(el("span", { class: "lp-football-hint muted" }, ["No hints used"]))
  } else {
    for (const hint of hints) hintList.appendChild(el("span", { class: "lp-football-hint" }, [hint]))
  }

  const card = el("div", { class: "lp-football-card" }, [
    el("p", { class: "lp-who-meta" }, [`${footballLeagueLabel(current.card.leagueCategory)} - ${current.card.position} - ${current.card.difficulty}`]),
    el("p", { class: "lp-who-identity-label" }, [state.playerNames.length === 0 ? "Football Player Card" : `${current.name}'s card`]),
    el("h1", { class: "lp-who-word lp-football-player-name" }, [current.card.name]),
    hintList
  ])

  const guessInput = el("input", {
    class: "lp-football-guess-input",
    type: "text",
    maxlength: "48",
    placeholder: "Type final guess"
  }) as HTMLInputElement

  const submitBtn = el("button", { class: "lp-primary", type: "button" }, ["Submit Guess"])
  submitBtn.addEventListener("click", () => {
    const guess = normalizeGuess(guessInput.value)
    if (!guess) {
      buildErrorMessage(container, "Enter a guess first.")
      return
    }
    if (guess === normalizeGuess(current.card.name)) {
      current.solved = true
      state.roundEndsAt = null
      state.footballMessage = `Correct. ${current.name} found ${current.card.name}.`
    } else {
      state.footballMessage = `Wrong guess: ${guessInput.value.trim()}. Keep asking.`
    }
    render()
  })

  const hintBtn = el("button", { class: "lp-secondary", type: "button" }, ["Show Hint"])
  const maxHints = state.footballHintsEnabled ? state.footballMaxHints : 0
  hintBtn.toggleAttribute("disabled", !state.footballHintsEnabled || current.hintsUsed >= maxHints)
  hintBtn.addEventListener("click", () => {
    if (!state.footballHintsEnabled || current.hintsUsed >= maxHints) return
    current.hintsUsed += 1
    state.footballMessage = `Hint ${current.hintsUsed} shown.`
    render()
  })

  const nextBtnLabel = state.playerNames.length === 0
    ? "New Card"
    : state.footballCurrentIndex + 1 >= state.footballAssignments.length ? "Finish Game" : "Next Player"
  const nextBtn = el("button", { class: "lp-secondary", type: "button" }, [nextBtnLabel])
  nextBtn.addEventListener("click", () => {
    void play("click")
    advanceFootballTurn(render)
  })

  container.append(
    renderProgressBar(1, 3),
    el("p", { class: "lp-sub lp-who-active-cat" }, [
      state.playerNames.length === 0 ? "Football Card" : `Player ${state.footballCurrentIndex + 1} of ${state.footballAssignments.length}`
    ]),
    timer,
    card,
    el("div", { class: "lp-football-guess-row" }, [guessInput, submitBtn]),
    el("div", { class: "lp-error" }, [state.footballMessage ?? ""]),
    el("div", { class: "lp-actions lp-who-actions" }, [hintBtn, nextBtn])
  )
}

function renderFootballSummary(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const solved = state.footballAssignments.filter(a => a.solved).length
  const list = el("div", { class: "lp-done-list lp-football-summary" })
  for (const a of state.footballAssignments) {
    list.appendChild(el("div", { class: "lp-done-row" }, [
      el("span", { class: "lp-done-icon" }, [a.solved ? "OK" : "--"]),
      el("span", { class: "lp-done-name" }, [a.name]),
      el("span", { class: "lp-done-role" }, [a.card.name])
    ]))
  }

  const sameGroupBtn = el("button", { class: "lp-primary", type: "button" }, ["New Cards"])
  sameGroupBtn.addEventListener("click", () => {
    void play("transition")
    try {
      prepareFootballRound()
      render()
    } catch (err) {
      buildErrorMessage(container, err instanceof Error ? err.message : "Failed to start")
    }
  })

  const settingsBtn = el("button", { class: "lp-secondary", type: "button" }, ["Settings"])
  settingsBtn.addEventListener("click", () => {
    state.step = "settings"
    render()
  })

  const homeBtn = el("button", { class: "lp-back", type: "button" }, [localReviewText(lang, "doneBack")])
  homeBtn.addEventListener("click", () => {
    void play("click")
    clearLocalState()
    clearTheme()
    setView("homeView")
  })

  container.append(
    renderProgressBar(4, 4),
    el("h2", { class: "lp-title" }, ["Final Score"]),
    el("p", { class: "lp-sub" }, [`${solved} of ${state.footballAssignments.length} players guessed correctly in ${game.title[lang]}.`]),
    list,
    el("div", { class: "lp-error" }, []),
    el("div", { class: "lp-actions" }, [homeBtn, settingsBtn, sameGroupBtn])
  )
}

function clampRoundSeconds(value: number): number {
  if (!Number.isFinite(value)) return 60
  return Math.max(15, Math.min(180, Math.round(value)))
}

function getRoundSeconds(): number {
  return clampRoundSeconds(settingNumber("roundSeconds", 60))
}

function renderWhoAmISetup(container: HTMLDivElement, lang: LangCode, render: () => void): void {
  if (!state.whoCategoryKey) state.whoCategoryKey = RANDOM_MIX_KEY

  const grid = el("div", { class: "lp-who-cat-grid" })

  const allOptions: Array<{ key: string; icon: string; label: string }> = [
    { key: RANDOM_MIX_KEY, icon: "🎲", label: t("whoAmIRandomMix") },
    ...WHO_AM_I_CATEGORIES.map(c => ({ key: c.key, icon: c.icon, label: c.label[lang] ?? c.label.en! }))
  ]

  const summary = el("p", { class: "lp-who-summary" }, [])

  function updateSummary(): void {
    clear(summary)
    summary.append(
      el("span", { class: "lp-who-summary-label" }, [`${t("whoAmISelectedCategory")}:`]),
      el("strong", {}, [resolveCategoryLabel(state.whoCategoryKey, lang)])
    )
  }

  for (const opt of allOptions) {
    const isSelected = opt.key === state.whoCategoryKey
    const card = el(
      "button",
      {
        class: isSelected ? "lp-who-cat selected" : "lp-who-cat",
        type: "button",
        "aria-pressed": isSelected ? "true" : "false",
        "data-key": opt.key
      },
      [
        el("span", { class: "lp-who-cat-icon" }, [opt.icon]),
        el("span", { class: "lp-who-cat-label" }, [opt.label])
      ]
    )
    card.addEventListener("click", () => {
      void play("click", 0.3)
      state.whoCategoryKey = opt.key
      for (const c of grid.querySelectorAll<HTMLElement>(".lp-who-cat")) {
        const active = c.dataset.key === opt.key
        c.classList.toggle("selected", active)
        c.setAttribute("aria-pressed", active ? "true" : "false")
      }
      updateSummary()
      saveState()
    })
    grid.appendChild(card)
  }

  updateSummary()

  // Round time slider/input
  const seconds = getRoundSeconds()
  const secondsInput = el("input", {
    type: "number",
    min: "15",
    max: "180",
    step: "5",
    value: String(seconds),
    class: "lp-who-seconds-input"
  }) as HTMLInputElement
  const secondsValue = el("span", { class: "lp-who-seconds-value" }, [`${seconds} ${t("whoAmISeconds")}`])
  secondsInput.addEventListener("input", () => {
    const v = clampRoundSeconds(Number(secondsInput.value))
    state.settings.roundSeconds = v
    secondsValue.textContent = `${v} ${t("whoAmISeconds")}`
    saveState()
  })

  const presetRow = el("div", { class: "lp-who-presets" })
  for (const preset of [30, 45, 60, 90, 120]) {
    const btn = el("button", {
      type: "button",
      class: preset === seconds ? "lp-who-preset selected" : "lp-who-preset"
    }, [`${preset}s`])
    btn.addEventListener("click", () => {
      void play("click", 0.3)
      state.settings.roundSeconds = preset
      secondsInput.value = String(preset)
      secondsValue.textContent = `${preset} ${t("whoAmISeconds")}`
      for (const b of presetRow.querySelectorAll<HTMLElement>(".lp-who-preset")) {
        b.classList.remove("selected")
      }
      btn.classList.add("selected")
      saveState()
    })
    presetRow.appendChild(btn)
  }

  const startBtn = el("button", { class: "lp-primary lp-who-start", type: "button" }, [t("whoAmIStartRound")])
  startBtn.addEventListener("click", () => {
    void play("transition")
    state.whoCurrentWord = null
    state.whoCurrentWordCategory = null
    state.whoRecentWords = []
    state.step = "whoCountdown"
    render()
  })

  const backBtn = el("button", { class: "lp-back", type: "button" }, ["<- Back"])
  backBtn.addEventListener("click", () => {
    if (presetGameId) {
      const game = findGame(presetGameId)
      const id = presetGameId
      clearLocalState()
      sessionStorage.setItem("role-room:selectedGame", id)
      if (game) void setView("gameInfoView")
      else void setView("homeView")
      return
    }
    state.step = "game"
    render()
  })

  const game = findGame(state.gameId)
  const summaryHeader = presetGameId && game ? buildSelectedGameSummary(game, lang) : null

  const children: Array<HTMLElement | Node> = [
    renderProgressBar(0, 3),
    buildSetupHeader(
      "Setup · Step 1 of 3",
      t("whoAmIChooseCategory"),
      `Pick a category. ${t("whoAmIRandomMix")} blends them all.`
    ),
    grid,
    summary,
    el("div", { class: "lp-who-time-block" }, [
      el("h3", { class: "lp-section-title" }, [`${t("whoAmIRoundTime")} (${t("whoAmISeconds")})`]),
      presetRow,
      el("label", { class: "lp-who-seconds-row" }, [
        secondsInput,
        secondsValue
      ])
    ]),
    el("div", { class: "lp-actions" }, [backBtn, startBtn])
  ]
  if (summaryHeader) children.unshift(summaryHeader)
  container.append(...children)
}

function pickNextWhoAmIWord(lang: LangCode): void {
  const picked = pickWhoAmIWord(state.whoCategoryKey, lang, state.whoRecentWords)
  state.whoCurrentWord = picked.word
  state.whoCurrentWordCategory = picked.categoryKey
  const recent = [picked.word, ...state.whoRecentWords]
  state.whoRecentWords = recent.slice(0, WHO_AM_I_RECENT_LIMIT)
}

function renderWhoAmICountdown(
  container: HTMLDivElement,
  lang: LangCode,
  render: () => void,
  setTimer: (id: number) => void
): void {
  if (!state.whoCurrentWord) {
    try { pickNextWhoAmIWord(lang) }
    catch {
      buildErrorMessage(container, "No words available.")
      state.step = "whoSetup"
      render()
      return
    }
  }

  const categoryLabel = resolveCategoryLabel(state.whoCategoryKey, lang)
  const numberEl = el("div", { class: "lp-who-countdown-num" }, ["5"])
  const stage = el("div", { class: "lp-who-countdown-stage" }, [
    el("p", { class: "lp-who-countdown-cat" }, [`${t("whoAmICategory")}: ${categoryLabel}`]),
    el("p", { class: "lp-who-countdown-ready" }, [t("whoAmIGetReady")]),
    numberEl
  ])

  const sequence = ["5", "4", "3", "2", "1", t("whoAmIGo")]
  let idx = 0

  const advance = () => {
    if (idx >= sequence.length) {
      state.roundEndsAt = Date.now() + getRoundSeconds() * 1000
      state.step = "whoRound"
      render()
      return
    }
    numberEl.textContent = sequence[idx]!
    numberEl.classList.remove("anim")
    void numberEl.offsetWidth
    numberEl.classList.add("anim")
    if (idx < sequence.length - 1) void play("click", 0.25)
    else void play("transition")
    idx += 1
  }

  advance()
  setTimer(window.setInterval(advance, 1000))

  container.append(
    renderProgressBar(1, 3),
    stage
  )
}

function renderWhoAmIRound(
  container: HTMLDivElement,
  lang: LangCode,
  render: () => void,
  setTimer: (id: number) => void
): void {
  if (!state.whoCurrentWord) {
    state.step = "whoCountdown"
    render()
    return
  }

  if (!state.roundEndsAt) {
    state.roundEndsAt = Date.now() + getRoundSeconds() * 1000
  }

  const wordCategoryKey = state.whoCurrentWordCategory ?? state.whoCategoryKey
  const wordCategoryLabel = resolveCategoryLabel(wordCategoryKey, lang)
  const selectedCategoryLabel = resolveCategoryLabel(state.whoCategoryKey, lang)

  const timer = el("div", { class: "lp-timer lp-who-timer" }, ["00"])
  const updateTimer = () => {
    const remainingMs = (state.roundEndsAt ?? Date.now()) - Date.now()
    const remaining = Math.max(0, Math.ceil(remainingMs / 1000))
    timer.textContent = String(remaining)
    timer.classList.toggle("danger", remaining <= 5 && remaining > 0)
    if (remainingMs <= 0) {
      state.step = "whoTimeUp"
      render()
    }
  }
  updateTimer()
  setTimer(window.setInterval(updateTimer, 250))

  const card = el("div", { class: "lp-who-word-card" }, [
    el("p", { class: "lp-who-meta" }, [
      `${t("whoAmICategory")}: ${wordCategoryLabel}`
    ]),
    el("p", { class: "lp-who-identity-label" }, [t("whoAmIYourIdentity")]),
    el("h1", { class: "lp-who-word" }, [state.whoCurrentWord!])
  ])

  const nextBtn = el("button", { class: "lp-secondary", type: "button" }, [t("whoAmINewWord")])
  nextBtn.addEventListener("click", () => {
    void play("click")
    try {
      pickNextWhoAmIWord(lang)
      render()
    } catch {
      buildErrorMessage(container, "No words available.")
    }
  })

  const endBtn = el("button", { class: "lp-primary", type: "button" }, [t("whoAmIEndRound")])
  endBtn.addEventListener("click", () => {
    void play("click")
    state.step = "whoTimeUp"
    render()
  })

  const changeBtn = el("button", { class: "lp-back", type: "button" }, [t("whoAmIChangeCategory")])
  changeBtn.addEventListener("click", () => {
    void play("click", 0.3)
    state.roundEndsAt = null
    state.whoCurrentWord = null
    state.whoCurrentWordCategory = null
    state.step = "whoSetup"
    render()
  })

  const meta = el("p", { class: "lp-sub lp-who-active-cat" }, [
    `${t("whoAmISelectedCategory")}: ${selectedCategoryLabel}`
  ])

  container.append(
    renderProgressBar(2, 3),
    meta,
    timer,
    card,
    el("div", { class: "lp-actions lp-who-actions" }, [changeBtn, nextBtn, endBtn])
  )
}

function renderWhoAmITimeUp(container: HTMLDivElement, lang: LangCode, render: () => void): void {
  state.roundEndsAt = null
  const lastWord = state.whoCurrentWord ?? "-"
  const lastCategory = resolveCategoryLabel(state.whoCurrentWordCategory ?? state.whoCategoryKey, lang)

  const playAgainBtn = el("button", { class: "lp-primary", type: "button" }, [t("whoAmIRestart")])
  playAgainBtn.addEventListener("click", () => {
    void play("transition")
    state.whoCurrentWord = null
    state.whoCurrentWordCategory = null
    state.step = "whoCountdown"
    render()
  })

  const setupBtn = el("button", { class: "lp-secondary", type: "button" }, [t("whoAmIBackToSetup")])
  setupBtn.addEventListener("click", () => {
    void play("click")
    state.whoCurrentWord = null
    state.whoCurrentWordCategory = null
    state.step = "whoSetup"
    render()
  })

  const homeBtn = el("button", { class: "lp-back", type: "button" }, [localReviewText(lang, "doneBack")])
  homeBtn.addEventListener("click", () => {
    void play("click")
    clearLocalState()
    clearTheme()
    setView("homeView")
  })

  container.append(
    renderProgressBar(2, 3),
    el("div", { class: "lp-reveal-stage lp-who-timeup" }, [
      el("p", { class: "lp-reveal-progress" }, [t("whoAmITimesUp")]),
      el("h1", { class: "lp-reveal-name" }, [t("whoAmITimesUp")]),
      el("p", { class: "lp-who-meta" }, [`${t("whoAmICategory")}: ${lastCategory}`]),
      el("p", { class: "lp-who-identity-label" }, [t("whoAmIYourIdentity")]),
      el("h2", { class: "lp-who-word lp-who-word-small" }, [lastWord]),
      el("div", { class: "lp-actions lp-who-actions" }, [homeBtn, setupBtn, playAgainBtn])
    ])
  )
}
