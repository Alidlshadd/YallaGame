import type { Game, LangCode, Role } from "@shared/types.js"
import type { RoleAssignedPayload } from "@shared/events.js"
import { $, el, clear } from "../ui/dom.js"
import { getLang } from "../services/i18n.js"
import { setView } from "../router.js"
import { play } from "../services/sound.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { showReveal } from "../ui/roleReveal.js"
import { getGames } from "./home.js"
import { buildRolePool, assignRolesLocally, type LocalAssignment } from "../domain/local-roles.js"
import { SPY_WORD_CATEGORIES, pickSpyWord } from "../domain/spy-data.js"

const STORAGE_KEY = "role-room:local-play"
const SPY_GAME_ID = "spy-game"
const DEFAULT_SPY_CATEGORIES = ["places", "food", "jobs", "objects"]

type Step = "game" | "names" | "settings" | "reveal" | "discussion" | "vote" | "result" | "done"
type SpyResult = "citizens" | "spies"

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
}

let state: LocalState = freshState()

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
    result: null
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
    tr: {
      wordForPlayer: "Gizli kelime",
      wordForSpy: "Gizli kelime sana gosterilmiyor. Sorulara uyum sagla ve fark edilme.",
      citizensWin: "Oyuncular casusu buldu.",
      spiesWin: "Casus oyunu kazandi."
    },
    en: {
      wordForPlayer: "Secret word",
      wordForSpy: "The secret word is hidden from you. Blend in and avoid suspicion.",
      citizensWin: "The players found the spy.",
      spiesWin: "The spy won the game."
    }
  }
  return (lang === "tr" ? text.tr : text.en)[key]
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
  state.voteAttemptsLeft = Math.max(1, settingNumber("guessAttempts", 1))

  if (isSpyGame(game)) {
    state.spyWord = pickSpyWord(lang, state.spyCategoryIds, state.customSpyWords)
  } else {
    state.spyWord = null
  }

  state.step = "reveal"
}

export const localPlayView = {
  id: "localPlayView" as const,
  mount() {
    const container = $<HTMLDivElement>("#localPlayContent")
    let activeTimer: number | undefined
    loadState()

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
      else if (state.step === "discussion" && game) renderDiscussion(container, render, id => { activeTimer = id })
      else if (state.step === "vote" && game) renderVote(container, render)
      else if (state.step === "result" && game) renderSpyResult(container, lang, render, game)
      else if (state.step === "done" && game) renderDone(container, lang, render, game)
      else {
        state.step = "game"
        renderGamePicker(container, lang, render)
      }
      saveState()
    }

    render()

    const onBack = () => {
      clearTimer()
      clearLocalState()
      clearTheme()
      setView("homeView")
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
        el("img", { src: `/characters/${game.theme}.png`, alt: game.title[lang] }),
        el("div", { class: "lp-game-info" }, [
          el("strong", {}, [game.title[lang]]),
          el("span", { class: "muted" }, [`Minimum ${game.minPlayers} players`])
        ])
      ]
    )
    card.addEventListener("click", () => {
      void play("click")
      state = { ...freshState(), gameId: game.id, settings: { ...game.defaultSettings }, step: "names" }
      render()
    })
    grid.appendChild(card)
  }

  container.append(
    renderProgressBar(0, 4),
    el("h2", { class: "lp-title" }, ["Choose Your Game"]),
    el("p", { class: "lp-sub" }, ["Step 1 of 4 - Pick a game everyone wants to play"]),
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
        el("span", { class: "lp-name-num" }, [`${idx + 1}.`]),
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
    state.step = "game"
    render()
  })

  container.append(
    renderProgressBar(1, isSpyGame(game) ? 6 : 4),
    el("h2", { class: "lp-title" }, ["Player Names"]),
    el("p", { class: "lp-sub" }, [`Step 2 - Enter names for ${game.title[lang]} (min ${game.minPlayers})`]),
    el("div", { class: "lp-name-list" }),
    el("div", { class: "lp-actions" }, [addBtn]),
    el("div", { class: "lp-error" }, []),
    el("div", { class: "lp-actions" }, [backBtn, continueBtn])
  )
  renderList()
}

function renderSettings(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
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

  container.append(
    renderProgressBar(2, isSpyGame(game) ? 6 : 4),
    el("h2", { class: "lp-title" }, [isSpyGame(game) ? "Spy Setup" : "Configure"]),
    el("p", { class: "lp-sub" }, [`${state.playerNames.length} players - customize ${game.title[lang]}`]),
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
          state.step = "discussion"
        } else {
          state.step = "done"
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

  const timer = el("div", { class: "lp-timer" }, ["00:00"])
  const firstQuestioner = state.assignments[0]?.name ?? "Player 1"
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

  const restartBtn = el("button", { class: "lp-primary", type: "button" }, ["New Game"])
  restartBtn.addEventListener("click", () => {
    void play("click")
    clearLocalState()
    render()
  })

  const homeBtn = el("button", { class: "lp-back", type: "button" }, ["Done - Back to Home"])
  homeBtn.addEventListener("click", () => {
    void play("click")
    clearLocalState()
    clearTheme()
    setView("homeView")
  })

  container.append(
    renderProgressBar(4, 4),
    el("h2", { class: "lp-title" }, ["All Players Have Their Roles"]),
    el("p", { class: "lp-sub" }, ["The game can begin. Day phase, voting, and other rules happen in your group."]),
    list,
    el("div", { class: "lp-actions" }, [homeBtn, restartBtn])
  )
}
