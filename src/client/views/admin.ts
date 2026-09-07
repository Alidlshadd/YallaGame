import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { socket, emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { showToast } from "../ui/toast.js"
import { confirmDialog } from "../ui/confirm.js"
import { watchConnection } from "../services/connection.js"
import { holdWakeLock } from "../services/wakeLock.js"
import { vibrate } from "../ui/haptics.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { setView, setViewBackHandler } from "../router.js"
import { showReveal } from "../ui/roleReveal.js"
import type { RoleAssignedPayload } from "@shared/events.js"
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
    const requestsPanel = $<HTMLDivElement>("#joinRequestsPanel")
    const requestsList  = $<HTMLDivElement>("#joinRequestsList")
    const requestsCount = $<HTMLElement>("#requestsCount")
    const publicToggle   = $<HTMLInputElement>("#roomPublicToggle")
    const approvalToggle = $<HTMLInputElement>("#roomApprovalToggle")

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
      const roleName = (id: string | null) => {
        if (!id || !room) return "—"
        const role = room.game.roles.find(r => r.id === id)
        return role ? `${role.icon} ${role.name[lang]}` : id
      }
      for (const p of room.players) {
        const isHost = p.id === room.hostPlayerId
        const kickBtn = el("button", {
          class: "kick-btn", type: "button", title: t("kick"), "aria-label": `${t("kick")} ${p.name}`
        }, ["✕"])
        // The host holds their own seat; removing it would leave a room with
        // nobody able to deal or close it, so the server refuses too.
        if (isHost) kickBtn.hidden = true
        kickBtn.addEventListener("click", async () => {
          if (!room) return
          const s = session.load(); if (s?.kind !== "admin") return
          // The ✕ sits right next to the player name on a phone, so a misfire
          // used to drop somebody out of the room with no way to undo it.
          const confirmed = await confirmDialog({
            title: "kickPlayerTitle",
            body: "kickPlayerBody",
            confirmKey: "kick",
            cancelKey: "cancel",
            danger: true
          })
          if (!confirmed || !room) return
          const r = await emit("admin:kick-player", { code: room.code, adminSecret: s.adminSecret, playerId: p.id })
          if (!r.ok) showToast(t("errorGeneric"))
        })
        const nameCell = el("span", { class: "player-name" }, [p.name])
        if (isHost) nameCell.appendChild(el("span", { class: "player-badge" }, [t("hostBadge")]))
        const row = el("div", { class: `player-row ${p.connected ? "" : "off"}${isHost ? " is-host" : ""}` }, [
          nameCell,
          el("span", { class: "player-role" }, [roleName(p.role)]),
          kickBtn
        ])
        listEl.appendChild(row)
      }
    }

    function renderRequests() {
      if (!room) return
      // The panel only makes sense while approval is on; with it off there is
      // no queue and an empty box would just be noise.
      requestsPanel.hidden = !room.requireApproval
      clear(requestsList)
      requestsCount.textContent = String(room.pending.length)
      if (room.pending.length === 0) {
        requestsList.classList.add("empty")
        requestsList.appendChild(el("p", { class: "requests-empty" }, [t("noJoinRequests")]))
        return
      }
      requestsList.classList.remove("empty")
      for (const request of room.pending) {
        const decide = async (event: "admin:approve-join" | "admin:reject-join") => {
          if (!room) return
          const s = session.load(); if (s?.kind !== "admin") return
          const r = await emit(event, { code: room.code, adminSecret: s.adminSecret, requestId: request.id })
          if (!r.ok) {
            showToast(r.error === "REQUEST_NOT_FOUND" ? t("errorRequestGone")
                    : r.error === "ROOM_FULL"         ? t("errorRoomFull")
                    : t("errorGeneric"))
          }
        }
        const approveBtn = el("button", { class: "btn btn-primary request-btn", type: "button" }, [t("approve")])
        const rejectBtn  = el("button", { class: "btn btn-ghost request-btn", type: "button" }, [t("reject")])
        approveBtn.addEventListener("click", () => void decide("admin:approve-join"))
        rejectBtn.addEventListener("click",  () => void decide("admin:reject-join"))
        requestsList.appendChild(el("div", { class: "request-row" }, [
          el("span", { class: "request-name" }, [request.name]),
          el("div", { class: "request-actions" }, [rejectBtn, approveBtn])
        ]))
      }
    }

    function renderPrivacy() {
      if (!room) return
      publicToggle.checked = room.isPublic
      approvalToggle.checked = room.requireApproval
    }

    function renderHeader() {
      if (!room) return
      codeEl.textContent     = room.code
      gameNameEl.textContent = room.game.title[lang]
      gameSelEl.textContent  = room.game.title[lang]
    }

    function renderAll() { renderHeader(); renderSettings(); renderPlayers(); renderRequests(); renderPrivacy() }

    const onUpdated = (next: VisibleRoom) => {
      const dealt = !room?.assigned && next.assigned
      room = next
      renderAll()
      if (dealt) vibrate("reveal")
    }
    socket.on("admin:room-updated", onUpdated)

    // The host holds a seat like everyone else, so they get the same flip-card
    // reveal on their own screen rather than reading their role off the list.
    const onRoleAssigned = async (payload: RoleAssignedPayload) => {
      vibrate("reveal")
      await showReveal({ payload, lang })
    }
    socket.on("player:role-assigned", onRoleAssigned)

    // The host's room can also disappear from underneath them — a second tab
    // closing it, or the server sweeping it away.
    const onRoomClosed = () => {
      session.clear()
      clearTheme()
      showToast(t("roomClosedByHost"))
      void setView("homeView", {}, { mode: "root" })
    }
    socket.on("room:closed", onRoomClosed)

    // The host watches the player list fill up without touching the screen.
    const releaseWakeLock = holdWakeLock()
    const stopWatchingConnection = watchConnection()

    if (room) renderAll()

    const onSave = async () => {
      if (!room) return
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
      const s = session.load(); if (s?.kind !== "admin") return
      const r = await emit("admin:clear-roles", { code: room.code, adminSecret: s.adminSecret })
      if (!r.ok) showToast(t("errorGeneric"))
    }

    const onPrivacyChange = async () => {
      if (!room) return
      const s = session.load(); if (s?.kind !== "admin") return
      const r = await emit("admin:update-room", {
        code: room.code, adminSecret: s.adminSecret,
        isPublic: publicToggle.checked,
        requireApproval: approvalToggle.checked
      })
      // Snap the switches back to the server's answer rather than leaving them
      // showing a state the room never entered.
      if (!r.ok) { showToast(t("errorGeneric")); renderPrivacy() }
    }

    const onCopy = async () => {
      if (!room) return
      try { await navigator.clipboard.writeText(room.code); showToast(t("copied")) }
      catch { /* clipboard may be blocked */ }
    }

    const onShare = async () => {
      if (!room) return
      const url = `${location.origin}/?join=${room.code}`
      if (navigator.share) {
        try { await navigator.share({ title: "Yalla Game", text: t("shareInviteText"), url }); return }
        catch { /* user cancelled the share sheet — fall through to copy */ }
      }
      try { await navigator.clipboard.writeText(url); showToast(t("linkCopied")) }
      catch { showToast(url) }
    }

    // Leaving is destructive (the room is abandoned), so both the button and
    // the phone's back gesture route through the same localized confirmation.
    let asking = false
    const requestLeave = (): void => {
      if (asking) return
      asking = true
      void confirmDialog({
        title: "closeRoomTitle",
        body: "closeRoomBody",
        confirmKey: "dialogLeave",
        cancelKey: "dialogStay",
        danger: true
      }).then(async confirmed => {
        asking = false
        if (!confirmed) return
        const s = session.load()
        // Actually delete the room instead of walking away from it: an
        // abandoned room used to linger in the store for hours, and it would
        // now also sit in the public browser luring people into a dead code.
        if (s?.kind === "admin" && room) {
          await emit("admin:close-room", { code: room.code, adminSecret: s.adminSecret })
        }
        session.clear()
        clearTheme()
        void setView("homeView", {}, { mode: "root" })
      })
    }
    const onLeave = () => requestLeave()
    setViewBackHandler(() => { requestLeave(); return true })

    const saveBtn   = $<HTMLButtonElement>("#saveSettingsBtn")
    const clearBtn  = $<HTMLButtonElement>("#clearRolesBtn")
    const copyBtn   = $<HTMLButtonElement>("#copyCodeBtn")
    const shareBtn  = $<HTMLButtonElement>("#shareLinkBtn")
    const leaveBtn  = $<HTMLButtonElement>("#adminLeaveBtn")
    // Named, because these two live in the static shell markup: an anonymous
    // handler would stack up another copy on every re-mount.
    const onToggle = () => void onPrivacyChange()
    publicToggle.addEventListener("change", onToggle)
    approvalToggle.addEventListener("change", onToggle)
    saveBtn.addEventListener("click", onSave)
    assignBtn.addEventListener("click", onAssign)
    clearBtn.addEventListener("click", onClear)
    copyBtn.addEventListener("click", onCopy)
    shareBtn.addEventListener("click", onShare)
    leaveBtn.addEventListener("click", onLeave)

    return () => {
      setViewBackHandler(null)
      releaseWakeLock()
      stopWatchingConnection()
      socket.off("admin:room-updated", onUpdated)
      socket.off("player:role-assigned", onRoleAssigned)
      socket.off("room:closed", onRoomClosed)
      publicToggle.removeEventListener("change", onToggle)
      approvalToggle.removeEventListener("change", onToggle)
      saveBtn.removeEventListener("click", onSave)
      assignBtn.removeEventListener("click", onAssign)
      clearBtn.removeEventListener("click", onClear)
      copyBtn.removeEventListener("click", onCopy)
      shareBtn.removeEventListener("click", onShare)
      leaveBtn.removeEventListener("click", onLeave)
    }
  }
}
