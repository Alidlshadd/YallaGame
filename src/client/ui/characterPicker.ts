import { el, clear } from "./dom.js"
import { t } from "../services/i18n.js"
import { buildAvatar } from "./avatar.js"
import { CHARACTERS } from "@shared/characters.js"
import type { LangCode } from "@shared/types.js"

const LAST_CHARACTER_KEY = "role-room:last-character"

export interface CharacterPicker {
  element: HTMLElement
  /** The chosen id, or "" while nothing is picked. */
  value: () => string
  /** Re-render with a fresh set of claimed ids, keeping the pick if still free. */
  setTaken: (taken: string[]) => void
}

/**
 * The grid of faces on the join screen. Characters already claimed in the room
 * are shown but not selectable — seeing that the Wolf is gone is more useful
 * than wondering where it went.
 */
export function buildCharacterPicker(
  lang: LangCode,
  taken: string[],
  onChange: (id: string) => void
): CharacterPicker {
  const grid = el("div", { class: "char-grid", role: "radiogroup", "aria-label": t("chooseCharacter") })
  let claimed = new Set(taken)
  let chosen = ""

  function render(): void {
    clear(grid)
    for (const def of CHARACTERS) {
      const isTaken = claimed.has(def.id)
      const tile = el("button", {
        class: "char-tile",
        type: "button",
        role: "radio",
        "aria-checked": String(chosen === def.id),
        "aria-label": def.name[lang],
        title: isTaken ? `${def.name[lang]} — ${t("characterTaken")}` : def.name[lang],
        "data-character": def.id
      }, [
        buildAvatar(def.id, def.name[lang], lang, { size: 64, class: "avatar--tile", lazy: false }),
        el("span", { class: "char-tile-name" }, [def.name[lang]])
      ]) as HTMLButtonElement

      if (isTaken) {
        tile.disabled = true
        tile.classList.add("is-taken")
      }
      tile.addEventListener("click", () => {
        chosen = def.id
        localStorage.setItem(LAST_CHARACTER_KEY, def.id)
        render()
        onChange(chosen)
      })
      grid.appendChild(tile)
    }
  }

  // Offer back the face they used last time, when it is still free here.
  const remembered = localStorage.getItem(LAST_CHARACTER_KEY) ?? ""
  if (remembered && !claimed.has(remembered) && CHARACTERS.some(c => c.id === remembered)) {
    chosen = remembered
  }
  render()
  if (chosen) onChange(chosen)

  return {
    element: grid,
    value: () => chosen,
    setTaken(next: string[]) {
      claimed = new Set(next)
      // Somebody took it while this screen was open; make them choose again
      // rather than letting them submit a pick the server will reject.
      if (chosen && claimed.has(chosen)) {
        chosen = ""
        onChange("")
      }
      render()
    }
  }
}
