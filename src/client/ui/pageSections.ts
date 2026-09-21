import { el } from "./dom.js"

/** Shared "eyebrow + title (+ description)" header, reused by How to Play,
 * Features and About for every section — same markup/classes the site
 * already styles (.how-header/.how-eyebrow/.how-title/.how-sub), so no new
 * CSS is needed just to keep the three pages visually consistent. */
export function sectionHeading(opts: { eyebrow?: string; title: string; description?: string; center?: boolean }): HTMLElement {
  const header = el("header", { class: `how-header${opts.center === false ? " how-header-start" : ""}` })
  if (opts.eyebrow) {
    header.append(
      el("p", { class: "how-eyebrow" }, [
        el("span", { class: "how-ornament", "aria-hidden": "true" }, ["◆"]),
        el("span", {}, [opts.eyebrow.toUpperCase()]),
        el("span", { class: "how-ornament", "aria-hidden": "true" }, ["◆"])
      ])
    )
  }
  header.append(el("h2", { class: "how-title" }, [opts.title]))
  if (opts.description) header.append(el("p", { class: "how-sub" }, [opts.description]))
  return header
}

export interface CtaOptions {
  variant?: "primary" | "secondary" | "ghost"
  glyph?: string
  onClick: () => void
}

/** Shared CTA button — the same .btn system used across the whole app (join,
 * admin, room screens), so these pages never invent their own button look. */
export function ctaButton(label: string, opts: CtaOptions): HTMLButtonElement {
  const variantClass = opts.variant === "secondary" ? "btn-secondary" : opts.variant === "ghost" ? "btn-ghost" : "btn-primary"
  const btn = el("button", { class: `btn ${variantClass}`, type: "button" }, [
    ...(opts.glyph ? [el("span", { class: "cta-icon", "aria-hidden": "true" }, [opts.glyph])] : []),
    el("span", {}, [label])
  ])
  btn.addEventListener("click", opts.onClick)
  return btn
}
