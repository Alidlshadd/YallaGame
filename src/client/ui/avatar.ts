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
const ANCHORS: readonly [number, number, number, number][] = [
  [46.14,50.35,17.35,62],[47.12,50.35,16.35,60],[46.57,54.73,20.73,73],[52.02,47.73,18.73,70],[53.47,50.73,17.73,62],
  [46.57,53,22,75],[51.06,57,25,66],[54,52,20,60],[53.94,55,22,70],[55.94,53,22,70],
  [50.04,52.24,21.24,60],[51.98,52.24,19.24,60],[53.98,56.24,22.24,72],[54.41,53.24,22.24,70],[56.43,50.24,19.24,65],
  [51.51,54,21,62],[54.96,55,22,61],[52.96,66,24,66],[55.9,55,23,65],[55.92,53,20,63]
]

// The painted oval centers drift between rows; a uniform grid shifts the faces.
// Each origin centers one portrait inside its 204 x 264 viewport.
const PORTRAIT_ORIGINS: readonly [number, number][] = [
  [24,201],[228,201],[425,200],[622,200],[812,200],
  [17,486],[222,486],[418,486],[614,486],[809,486],
  [14,785],[214,785],[416,785],[611,785],[808,785],
  [11,1086],[212,1086],[414,1086],[610,1086],[807,1086]
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
    const [x, y] = PORTRAIT_ORIGINS[def.portrait]!
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
