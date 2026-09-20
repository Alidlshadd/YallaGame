import type { Game, LangCode } from "@shared/types.js"
import { el } from "./dom.js"
import { t } from "../services/i18n.js"
import { worldCoverPath } from "../data/assets.js"

/* Short, dramatic taglines shown on each book cover (poster-style). Shared by
   the Worlds page and the Home page's featured-worlds teaser, so both render
   an identical card for the same game. */
const GAME_TAGLINES: Record<string, string> = {
  "vampire-village": "LIE. SEDUCE. SURVIVE.",
  "mafia-classic":   "TRUST IS A WEAPON.",
  "spy-game":        "SECRETS. MISSIONS. DECEPTION.",
  "who-am-i":        "ASK. GUESS. LAUGH.",
  "football-player-guess": "ASK. DRIBBLE. GUESS."
}

function taglineFor(game: Game, lang: LangCode): string {
  return GAME_TAGLINES[game.id] ?? game.subtitle[lang]
}

export function buildBookCover(game: Game, lang: LangCode, idx: number, onSelect: (gameId: string) => void): HTMLElement {
  const card = el("button", {
    class: "shelf-card game-card",
    type: "button",
    "data-game": game.id,
    "data-theme": game.theme,
    "data-position": String(idx),
    "aria-label": game.title[lang]
  })

  const frame = el("div", { class: "book-frame" })

  // TOP ornament header
  const top = el("div", { class: "book-top" }, [
    el("span", { class: "book-ornament" }, ["❖"]),
    el("span", { class: "book-kicker" }, [t("worldLabel").toUpperCase()]),
    el("span", { class: "book-ornament" }, ["❖"])
  ])

  // COVER artwork — only the first cover loads eagerly (LCP candidate);
  // the rest defer until they're scrolled into view to spare initial bandwidth.
  const cover = el("div", { class: "book-cover" })
  const backdrop = el("div", { class: "book-backdrop", "aria-hidden": "true" })
  const isFirst = idx === 0
  const img = el("img", {
    src: worldCoverPath(game.theme),
    alt: game.title[lang],
    loading: isFirst ? "eager" : "lazy",
    decoding: "async",
    fetchpriority: isFirst ? "high" : "low",
    width: "320",
    height: "480",
    class: "book-image"
  }) as HTMLImageElement
  if (img.complete) img.classList.add("loaded")
  else img.addEventListener("load", () => img.classList.add("loaded"), { once: true })
  cover.append(backdrop, img)
  // No per-theme FX layer on shelf cards. Neither the Worlds page nor the
  // Home teaser activate a [data-theme] on <html>, so theme-fx CSS (which is
  // gated by that selector) wouldn't apply anyway. Worse, spy-game's FX
  // builder emits raw HUD/binary text nodes that would appear unstyled and
  // leak across the cover. FX still runs on gameInfo + playerRoom where the
  // theme IS active.

  // BOTTOM title/tagline — tagline is always English poster art, wrap with
  // <bdi dir="ltr"> so adjacent RTL glyphs don't interleave with its punctuation.
  const bottom = el("div", { class: "book-bottom" }, [
    el("h3", { class: "book-title" }, [game.title[lang]]),
    el("p", { class: "book-tagline" }, [
      el("bdi", { dir: "ltr" }, [taglineFor(game, lang)])
    ]),
    el("span", { class: "book-emblem" }, ["✦"])
  ])

  frame.append(top, cover, bottom)
  card.appendChild(frame)

  card.addEventListener("click", () => { onSelect(game.id) })

  return card
}
