import { $ } from "../ui/dom.js"
import { t } from "../services/i18n.js"
import { goBack, setView } from "../router.js"
import { emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import type { PlayerJoinData } from "@shared/events.js"
import type { ErrorCode } from "@shared/types.js"
import type { Translations } from "../i18n/en.js"

const ERR_TO_KEY: Partial<Record<ErrorCode, keyof Translations>> = {
  NAME_TAKEN: "errorNameTaken",
  NAME_REQUIRED: "errorNameRequired",
  ROOM_NOT_FOUND: "errorRoomNotFound",
  RATE_LIMITED: "errorRateLimited",
  SERVER_BUSY: "errorServerBusy"
}

export const joinView = {
  id: "joinView" as const,
  mount(ctx: { code?: string } = {}) {
    const code = $<HTMLInputElement>("#joinCodeInput")
    const name = $<HTMLInputElement>("#playerNameInput")
    const msg  = $<HTMLDivElement>("#joinMessage")

    code.classList.remove("locked")
    msg.classList.add("hidden"); msg.textContent = ""

    // Invite link (/?join=CODE) prefills and locks the code so the
    // player only has to type their name.
    if (typeof ctx.code === "string" && ctx.code) {
      code.value = ctx.code.toUpperCase()
      if (code.value.length === 5) code.classList.add("locked")
      name.focus()
    }

    const onCodeInput = () => {
      code.value = code.value.toUpperCase()
      if (code.value.length === 5) code.classList.add("locked")
      else code.classList.remove("locked")
    }
    code.addEventListener("input", onCodeInput)

    const onJoin = async () => {
      const c = code.value.trim().toUpperCase()
      const n = name.value.trim()
      if (!c || !n) {
        msg.classList.remove("hidden")
        msg.textContent = t("errorNameRequired")
        return
      }

      const r = await emit("player:join", { code: c, name: n })
      if (!r.ok) {
        msg.classList.remove("hidden")
        const k = ERR_TO_KEY[r.error] ?? "errorGeneric"
        msg.textContent = t(k)
        return
      }
      const data = r.data as PlayerJoinData
      session.save({ kind: "player", code: c, playerId: data.player.id, name: data.player.name })
      await applyTheme(data.room.game.theme)
      await setView("playerRoomView", { initial: data })
    }

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
      if (e.target === code && code.value.trim().length === 5) { name.focus(); return }
      void onJoin()
    }
    code.addEventListener("keydown", onKey)
    name.addEventListener("keydown", onKey)

    const btn = $<HTMLButtonElement>("#joinBtn")
    const backs = document.querySelectorAll<HTMLButtonElement>(".backHome")
    btn.addEventListener("click", onJoin)
    backs.forEach(b => b.addEventListener("click", onBack))

    return () => {
      code.removeEventListener("input", onCodeInput)
      code.removeEventListener("keydown", onKey)
      name.removeEventListener("keydown", onKey)
      btn.removeEventListener("click", onJoin)
      backs.forEach(b => b.removeEventListener("click", onBack))
    }
  }
}
