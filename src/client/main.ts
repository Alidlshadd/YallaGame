import { setLang, applyAll } from "./services/i18n.js"
import * as session from "./services/session.js"
import { refreshCurrentView, register, registerLazy, setView } from "./router.js"
import { homeView, loadCatalog } from "./views/home.js"
import { applyTheme, clearTheme } from "./themes/loader.js"
import { ensureAtmosphere, applyPerformanceProfile } from "./ui/atmosphere.js"
import { initLazyImageFade } from "./ui/lazyImage.js"
import "./themes/_base.css"
import "./themes/home.css"
import type { LangCode } from "@shared/types.js"
import type { AdminRoomData, PlayerJoinData } from "@shared/events.js"

async function bootstrap() {
  ensureAtmosphere()
  applyPerformanceProfile()
  initLazyImageFade()

  register(homeView)
  registerLazy("joinView", async () => (await import("./views/join.js")).joinView)
  registerLazy("gameInfoView", async () => (await import("./views/gameInfo.js")).gameInfoView)
  registerLazy("playerRoomView", async () => (await import("./views/playerRoom.js")).playerRoomView)
  registerLazy("adminView", async () => (await import("./views/admin.js")).adminView)
  registerLazy("localPlayView", async () => (await import("./views/localPlay.js")).localPlayView)

  applyAll()

  document.querySelectorAll<HTMLButtonElement>(".lang-switch button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const lang = btn.dataset.lang as LangCode
      setLang(lang)
      const active = document.querySelector<HTMLElement>("section.view.active-view")
      if (!active) return

      const id = active.id as Parameters<typeof setView>[0]
      await setView("homeView")
      await setView(id)
    })
  })

  // Top nav: scroll within the home stage to the requested slide.
  document.querySelectorAll<HTMLButtonElement>(".main-nav button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const target = btn.dataset.nav
      if (target === "home" || target === "worlds" || target === "features" || target === "how") {
        if (document.querySelector<HTMLElement>("section.view.active-view")?.id !== "homeView") {
          await setView("homeView")
        }
        const sel =
          target === "home"     ? ".hero-slide"
          : target === "worlds" ? ".shelf-slide"
          : target === "features" ? ".feat-row"
          /* how */             : ".shelf-slide"
        document.querySelector<HTMLElement>(sel)?.scrollIntoView({ behavior: "smooth", block: target === "features" ? "center" : "start" })
      }
      // about: placeholder (no destination yet — keep as visual presence)
    })
  })

  // Keep audio code out of the first bundle until the user touches the control.
  const muteBtn = document.getElementById("muteToggle") as HTMLButtonElement | null
  if (muteBtn) {
    const renderMute = (m: boolean) => {
      muteBtn.setAttribute("aria-pressed", String(m))
      const icon = muteBtn.firstElementChild
      if (icon) icon.textContent = m ? "\u{1F507}" : "\u{1F50A}"
    }
    renderMute(localStorage.getItem("role-room:muted") !== "0")
    muteBtn.addEventListener("click", async () => {
      const { init: initSound, isMuted, setMuted, play } = await import("./services/sound.js")
      initSound()
      const next = !isMuted()
      setMuted(next)
      renderMute(next)
      await play("mute-toggle")
    })
  }

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
  const catalogPromise = loadCatalog()
  if (existing?.kind === "admin") {
    await catalogPromise
    const { emit } = await import("./services/socket.js")
    const r = await emit("admin:reconnect", { code: existing.code, adminSecret: existing.adminSecret })
    if (r.ok) {
      const data = r.data as AdminRoomData
      await applyTheme(data.room.game.theme)
      await setView("adminView", { initial: data.room })
      return
    }
    session.clear()
  }
  if (existing?.kind === "player") {
    await catalogPromise
    const { emit } = await import("./services/socket.js")
    const r = await emit("player:join", { code: existing.code, name: existing.name, playerId: existing.playerId })
    if (r.ok) {
      const data = r.data as PlayerJoinData
      await applyTheme(data.room.game.theme)
      await setView("playerRoomView", { initial: data })
      return
    }
    session.clear()
  }

  clearTheme()
  await setView("homeView")
  await catalogPromise
  const active = document.querySelector<HTMLElement>("section.view.active-view")
  if (active?.id === "homeView") await refreshCurrentView()
}

void bootstrap()
