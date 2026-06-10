import { setLang, applyAll } from "./services/i18n.js"
import { socket, emit } from "./services/socket.js"
import * as session from "./services/session.js"
import { register, setView } from "./router.js"
import { homeView, loadCatalog } from "./views/home.js"
import { gameInfoView } from "./views/gameInfo.js"
import { joinView } from "./views/join.js"
import { playerRoomView } from "./views/playerRoom.js"
import { adminView } from "./views/admin.js"
import type { LangCode, VisibleRoom } from "@shared/types.js"
import type { AdminRoomData, PlayerJoinData } from "@shared/events.js"

async function bootstrap() {
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

  socket.on("room:status", (_room: VisibleRoom) => { /* reserved for future cached state */ })

  const existing = session.load()
  if (existing?.kind === "admin") {
    const r = await emit("admin:reconnect", { code: existing.code, adminSecret: existing.adminSecret })
    if (r.ok) {
      const data = r.data as AdminRoomData
      setView("adminView", { initial: data.room })
      return
    }
    session.clear()
  }
  if (existing?.kind === "player") {
    const r = await emit("player:join", { code: existing.code, name: existing.name, playerId: existing.playerId })
    if (r.ok) {
      const data = r.data as PlayerJoinData
      setView("playerRoomView", { initial: data })
      return
    }
    session.clear()
  }

  setView("homeView")
}

void bootstrap()
