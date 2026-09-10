import { el } from "./dom.js"
import { findCharacter } from "@shared/characters.js"
import { characterAccessory, findAccessory } from "@shared/accessories.js"
import { buildAccessory } from "./accessory.js"
import { portraitGeometry } from "./portraitGeometry.js"
import type { LangCode } from "@shared/types.js"

export function characterImagePath(id: string): string {
  const def = findCharacter(id)
  return def?.image ?? (def?.portrait !== undefined ? "/assets/characters/avatar-atlas.webp" : `/assets/characters/${id}.webp`)
}
export function characterName(id: string, lang: LangCode): string { return findCharacter(id)?.name[lang] ?? "" }
export interface AvatarOptions { size?: number; class?: string; lazy?: boolean; accessory?: string | undefined }

export function buildAvatar(character: string, playerName: string, lang: LangCode, opts: AvatarOptions = {}): HTMLElement {
  const def = findCharacter(character)
  const accessory = findAccessory(characterAccessory(character, opts.accessory))
  const geometry = def?.portrait !== undefined ? portraitGeometry(def.portrait) : undefined
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
    wrap.querySelector(".avatar-accessory")?.remove()
  }
  if (!def) { fallback(); return wrap }
  const img = el("img", { src: characterImagePath(def.id), alt: "", decoding: "async", ...(opts.lazy === false ? {} : { loading: "lazy" }) })
  if (geometry) {
    // Viewports preserve the approved bitmap faces, with a single cached request.
    const [x, y] = geometry.crop
    img.classList.add("avatar-atlas")
    img.style.cssText = `width:${1024/204*100}%;height:${1536/264*100}%;left:${-x/204*100}%;top:${-y/264*100}%`
  }
  img.addEventListener("error", fallback, { once: true })
  face.append(img)
  if (accessory && geometry) {
    const overlay = buildAccessory(accessory.id, geometry.fit)
    if (overlay) wrap.append(overlay)
  }
  return wrap
}
