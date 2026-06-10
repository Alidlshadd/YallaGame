import { el } from "./dom.js"
import { animate, prefersReducedMotion, orchestrate, REVEAL_EASING } from "./motion.js"
import { play } from "../services/sound.js"
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
  const role = opts.payload.roleData
  const overlay = buildFlipOverlay(role, opts.lang)
  document.body.appendChild(overlay)

  const closeBtn = overlay.querySelector<HTMLButtonElement>(".reveal-close")!
  const previouslyFocused = document.activeElement as HTMLElement | null

  return new Promise<void>(resolve => {
    // eslint-disable-next-line prefer-const
    let cancel: (() => void) | undefined

    const cleanup = (): void => {
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
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cleanup() }
    overlay.addEventListener("keydown", onKey)

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
          void play("reveal-flip", 0.6)
          animate(card, [
            { transform: "rotateY(-180deg)" },
            { transform: "rotateY(0deg)" }
          ], { duration: 400, easing: REVEAL_EASING })
        } },
      { at: 800, do: () => {
          void play("reveal-burst", 0.5)
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

function buildFlipOverlay(role: RoleAssignedPayload["roleData"], lang: LangCode): HTMLDivElement {
  const overlay = el("div", {
    class: "reveal-overlay",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Your role",
    tabindex: "-1"
  }) as HTMLDivElement

  const burst = el("div", { class: "reveal-burst" })
  const card = el("div", { class: "reveal-card" }, [
    el("div", { class: "reveal-icon" }, [role.icon]),
    el("h3", { class: "reveal-name" }, [role.name[lang]]),
    el("p", { class: "reveal-desc" }, [role.desc[lang]])
  ])

  const closeBtn = el("button", { class: "btn btn-secondary reveal-close" }, ["Got it"])

  const stage = el("div", { class: "reveal-stage" }, [burst, card])
  overlay.append(stage, closeBtn)
  return overlay
}

async function showSpyReveal(opts: RevealOptions): Promise<void> {
  const role = opts.payload.roleData
  const overlay = buildSpyOverlay()
  document.body.appendChild(overlay)

  const closeBtn = overlay.querySelector<HTMLButtonElement>(".reveal-close")!
  const previouslyFocused = document.activeElement as HTMLElement | null

  return new Promise<void>(resolve => {
    const cleanup = (): void => {
      animate(overlay, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" })
        .finished.then(() => {
          overlay.remove()
          previouslyFocused?.focus?.()
          opts.onClose?.()
          resolve()
        })
    }
    closeBtn.addEventListener("click", cleanup)
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cleanup() }
    overlay.addEventListener("keydown", onKey)

    requestAnimationFrame(() => overlay.classList.add("visible"))

    if (prefersReducedMotion()) {
      const terminal = overlay.querySelector<HTMLElement>(".reveal-terminal")!
      const lineA = terminal.querySelector<HTMLElement>(".line-a .typewriter")!
      const lineB = terminal.querySelector<HTMLElement>(".line-b .typewriter")!
      const lineC = terminal.querySelector<HTMLElement>(".line-c")!
      lineA.textContent = "DECRYPTING…"
      lineA.classList.add("done")
      lineB.textContent = `IDENTITY: ${role.name[opts.lang].toUpperCase()}`
      lineB.classList.add("done")
      lineC.style.opacity = "1"
      lineC.textContent = role.desc[opts.lang]
      closeBtn.focus()
      return
    }

    const lineA = overlay.querySelector<HTMLElement>(".line-a .typewriter")!
    const lineB = overlay.querySelector<HTMLElement>(".line-b .typewriter")!
    const lineC = overlay.querySelector<HTMLElement>(".line-c")!

    const aText = "DECRYPTING…"
    const bText = `IDENTITY: ${role.name[opts.lang].toUpperCase()}`

    const typeOut = async (target: HTMLElement, text: string, msPerChar: number): Promise<void> => {
      for (let i = 0; i <= text.length; i++) {
        target.textContent = text.slice(0, i)
        await new Promise(r => setTimeout(r, msPerChar))
      }
      target.classList.add("done")
    }

    ;(async () => {
      await new Promise(r => setTimeout(r, 200))
      await typeOut(lineA, aText, 80)
      await new Promise(r => setTimeout(r, 400))
      overlay.querySelector<HTMLElement>(".line-b")!.style.opacity = "1"
      await typeOut(lineB, bText, 80)
      await new Promise(r => setTimeout(r, 200))
      lineC.textContent = role.desc[opts.lang]
      animate(lineC, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 })
      closeBtn.focus()
    })()
  })
}

function buildSpyOverlay(): HTMLDivElement {
  const overlay = el("div", {
    class: "reveal-overlay",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Your role",
    tabindex: "-1"
  }) as HTMLDivElement

  const terminal = el("div", { class: "reveal-terminal" }, [
    el("div", { class: "line line-a" }, [el("span", { class: "typewriter" }, [])]),
    el("div", { class: "line line-b", style: "opacity: 0" }, [el("span", { class: "typewriter" }, [])]),
    el("p", { class: "line-c", style: "opacity: 0; margin-top: 16px" }, [])
  ])

  const closeBtn = el("button", { class: "btn btn-secondary reveal-close" }, ["Got it"])

  overlay.append(terminal, closeBtn)
  return overlay
}
