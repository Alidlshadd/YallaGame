import { setLang, applyAll } from "./services/i18n.js"
import { socket, emit } from "./services/socket.js"
import * as session from "./services/session.js"
import { register, setView } from "./router.js"
import { homeView, loadCatalog } from "./views/home.js"
import { gameInfoView } from "./views/gameInfo.js"
import { joinView } from "./views/join.js"
import { playerRoomView } from "./views/playerRoom.js"
import { adminView } from "./views/admin.js"
import { applyTheme, clearTheme } from "./themes/loader.js"
import { ensureAtmosphere, applyPerformanceProfile } from "./ui/atmosphere.js"
import "./themes/_base.css"
import type { LangCode, VisibleRoom } from "@shared/types.js"
import type { AdminRoomData, PlayerJoinData } from "@shared/events.js"

async function bootstrap() {
  ensureAtmosphere()
  applyPerformanceProfile()
  await loadCatalog()
  applyAll()

  register(homeView)
  register(gameInfoView)
  register(joinView)
  register(playerRoomView)
  register(adminView)

  document.querySelectorAll<HTMLButtonElement>(".lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang as LangCode
      setLang(lang)
      const active = document.querySelector<HTMLElement>("section.view.active-view")
      if (active) { const id = active.id as Parameters<typeof setView>[0]; setView("homeView"); setView(id) }
    })
  })

  // Sound + mute toggle
  const { init: initSound, isMuted, setMuted, play } = await import("./services/sound.js")
  initSound()
  const muteBtn = document.getElementById("muteToggle") as HTMLButtonElement | null
  if (muteBtn) {
    const renderMute = () => {
      const m = isMuted()
      muteBtn.setAttribute("aria-pressed", String(m))
      const icon = muteBtn.firstElementChild
      if (icon) icon.textContent = m ? "🔇" : "🔊"
    }
    renderMute()
    muteBtn.addEventListener("click", async () => {
      setMuted(!isMuted())
      renderMute()
      await play("mute-toggle")
    })
  }

  socket.on("room:status", (_room: VisibleRoom) => { /* reserved for future cached state */ })

  // Spy HUD clock (decorative, only visible when spy theme active)
  const clockEl = document.getElementById("spyHudClock")
  if (clockEl) {
    const updateClock = () => {
      const d = new Date()
      const hh = String(d.getUTCHours()).padStart(2, "0")
      const mm = String(d.getUTCMinutes()).padStart(2, "0")
      const ss = String(d.getUTCSeconds()).padStart(2, "0")
      clockEl.textContent = `${hh}:${mm}:${ss}Z`
    }
    updateClock()
    window.setInterval(updateClock, 1000)
  }

  const existing = session.load()
  if (existing?.kind === "admin") {
    const r = await emit("admin:reconnect", { code: existing.code, adminSecret: existing.adminSecret })
    if (r.ok) {
      const data = r.data as AdminRoomData
      await applyTheme(data.room.game.theme)
      setView("adminView", { initial: data.room })
      return
    }
    session.clear()
  }
  if (existing?.kind === "player") {
    const r = await emit("player:join", { code: existing.code, name: existing.name, playerId: existing.playerId })
    if (r.ok) {
      const data = r.data as PlayerJoinData
      await applyTheme(data.room.game.theme)
      setView("playerRoomView", { initial: data })
      return
    }
    session.clear()
  }

  clearTheme()
  setView("homeView")
}

void bootstrap()
