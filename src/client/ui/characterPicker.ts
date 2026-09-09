import { el, clear } from "./dom.js"
import { t } from "../services/i18n.js"
import { buildAvatar } from "./avatar.js"
import { CHARACTERS } from "@shared/characters.js"
import { applyCharacterTheme } from "../themes/characterTheme.js"
import { ACCESSORIES, allowsAccessories, characterAccessory, findAccessory, isAccessoryId } from "@shared/accessories.js"
import type { LangCode } from "@shared/types.js"

const LAST_CHARACTER_KEY = "role-room:last-character"
const LAST_ACCESSORY_KEY = "role-room:last-accessory"
let pickerId = 0
function read(key: string): string { try { return localStorage.getItem(key) ?? "" } catch { return "" } }
function remember(key: string, value: string): void { try { localStorage.setItem(key, value) } catch { /* private storage */ } }

export interface CharacterPicker {
  element: HTMLElement
  value: () => string
  accessory: () => string
  setTaken: (taken: string[]) => void
}

export function buildCharacterPicker(lang: LangCode, taken: string[], onChange: (id: string) => void): CharacterPicker {
  const id = `avatar-picker-${pickerId++}`
  let claimed = new Set(taken)
  const saved = read(LAST_CHARACTER_KEY)
  let chosen = CHARACTERS.some(c => c.id === saved) && !claimed.has(saved) ? saved : ""
  const savedAccessory = read(LAST_ACCESSORY_KEY)
  let accessory = isAccessoryId(savedAccessory) ? savedAccessory : ""
  let activeTab = "characters"
  const preview = el("div", { class: "avatar-preview" })
  const previewName = el("strong")
  const previewDetail = el("span", { class: "avatar-preview-detail" })
  const surprise = el("button", { type: "button", class: "avatar-surprise", "aria-label": t("avatarRandom") }, ["⤨", el("span", {}, [t("avatarRandom")])])
  const stage = el("div", { class: "avatar-stage" }, [preview, el("div", { class: "avatar-preview-copy", "aria-live": "polite" }, [previewName, previewDetail]), surprise])
  const tabs = el("div", { class: "avatar-tabs", role: "tablist", "aria-label": t("avatarCustomize") })
  const characterTab = el("button", { type: "button", role: "tab", id: `${id}-characters-tab`, "aria-controls": `${id}-characters` }, [t("avatarCharacters"), el("span", {}, [String(CHARACTERS.length)])])
  const accessoryTab = el("button", { type: "button", role: "tab", id: `${id}-accessories-tab`, "aria-controls": `${id}-accessories` }, [t("avatarAccessories"), el("span", {}, [String(ACCESSORIES.length)])])
  tabs.append(characterTab, accessoryTab)
  const characterPanel = el("div", { id: `${id}-characters`, class: "avatar-picker-panel", role: "tabpanel", "aria-labelledby": characterTab.id })
  const accessoryPanel = el("div", { id: `${id}-accessories`, class: "avatar-picker-panel", role: "tabpanel", "aria-labelledby": accessoryTab.id })
  const grid = el("div", { class: "char-grid", role: "radiogroup", "aria-label": t("chooseCharacter") })
  const accessories = el("div", { class: "char-grid accessory-grid", role: "radiogroup", "aria-label": t("avatarAccessories") })
  characterPanel.append(grid)
  accessoryPanel.append(accessories)
  const element = el("div", { class: "avatar-picker" }, [stage, tabs, characterPanel, accessoryPanel])

  function renderPreview(): void {
    applyCharacterTheme(chosen)
    const def = CHARACTERS.find(c => c.id === chosen)
    preview.replaceChildren(buildAvatar(def?.id ?? CHARACTERS[0]!.id, "", lang, { size: 100, accessory, lazy: false }))
    previewName.textContent = def?.name[lang] ?? t("chooseCharacter")
    previewDetail.textContent = allowsAccessories(chosen) ? findAccessory(accessory)?.name[lang] ?? t("avatarMakeItYours") : t("avatarNoAccessory")
    surprise.disabled = CHARACTERS.every(c => claimed.has(c.id))
  }
  function renderCharacters(): void {
    const focused = grid.querySelector<HTMLElement>(":focus")?.dataset.character
    const scroll = grid.scrollTop
    clear(grid)
    const focusId = chosen || CHARACTERS.find(c => !claimed.has(c.id))?.id
    for (const def of CHARACTERS) {
      const isTaken = claimed.has(def.id)
      const tile = el("button", {
        class: `char-tile${isTaken ? " is-taken" : ""}`, type: "button", role: "radio",
        "aria-checked": String(chosen === def.id), "aria-label": `${def.name[lang]}${isTaken ? ` · ${t("characterTaken")}` : ""}`,
        title: def.name[lang], "data-character": def.id, tabindex: def.id === focusId ? "0" : "-1", disabled: isTaken
      }, [buildAvatar(def.id, def.name[lang], lang, { size: 64, class: "avatar--tile", lazy: false }), el("span", { class: "char-tile-name" }, [def.name[lang]])])
      tile.addEventListener("click", () => {
        chosen = def.id
        remember(LAST_CHARACTER_KEY, chosen)
        renderCharacters(); renderAccessories(); renderPreview(); onChange(chosen)
        grid.querySelector<HTMLButtonElement>(`[data-character="${chosen}"]`)?.focus({ preventScroll: true })
      })
      grid.append(tile)
    }
    grid.scrollTop = scroll
    if (focused) grid.querySelector<HTMLButtonElement>(`[data-character="${focused}"]:not(:disabled)`)?.focus({ preventScroll: true })
  }
  function renderAccessories(): void {
    const allowed = allowsAccessories(chosen)
    accessoryTab.disabled = !allowed
    if (!allowed) {
      accessory = ""
      remember(LAST_ACCESSORY_KEY, accessory)
      selectTab("characters")
    }
    const scroll = accessories.scrollTop
    clear(accessories)
    if (!allowed) return
    for (const def of [{ id: "", name: { [lang]: t("avatarNoAccessory") } }, ...ACCESSORIES]) {
      const tile = el("button", { class: "char-tile accessory-tile", type: "button", role: "radio", "aria-checked": String(accessory === def.id), "aria-label": def.name[lang]!, "data-accessory": def.id, tabindex: accessory === def.id ? "0" : "-1" })
      const icon = el("span", { class: "accessory-icon", "aria-hidden": "true" })
      const character = CHARACTERS.find(c => c.id === chosen) ?? CHARACTERS[0]!
      icon.append(buildAvatar(character.id, character.name[lang], lang, { size: 58, lazy: false, accessory: def.id }))
      tile.append(icon, el("span", { class: "char-tile-name" }, [def.name[lang]!]))
      tile.addEventListener("click", () => {
        accessory = def.id
        remember(LAST_ACCESSORY_KEY, accessory)
        renderAccessories(); renderPreview(); onChange(chosen)
        accessories.querySelector<HTMLButtonElement>(`[data-accessory="${accessory}"]`)?.focus({ preventScroll: true })
      })
      accessories.append(tile)
    }
    accessories.scrollTop = scroll
  }
  function selectTab(tab: string): void {
    activeTab = tab === "accessories" && !allowsAccessories(chosen) ? "characters" : tab
    const characters = activeTab === "characters"
    characterPanel.hidden = !characters
    accessoryPanel.hidden = characters
    characterTab.setAttribute("aria-selected", String(characters))
    accessoryTab.setAttribute("aria-selected", String(!characters))
    characterTab.tabIndex = characters ? 0 : -1
    accessoryTab.tabIndex = characters ? -1 : 0
  }
  characterTab.addEventListener("click", () => selectTab("characters"))
  accessoryTab.addEventListener("click", () => selectTab("accessories"))
  tabs.addEventListener("keydown", e => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return
    e.preventDefault()
    selectTab(e.key === "Home" ? "characters" : e.key === "End" ? "accessories" : activeTab === "characters" ? "accessories" : "characters")
    ;(activeTab === "characters" ? characterTab : accessoryTab).focus()
  })
  for (const group of [grid, accessories]) group.addEventListener("keydown", e => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return
    const buttons = [...group.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")]
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (current < 0 || !buttons.length) return
    e.preventDefault()
    const columns = Math.max(1, getComputedStyle(group).gridTemplateColumns.split(" ").length)
    const rtl = getComputedStyle(group).direction === "rtl"
    const delta = e.key === "ArrowDown" ? columns : e.key === "ArrowUp" ? -columns : (e.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1)
    const next = e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : (current + delta + buttons.length) % buttons.length
    buttons[next]?.click()
  })
  surprise.addEventListener("click", () => {
    const free = CHARACTERS.filter(c => !claimed.has(c.id))
    if (!free.length) return
    chosen = free[Math.floor(Math.random() * free.length)]!.id
    accessory = characterAccessory(chosen, ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)]!.id)
    remember(LAST_CHARACTER_KEY, chosen); remember(LAST_ACCESSORY_KEY, accessory)
    renderCharacters(); renderAccessories(); renderPreview(); onChange(chosen)
  })
  selectTab("characters"); renderCharacters(); renderAccessories(); renderPreview()
  // No synchronous callback here: the caller has not received its picker yet.
  return {
    element, value: () => chosen, accessory: () => accessory,
    setTaken(next) {
      if (next.length === claimed.size && next.every(id => claimed.has(id))) return
      claimed = new Set(next)
      if (chosen && claimed.has(chosen)) { chosen = ""; onChange("") }
      renderCharacters(); renderAccessories(); renderPreview()
    }
  }
}
