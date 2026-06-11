import { el } from "./dom.js"
// Eagerly import all theme CSS so character-frame effects work
// regardless of whether a global data-theme is set on <html>.
import "../themes/vampire-village.css"
import "../themes/mafia-classic.css"
import "../themes/spy-game.css"

const BAT_SVG_PATH = "M0 9 L4 4 L8 7 L12 2 L15 6 L18 2 L22 7 L26 4 L30 9 L26 11 L22 9 L18 12 L15 9 L12 12 L8 9 L4 11 Z"

const HUD_TEXT = "TGT: 1\nLAT: 51.5\nLON: -0.12\nSTATUS: ACTIVE\nSIG: ●●●●○"

const CODE_COLUMNS = [
  "01101\n11010\n00111\n10101\n11001\n01110",
  "10110\n00011\n11100\n01010\n10011\n11010",
  "11001\n01101\n10010\n11110\n00101\n10110",
  "01011\n11100\n10101\n00110\n11010\n01001"
]

function buildVampireFx(): HTMLDivElement {
  const fx = el("div", { class: "theme-fx" }) as HTMLDivElement
  fx.appendChild(el("div", { class: "mist" }))
  for (let i = 0; i < 3; i++) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("class", "bat-svg")
    svg.setAttribute("viewBox", "0 0 30 18")
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("d", BAT_SVG_PATH)
    path.setAttribute("fill", "#000")
    svg.appendChild(path)
    fx.appendChild(svg)
  }
  for (let i = 0; i < 3; i++) fx.appendChild(el("span", { class: "blood-drop" }))
  fx.appendChild(el("div", { class: "lightning" }))
  return fx
}

function buildMafiaFx(): HTMLDivElement {
  const fx = el("div", { class: "theme-fx" }) as HTMLDivElement
  fx.appendChild(el("div", { class: "neon-flicker" }))
  fx.appendChild(el("div", { class: "match-glow" }))
  for (let i = 0; i < 4; i++) fx.appendChild(el("div", { class: "smoke-wisp" }))
  for (let i = 0; i < 7; i++) fx.appendChild(el("div", { class: "rain-streak" }))
  return fx
}

function buildSpyFx(): HTMLDivElement {
  const fx = el("div", { class: "theme-fx" }) as HTMLDivElement
  fx.appendChild(el("div", { class: "crt-lines" }))
  fx.appendChild(el("div", { class: "bracket tl" }))
  fx.appendChild(el("div", { class: "bracket tr" }))
  fx.appendChild(el("div", { class: "bracket bl" }))
  fx.appendChild(el("div", { class: "bracket br" }))
  fx.appendChild(el("div", { class: "hud-text" }, [HUD_TEXT]))
  for (const code of CODE_COLUMNS) fx.appendChild(el("div", { class: "code-col" }, [code]))
  fx.appendChild(el("div", { class: "scan-beam" }))
  return fx
}

const FX_BUILDERS: Record<string, () => HTMLDivElement> = {
  "vampire-village": buildVampireFx,
  "mafia-classic":   buildMafiaFx,
  "spy-game":        buildSpyFx
}

/**
 * Build a character frame with image + atmospheric layers + theme-specific FX.
 * Frame uses /characters/<theme>.png from publicDir.
 */
export function buildCharacterFrame(theme: string, alt: string): HTMLDivElement {
  const frame = el("div", { class: "character-frame" }) as HTMLDivElement
  const img = el("img", { src: `/characters/${theme}.png`, alt }) as HTMLImageElement
  frame.appendChild(img)
  frame.appendChild(el("div", { class: "spotlight" }))
  frame.appendChild(el("div", { class: "face-glow" }))
  const fxBuilder = FX_BUILDERS[theme]
  if (fxBuilder) frame.appendChild(fxBuilder())
  return frame
}
