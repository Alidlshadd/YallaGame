import { $ } from "../ui/dom.js"
import { t } from "../services/i18n.js"
import { setView } from "../router.js"
import { emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { play } from "../services/sound.js"
import type { PlayerJoinData } from "@shared/events.js"
import type { ErrorCode } from "@shared/types.js"
import type { Translations } from "../i18n/en.js"

const ERR_TO_KEY: Partial<Record<ErrorCode, keyof Translations>> = {
  NAME_TAKEN: "errorNameTaken",
  NAME_REQUIRED: "errorNameRequired",
  ROOM_NOT_FOUND: "errorRoomNotFound",
  ROOM_FULL: "errorRoomFull",
  RATE_LIMITED: "errorRateLimited",
  SERVER_BUSY: "errorServerBusy"
}

export const joinView = {
  id: "joinView" as const,
  mount() {
    const code = $<HTMLInputElement>("#joinCodeInput")
    const name = $<HTMLInputElement>("#playerNameInput")
    const msg  = $<HTMLDivElement>("#joinMessage")

    code.value = ""; name.value = ""
    code.classList.remove("locked")
    msg.classList.add("hidden"); msg.textContent = ""

    const onCodeInput = () => {
      void play("click", 0.3)
      if (code.value.length === 5) code.classList.add("locked")
      else code.classList.remove("locked")
    }
    code.addEventListener("input", onCodeInput)

    const onJoin = async () => {
      void play("click")
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
      void play("transition")
      setView("playerRoomView", { initial: data })
    }

    const onBack = () => {
      clearTheme()
      setView("homeView")
    }

    const btn = $<HTMLButtonElement>("#joinBtn")
    const backs = document.querySelectorAll<HTMLButtonElement>(".backHome")
    btn.addEventListener("click", onJoin)
    backs.forEach(b => b.addEventListener("click", onBack))

    return () => {
      code.removeEventListener("input", onCodeInput)
      btn.removeEventListener("click", onJoin)
      backs.forEach(b => b.removeEventListener("click", onBack))
    }
  }
}
