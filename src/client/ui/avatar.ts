import { el } from "./dom.js"
import { findCharacter } from "@shared/characters.js"
import type { LangCode } from "@shared/types.js"

/** Artwork lives under public/assets/characters/<id>.webp. */
export function characterImagePath(id: string): string {
  return `/assets/characters/${id}.webp`
}

export function characterName(id: string, lang: LangCode): string {
  return findCharacter(id)?.name[lang] ?? ""
}

export interface AvatarOptions {
  /** Rendered pixel size; also the intrinsic size given to the tag. */
  size?: number
  /** Extra class on the wrapper, for per-context sizing. */
  class?: string
  lazy?: boolean
}

/**
 * A player's face. Falls back to the first letter of their name when they have
 * no character — seats taken before characters existed, and anyone the host
 * admitted after their pick was claimed by somebody faster.
 */
export function buildAvatar(
  character: string,
  playerName: string,
  lang: LangCode,
  opts: AvatarOptions = {}
): HTMLElement {
  const size = opts.size ?? 32
  const wrap = el("span", {
    class: `avatar${opts.class ? ` ${opts.class}` : ""}`,
    style: `--avatar-size:${size}px`
  })

  const def = findCharacter(character)
  if (!def) {
    wrap.classList.add("avatar--monogram")
    wrap.append(el("span", { class: "avatar-monogram", "aria-hidden": "true" }, [initialOf(playerName)]))
    return wrap
  }

  const img = el("img", {
    src: characterImagePath(def.id),
    alt: def.name[lang],
    width: String(size),
    height: String(size),
    decoding: "async",
    ...(opts.lazy === false ? {} : { loading: "lazy" })
  }) as HTMLImageElement

  // The art is dropped in separately from the code. Until a file exists — or
  // if one fails to load on a flaky connection — show the monogram rather than
  // a broken-image glyph.
  img.addEventListener("error", () => {
    wrap.classList.add("avatar--monogram")
    img.remove()
    wrap.append(el("span", { class: "avatar-monogram", "aria-hidden": "true" }, [initialOf(playerName)]))
  }, { once: true })

  wrap.appendChild(img)
  return wrap
}

function initialOf(name: string): string {
  const trimmed = name.trim()
  return trimmed ? [...trimmed][0]!.toUpperCase() : "?"
}
