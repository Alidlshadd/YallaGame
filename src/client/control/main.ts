import type { Game } from "../../shared/types.js"
import { worldCoverPath } from "../data/assets.js"
import { getWorldDetail } from "../data/worldDetails.js"
import type { PublicConfiguration } from "../services/publicConfig.js"
import { portraitGeometry } from "../ui/portraitGeometry.js"
import { bind, date, language, number, t, updateTranslations, type Copy, type Key } from "./i18n.js"
import {
  button,
  confirmAction,
  countUp,
  dismiss,
  empty,
  field,
  icon,
  node,
  preferences,
  setText,
  skeleton,
  toast,
  trackForm,
  trapDialog,
  type Icon
} from "./ui.js"
import "./style.css"

const root = document.getElementById("control-root")!
let csrf = ""
let catalog: Game[] = []
let brand: Record<string, string> = {}
const brandName = () => brand.siteName || "YallaGame"
const brandLogo = () =>
  (document.documentElement.dataset.theme === "dark" ? brand.darkLogo : "") ||
  brand.logo ||
  "/assets/logo/yallagame-velocity-icon.svg"
const navItems: readonly [string, Key, Icon][] = [
  ["/admin", "overview", "LayoutDashboard"],
  ["/admin/analytics", "analytics", "BarChart3"],
  ["/admin/games/history", "history", "Clock3"],
  ["/admin/players", "players", "Users"],
  ["/admin/games", "library", "Gamepad2"],
  ["/admin/avatars", "avatars", "SmilePlus"],
  ["/admin/settings/branding", "branding", "Palette"],
  ["/admin/settings/system", "system", "Activity"],
  ["/admin/audit-logs", "audit", "ShieldCheck"]
]
class RequestError extends Error {
  constructor(readonly key: Key) {
    super(key)
  }
}
function errorCopy(error: unknown): Copy {
  return t(error instanceof RequestError ? error.key : "failure")
}
async function api<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (method !== "GET") headers["x-csrf-token"] = csrf
  if (body !== undefined) headers["Content-Type"] = "application/json"
  const response = await fetch(url, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store"
  })
  if (response.status === 401 && !url.startsWith("/api/auth")) {
    location.replace("/admin/login")
    throw new RequestError("expired")
  }
  if (!response.ok)
    throw new RequestError(
      response.status === 429
        ? "rateLimit"
        : response.status === 403
          ? "forbidden"
          : response.status === 401
            ? "credentials"
            : "failure"
    )
  return (await response.json()) as T
}
function brandMark(): HTMLImageElement {
  const image = node("img", "", "brand-icon")
  image.alt = ""
  image.width = 44
  image.height = 44
  image.dataset.brandLogo = "true"
  image.src = brandLogo()
  return image
}
function updateBrand(): void {
  document.title = `${brandName()} · ${t("control")()}`
  document.querySelectorAll<HTMLImageElement>("[data-brand-logo]").forEach(image => {
    image.src = brandLogo()
  })
  updateTranslations()
}
document.addEventListener("admin-theme", updateBrand)
document.addEventListener("admin-language", updateBrand)
function heading(title: Copy, description: Copy): HTMLElement {
  const header = node("header", "", "page-heading")
  const eyebrow = node("p", () => `${brandName()} / ${t("control")()}`, "eyebrow")
  header.append(eyebrow, node("h1", title), node("p", description, "muted"))
  return header
}
async function login(): Promise<void> {
  root.className = "login-stage"
  const top = node("div", "", "login-top")
  const identity = node("div", "", "login-brand")
  identity.append(brandMark(), node("strong", brandName))
  top.append(identity, preferences())
  const story = node("section", "", "login-story")
  const orbital = node("div", "", "orbital")
  orbital.setAttribute("aria-hidden", "true")
  for (const name of ["Gamepad2", "Users", "Sparkles", "Trophy"] as const) {
    const tile = node("span", "", "orbit-tile")
    tile.append(icon(name))
    orbital.append(tile)
  }
  story.append(
    node("p", t("control"), "eyebrow"),
    node("h2", t("loginHero")),
    node("p", t("loginDesc"), "muted"),
    orbital
  )
  const panel = node("main", "", "login-panel")
  panel.id = "main-content"
  panel.append(
    icon("ShieldCheck"),
    node("p", t("welcome"), "eyebrow"),
    node("h1", t("control")),
    node("p", t("loginLine"), "muted")
  )
  const form = node("form"),
    username = field(t("username")),
    password = field(t("password"), "password")
  const submit = node("button", t("signIn"), "primary")
  username.input.name = "username"
  username.input.autocomplete = "username"
  username.input.required = true
  username.input.maxLength = 64
  password.input.name = "password"
  password.input.autocomplete = "current-password"
  password.input.required = true
  password.input.maxLength = 128
  const passwordWrap = node("div", "", "password-wrap")
  const reveal = button(
    "",
    () => {
      const visible = password.input.type === "password"
      password.input.type = visible ? "text" : "password"
      reveal.replaceChildren(icon(visible ? "EyeOff" : "Eye"))
      bind(reveal, t(visible ? "hidePassword" : "showPassword"), "aria-label")
      reveal.setAttribute("aria-pressed", String(visible))
    },
    "icon-button",
    "Eye"
  )
  bind(reveal, t("showPassword"), "aria-label")
  reveal.setAttribute("aria-pressed", "false")
  passwordWrap.append(password.input, reveal)
  password.label.append(passwordWrap)
  const error = node("p", "", "form-error")
  error.setAttribute("role", "alert")
  form.append(username.label, password.label, error, submit)
  panel.append(form, node("p", t("restricted"), "login-note"))
  const skip = node("a", t("skip"), "skip-link")
  skip.href = "#main-content"
  root.replaceChildren(skip, top, story, panel)
  form.onsubmit = event => {
    event.preventDefault()
    if (submit.disabled) return
    submit.disabled = true
    setText(submit, t("signingIn"))
    setText(error, "")
    form.setAttribute("aria-busy", "true")
    void (async () => {
      csrf = (await api<{ csrf: string }>("/api/auth/csrf")).csrf
      await api("/api/auth/login", "POST", { username: username.input.value, password: password.input.value })
      password.input.value = ""
      location.replace("/admin")
    })().catch(err => {
      setText(error, errorCopy(err))
      submit.disabled = false
      setText(submit, t("signIn"))
      form.setAttribute("aria-busy", "false")
    })
  }
  username.input.focus()
}
function navigation(): HTMLElement {
  const nav = node("nav")
  bind(nav, t("administration"), "aria-label")
  navItems.forEach(([url, label, glyph], index) => {
    if (index === 0 || index === 4 || index === 6)
      nav.append(node("p", t(index === 0 ? "workspace" : index === 4 ? "manage" : "settings"), "nav-label"))
    const link = node("a")
    link.href = url
    link.append(icon(glyph), node("span", t(label)))
    bind(link, t(label), "title")
    if (location.pathname === url) {
      link.className = "active"
      link.setAttribute("aria-current", "page")
    }
    nav.append(link)
  })
  return nav
}
function signOutLink(): HTMLAnchorElement {
  const link = node("a", "", "logout")
  link.href = "/admin/logout"
  link.append(icon("LogOut"), node("span", t("signOut")))
  return link
}
function shell(username: string): HTMLElement {
  root.className = "control-shell"
  const sidebar = node("aside", "", "sidebar"),
    identity = node("div", "", "sidebar-brand")
  identity.append(brandMark(), node("strong", brandName), node("small", t("control")))
  const note = node("div", "", "sidebar-note")
  note.append(icon("ShieldCheck"), node("span", t("private")))
  sidebar.append(identity, navigation(), note, signOutLink())
  const body = node("div", "", "workspace"),
    top = node("header", "", "topbar"),
    drawer = node("dialog", "", "drawer")
  bind(drawer, t("navigation"), "aria-label")
  trapDialog(drawer)
  const closeDrawer = () =>
    dismiss(drawer, () => {
      drawer.close()
      drawer.classList.remove("leaving")
      menu.focus()
    })
  drawer.append(button(t("closeMenu"), closeDrawer, "drawer-close", "X"), navigation(), signOutLink())
  drawer.oncancel = event => {
    event.preventDefault()
    closeDrawer()
  }
  const menu = button("", () => drawer.showModal(), "menu-toggle icon-button", "Menu")
  bind(menu, t("openMenu"), "aria-label")
  const breadcrumb = node("div", "", "breadcrumb")
  breadcrumb.append(
    node("span", t("workspace")),
    icon("ChevronDown"),
    node("strong", t(navItems.find(([url]) => url === location.pathname)?.[1] ?? "signOut"))
  )
  const account = node("details", "", "account-menu"),
    summary = node("summary", "", "account")
  bind(summary, () => `${t("account")()}: ${username}`, "aria-label")
  summary.append(
    node("span", username.slice(0, 2).toUpperCase(), "avatar"),
    node("span", username, "account-name"),
    icon("ChevronDown")
  )
  account.append(summary, signOutLink())
  account.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      account.open = false
      summary.focus()
    }
  })
  document.addEventListener("click", event => {
    if (!account.contains(event.target as Node)) account.open = false
  })
  top.append(menu, breadcrumb, node("span", t("live"), "live-badge"), preferences(), account)
  const main = node("main")
  main.id = "main-content"
  main.tabIndex = -1
  const skip = node("a", t("skip"), "skip-link")
  skip.href = "#main-content"
  body.append(top, main)
  root.replaceChildren(skip, sidebar, body, drawer)
  return main
}
function gameTitle(id: unknown): string {
  const game = catalog.find(game => game.id === id)
  return game ? game.title[language] || game.title.en : id ? String(id) : t("noData")()
}
type CountRow = { count: number; day?: string; hour?: string; game_id?: string }
function chart(title: Copy, rows: CountRow[], key: "day" | "hour" | "game_id", glyph: Icon): HTMLElement {
  const panel = node("section", "", "panel chart-panel"),
    head = node("div", "", "panel-heading")
  head.append(icon(glyph), node("h2", title))
  panel.append(head)
  if (!rows.length || rows.every(row => row.count === 0)) {
    panel.append(empty("emptyActivity"))
    return panel
  }
  const max = Math.max(1, ...rows.map(row => row.count)),
    bars = node("div", "", "bars")
  rows.forEach((row, index) => {
    const label = () => (key === "game_id" ? gameTitle(row.game_id) : String(row[key]))
    const bar = node("div", "", "bar-row"),
      track = node("div", "", "bar-track"),
      fill = node("div", "", "bar-fill")
    track.setAttribute("role", "meter")
    track.setAttribute("aria-valuemin", "0")
    track.setAttribute("aria-valuemax", String(max))
    track.setAttribute("aria-valuenow", String(row.count))
    bind(track, () => `${label()}: ${number(row.count)}`, "aria-label")
    bar.tabIndex = 0
    const tooltip = node("span", () => `${label()} · ${number(row.count)}`, "chart-tooltip")
    tooltip.setAttribute("aria-hidden", "true")
    fill.style.width = `${(row.count / max) * 100}%`
    fill.style.setProperty("--delay", `${Math.min(index, 12) * 25}ms`)
    track.append(fill)
    bar.append(
      node("span", label, "bar-label"),
      track,
      node("strong", () => number(row.count)),
      tooltip
    )
    bars.append(bar)
  })
  panel.append(bars)
  return panel
}
type Runtime = {
  version: string
  node: string
  uptimeSeconds: number
  database: string
  lastHealthCheck: number | null
  disk: { totalBytes: number; availableBytes: number } | null
}
const metrics: readonly [string, Key, Icon, Key][] = [
  ["visitorsToday", "visitorsToday", "Users", "uniqueHint"],
  ["visitors7Days", "visitors7", "CalendarDays", "uniqueHint"],
  ["visitorsTotal", "visitorsTotal", "Globe2", "retainedHint"],
  ["online", "online", "Activity", "onlineHint"],
  ["roomsToday", "rooms", "Layers3", "roomsHint"],
  ["startedToday", "started", "Gamepad2", "startsHint"],
  ["completedToday", "completed", "CheckCheck", "completeHint"],
  ["gamesTotal", "gamesTotal", "Trophy", "retainedHint"],
  ["averagePlayers", "average", "Users", "averageHint"],
  ["mostPopular", "popular", "Sparkles", "popularHint"]
]
async function dashboard(main: HTMLElement): Promise<void> {
  const hero = heading(
    t(location.pathname.endsWith("analytics") ? "analytics" : "overviewTitle"),
    t("overviewDesc")
  )
  hero.classList.add("hero")
  const art = node("div", "", "hero-art")
  art.setAttribute("aria-hidden", "true")
  art.append(icon("Gamepad2"), icon("Sparkles"))
  hero.append(art)
  const heroMeta = node("div", "", "hero-meta"),
    health = node("span", t("checking"), "status-badge"),
    refreshed = node("span", "", "muted")
  const period = node("select")
  bind(period, t("dateRange"), "aria-label")
  const periods: readonly [number, Key][] = [
    [1, "today"],
    [7, "days7"],
    [30, "days30"],
    [90, "days90"],
    [0, "allTime"]
  ]
  for (const [value, label] of periods) {
    const option = node("option", t(label))
    option.value = String(value)
    period.append(option)
  }
  period.value = "7"
  const selectedPeriod = node(
    "span",
    () => t(periods.find(([value]) => String(value) === period.value)?.[1] ?? "days7")(),
    "period-badge"
  )
  heroMeta.append(health, selectedPeriod, refreshed)
  hero.append(heroMeta)
  const toolbar = node("div", "", "toolbar"),
    label = node("label", t("period"), "period-label")
  label.append(period)
  const refreshButton = button(t("refresh"), () => void refresh(), "", "RefreshCw")
  toolbar.append(label, refreshButton)
  const content = node("div", "", "dashboard-content"),
    note = node("p", t("utcNote"), "data-note")
  main.append(hero, toolbar, content, note)
  let request = 0
  const previousValues = new Map<string, number>()
  async function refresh() {
    const sequence = ++request
    content.setAttribute("aria-busy", "true")
    refreshButton.disabled = true
    if (!content.children.length) content.replaceChildren(skeleton())
    updateTranslations()
    // System failure must not hide otherwise available analytics.
    const runtimePromise = api<Runtime>("/api/admin/system").catch(() => null)
    try {
      const data = await api<{
        kpis: Record<string, number | string | null>
        visitors: CountRow[]
        starts: CountRow[]
        popularity: CountRow[]
        hours: CountRow[]
      }>(`/api/admin/dashboard?days=${period.value}`)
      const runtime = await runtimePromise
      if (sequence !== request) return
      setText(health, t(runtime?.database === "ok" ? "connected" : "disconnected"))
      health.classList.toggle("online", runtime?.database === "ok")
      health.classList.toggle("offline", runtime?.database !== "ok")
      const updated = Date.now()
      setText(refreshed, t("refreshed", { time: () => date(updated, true) }))
      const cards = node("section", "", "kpi-grid")
      const animations: (() => void)[] = []
      metrics.forEach(([key, label, glyph, hint], index) => {
        const card = node("article", "", `kpi accent-${index % 5} ${key === "online" ? "highlight" : ""}`)
        card.style.setProperty("--delay", `${index * 35}ms`)
        const top = node("div", "", "kpi-top"),
          value = node("strong", "", "kpi-value")
        top.append(node("p", t(label)), icon(glyph))
        if (key === "mostPopular") setText(value, () => gameTitle(data.kpis[key]))
        else if (typeof data.kpis[key] === "number") {
          const amount = data.kpis[key] as number
          setText(value, () => number(amount))
          animations.push(() => countUp(value, previousValues.get(key) ?? 0, amount))
          previousValues.set(key + ":next", amount)
        } else setText(value, t("noData"))
        card.append(top, value, node("small", t(hint)))
        cards.append(card)
      })
      const graphs = node("div", "", "chart-grid")
      graphs.append(
        chart(t("unique"), data.visitors, "day", "Users"),
        chart(t("starts"), data.starts, "day", "Gamepad2"),
        chart(t("rotation"), data.popularity, "game_id", "Trophy"),
        chart(t("hours"), data.hours, "hour", "Clock3")
      )
      const pulse = node("section", "", "panel pulse-panel")
      pulse.append(
        node("h2", t("pulse")),
        node("span", t(runtime?.database === "ok" ? "connected" : "disconnected"), "status-badge")
      )
      if (runtime)
        pulse.append(
          node(
            "p",
            () =>
              `${t("uptime")()}: ${t("minutes", { count: number(Math.floor(runtime.uptimeSeconds / 60)) })()}`
          )
        )
      pulse.append(
        node("p", () => `${t("online")()}: ${number(Number(data.kpis.online ?? 0))}`),
        node("p", () => `${t("popular")()}: ${gameTitle(data.kpis.mostPopular)}`)
      )
      content.replaceChildren(
        cards,
        node(
          "p",
          t("selectedVisitors", { count: () => number(Number(data.kpis.visitorsSelected ?? 0)) }),
          "muted section-caption"
        ),
        ...(period.value === "0" ? [node("p", t("days90"), "muted")] : []),
        graphs,
        pulse
      )
      animations.forEach(animate => animate())
      metrics.forEach(([key]) => {
        const next = previousValues.get(key + ":next")
        if (next !== undefined) previousValues.set(key, next)
      })
    } catch (err) {
      if (sequence !== request) return
      setText(health, t("disconnected"))
      health.classList.remove("online")
      content.replaceChildren(
        node("p", errorCopy(err), "form-error"),
        button(t("retry"), () => void refresh())
      )
    } finally {
      if (sequence === request) {
        content.setAttribute("aria-busy", "false")
        refreshButton.disabled = false
      }
    }
  }
  period.onchange = () => void refresh()
  await refresh()
}

type RecordRow = Record<string, string | number | null>
const actionKeys: Record<string, Key> = {
  login: "loginAction",
  logout: "logoutAction",
  login_failed: "loginFailed",
  game_status_changed: "gameUpdated",
  game_image_changed: "gameUpdated",
  game_settings_changed: "gameUpdated",
  logo_changed: "brandUpdated",
  system_setting_changed: "brandUpdated",
  image_uploaded: "imageUploaded"
}
async function records(main: HTMLElement, kind: "history" | "players" | "audit-logs"): Promise<void> {
  const title: Key = kind === "audit-logs" ? "audit" : kind
  main.append(heading(t(title), t(kind === "players" ? "playerDesc" : "recordsDesc")))
  const form = node("form", "", "toolbar filters panel"),
    search = field(t("search")),
    from = field(t("from"), "date"),
    to = field(t("to"), "date"),
    game = node("select")
  search.input.maxLength = 80
  bind(game, t("gameFilter"), "aria-label")
  const all = node("option", t("allGames"))
  all.value = ""
  game.append(all)
  for (const item of catalog) {
    const option = node("option", () => gameTitle(item.id))
    option.value = item.id
    game.append(option)
  }
  const submit = node("button", t("apply"), "primary")
  form.append(search.label, from.label, to.label)
  if (kind !== "audit-logs") form.append(game)
  form.append(submit)
  const content = node("div"),
    pagination = node("div", "", "pagination"),
    error = node("p", "", "form-error")
  error.setAttribute("role", "alert")
  main.append(form, error, content, pagination)
  let page = 1,
    sequence = 0
  async function refresh() {
    const request = ++sequence
    content.setAttribute("aria-busy", "true")
    content.replaceChildren(skeleton("loadingRecords"))
    pagination.replaceChildren()
    submit.disabled = true
    const params = new URLSearchParams({ page: String(page), q: search.input.value, game: game.value })
    if (from.input.value) params.set("from", from.input.value)
    if (to.input.value) params.set("to", to.input.value)
    try {
      const data = await api<{ rows: RecordRow[]; total: number; pageSize: number }>(
        `/api/admin/${kind}?${params}`
      )
      if (request !== sequence) return
      const headers: Key[] =
        kind === "history"
          ? ["date", "game", "room", "players", "count", "duration", "status"]
          : kind === "players"
            ? ["date", "displayName", "game", "room"]
            : ["date", "admin", "action", "target", "details"]
      const table = node("table"),
        head = node("thead"),
        hr = node("tr"),
        tbody = node("tbody")
      const caption = node("caption", t(title), "sr-only")
      table.append(caption)
      for (const label of headers) {
        const th = node("th", t(label))
        th.scope = "col"
        hr.append(th)
      }
      head.append(hr)
      for (const row of data.rows) {
        const tr = node("tr"),
          timestamp = () => date(Number(row.started_at ?? row.created_at))
        const cells: Copy[] =
          kind === "history"
            ? [
                timestamp,
                () => gameTitle(row.game_id),
                String(row.room_ref ?? "—"),
                String(JSON.parse(String(row.players)).join(", ")),
                () => number(Number(row.player_count)),
                row.ended_at
                  ? t("seconds", {
                      count: () => number(Math.round((Number(row.ended_at) - Number(row.started_at)) / 1000))
                    })
                  : "—",
                t(
                  row.status === "running"
                    ? "running"
                    : row.status === "completed"
                      ? "complete"
                      : "interrupted"
                )
              ]
            : kind === "players"
              ? [
                  timestamp,
                  String(row.player_name ?? "—"),
                  () => gameTitle(row.game_id),
                  String(row.room_ref ?? "—")
                ]
              : [
                  timestamp,
                  row.username ? String(row.username) : t("anonymous"),
                  actionKeys[String(row.action)] ? t(actionKeys[String(row.action)]!) : String(row.action),
                  String(row.target ?? "—")
                ]
        for (const value of cells) tr.append(node("td", value))
        if (kind === "audit-logs") {
          const cell = node("td"),
            details = node("details", "", "metadata")
          let metadata = String(row.metadata ?? "{}")
          try {
            metadata = JSON.stringify(JSON.parse(metadata), null, 2)
          } catch {
            /* server supplies sanitized text */
          }
          details.append(node("summary", t("details")), node("pre", metadata))
          cell.append(details)
          tr.append(cell)
        }
        tbody.append(tr)
      }
      table.append(head, tbody)
      const scroll = node("div", "", "table-scroll panel")
      scroll.tabIndex = 0
      bind(scroll, t(title), "aria-label")
      scroll.append(table)
      content.replaceChildren(data.rows.length ? scroll : empty("emptyRecords"))
      const previous = button(
          t("previous"),
          () => {
            page--
            void refresh()
          },
          "directional",
          "ArrowLeft"
        ),
        next = button(
          t("next"),
          () => {
            page++
            void refresh()
          },
          "directional",
          "ArrowRight"
        )
      previous.disabled = page === 1
      next.disabled = page * data.pageSize >= data.total
      const currentPage = page
      const info = node(
        "span",
        t("pagination", {
          count: () => number(data.total),
          page: () => number(currentPage),
          pages: () => number(Math.max(1, Math.ceil(data.total / data.pageSize)))
        }),
        "muted"
      )
      info.setAttribute("role", "status")
      pagination.replaceChildren(info, previous, next)
    } catch (err) {
      if (request === sequence)
        content.replaceChildren(
          node("p", errorCopy(err), "form-error"),
          button(t("retry"), () => void refresh())
        )
    } finally {
      if (request === sequence) {
        content.setAttribute("aria-busy", "false")
        submit.disabled = false
      }
    }
  }
  form.onsubmit = event => {
    event.preventDefault()
    if (from.input.value && to.input.value && from.input.value > to.input.value) {
      setText(error, t("datesInvalid"))
      return
    }
    setText(error, "")
    page = 1
    void refresh()
  }
  await refresh()
}

interface AssetEditor {
  element: HTMLElement
  value: () => Promise<string | null>
  preview: () => string
  isDefault: () => boolean
  committed: () => void
}
function imageEditor(label: Key, current: string | null, fallback: string): AssetEditor {
  const element = node("fieldset", "", "image-editor"),
    legend = node("legend", t(label)),
    image = node("img"),
    input = node("input"),
    status = node("p", t(current ? "uploaded" : "defaultAsset"), "asset-status")
  bind(image, t("preview", { label: t(label) }), "alt")
  image.src = current || fallback
  image.loading = "lazy"
  image.hidden = !current && !fallback
  input.type = "file"
  input.accept = "image/jpeg,image/png,image/webp"
  bind(input, t("upload", { label: t(label) }), "aria-label")
  let selected: File | null = null,
    asset = current?.split("/").pop() ?? null,
    preview = "",
    uploading = false
  const changed = () => element.dispatchEvent(new Event("change", { bubbles: true }))
  const clearPreview = () => {
    if (preview) URL.revokeObjectURL(preview)
    preview = ""
  }
  const choose = (file: File | undefined) => {
    if (!file || uploading) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast(t("uploadLimit"), true)
      input.value = ""
      return
    }
    selected = file
    clearPreview()
    preview = URL.createObjectURL(file)
    image.src = preview
    image.hidden = false
    element.dataset.state = "unsaved"
    setText(status, t("newPreview"))
    changed()
  }
  input.onchange = () => choose(input.files?.[0])
  element.addEventListener("dragover", event => {
    event.preventDefault()
    if (!uploading) element.classList.add("drag-over")
  })
  element.addEventListener("dragleave", () => element.classList.remove("drag-over"))
  element.addEventListener("drop", event => {
    event.preventDefault()
    element.classList.remove("drag-over")
    choose(event.dataTransfer?.files[0])
  })
  const reset = button(
    t("restore"),
    () => {
      void confirmAction(t("restoreConfirm", { label: t(label) })).then(ok => {
        if (!ok || uploading) return
        asset = null
        selected = null
        input.value = ""
        clearPreview()
        image.src = fallback
        image.hidden = !fallback
        element.dataset.state = "unsaved"
        setText(status, t("defaultSelected"))
        changed()
      })
    },
    "subtle"
  )
  const help = node("label", t("uploadHelp"), "upload-zone")
  help.prepend(icon("UploadCloud"))
  help.append(input)
  element.append(legend, image, help, reset, status)
  status.setAttribute("aria-live", "polite")
  return {
    element,
    preview: () => (image.hidden ? "" : image.src),
    isDefault: () => !asset && !selected,
    committed: () => {
      element.dataset.state = "saved"
      setText(status, t(asset ? "uploaded" : "defaultAsset"))
    },
    value: async () => {
      if (!selected) return asset
      uploading = true
      element.classList.add("uploading")
      element.setAttribute("aria-busy", "true")
      input.disabled = true
      reset.disabled = true
      setText(status, t("uploading"))
      try {
        const response = await fetch("/api/admin/uploads", {
          method: "POST",
          headers: { "x-csrf-token": csrf, "Content-Type": selected.type },
          body: selected,
          cache: "no-store"
        })
        if (response.status === 401) {
          location.replace("/admin/login")
          throw new RequestError("expired")
        }
        const result = (await response.json()) as { id?: string }
        if (!response.ok || !result.id) throw new RequestError("uploadFailed")
        asset = result.id
        selected = null
        input.value = ""
        image.src = `/uploads/${asset}`
        clearPreview()
        setText(status, t("uploaded"))
        return asset
      } catch (err) {
        setText(status, t("uploadFailed"))
        throw err
      } finally {
        uploading = false
        input.disabled = false
        reset.disabled = false
        element.classList.remove("uploading")
        element.setAttribute("aria-busy", "false")
      }
    }
  }
}
/** Like `imageEditor`, but the "no override yet" state for a built-in avatar
 * that still uses the sprite atlas shows the atlas sheet cropped to that
 * character's face (same CSS trick `buildAvatar` uses client-side) instead
 * of a single fallback image URL — there isn't one, by design (see the
 * avatar-management spec: slicing the atlas into per-character files was
 * deliberately out of scope). Once a replacement is uploaded it's always a
 * plain image, atlas or not. */
function avatarImageEditor(def: CharacterDefLite | null, current: string | null): AssetEditor {
  const element = node("fieldset", "", "image-editor"),
    legend = node("legend", t("avatarImage")),
    face = node("div", "", "avatar-mini-face"),
    preview = node("div", "", "avatar-mini"),
    input = node("input"),
    status = node("p", t(current ? "uploaded" : "defaultAsset"), "asset-status")
  preview.append(face)
  const showDefault = () => {
    const img = node("img")
    img.alt = ""
    if (def?.image) {
      img.src = def.image
    } else if (def?.portrait !== undefined) {
      const [x, y] = portraitGeometry(def.portrait).crop
      img.src = "/assets/characters/avatar-atlas.webp"
      img.classList.add("avatar-mini-atlas")
      img.style.cssText = `width:${(1024 / 204) * 100}%;height:${(1536 / 264) * 100}%;left:${(-x / 204) * 100}%;top:${(-y / 264) * 100}%`
    } else if (def) {
      img.src = `/assets/characters/${def.id}.webp`
    }
    face.replaceChildren(img)
  }
  const showUrl = (url: string) => {
    const img = node("img")
    img.alt = ""
    img.src = url
    face.replaceChildren(img)
  }
  if (current) showUrl(current)
  else showDefault()
  input.type = "file"
  input.accept = "image/jpeg,image/png,image/webp"
  bind(input, t("upload", { label: t("avatarImage") }), "aria-label")
  let selected: File | null = null,
    asset = current?.split("/").pop() ?? null,
    objectUrl = "",
    uploading = false
  const changed = () => element.dispatchEvent(new Event("change", { bubbles: true }))
  const clearObjectUrl = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = ""
  }
  const choose = (file: File | undefined) => {
    if (!file || uploading) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast(t("uploadLimit"), true)
      input.value = ""
      return
    }
    selected = file
    clearObjectUrl()
    objectUrl = URL.createObjectURL(file)
    showUrl(objectUrl)
    element.dataset.state = "unsaved"
    setText(status, t("newPreview"))
    changed()
  }
  input.onchange = () => choose(input.files?.[0])
  element.addEventListener("dragover", event => {
    event.preventDefault()
    if (!uploading) element.classList.add("drag-over")
  })
  element.addEventListener("dragleave", () => element.classList.remove("drag-over"))
  element.addEventListener("drop", event => {
    event.preventDefault()
    element.classList.remove("drag-over")
    choose(event.dataTransfer?.files[0])
  })
  const reset = button(
    t("restore"),
    () => {
      void confirmAction(t("restoreConfirm", { label: t("avatarImage") })).then(ok => {
        if (!ok || uploading) return
        asset = null
        selected = null
        input.value = ""
        clearObjectUrl()
        showDefault()
        element.dataset.state = "unsaved"
        setText(status, t("defaultSelected"))
        changed()
      })
    },
    "subtle"
  )
  const help = node("label", t("uploadHelp"), "upload-zone")
  help.prepend(icon("UploadCloud"))
  help.append(input)
  // A fully custom avatar has no built-in default to restore, so the button
  // isn't in the DOM at all — `button { display: ... }` in this stylesheet
  // would defeat a plain `hidden` attribute on it.
  element.append(legend, preview, help, ...(def ? [reset] : []), status)
  status.setAttribute("aria-live", "polite")
  return {
    element,
    preview: () => (objectUrl ? objectUrl : asset ? `/uploads/${asset}` : ""),
    isDefault: () => !asset && !selected,
    committed: () => {
      element.dataset.state = "saved"
      setText(status, t(asset ? "uploaded" : "defaultAsset"))
    },
    value: async () => {
      if (!selected) return asset
      uploading = true
      element.classList.add("uploading")
      element.setAttribute("aria-busy", "true")
      input.disabled = true
      reset.disabled = true
      setText(status, t("uploading"))
      try {
        const response = await fetch("/api/admin/uploads", {
          method: "POST",
          headers: { "x-csrf-token": csrf, "Content-Type": selected.type },
          body: selected,
          cache: "no-store"
        })
        if (response.status === 401) {
          location.replace("/admin/login")
          throw new RequestError("expired")
        }
        const result = (await response.json()) as { id?: string }
        if (!response.ok || !result.id) throw new RequestError("uploadFailed")
        asset = result.id
        selected = null
        input.value = ""
        showUrl(`/uploads/${asset}`)
        clearObjectUrl()
        setText(status, t("uploaded"))
        return asset
      } catch (err) {
        setText(status, t("uploadFailed"))
        throw err
      } finally {
        uploading = false
        input.disabled = false
        reset.disabled = false
        element.classList.remove("uploading")
        element.setAttribute("aria-busy", "false")
      }
    }
  }
}
function submitState(form: HTMLFormElement, busy: boolean): void {
  form.inert = busy
  form.setAttribute("aria-busy", String(busy))
  form.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input,button").forEach(input => {
    input.disabled = busy
  })
}
async function games(main: HTMLElement): Promise<void> {
  main.append(heading(t("library"), t("libraryDesc")))
  const loading = skeleton()
  main.append(loading)
  const data = await api<PublicConfiguration & { catalog: Game[] }>("/api/admin/games")
  const grid = node("div", "", "game-grid")
  for (const game of data.catalog) {
    const override = data.games[game.id],
      card = node("section", "", "panel game-card"),
      form = node("form")
    const cover = node("img", "", "game-cover")
    cover.src = override?.assets.cover || worldCoverPath(game.theme)
    cover.alt = ""
    cover.loading = "lazy"
    const cardHead = node("div", "", "game-card-heading"),
      badge = node("span", t(override?.enabled === false ? "disabled" : "visible"), "status-badge")
    cardHead.append(
      node("p", game.id, "eyebrow"),
      node("h2", () => gameTitle(game.id)),
      badge
    )
    card.append(cover, cardHead)
    const enabled = field(t("visible"), "checkbox"),
      order = field(t("order"), "number", String(override?.order ?? data.catalog.indexOf(game)))
    enabled.input.checked = override?.enabled !== false
    order.input.min = "-10000"
    order.input.max = "10000"
    order.input.step = "1"
    order.input.required = true
    const detail = getWorldDetail(game.id)
    const defaults = {
      cover: worldCoverPath(game.theme),
      detail: detail?.detailBackground ?? "",
      cta: detail?.ctaBackground ?? "",
      section: detail?.sectionsBackground ?? ""
    }
    const editors = Object.entries(defaults).map(([slot, fallback]) => ({
      slot,
      editor: imageEditor(
        slot as "cover" | "detail" | "cta" | "section",
        override?.assets[slot] ?? null,
        fallback
      )
    }))
    const images = node("div", "", "image-grid")
    for (const { editor } of editors) images.append(editor.element)
    const save = node("button", t("saveGame"), "primary"),
      settings = node("div", "", "game-settings")
    settings.append(enabled.label, order.label)
    form.append(settings, images, save)
    const state = trackForm(form)
    card.append(form)
    grid.append(card)
    form.addEventListener("change", () => {
      cover.src = editors[0]!.editor.preview()
      setText(badge, t(enabled.input.checked ? "visible" : "disabled"))
    })
    let saving = false
    form.onsubmit = event => {
      event.preventDefault()
      if (saving) return
      saving = true
      void (async () => {
        if (
          !enabled.input.checked &&
          !(await confirmAction(t("disableConfirm", { game: () => gameTitle(game.id) })))
        )
          return
        submitState(form, true)
        setText(save, t("saving"))
        const assets: Record<string, string | null> = {}
        for (const { slot, editor } of editors) assets[slot] = await editor.value()
        await api(`/api/admin/games/${game.id}`, "PUT", {
          enabled: enabled.input.checked,
          order: Number(order.input.value),
          assets
        })
        state.saved()
        editors.forEach(({ editor }) => editor.committed())
        cover.src = editors[0]!.editor.preview()
        toast(t("gameSaved", { game: () => gameTitle(game.id) }))
      })()
        .catch(err => toast(errorCopy(err), true))
        .finally(() => {
          saving = false
          submitState(form, false)
          setText(save, t("saveGame"))
        })
    }
  }
  loading.replaceWith(grid)
}
interface CharacterDefLite {
  id: string
  name: Record<"en" | "tr" | "ar" | "ku", string>
  portrait?: number
  image?: string
}
interface AvatarOverrideRow {
  id: string
  enabled: number
  sort_order: number
  name_en: string | null
  name_tr: string | null
  name_ar: string | null
  name_ku: string | null
  image: string | null
  created_at: number
  updated_at: number
}
function avatarCard(def: CharacterDefLite | null, override: AvatarOverrideRow | null): HTMLElement {
  const isCustom = !def
  const card = node("section", "", "panel avatar-card"),
    form = node("form")
  const badge = node("span", t(isCustom ? "custom" : "builtIn"), "status-badge avatar-card-badge")
  const editor = avatarImageEditor(def, override?.image ? `/uploads/${override.image}` : null)
  const nameEn = field(t("nameEn"), "text", override?.name_en ?? def?.name.en ?? ""),
    nameTr = field(t("nameTr"), "text", override?.name_tr ?? def?.name.tr ?? ""),
    nameAr = field(t("nameAr"), "text", override?.name_ar ?? def?.name.ar ?? ""),
    nameKu = field(t("nameKu"), "text", override?.name_ku ?? def?.name.ku ?? "")
  for (const f of [nameEn, nameTr, nameAr, nameKu]) {
    f.input.required = true
    f.input.maxLength = 40
  }
  const names = node("div", "", "avatar-card-names")
  names.append(nameEn.label, nameTr.label, nameAr.label, nameKu.label)
  const enabled = field(t("visible"), "checkbox"),
    order = field(t("order"), "number", String(override?.sort_order ?? 0))
  enabled.input.checked = override?.enabled !== 0
  order.input.min = "-10000"
  order.input.max = "10000"
  order.input.step = "1"
  order.input.required = true
  const settings = node("div", "", "game-settings")
  settings.append(enabled.label, order.label)
  const nameOf = () => nameEn.input.value || def?.name.en || override?.id || ""
  const save = node("button", t("saveAvatar"), "primary")
  const actions = node("div", "", "avatar-card-row")
  actions.append(save)
  if (isCustom) {
    actions.append(
      button(t("deleteAvatar"), () => {
        void confirmAction(t("deleteAvatarConfirm", { avatar: nameOf })).then(ok => {
          if (!ok) return
          void api(`/api/admin/avatars/${override!.id}`, "DELETE")
            .then(() => {
              dismiss(card, () => card.remove())
              toast(t("avatarDeleted"))
            })
            .catch(err => toast(errorCopy(err), true))
        })
      })
    )
  }
  form.append(editor.element, names, settings, actions)
  const state = trackForm(form)
  card.append(badge, form)
  let saving = false
  form.onsubmit = event => {
    event.preventDefault()
    if (saving) return
    saving = true
    void (async () => {
      if (
        !enabled.input.checked &&
        override?.enabled !== 0 &&
        !(await confirmAction(t("hideAvatarConfirm", { avatar: nameOf })))
      )
        return
      submitState(form, true)
      setText(save, t("saving"))
      const image = await editor.value()
      const id = def?.id ?? override!.id
      await api(`/api/admin/avatars/${id}`, "PUT", {
        enabled: enabled.input.checked,
        order: Number(order.input.value),
        name: { en: nameEn.input.value, tr: nameTr.input.value, ar: nameAr.input.value, ku: nameKu.input.value },
        image
      })
      state.saved()
      editor.committed()
      toast(t("avatarSaved", { avatar: nameOf }))
    })()
      .catch(err => toast(errorCopy(err), true))
      .finally(() => {
        saving = false
        submitState(form, false)
        setText(save, t("saveAvatar"))
      })
  }
  return card
}
function newAvatarCard(onCreated: (row: AvatarOverrideRow) => void): HTMLElement {
  const card = node("section", "", "panel avatar-card"),
    form = node("form")
  const badge = node("span", t("custom"), "status-badge avatar-card-badge")
  const editor = avatarImageEditor(null, null)
  const nameEn = field(t("nameEn")),
    nameTr = field(t("nameTr")),
    nameAr = field(t("nameAr")),
    nameKu = field(t("nameKu"))
  for (const f of [nameEn, nameTr, nameAr, nameKu]) {
    f.input.required = true
    f.input.maxLength = 40
  }
  const names = node("div", "", "avatar-card-names")
  names.append(nameEn.label, nameTr.label, nameAr.label, nameKu.label)
  const save = node("button", t("addAvatar"), "primary")
  const actions = node("div", "", "avatar-card-row")
  actions.append(
    save,
    button(t("cancel"), () => dismiss(card, () => card.remove()))
  )
  form.append(editor.element, names, actions)
  card.append(badge, form)
  let saving = false
  form.onsubmit = event => {
    event.preventDefault()
    if (saving) return
    saving = true
    void (async () => {
      submitState(form, true)
      setText(save, t("saving"))
      const image = await editor.value()
      if (!image) {
        toast(t("uploadLimit"), true)
        return
      }
      const name = { en: nameEn.input.value, tr: nameTr.input.value, ar: nameAr.input.value, ku: nameKu.input.value }
      const created = await api<{ id: string }>("/api/admin/avatars", "POST", { name, image })
      toast(t("avatarCreated"))
      dismiss(card, () => {
        card.remove()
        onCreated({
          id: created.id,
          enabled: 1,
          sort_order: 0,
          name_en: name.en,
          name_tr: name.tr,
          name_ar: name.ar,
          name_ku: name.ku,
          image,
          created_at: Date.now(),
          updated_at: Date.now()
        })
      })
    })()
      .catch(err => toast(errorCopy(err), true))
      .finally(() => {
        saving = false
        submitState(form, false)
        setText(save, t("addAvatar"))
      })
  }
  return card
}
async function avatars(main: HTMLElement): Promise<void> {
  main.append(heading(t("avatars"), t("avatarsDesc")))
  const loading = skeleton()
  main.append(loading)
  const data = await api<{ catalog: CharacterDefLite[]; overrides: AvatarOverrideRow[] }>("/api/admin/avatars")
  const overridesById = new Map(data.overrides.map(row => [row.id, row]))
  const builtInIds = new Set(data.catalog.map(def => def.id))
  const toolbar = node("div", "", "avatar-toolbar"),
    grid = node("div", "", "game-grid avatar-grid")
  toolbar.append(
    button(t("addAvatar"), () => grid.prepend(newAvatarCard(row => grid.prepend(avatarCard(null, row)))), "primary", "SmilePlus")
  )
  for (const def of data.catalog) grid.append(avatarCard(def, overridesById.get(def.id) ?? null))
  for (const row of data.overrides)
    if (!builtInIds.has(row.id)) grid.append(avatarCard(null, row))
  loading.replaceWith(toolbar, grid)
}
async function branding(main: HTMLElement): Promise<void> {
  main.append(heading(t("brandTitle"), t("brandDesc")))
  const data = await api<Record<string, string>>("/api/admin/branding"),
    form = node("form", "", "panel branding-form")
  const name = field(t("siteName"), "text", data.siteName ?? ""),
    description = field(t("description"), "text", data.description ?? ""),
    footer = field(t("footer"), "text", data.footer ?? "")
  name.input.maxLength = 80
  description.input.maxLength = 300
  footer.input.maxLength = 300
  name.input.placeholder = "YallaGame"
  form.append(node("h2", t("brandTitle")), name.label, description.label, footer.label)
  const defaults: Record<string, string> = {
    logo: "/assets/logo/yallagame-velocity-icon.svg",
    darkLogo: "/assets/logo/yallagame-velocity-icon.svg",
    favicon: "/assets/logo/favicon-velocity.png",
    ogImage: "/assets/logo/og-velocity.png"
  }
  const assetLabels: Record<string, Key> = {
    logo: "mainLogo",
    darkLogo: "darkLogo",
    favicon: "favicon",
    ogImage: "og"
  }
  const editors = Object.entries(defaults).map(([key, fallback]) => ({
    key,
    editor: imageEditor(assetLabels[key]!, data[key] ?? null, fallback)
  }))
  const images = node("div", "", "image-grid")
  for (const { editor } of editors) images.append(editor.element)
  const save = node("button", t("saveBrand"), "primary")
  form.append(images, node("p", t("imageLimits"), "muted"), save)
  const state = trackForm(form)
  const preview = node("aside", "", "brand-preview panel")
  preview.append(node("h2", t("livePreview")), node("p", t("previewNote"), "muted"))
  const previews: {
    logo: HTMLImageElement
    name: HTMLElement
    description: HTMLElement
    footer: HTMLElement
    dark: boolean
  }[] = []
  for (const dark of [false, true]) {
    const sample = node("div", "", `brand-sample ${dark ? "sample-dark" : "sample-light"}`),
      logo = node("img", "", "preview-logo")
    logo.alt = ""
    const title = node("h3"),
      desc = node("p"),
      foot = node("small")
    sample.append(node("span", t(dark ? "dark" : "light"), "preview-theme"), logo, title, desc, foot)
    previews.push({ logo, name: title, description: desc, footer: foot, dark })
    preview.append(sample)
  }
  const renderPreview = () => {
    for (const sample of previews) {
      const mainLogo = editors.find(({ key }) => key === "logo")!.editor
      const darkLogo = editors.find(({ key }) => key === "darkLogo")!.editor
      sample.logo.src = sample.dark && !darkLogo.isDefault() ? darkLogo.preview() : mainLogo.preview()
      setText(sample.name, name.input.value.trim() || "YallaGame")
      setText(sample.description, description.input.value || t("loginLine"))
      setText(sample.footer, footer.input.value || t("control"))
    }
  }
  form.addEventListener("input", renderPreview)
  form.addEventListener("change", renderPreview)
  const layout = node("div", "", "branding-layout")
  layout.append(form, preview)
  main.append(layout)
  renderPreview()
  let saving = false
  form.onsubmit = event => {
    event.preventDefault()
    if (saving) return
    saving = true
    void (async () => {
      if (!(await confirmAction(t("publishBrand")))) return
      submitState(form, true)
      setText(save, t("saving"))
      const body: Record<string, string | null> = {
        siteName: name.input.value,
        description: description.input.value,
        footer: footer.input.value
      }
      for (const { key, editor } of editors) body[key] = await editor.value()
      await api("/api/admin/branding", "PUT", body)
      state.saved()
      editors.forEach(({ editor }) => editor.committed())
      brand = {
        ...brand,
        siteName: name.input.value.trim(),
        description: description.input.value.trim(),
        footer: footer.input.value.trim()
      }
      for (const { key } of editors) {
        if (body[key]) brand[key] = `/uploads/${body[key]}`
        else delete brand[key]
      }
      updateBrand()
      renderPreview()
      toast(t("brandSaved"))
    })()
      .catch(err => toast(errorCopy(err), true))
      .finally(() => {
        saving = false
        submitState(form, false)
        setText(save, t("saveBrand"))
      })
  }
}
async function system(main: HTMLElement): Promise<void> {
  main.append(heading(t("systemTitle"), t("systemDesc")))
  const data = await api<Runtime>("/api/admin/system"),
    grid = node("div", "", "system-grid")
  const items: [Key, Copy, Icon][] = [
    ["version", data.version, "Layers3"],
    ["node", data.node, "Gamepad2"],
    ["uptime", t("minutes", { count: () => number(Math.floor(data.uptimeSeconds / 60)) }), "Clock3"],
    ["database", t(data.database === "ok" ? "connected" : "unavailable"), "Database"],
    [
      "healthCheck",
      data.lastHealthCheck ? () => date(data.lastHealthCheck!) : t("notChecked"),
      "ShieldCheck"
    ],
    [
      "disk",
      data.disk
        ? () =>
            `${number(data.disk!.availableBytes / 1024 ** 3)} / ${number(data.disk!.totalBytes / 1024 ** 3)} GiB`
        : t("unavailable"),
      "Layers3"
    ]
  ]
  for (const [label, value, glyph] of items) {
    const card = node("section", "", "panel system-card")
    card.append(icon(glyph), node("h2", t(label)), node("p", value))
    grid.append(card)
  }
  main.append(grid)
}
async function start(): Promise<void> {
  root.append(skeleton("opening"))
  // Public configuration is safe before login, with bounded fallback for unavailable branding.
  try {
    const response = await fetch("/api/public-config", {
      cache: "no-store",
      signal: AbortSignal.timeout(3000)
    })
    if (response.ok) brand = ((await response.json()) as PublicConfiguration).branding
  } catch {
    /* Bundled branding remains available. */
  }
  if (location.pathname === "/admin/login") {
    await login()
    updateBrand()
    return
  }
  const session = await api<{ csrf: string; username: string }>("/api/admin/session")
  csrf = session.csrf
  const main = shell(session.username)
  catalog = (await api<{ catalog: Game[] }>("/api/admin/games")).catalog
  updateBrand()
  switch (location.pathname) {
    case "/admin":
    case "/admin/analytics":
      await dashboard(main)
      break
    case "/admin/games":
      await games(main)
      break
    case "/admin/avatars":
      await avatars(main)
      break
    case "/admin/games/history":
      await records(main, "history")
      break
    case "/admin/players":
      await records(main, "players")
      break
    case "/admin/audit-logs":
      await records(main, "audit-logs")
      break
    case "/admin/settings/branding":
      await branding(main)
      break
    case "/admin/settings/system":
      await system(main)
      break
    case "/admin/logout": {
      const card = node("section", "", "panel logout-panel")
      const logout = button(
        t("signOut"),
        () => {
          logout.disabled = true
          void api("/api/admin/logout", "POST")
            .then(() => location.replace("/admin/login"))
            .catch(err => {
              toast(errorCopy(err), true)
              logout.disabled = false
            })
        },
        "primary",
        "LogOut"
      )
      card.append(icon("ShieldCheck"), heading(t("signOut"), t("signOutDesc")), logout)
      main.append(card)
      break
    }
  }
}
void start().catch(err => {
  const target = document.getElementById("main-content") ?? root
  target.querySelectorAll(".loading-state").forEach(el => el.remove())
  target.append(
    node("p", errorCopy(err), "form-error"),
    button(t("retry"), () => location.reload())
  )
})
