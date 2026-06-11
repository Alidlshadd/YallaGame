import type { Game, LangCode } from "@shared/types.js"
import type { RoleAssignedPayload } from "@shared/events.js"
import { $, el, clear } from "../ui/dom.js"
import { getLang } from "../services/i18n.js"
import { setView } from "../router.js"
import { play } from "../services/sound.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { showReveal } from "../ui/roleReveal.js"
import { getGames } from "./home.js"
import { buildRolePool, assignRolesLocally, type LocalAssignment } from "../domain/local-roles.js"

const STORAGE_KEY = "role-room:local-play"

type Step = "game" | "names" | "settings" | "reveal" | "done"

interface LocalState {
  step: Step
  gameId: string | null
  playerNames: string[]
  settings: Record<string, number | boolean>
  assignments: LocalAssignment[]
  currentRevealIndex: number
}

let state: LocalState = freshState()

function freshState(): LocalState {
  return {
    step: "game",
    gameId: null,
    playerNames: [],
    settings: {},
    assignments: [],
    currentRevealIndex: 0
  }
}

function saveState(): void {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* */ }
}

function loadState(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) state = JSON.parse(raw)
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

function buildErrorMessage(container: HTMLElement, text: string): void {
  const existing = container.querySelector(".lp-error") as HTMLElement | null
  if (existing) { existing.textContent = text; return }
  container.appendChild(el("div", { class: "lp-error" }, [text]))
}

export const localPlayView = {
  id: "localPlayView" as const,
  mount() {
    const container = $<HTMLDivElement>("#localPlayContent")
    loadState()

    function render(): void {
      clear(container)
      const lang = getLang()
      const game = findGame(state.gameId)
      if (game) void applyTheme(game.theme).catch(() => {})
      else clearTheme()

      if (state.step === "game") renderGamePicker(container, lang, render)
      else if (state.step === "names" && game) renderNameEntry(container, lang, render, game)
      else if (state.step === "settings" && game) renderSettings(container, lang, render, game)
      else if (state.step === "reveal" && game) renderReveal(container, lang, render, game)
      else if (state.step === "done" && game) renderDone(container, lang, render, game)
      else {
        state.step = "game"
        renderGamePicker(container, lang, render)
      }
      saveState()
    }

    render()

    const onBack = () => {
      clearLocalState()
      clearTheme()
      setView("homeView")
    }
    const back = $<HTMLButtonElement>("#localPlayBack")
    back.addEventListener("click", onBack)

    return () => {
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
      state.gameId = game.id
      state.settings = { ...game.defaultSettings }
      state.step = "names"
      render()
    })
    grid.appendChild(card)
  }

  container.append(
    renderProgressBar(0, 4),
    el("h2", { class: "lp-title" }, ["Choose Your Game"]),
    el("p", { class: "lp-sub" }, ["Step 1 of 4 — Pick a game everyone wants to play"]),
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
        const remove = el("button", { class: "lp-name-remove", type: "button", "aria-label": "Remove player" }, ["×"])
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

  const continueBtn = el("button", { class: "lp-primary", type: "button" }, ["Continue →"])
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

  const backBtn = el("button", { class: "lp-back", type: "button" }, ["← Back"])
  backBtn.addEventListener("click", () => {
    state.step = "game"
    render()
  })

  container.append(
    renderProgressBar(1, 4),
    el("h2", { class: "lp-title" }, ["Player Names"]),
    el("p", { class: "lp-sub" }, [`Step 2 of 4 — Enter names for ${game.title[lang]} (min ${game.minPlayers})`]),
    el("div", { class: "lp-name-list" }),
    el("div", { class: "lp-actions" }, [addBtn]),
    el("div", { class: "lp-error" }, []),
    el("div", { class: "lp-actions" }, [backBtn, continueBtn])
  )
  renderList()
}

function renderSettings(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const settingsEl = el("div", { class: "lp-settings" })
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

  const assignBtn = el("button", { class: "lp-primary", type: "button" }, ["Assign Roles ▸"])
  assignBtn.addEventListener("click", () => {
    void play("transition")
    try {
      const pool = buildRolePool(game, state.settings, state.playerNames.length)
      state.assignments = assignRolesLocally(state.playerNames, pool)
      state.step = "reveal"
      state.currentRevealIndex = 0
      render()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to assign roles"
      if (msg === "NO_FILLER_ROLE")            buildErrorMessage(container, "Game configuration is broken (no filler role).")
      else if (msg === "TOO_MANY_SPECIAL_ROLES") buildErrorMessage(container, "Too many special roles for this player count. Reduce vampires/mafia/spies.")
      else                                      buildErrorMessage(container, msg)
    }
  })

  const backBtn = el("button", { class: "lp-back", type: "button" }, ["← Back"])
  backBtn.addEventListener("click", () => {
    state.step = "names"
    render()
  })

  container.append(
    renderProgressBar(2, 4),
    el("h2", { class: "lp-title" }, ["Configure"]),
    el("p", { class: "lp-sub" }, [`Step 3 of 4 — ${state.playerNames.length} players, customize ${game.title[lang]}`]),
    settingsEl,
    el("div", { class: "lp-error" }, []),
    el("div", { class: "lp-actions" }, [backBtn, assignBtn])
  )
}

function renderReveal(container: HTMLDivElement, lang: LangCode, render: () => void, game: Game): void {
  const player = state.assignments[state.currentRevealIndex]
  if (!player) {
    state.step = "done"
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
      roleData,
      name: player.name,
      code: "LOCAL",
      game
    }
    await showReveal({ payload, lang, onClose: () => {
      state.currentRevealIndex += 1
      if (state.currentRevealIndex >= state.assignments.length) {
        state.step = "done"
      }
      render()
    }})
  })

  card.appendChild(revealBtn)

  container.append(
    renderProgressBar(3, 4),
    card
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

  const homeBtn = el("button", { class: "lp-back", type: "button" }, ["Done · Back to Home"])
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
