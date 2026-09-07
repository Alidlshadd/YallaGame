import { el } from "./dom.js"
import { findCharacter } from "@shared/characters.js"
import { findAccessory } from "@shared/accessories.js"
import { buildAccessory } from "./accessory.js"
import type { LangCode } from "@shared/types.js"

export function characterImagePath(id: string): string {
  return findCharacter(id)?.portrait !== undefined ? "/assets/characters/avatar-atlas.png" : `/assets/characters/${id}.webp`
}
export function characterName(id: string, lang: LangCode): string { return findCharacter(id)?.name[lang] ?? "" }
export interface AvatarOptions { size?: number; class?: string; lazy?: boolean; accessory?: string | undefined }

// Eyes x/y, forehead y and face width, as percentages of each portrait viewport.
const ANCHORS = [
  [53,53,20,62],[53,53,19,60],[50,57,23,73],[53,50,21,70],[52,53,20,62],
  [50,53,22,75],[54,57,25,66],[54,52,20,60],[51,55,22,70],[53,53,22,70],
  [52,53,22,60],[51,53,20,60],[53,57,23,72],[50,54,23,70],[53,51,20,65],
  [52,54,21,62],[53,55,22,61],[51,66,24,66],[51,55,23,65],[52,53,20,63]
]

export function buildAvatar(character: string, playerName: string, lang: LangCode, opts: AvatarOptions = {}): HTMLElement {
  const def = findCharacter(character)
  const accessory = findAccessory(opts.accessory ?? "")
  const wrap = el("span", {
    class: `avatar${opts.class ? ` ${opts.class}` : ""}`,
    style: `--avatar-size:${opts.size ?? 32}px`, role: "img",
    "aria-label": [def?.name[lang] ?? playerName, accessory?.name[lang]].filter(Boolean).join(" · "),
    "data-avatar": character, "data-accessory": accessory?.id ?? ""
  })
  const face = el("span", { class: "avatar-face", "aria-hidden": "true" })
  wrap.append(face)
  const fallback = () => {
    face.replaceChildren(el("span", { class: "avatar-monogram" }, [[...playerName.trim()][0]?.toUpperCase() ?? "?"]))
    wrap.classList.add("avatar--monogram")
  }
  if (!def) { fallback(); return wrap }
  const img = el("img", { src: characterImagePath(def.id), alt: "", decoding: "async", ...(opts.lazy === false ? {} : { loading: "lazy" }) })
  if (def.portrait !== undefined) {
    // Viewports preserve the approved bitmap faces, with a single cached request.
    const x = [10,216,418,620,815][def.portrait % 5]!
    const y = [194,486,783,1086][Math.floor(def.portrait / 5)]!
    img.classList.add("avatar-atlas")
    img.style.cssText = `width:${1024/204*100}%;height:${1536/264*100}%;left:${-x/204*100}%;top:${-y/264*100}%`
    const [eyeX, eyeY, headY, width] = ANCHORS[def.portrait]!
    wrap.style.setProperty("--face-x", `${eyeX}%`)
    wrap.style.setProperty("--eye-y", `${eyeY}%`)
    wrap.style.setProperty("--head-y", `${headY}%`)
    wrap.style.setProperty("--face-width", `${width}%`)
  }
  img.addEventListener("error", fallback, { once: true })
  face.append(img)
  if (accessory) {
    const overlay = buildAccessory(accessory.id)
    if (overlay) { overlay.classList.add(`accessory-anchor--${accessory.anchor}`); wrap.append(overlay) }
  }
  return wrap
}
