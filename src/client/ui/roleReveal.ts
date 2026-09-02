import { el } from "./dom.js"
import { dismissLayer, pushLayer, type LayerHandle } from "../services/navigation.js"
import { animate, prefersReducedMotion, orchestrate, REVEAL_EASING } from "./motion.js"
import { vibrate } from "./haptics.js"
import { currentTheme } from "../themes/loader.js"
import type { RoleAssignedPayload } from "@shared/events.js"
import type { LangCode } from "@shared/types.js"

interface RevealOptions {
  payload: RoleAssignedPayload
  lang: LangCode
  onClose?: () => void
}

const SPY_THEME = "spy-game"

export function showReveal(opts: RevealOptions): Promise<void> {
  if (currentTheme() === SPY_THEME) return showSpyReveal(opts)
  return showFlipReveal(opts)
}

async function showFlipReveal(opts: RevealOptions): Promise<void> {
  const overlay = buildFlipOverlay(opts)
  document.body.appendChild(overlay)

  const closeBtn = overlay.querySelector<HTMLButtonElement>(".reveal-close")!
  const previouslyFocused = document.activeElement as HTMLElement | null

  return new Promise<void>(resolve => {
    // eslint-disable-next-line prefer-const
    let cancel: (() => void) | undefined

    let handle: LayerHandle | null = null
    let closed = false

    const cleanup = (): void => {
      if (closed) return
      closed = true
      dismissLayer(handle)
      cancel?.()
      animate(overlay, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" })
        .finished.then(() => {
          overlay.remove()
          previouslyFocused?.focus?.()
          opts.onClose?.()
          resolve()
        })
    }

    closeBtn.addEventListener("click", cleanup)
    // The card is a back-stack layer, so a back gesture closes the card rather
    // than the screen behind it. Escape reaches the same stack globally.
    handle = pushLayer(cleanup, "role-reveal")

    vibrate("reveal")
    requestAnimationFrame(() => overlay.classList.add("visible"))

    if (prefersReducedMotion()) {
      const stage = overlay.querySelector<HTMLElement>(".reveal-stage")!
      stage.querySelector<HTMLElement>(".reveal-icon")!.style.opacity = "1"
      stage.querySelector<HTMLElement>(".reveal-name")!.style.opacity = "1"
      stage.querySelector<HTMLElement>(".reveal-desc")!.style.opacity = "1"
      closeBtn.focus()
      return
    }

    const card = overlay.querySelector<HTMLElement>(".reveal-card")!
    const burst = overlay.querySelector<HTMLElement>(".reveal-burst")!
    const icon = overlay.querySelector<HTMLElement>(".reveal-icon")!
    const name = overlay.querySelector<HTMLElement>(".reveal-name")!
    const desc = overlay.querySelector<HTMLElement>(".reveal-desc")!

    card.style.transform = "rotateY(-180deg)"

    cancel = orchestrate([
      { at: 400, do: () => {
          animate(card, [
            { transform: "rotateY(-180deg)" },
            { transform: "rotateY(0deg)" }
          ], { duration: 400, easing: REVEAL_EASING })
        } },
      { at: 800, do: () => {
          animate(burst, [
            { opacity: 0, transform: "scale(0.6)" },
            { opacity: 0.8, transform: "scale(1.6)" },
            { opacity: 0, transform: "scale(2.0)" }
          ], { duration: 300 })
        } },
      { at: 1000, do: () => {
          animate(icon, [
            { opacity: 0, transform: "scale(0.8) translateY(8px)" },
            { opacity: 1, transform: "scale(1.0) translateY(0)" }
          ], { duration: 250 })
        } },
      { at: 1200, do: () => {
          animate(name, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 })
        } },
      { at: 1400, do: () => {
          animate(desc, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 })
        } },
      { at: 1600, do: () => { closeBtn.focus() } }
    ])
  })
}

function buildFlipOverlay(opts: RevealOptions): HTMLDivElement {
  const role = opts.payload.roleData
  const lang = opts.lang
  const dt = DOSSIER_TEXT[lang] ?? DOSSIER_TEXT.en
  const overlay = el("div", {
    class: "reveal-overlay",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Your role",
    tabindex: "-1"
  }) as HTMLDivElement

  const burst = el("div", { class: "reveal-burst" })
  const card = el("div", { class: "reveal-card" }, [
    el("p", { class: "reveal-player" }, [opts.payload.name]),
    el("div", { class: "reveal-icon" }, [role.icon]),
    el("h3", { class: "reveal-name" }, [role.name[lang]]),
    el("p", { class: "reveal-desc" }, [role.desc[lang]])
  ])

  const closeBtn = el("button", { class: "btn btn-secondary reveal-close" }, [dt.gotIt])

  const stage = el("div", { class: "reveal-stage" }, [burst, card])
  overlay.append(stage, closeBtn)
  return overlay
}

interface DossierText {
  accessing: string
  agent: string
  identity: string
  classified: string
  gotIt: string
}

const DOSSIER_TEXT: Record<LangCode, DossierText> = {
  en: { accessing: "ACCESSING DOSSIER…", agent: "AGENT", identity: "IDENTITY", classified: "CLASSIFIED", gotIt: "Got it" },
  tr: { accessing: "DOSYA AÇILIYOR…", agent: "AJAN", identity: "KİMLİK", classified: "ÇOK GİZLİ", gotIt: "Anladım" },
  ar: { accessing: "جاري فتح الملف…", agent: "العميل", identity: "الهوية", classified: "سري للغاية", gotIt: "فهمت" },
  ku: { accessing: "کردنەوەی دۆسیە…", agent: "ئاژان", identity: "ناسنامە", classified: "زۆر نهێنی", gotIt: "تێگەیشتم" }
}

async function showSpyReveal(opts: RevealOptions): Promise<void> {
  const dt = DOSSIER_TEXT[opts.lang] ?? DOSSIER_TEXT.en
  const isSpy = opts.payload.role === "spy"
  const overlay = buildSpyOverlay(opts, dt, isSpy)
  document.body.appendChild(overlay)

  const closeBtn = overlay.querySelector<HTMLButtonElement>(".reveal-close")!
  const previouslyFocused = document.activeElement as HTMLElement | null

  return new Promise<void>(resolve => {
    let handle: LayerHandle | null = null
    let closed = false

    const cleanup = (): void => {
      if (closed) return
      closed = true
      dismissLayer(handle)
      animate(overlay, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" })
        .finished.then(() => {
          overlay.remove()
          previouslyFocused?.focus?.()
          opts.onClose?.()
          resolve()
        })
    }
    closeBtn.addEventListener("click", cleanup)
    handle = pushLayer(cleanup, "role-reveal")

    vibrate("reveal")
    requestAnimationFrame(() => overlay.classList.add("visible"))

    const status = overlay.querySelector<HTMLElement>(".dossier-status .typewriter")!
    const stamp = overlay.querySelector<HTMLElement>(".dossier-stamp")!
    const identity = overlay.querySelector<HTMLElement>(".dossier-identity")!
    const desc = overlay.querySelector<HTMLElement>(".dossier-desc")!

    if (prefersReducedMotion()) {
      status.textContent = dt.accessing
      status.classList.add("done")
      stamp.style.opacity = "1"
      stamp.style.transform = "rotate(-8deg) scale(1)"
      identity.style.opacity = "1"
      desc.style.opacity = "1"
      closeBtn.focus()
      return
    }

    const typeOut = async (target: HTMLElement, text: string, msPerChar: number): Promise<void> => {
      for (let i = 0; i <= text.length; i++) {
        target.textContent = text.slice(0, i)
        await new Promise(r => setTimeout(r, msPerChar))
      }
      target.classList.add("done")
    }

    ;(async () => {
      await new Promise(r => setTimeout(r, 150))
      await typeOut(status, dt.accessing, 35)
      await new Promise(r => setTimeout(r, 250))
      stamp.style.opacity = "1"
      animate(stamp, [
        { opacity: 0, transform: "rotate(-8deg) scale(2.2)" },
        { opacity: 1, transform: "rotate(-8deg) scale(0.95)" },
        { opacity: 1, transform: "rotate(-8deg) scale(1)" }
      ], { duration: 320, easing: REVEAL_EASING, fill: "forwards" })
      await new Promise(r => setTimeout(r, 350))
      identity.style.opacity = "1"
      identity.classList.add("glitch-in")
      await new Promise(r => setTimeout(r, 320))
      desc.style.opacity = "1"
      animate(desc, [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], { duration: 280 })
      closeBtn.focus()
    })()
  })
}

function buildSpyOverlay(
  opts: RevealOptions,
  dt: DossierText,
  isSpy: boolean
): HTMLDivElement {
  const role = opts.payload.roleData
  const overlay = el("div", {
    class: "reveal-overlay",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Your role",
    tabindex: "-1"
  }) as HTMLDivElement

  const dossier = el("div", { class: `reveal-dossier${isSpy ? " is-spy" : ""}` }, [
    el("div", { class: "dossier-scanline", "aria-hidden": "true" }),
    el("header", { class: "dossier-topbar" }, [
      el("span", { class: "dossier-brand" }, ["◉ YALLA INTEL"]),
      el("span", { class: "dossier-status" }, [el("span", { class: "typewriter" }, [])])
    ]),
    el("div", { class: "dossier-stamp", "aria-hidden": "true" }, [dt.classified]),
    el("div", { class: "dossier-body" }, [
      el("div", { class: "dossier-row" }, [
        el("span", { class: "dossier-label" }, [dt.agent]),
        el("span", { class: "dossier-value" }, [opts.payload.name])
      ]),
      el("div", { class: "dossier-identity" }, [
        el("span", { class: "dossier-identity-icon", "aria-hidden": "true" }, [role.icon]),
        el("div", {}, [
          el("span", { class: "dossier-label" }, [dt.identity]),
          el("h3", { class: "dossier-identity-name" }, [role.name[opts.lang]])
        ])
      ]),
      el("p", { class: "dossier-desc" }, [role.desc[opts.lang]]),
      el("div", { class: "dossier-redactions", "aria-hidden": "true" }, [
        el("span", { class: "redact", style: "width: 82%" }),
        el("span", { class: "redact", style: "width: 58%" }),
        el("span", { class: "redact", style: "width: 37%" })
      ])
    ]),
    el("footer", { class: "dossier-footer", "aria-hidden": "true" }, [
      el("span", { class: "dossier-barcode" }),
      el("span", { class: "dossier-code" }, [`#${opts.payload.code}-${Math.floor(Math.random() * 900 + 100)}`])
    ])
  ])

  const closeBtn = el("button", { class: "btn btn-secondary reveal-close" }, [dt.gotIt])

  overlay.append(dossier, closeBtn)
  return overlay
}
