import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { socket, emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { showToast } from "../ui/toast.js"
import { play } from "../services/sound.js"
import { applyTheme } from "../themes/loader.js"
import type { VisibleRoom } from "@shared/types.js"

export const adminView = {
  id: "adminView" as const,
  mount(ctx: { initial?: VisibleRoom }) {
    let room: VisibleRoom | null = ctx.initial ?? null
    const lang = getLang()

    if (room) void applyTheme(room.game.theme).catch(() => {})

    const codeEl     = $<HTMLElement>("#roomCodeText")
    const gameNameEl = $<HTMLElement>("#adminGameName")
    const gameSelEl  = $<HTMLElement>("#selectedGameText")
    const playersN   = $<HTMLElement>("#playersCount")
    const playersNS  = $<HTMLElement>("#playersCountSmall")
    const rolesStat  = $<HTMLElement>("#rolesStatus")
    const settingsEl = $<HTMLDivElement>("#dynamicSettings")
    const listEl     = $<HTMLDivElement>("#adminPlayersList")
    const assignBtn  = $<HTMLButtonElement>("#assignRolesBtn")

    function renderSettings() {
      if (!room) return
      clear(settingsEl)
      for (const def of room.game.settings) {
        const id = `setting-${def.key}`
        const labelText = def.label[lang]
        const value = room.settings[def.key]
        const row = el("label", { for: id })
        row.appendChild(el("span", {}, [labelText]))
        if (def.type === "number") {
          const input = el("input", {
            id, type: "number",
            min: String(def.min), max: String(def.max),
            value: String(value ?? def.min)
          }) as HTMLInputElement
          row.appendChild(input)
        } else {
          const input = el("input", { id, type: "checkbox" }) as HTMLInputElement
          input.checked = Boolean(value)
          row.appendChild(input)
        }
        settingsEl.appendChild(row)
      }
    }

    function renderPlayers() {
      if (!room) return
      clear(listEl)
      playersN.textContent  = String(room.players.length)
      playersNS.textContent = String(room.players.length)
      rolesStat.textContent = room.assigned ? "✓" : "—"
      if (room.players.length === 0) {
        listEl.classList.add("empty")
        listEl.textContent = t("noPlayers")
        return
      }
      listEl.classList.remove("empty")
      for (const p of room.players) {
        const row = el("div", { class: `player-row ${p.connected ? "" : "off"}` }, [
          el("span", { class: "player-name" }, [p.name]),
          el("span", { class: "player-role" }, [p.role ?? "—"])
        ])
        listEl.appendChild(row)
      }
    }

    function renderHeader() {
      if (!room) return
      codeEl.textContent     = room.code
      gameNameEl.textContent = room.game.title[lang]
      gameSelEl.textContent  = room.game.title[lang]
    }

    function renderAll() { renderHeader(); renderSettings(); renderPlayers() }

    const onUpdated = (next: VisibleRoom) => { room = next; renderAll() }
    socket.on("admin:room-updated", onUpdated)

    if (room) renderAll()

    const onSave = async () => {
      if (!room) return
      void play("click")
      const s = session.load()
      if (s?.kind !== "admin") return
      const incoming: Record<string, number | boolean> = {}
      for (const def of room.game.settings) {
        const input = document.getElementById(`setting-${def.key}`) as HTMLInputElement
        if (def.type === "number")  incoming[def.key] = Number(input.value)
        if (def.type === "boolean") incoming[def.key] = input.checked
      }
      const r = await emit("admin:update-settings", { code: room.code, adminSecret: s.adminSecret, settings: incoming })
      if (!r.ok) showToast(t("errorGeneric"))
    }

    const onAssign = async () => {
      if (!room) return
      void play("click")
      const s = session.load(); if (s?.kind !== "admin") return
      assignBtn.classList.add("curtain-fill")
      window.setTimeout(() => assignBtn.classList.remove("curtain-fill"), 1500)
      const r = await emit("admin:assign-roles", { code: room.code, adminSecret: s.adminSecret })
      if (!r.ok) {
        if (r.error === "NEED_MORE_PLAYERS")           showToast(t("errorNeedMorePlayers"))
        else if (r.error === "TOO_MANY_SPECIAL_ROLES") showToast(t("errorTooManySpecial"))
        else                                           showToast(t("errorGeneric"))
      }
    }

    const onClear = async () => {
      if (!room) return
      void play("click")
      const s = session.load(); if (s?.kind !== "admin") return
      const r = await emit("admin:clear-roles", { code: room.code, adminSecret: s.adminSecret })
      if (!r.ok) showToast(t("errorGeneric"))
    }

    const onCopy = async () => {
      if (!room) return
      void play("click", 0.4)
      try { await navigator.clipboard.writeText(room.code); showToast(t("copied")) }
      catch { /* clipboard may be blocked */ }
    }

    const saveBtn   = $<HTMLButtonElement>("#saveSettingsBtn")
    const clearBtn  = $<HTMLButtonElement>("#clearRolesBtn")
    const copyBtn   = $<HTMLButtonElement>("#copyCodeBtn")
    saveBtn.addEventListener("click", onSave)
    assignBtn.addEventListener("click", onAssign)
    clearBtn.addEventListener("click", onClear)
    copyBtn.addEventListener("click", onCopy)

    return () => {
      socket.off("admin:room-updated", onUpdated)
      saveBtn.removeEventListener("click", onSave)
      assignBtn.removeEventListener("click", onAssign)
      clearBtn.removeEventListener("click", onClear)
      copyBtn.removeEventListener("click", onCopy)
    }
  }
}
