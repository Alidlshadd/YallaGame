import { setLang, applyAll } from "./services/i18n.js"
import * as session from "./services/session.js"
import { refreshCurrentView, register, registerLazy, setView } from "./router.js"
import { initNavigation } from "./services/navigation.js"
import { prefetchOfflineBundles, registerServiceWorker } from "./services/pwa.js"
import { homeView, loadCatalog, getGames } from "./views/home.js"
import { applyTheme, clearTheme } from "./themes/loader.js"
import { ensureAtmosphere, applyPerformanceProfile } from "./ui/atmosphere.js"
import { initLazyImageFade } from "./ui/lazyImage.js"
import "./themes/_base.css"
import "./themes/home.css"
import "./themes/morinji.css"
import type { LangCode } from "@shared/types.js"
import type { AdminRoomData, PlayerJoinData } from "@shared/events.js"

async function bootstrap() {
  // Must run before the first setView so the base history entry is labelled and
  // the hardware/gesture back button is wired up from the very first screen.
  initNavigation()
  registerServiceWorker()
  ensureAtmosphere()
  applyPerformanceProfile()
  initLazyImageFade()

  register(homeView)
  registerLazy("joinView", async () => (await import("./views/join.js")).joinView)
  registerLazy("gameInfoView", async () => (await import("./views/gameInfo.js")).gameInfoView)
  registerLazy("joinSetupView", async () => (await import("./views/joinSetup.js")).joinSetupView)
  registerLazy("pendingView", async () => (await import("./views/pending.js")).pendingView)
  registerLazy("playerRoomView", async () => (await import("./views/playerRoom.js")).playerRoomView)
  registerLazy("adminView", async () => (await import("./views/admin.js")).adminView)
  registerLazy("localPlayView", async () => (await import("./views/localPlay.js")).localPlayView)

  applyAll()

  document.querySelectorAll<HTMLButtonElement>(".lang-switch button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const lang = btn.dataset.lang as LangCode
      setLang(lang)
      // refreshCurrentView re-mounts whatever view is showing so every
      // string that captured getLang() at render time picks up the new
      // value. The old "setView(homeView) then setView(currentId)"
      // dance was a no-op on the home page (router.setView early-returns
      // when currentId === target), so on the home stage the language
      // appeared not to switch until the user reloaded the page.
      await refreshCurrentView()
    })
  })

  // Top nav: scroll within the home stage to the requested slide.
  document.querySelectorAll<HTMLButtonElement>(".main-nav button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const target = btn.dataset.nav
      if (target === "home" || target === "worlds" || target === "features" || target === "how") {
        if (document.querySelector<HTMLElement>("section.view.active-view")?.id !== "homeView") {
          // Top-nav "home" is a reset, not a step forward: drop the back stack
          // instead of stacking home on top of whatever view was open.
          await setView("homeView", {}, { mode: "root" })
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

  // Copyright footer — keep the year in sync with the user's clock so
  // the line auto-rolls over each January without a deploy. The string
  // tail ("All rights reserved.") is data-i18n driven via applyAll(),
  // so the language switcher already updates it without extra wiring.
  const yearEl = document.getElementById("appFooterYear")
  if (yearEl) yearEl.textContent = String(new Date().getFullYear())

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
  const initialCatalog = JSON.stringify(getGames())

  // Shared invite links: /?join=CODE opens the join view with the code
  // prefilled. The param is consumed (removed from the URL) so reloads
  // afterwards behave normally, and an explicit invite wins over any
  // stale session in this browser.
  const joinParam = new URLSearchParams(location.search).get("join")?.trim().toUpperCase() ?? ""
  if (/^[A-Z2-9]{5}$/.test(joinParam)) {
    history.replaceState(history.state, "", location.pathname)
    clearTheme()
    await setView("joinSetupView", { code: joinParam }, { mode: "root" })
    return
  }
  if (existing?.kind === "admin") {
    const { emit } = await import("./services/socket.js")
    const r = await emit("admin:reconnect", { code: existing.code, adminSecret: existing.adminSecret })
    if (r.ok) {
      const data = r.data as AdminRoomData
      await applyTheme(data.room.game.theme)
      await setView("adminView", { initial: data.room }, { mode: "root" })
      return
    }
    session.clear()
  }
  if (existing?.kind === "player") {
    const { emit } = await import("./services/socket.js")
    const r = await emit("player:join", { code: existing.code, name: existing.name, playerId: existing.playerId })
    if (r.ok) {
      const data = r.data as PlayerJoinData
      // A reload while the host still has not decided lands back in the queue
      // rather than pretending the player is in the room.
      if (data.status === "pending") {
        await applyTheme(data.theme)
        await setView("pendingView", { requestId: data.requestId, code: data.code, theme: data.theme }, { mode: "root" })
        return
      }
      await applyTheme(data.room.game.theme)
      await setView("playerRoomView", { initial: data }, { mode: "root" })
      return
    }
    session.clear()
  }

  clearTheme()
  await setView("homeView", {}, { mode: "root" })
  prefetchOfflineBundles()
  await catalogPromise
  const active = document.querySelector<HTMLElement>("section.view.active-view")
  if (active?.id === "homeView" && (getGames().length === 0 || initialCatalog !== JSON.stringify(getGames()))) await refreshCurrentView()
}

void bootstrap()
