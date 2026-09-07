import { el } from "./dom.js"
import { t } from "../services/i18n.js"
import { dismissLayer, pushLayer, type LayerHandle } from "../services/navigation.js"

export interface HostSetup {
  hostName: string
  isPublic: boolean
  requireApproval: boolean
}

const NAME_KEY = "role-room:last-name"
const PREFS_KEY = "role-room:host-prefs"

function loadPrefs(): { isPublic: boolean; requireApproval: boolean } {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        isPublic: Boolean(parsed?.isPublic),
        requireApproval: Boolean(parsed?.requireApproval)
      }
    }
  } catch { /* corrupt entry — fall through to the defaults */ }
  // Public by default so a new room actually shows up in the browser, with
  // approval on so the host stays in control of who walks in.
  return { isPublic: true, requireApproval: true }
}

/**
 * Asked once, right before a room is created: the host's name (which everyone
 * sees as "created by"), whether the room is listed publicly, and whether each
 * join waits for their approval. Resolves null when the host backs out.
 */
export function hostSetupDialog(): Promise<HostSetup | null> {
  if (document.getElementById("hostSetupOverlay")) return Promise.resolve(null)

  return new Promise<HostSetup | null>(resolve => {
    let settled = false
    let handle: LayerHandle | null = null
    const previouslyFocused = document.activeElement as HTMLElement | null

    const prefs = loadPrefs()

    const nameInput = el("input", {
      id: "hostNameInput",
      type: "text",
      maxlength: "24",
      autocomplete: "nickname",
      enterkeyhint: "go",
      placeholder: t("yourNamePlaceholder")
    }) as HTMLInputElement
    nameInput.value = localStorage.getItem(NAME_KEY) ?? ""

    const publicInput = el("input", { id: "hostPublicInput", type: "checkbox" }) as HTMLInputElement
    publicInput.checked = prefs.isPublic

    const approvalInput = el("input", { id: "hostApprovalInput", type: "checkbox" }) as HTMLInputElement
    approvalInput.checked = prefs.requireApproval

    const error = el("p", { class: "host-setup-error", role: "alert", hidden: "hidden" }, [t("errorNameRequired")])

    const createBtn = el("button", { class: "btn btn-primary full", type: "button" }, [t("createRoomConfirm")])
    const cancelBtn = el("button", { class: "btn btn-ghost", type: "button" }, [t("cancel")])

    const finish = (result: HostSetup | null): void => {
      if (settled) return
      settled = true
      dismissLayer(handle)
      overlay.removeAttribute("id")
      overlay.classList.remove("visible")
      overlay.classList.add("closing")
      window.setTimeout(() => overlay.remove(), 250)
      previouslyFocused?.focus?.()
      resolve(result)
    }

    const submit = (): void => {
      const hostName = nameInput.value.trim()
      if (!hostName) {
        error.hidden = false
        nameInput.focus()
        return
      }
      const setup: HostSetup = {
        hostName,
        isPublic: publicInput.checked,
        requireApproval: approvalInput.checked
      }
      localStorage.setItem(NAME_KEY, hostName)
      localStorage.setItem(PREFS_KEY, JSON.stringify({
        isPublic: setup.isPublic, requireApproval: setup.requireApproval
      }))
      finish(setup)
    }

    createBtn.addEventListener("click", submit)
    cancelBtn.addEventListener("click", () => finish(null))
    nameInput.addEventListener("input", () => { if (nameInput.value.trim()) error.hidden = true })
    nameInput.addEventListener("keydown", e => {
      if (e.key !== "Enter") return
      e.preventDefault()
      submit()
    })

    const panel = el("div", {
      class: "host-setup-panel",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "hostSetupTitle"
    }, [
      el("h2", { id: "hostSetupTitle", class: "host-setup-title" }, [t("hostSetupTitle")]),

      el("label", { class: "field", for: "hostNameInput" }, [
        el("span", {}, [t("hostNameLabel")]),
        nameInput,
        el("small", { class: "field-hint" }, [t("hostNameHint")])
      ]),
      error,

      el("fieldset", { class: "host-setup-group" }, [
        el("legend", {}, [t("visibilityLabel")]),
        el("label", { class: "switch-row", for: "hostPublicInput" }, [
          el("span", {}, [publicInput.checked ? t("visibilityPublic") : t("visibilityPrivate")]),
          publicInput
        ])
      ]),

      el("fieldset", { class: "host-setup-group" }, [
        el("legend", {}, [t("approvalLabel")]),
        el("label", { class: "switch-row", for: "hostApprovalInput" }, [
          el("span", {}, [t("approvalHint")]),
          approvalInput
        ])
      ]),

      el("div", { class: "host-setup-actions" }, [cancelBtn, createBtn])
    ])

    // The public/private label has to say which one is currently chosen, or
    // the switch reads as a riddle.
    const visibilityLabel = panel.querySelector<HTMLElement>(".host-setup-group .switch-row span")
    publicInput.addEventListener("change", () => {
      if (visibilityLabel) {
        visibilityLabel.textContent = publicInput.checked ? t("visibilityPublic") : t("visibilityPrivate")
      }
    })

    const overlay = el("div", { id: "hostSetupOverlay", class: "host-setup-overlay" }, [panel])
    overlay.addEventListener("click", e => { if (e.target === overlay) finish(null) })

    document.body.appendChild(overlay)
    handle = pushLayer(() => finish(null), "host-setup")
    requestAnimationFrame(() => {
      overlay.classList.add("visible")
      nameInput.focus()
    })
  })
}
