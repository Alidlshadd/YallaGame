import { el } from "./dom.js"
import { t } from "../services/i18n.js"
import { dismissLayer, pushLayer, type LayerHandle } from "../services/navigation.js"
import type { Translations } from "../i18n/en.js"

export interface ConfirmOptions {
  title: keyof Translations
  body?: keyof Translations
  /** Label of the destructive / confirming button. */
  confirmKey?: keyof Translations
  cancelKey?: keyof Translations
  danger?: boolean
}

/**
 * Localized replacement for window.confirm(). Native confirm dialogs were the
 * only English strings left in the Arabic/Kurdish/Turkish flows, and on phones
 * they sit outside the page so the back gesture dismisses the whole app instead
 * of the question. This one is a normal layer: back and Escape cancel it.
 */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  const existing = document.getElementById("confirmOverlay")
  if (existing) return Promise.resolve(false)

  return new Promise<boolean>(resolve => {
    let settled = false
    let handle: LayerHandle | null = null
    const previouslyFocused = document.activeElement as HTMLElement | null

    const finish = (result: boolean): void => {
      if (settled) return
      settled = true
      dismissLayer(handle)
      // Drop the id and stop taking clicks immediately: the node lingers for
      // 200ms to fade out, and a fast second back press would otherwise be
      // told "a dialog is already open" and land on this dead overlay.
      overlay.removeAttribute("id")
      overlay.classList.remove("visible")
      overlay.classList.add("closing")
      window.setTimeout(() => overlay.remove(), 200)
      previouslyFocused?.focus?.()
      resolve(result)
    }

    const cancelBtn = el("button", { class: "confirm-btn confirm-cancel", type: "button" }, [
      t(opts.cancelKey ?? "cancel")
    ])
    const okBtn = el("button", {
      class: `confirm-btn confirm-ok${opts.danger ? " danger" : ""}`,
      type: "button"
    }, [t(opts.confirmKey ?? "dialogConfirm")])

    cancelBtn.addEventListener("click", () => finish(false))
    okBtn.addEventListener("click", () => finish(true))

    const panel = el("div", {
      class: "confirm-panel",
      role: "alertdialog",
      "aria-modal": "true",
      "aria-labelledby": "confirmTitle"
    }, [
      el("h2", { id: "confirmTitle", class: "confirm-title" }, [t(opts.title)]),
      ...(opts.body ? [el("p", { class: "confirm-body" }, [t(opts.body)])] : []),
      el("div", { class: "confirm-actions" }, [cancelBtn, okBtn])
    ])

    const overlay = el("div", { id: "confirmOverlay", class: "confirm-overlay" }, [panel])
    overlay.addEventListener("click", e => { if (e.target === overlay) finish(false) })

    document.body.appendChild(overlay)
    handle = pushLayer(() => finish(false), "confirm")
    requestAnimationFrame(() => {
      overlay.classList.add("visible")
      cancelBtn.focus()
    })
  })
}
