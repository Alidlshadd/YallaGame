/** Personal color override; the room's game theme remains independent. */
export function applyCharacterTheme(character = ""): void {
  if (character === "morinji") document.documentElement.setAttribute("data-character-theme", "morinji")
  else document.documentElement.removeAttribute("data-character-theme")
}
