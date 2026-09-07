import { $, clear, el } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { goBack, setView } from "../router.js"
import { emit } from "../services/socket.js"
import { showToast } from "../ui/toast.js"
import { clearTheme } from "../themes/loader.js"
import { openCreatePicker } from "./home.js"
import type { RoomListData } from "@shared/events.js"
import type { RoomSummary } from "@shared/types.js"
import type { Translations } from "../i18n/en.js"

export const joinView = {
  id: "joinView" as const,
  mount(ctx: { code?: string } = {}) {
    const code = $<HTMLInputElement>("#joinCodeInput")
    const msg  = $<HTMLDivElement>("#joinMessage")
    const list = $<HTMLDivElement>("#lobbyList")
    const lang = getLang()

    code.classList.remove("locked")
    msg.classList.add("hidden"); msg.textContent = ""

    if (typeof ctx.code === "string" && ctx.code) {
      code.value = ctx.code.toUpperCase()
      if (code.value.length === 5) code.classList.add("locked")
    }

    const showError = (key: keyof Translations): void => {
      msg.classList.remove("hidden")
      msg.textContent = t(key)
    }

    const onCodeInput = () => {
      code.value = code.value.toUpperCase()
      if (code.value.length === 5) code.classList.add("locked")
      else code.classList.remove("locked")
    }
    code.addEventListener("input", onCodeInput)

    /* ─── Opening the doorstep ────────────────────────────── */

    // Nothing joins from this screen any more: the name and the character are
    // asked next, where there is room to show the faces.
    const openSetup = (roomCode: string, summary?: RoomSummary): void => {
      if (!roomCode) { showError("errorRoomNotFound"); code.focus(); return }
      msg.classList.add("hidden")
      void setView("joinSetupView", summary ? { code: roomCode, summary } : { code: roomCode })
    }

    const onJoin = () => openSetup(code.value.trim().toUpperCase())

    /* ─── The room browser ────────────────────────────────── */

    function renderPlaceholder(key: keyof Translations): void {
      clear(list)
      list.classList.add("empty")
      list.appendChild(el("p", { class: "lobby-empty" }, [t(key)]))
    }

    function renderRooms(rooms: RoomSummary[]): void {
      if (rooms.length === 0) { renderPlaceholder("noOpenRooms"); return }
      clear(list)
      list.classList.remove("empty")
      for (const room of rooms) {
        const joinBtn = el("button", { class: "lobby-join btn btn-secondary", type: "button" }, [t("joinRoomAction")])
        joinBtn.addEventListener("click", () => openSetup(room.code, room))

        const badges = el("div", { class: "lobby-badges" }, [
          el("span", { class: `lobby-badge ${room.assigned ? "running" : "waiting"}` }, [
            room.assigned ? t("roomInProgress") : t("roomWaiting")
          ]),
          el("span", { class: "lobby-badge lock" }, [
            room.requireApproval ? `🔒 ${t("roomNeedsApproval")}` : `🔓 ${t("roomOpenToAll")}`
          ])
        ])

        const row = el("div", { class: "lobby-row", "data-theme": room.theme }, [
          el("div", { class: "lobby-row-art", "aria-hidden": "true" }, [
            el("span", { class: "lobby-row-icon" }, [room.gameIcon])
          ]),
          el("div", { class: "lobby-row-main" }, [
            el("strong", { class: "lobby-room-title" }, [room.gameTitle[lang]]),
            el("span", { class: "lobby-room-host" }, [`${t("createdBy")}: ${room.hostName}`]),
            badges
          ]),
          el("div", { class: "lobby-row-side" }, [
            el("span", { class: "lobby-count" }, [`${t("playersLabel")}: ${room.playerCount}`]),
            el("code", { class: "lobby-code" }, [room.code]),
            joinBtn
          ])
        ])
        list.appendChild(row)
      }
    }

    let loading = false
    const timers = new Set<number>()
    const loadRooms = async (retryOnCooldown = false): Promise<void> => {
      if (loading) return
      loading = true
      list.setAttribute("aria-busy", "true")
      const r = await emit("rooms:list", {})
      loading = false
      list.setAttribute("aria-busy", "false")
      if (!r.ok) {
        // A rate-limited refresh is not worth wiping the list that is already
        // on screen; only an empty list needs the message.
        if (list.childElementCount === 0) renderPlaceholder("noOpenRooms")
        // Tapping Refresh right after the screen opened lands inside the
        // server's cooldown. Silently doing nothing makes the button look
        // broken, so wait it out and go again.
        if (r.error === "RATE_LIMITED" && retryOnCooldown) {
          const id = window.setTimeout(() => { timers.delete(id); void loadRooms() }, 700)
          timers.add(id)
        } else if (r.error === "RATE_LIMITED") {
          showToast(t("errorRateLimited"))
        }
        return
      }
      renderRooms((r.data as RoomListData).rooms)
    }

    renderPlaceholder("roomsLoading")
    void loadRooms()
    // The list goes stale as people come and go; a slow poll keeps it honest
    // without the player having to hunt for the refresh button.
    const poll = window.setInterval(() => { void loadRooms() }, 15000)

    const onRefresh = () => void loadRooms(true)
    const onCreate = () => { openCreatePicker(lang) }

    const onBack = () => {
      clearTheme()
      // goBack() walks the same stack as the phone's back gesture, so the
      // in-page button and the hardware button can never disagree.
      goBack()
    }

    // On a phone the keyboard's Go key is the natural way to submit; without
    // this it just closed the keyboard and left the player staring at the form.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
      e.preventDefault()
      onJoin()
    }
    code.addEventListener("keydown", onKey)

    const btn = $<HTMLButtonElement>("#joinBtn")
    const refreshBtn = $<HTMLButtonElement>("#refreshRoomsBtn")
    const createBtn = $<HTMLButtonElement>("#lobbyCreateBtn")
    const backs = document.querySelectorAll<HTMLButtonElement>(".backHome")
    btn.addEventListener("click", onJoin)
    refreshBtn.addEventListener("click", onRefresh)
    createBtn.addEventListener("click", onCreate)
    backs.forEach(b => b.addEventListener("click", onBack))

    return () => {
      window.clearInterval(poll)
      for (const id of timers) window.clearTimeout(id)
      timers.clear()
      code.removeEventListener("input", onCodeInput)
      code.removeEventListener("keydown", onKey)
      btn.removeEventListener("click", onJoin)
      refreshBtn.removeEventListener("click", onRefresh)
      createBtn.removeEventListener("click", onCreate)
      backs.forEach(b => b.removeEventListener("click", onBack))
    }
  }
}
