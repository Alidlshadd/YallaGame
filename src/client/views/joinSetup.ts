import { $, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { setView, setViewBackHandler, goBack } from "../router.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { buildCharacterPicker } from "../ui/characterPicker.js"
import { applyCharacterTheme } from "../themes/characterTheme.js"
import type { PlayerJoinData } from "@shared/events.js"
import type { ErrorCode, RoomSummary } from "@shared/types.js"
import type { Translations } from "../i18n/en.js"

const ERR_TO_KEY: Partial<Record<ErrorCode, keyof Translations>> = {
  NAME_TAKEN: "errorNameTaken",
  NAME_REQUIRED: "errorNameRequired",
  ROOM_NOT_FOUND: "errorRoomNotFound",
  RATE_LIMITED: "errorRateLimited",
  SERVER_BUSY: "errorServerBusy",
  ROOM_FULL: "errorRoomFull",
  CHARACTER_TAKEN: "errorCharacterTaken"
}

const NAME_KEY = "role-room:last-name"

/**
 * The doorstep: which room, who you are, and which face you wear. Reached from
 * a room-browser row or from a code, and the only way into an online room.
 */
export const joinSetupView = {
  id: "joinSetupView" as const,
  mount(ctx: { code?: string; summary?: RoomSummary }) {
    const lang = getLang()
    const code = (ctx.code ?? "").toUpperCase()

    const titleEl = $<HTMLElement>("#joinSetupGame")
    const hostEl  = $<HTMLElement>("#joinSetupHost")
    const nameInput = $<HTMLInputElement>("#joinSetupName")
    const slot = $<HTMLDivElement>("#joinSetupCharacters")
    const msg = $<HTMLDivElement>("#joinSetupMessage")
    const submitBtn = $<HTMLButtonElement>("#joinSetupSubmit")
    const backBtn = $<HTMLButtonElement>("#joinSetupBack")

    let summary: RoomSummary | null = ctx.summary ?? null
    if (summary?.theme) void applyTheme(summary.theme).catch(() => {})

    msg.classList.add("hidden"); msg.textContent = ""
    nameInput.value = localStorage.getItem(NAME_KEY) ?? ""

    function renderRoom(): void {
      titleEl.textContent = summary ? summary.gameTitle[lang] : code
      hostEl.textContent = summary
        ? `${t("createdBy")}: ${summary.hostName} · ${code}`
        : code
    }
    renderRoom()

    clear(slot)
    const picker = buildCharacterPicker(lang, summary?.takenCharacters ?? [], () => syncSubmit())
    slot.appendChild(picker.element)

    function syncSubmit(): void {
      submitBtn.disabled = !(nameInput.value.trim() && picker.value())
    }
    const onNameInput = () => { msg.classList.add("hidden"); syncSubmit() }
    nameInput.addEventListener("input", onNameInput)
    syncSubmit()

    const showError = (key: keyof Translations): void => {
      msg.classList.remove("hidden")
      msg.textContent = t(key)
    }

    // The room details may be stale (or absent, when reached with a typed
    // code), so refresh who is taken before the picker is trusted.
    let refreshing = false
    const refresh = async (): Promise<void> => {
      if (!code || refreshing) return
      refreshing = true
      const r = await emit("rooms:peek", { code })
      refreshing = false
      if (!r.ok) return
      const fresh = (r.data as { room: RoomSummary }).room
      summary = fresh
      renderRoom()
      if (fresh.theme) void applyTheme(fresh.theme).catch(() => {})
      picker.setTaken(fresh.takenCharacters)
      syncSubmit()
    }
    void refresh()
    const poll = window.setInterval(() => { void refresh() }, 5000)

    let joining = false
    const submit = async (): Promise<void> => {
      if (joining) return
      const playerName = nameInput.value.trim()
      const character = picker.value()
      const accessory = picker.accessory()
      if (!playerName) { showError("errorNameRequired"); nameInput.focus(); return }
      if (!character)  { showError("errorPickCharacter"); return }

      joining = true
      submitBtn.disabled = true
      msg.classList.add("hidden")
      const r = await emit("player:join", { code, name: playerName, character, accessory })
      joining = false
      syncSubmit()

      if (!r.ok) {
        showError(ERR_TO_KEY[r.error] ?? "errorGeneric")
        // Losing the race for a face is recoverable: show what is left.
        if (r.error === "CHARACTER_TAKEN") void refresh()
        return
      }
      localStorage.setItem(NAME_KEY, playerName)

      const data = r.data as PlayerJoinData
      if (data.status === "pending") {
        await applyTheme(data.theme)
        await setView("pendingView", {
          requestId: data.requestId, code: data.code, theme: data.theme,
          name: playerName, character, accessory
        })
        return
      }
      session.save({ kind: "player", code, playerId: data.player.id, name: data.player.name })
      await applyTheme(data.room.game.theme)
      await setView("playerRoomView", { initial: data })
    }

    const onSubmit = () => void submit()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
      e.preventDefault()
      if (!submitBtn.disabled) void submit()
    }
    const onBack = () => { clearTheme(); goBack() }

    submitBtn.addEventListener("click", onSubmit)
    nameInput.addEventListener("keydown", onKey)
    backBtn.addEventListener("click", onBack)
    setViewBackHandler(() => { clearTheme(); return false })

    return () => {
      applyCharacterTheme()
      setViewBackHandler(null)
      window.clearInterval(poll)
      nameInput.removeEventListener("input", onNameInput)
      nameInput.removeEventListener("keydown", onKey)
      submitBtn.removeEventListener("click", onSubmit)
      backBtn.removeEventListener("click", onBack)
      clear(slot)
    }
  }
}
