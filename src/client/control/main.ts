import type { Game } from "../../shared/types.js"
import { worldCoverPath } from "../data/assets.js"
import { getWorldDetail } from "../data/worldDetails.js"
import type { PublicConfiguration } from "../services/publicConfig.js"
import "./style.css"

const root = document.getElementById("control-root")!
let csrf = ""
let catalog: Game[] = []
const navItems = [
  ["/admin", "Overview", "◈"],
  ["/admin/analytics", "Analytics", "▥"],
  ["/admin/games/history", "Game history", "◷"],
  ["/admin/players", "Players", "♧"],
  ["/admin/games", "Game library", "▦"],
  ["/admin/settings/branding", "Branding", "✦"],
  ["/admin/settings/system", "System", "◎"],
  ["/admin/audit-logs", "Audit log", "☷"]
]
function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text = "",
  className = ""
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)
  element.textContent = text
  element.className = className
  return element
}
function button(text: string, action: () => void, className = ""): HTMLButtonElement {
  const element = node("button", text, className)
  element.type = "button"
  element.onclick = action
  return element
}
function toast(message: string, error = false): void {
  const element = node("div", message, `toast ${error ? "error" : ""}`)
  element.setAttribute("role", error ? "alert" : "status")
  document.body.append(element)
  window.setTimeout(() => element.remove(), 6000)
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
  const data = await response.json().catch(() => ({ error: `Request failed (${response.status})` }))
  if (response.status === 401 && !url.startsWith("/api/auth")) {
    location.replace("/admin/login")
    throw new Error("Session expired")
  }
  if (!response.ok) throw new Error(data.error ?? "Request failed")
  return data as T
}
function field(
  label: string,
  type = "text",
  value = ""
): { label: HTMLLabelElement; input: HTMLInputElement } {
  const wrap = node("label", label),
    input = node("input")
  input.type = type
  input.value = value
  wrap.append(input)
  return { label: wrap, input }
}
function heading(title: string, description: string): HTMLElement {
  const header = node("header", "", "page-heading")
  header.append(
    node("p", "YALLAGAME / CONTROL CENTER", "eyebrow"),
    node("h1", title),
    node("p", description, "muted")
  )
  return header
}
function confirmAction(title: string): Promise<boolean> {
  return new Promise(resolve => {
    const previous = document.activeElement as HTMLElement | null
    const modal = node("dialog", "", "confirmation"),
      heading = node("h2", title),
      description = node("p", "This change will apply to the public site.", "muted")
    heading.id = "confirm-title"
    modal.setAttribute("aria-labelledby", heading.id)
    const done = (value: boolean) => {
      modal.close()
      modal.remove()
      previous?.focus()
      resolve(value)
    }
    const cancel = button("Cancel", () => done(false)),
      accept = button("Confirm change", () => done(true), "primary")
    modal.append(heading, description, cancel, accept)
    modal.oncancel = event => {
      event.preventDefault()
      done(false)
    }
    document.body.append(modal)
    modal.showModal()
    cancel.focus()
  })
}
async function login(): Promise<void> {
  root.className = "login-stage"
  const panel = node("main", "", "login-panel")
  panel.append(
    node("div", "Y", "brand-icon"),
    node("p", "YALLAGAME", "eyebrow"),
    node("h1", "Control Center"),
    node("p", "Your worlds. One command center.", "muted")
  )
  const form = node("form"),
    username = field("Username or email"),
    password = field("Password", "password"),
    submit = node("button", "Sign in →", "primary")
  username.input.name = "username"
  username.input.autocomplete = "username"
  username.input.required = true
  password.input.name = "password"
  password.input.autocomplete = "current-password"
  password.input.required = true
  const error = node("p", "", "form-error")
  error.setAttribute("role", "alert")
  form.append(username.label, password.label, error, submit)
  panel.append(form, node("p", "Restricted to authorized administrators", "login-note"))
  root.replaceChildren(panel)
  form.onsubmit = event => {
    event.preventDefault()
    submit.disabled = true
    error.textContent = ""
    void (async () => {
      csrf = (await api<{ csrf: string }>("/api/auth/csrf")).csrf
      await api("/api/auth/login", "POST", { username: username.input.value, password: password.input.value })
      password.input.value = ""
      location.replace("/admin")
    })().catch(err => {
      error.textContent = (err as Error).message
      submit.disabled = false
    })
  }
  username.input.focus()
}
function shell(username: string): HTMLElement {
  root.className = "control-shell"
  const sidebar = node("aside", "", "sidebar"),
    brand = node("div", "", "sidebar-brand")
  brand.append(node("span", "Y", "brand-icon"), node("strong", "YallaGame"), node("small", "CONTROL CENTER"))
  const nav = node("nav")
  nav.setAttribute("aria-label", "Administration")
  for (const [url, label, icon] of navItems) {
    const a = node("a")
    a.href = url!
    a.append(node("span", icon!, "nav-icon"), document.createTextNode(label!))
    if (location.pathname === url) {
      a.className = "active"
      a.setAttribute("aria-current", "page")
    }
    nav.append(a)
  }
  const logout = node("a", "↗  Sign out", "logout")
  logout.href = "/admin/logout"
  sidebar.append(
    brand,
    node("p", "WORKSPACE", "nav-label"),
    nav,
    node("div", "Private administration", "sidebar-note"),
    logout
  )
  const body = node("div", "", "workspace"),
    top = node("div", "", "topbar")
  const drawer = node("dialog", "", "drawer")
  drawer.setAttribute("aria-label", "Navigation")
  drawer.append(
    button("Close menu", () => drawer.close()),
    nav.cloneNode(true)
  )
  const menu = button("☰", () => drawer.showModal(), "menu-toggle")
  menu.setAttribute("aria-label", "Open navigation")
  top.append(menu, node("span", "●  Live workspace", "live-badge"), node("span", username, "account"))
  const main = node("main")
  main.id = "main-content"
  main.tabIndex = -1
  const skip = node("a", "Skip to content", "skip-link")
  skip.href = "#main-content"
  body.append(top, main)
  root.replaceChildren(skip, sidebar, body, drawer)
  return main
}
function gameTitle(id: unknown): string {
  return catalog.find(game => game.id === id)?.title.en ?? String(id ?? "—")
}
type CountRow = { count: number; day?: string; hour?: string; game_id?: string }
function chart(title: string, rows: CountRow[], key: "day" | "hour" | "game_id"): HTMLElement {
  const panel = node("section", "", "panel chart-panel")
  panel.append(node("h2", title))
  if (!rows.length) {
    panel.append(node("p", "No activity in this period.", "empty"))
    return panel
  }
  const max = Math.max(1, ...rows.map(row => row.count)),
    bars = node("div", "", "bars")
  for (const row of rows) {
    const label = key === "game_id" ? gameTitle(row.game_id) : String(row[key]),
      bar = node("div", "", "bar-row"),
      meter = node("meter")
    meter.min = 0
    meter.max = max
    meter.value = row.count
    meter.setAttribute("aria-label", `${label}: ${row.count}`)
    bar.append(node("span", label), meter, node("strong", String(row.count)))
    bars.append(bar)
  }
  panel.append(bars)
  return panel
}
async function dashboard(main: HTMLElement): Promise<void> {
  main.append(
    heading(
      location.pathname.endsWith("analytics") ? "Analytics" : "Workspace overview",
      "A clear view of your community and the games bringing people together."
    )
  )
  const toolbar = node("div", "", "toolbar"),
    period = node("select")
  period.setAttribute("aria-label", "Date range")
  for (const [value, label] of [
    [1, "Today"],
    [7, "Last 7 days"],
    [30, "Last 30 days"],
    [90, "Last 90 days"],
    [0, "All time"]
  ]) {
    const option = node("option", String(label))
    option.value = String(value)
    period.append(option)
  }
  period.value = "7"
  toolbar.append(node("span", "Activity period", "muted"), period)
  const content = node("div"),
    note = node(
      "p",
      "Dates use UTC. Online means active within 90 seconds. Totals cover retained data. Local offline rounds are not counted.",
      "data-note"
    )
  main.append(toolbar, content, note)
  let request = 0
  async function refresh() {
    const sequence = ++request
    content.setAttribute("aria-busy", "true")
    content.replaceChildren(node("p", "Loading activity…", "empty"))
    try {
      const data = await api<{
        kpis: Record<string, number | string | null>
        visitors: CountRow[]
        starts: CountRow[]
        popularity: CountRow[]
        hours: CountRow[]
      }>(`/api/admin/dashboard?days=${period.value}`)
      if (sequence !== request) return
      const cards = node("section", "", "kpi-grid")
      for (const [key, label] of [
        ["visitorsToday", "Visitors today"],
        ["visitors7Days", "Visitors · 7 days"],
        ["visitorsTotal", "Total visitors"],
        ["online", "Online now"],
        ["roomsToday", "Rooms today"],
        ["startedToday", "Games started today"],
        ["completedToday", "Completed today"],
        ["gamesTotal", "Total games played"],
        ["averagePlayers", "Average players · selected period"],
        ["mostPopular", "Most played · selected period"]
      ]) {
        const card = node("article", "", `kpi ${key === "online" ? "highlight" : ""}`)
        card.append(
          node("p", label!),
          node("strong", key === "mostPopular" ? gameTitle(data.kpis[key!]) : String(data.kpis[key!] ?? 0))
        )
        cards.append(card)
      }
      const graphs = node("div", "", "chart-grid")
      graphs.append(
        chart(period.value === "0" ? "Unique visitors · last 90 days" : "Unique visitors", data.visitors, "day"),
        chart(period.value === "0" ? "Game starts · last 90 days" : "Game starts", data.starts, "day"),
        chart("Games in rotation", data.popularity, "game_id"),
        chart("Activity by hour · UTC", data.hours, "hour")
      )
      content.replaceChildren(
        cards,
        node("p", `${data.kpis.visitorsSelected} unique visitors in the selected period`, "muted"),
        graphs
      )
    } catch (err) {
      content.replaceChildren(
        node("p", (err as Error).message, "form-error"),
        button("Retry", () => void refresh())
      )
    } finally {
      content.setAttribute("aria-busy", "false")
    }
  }
  period.onchange = () => void refresh()
  await refresh()
}
type RecordRow = Record<string, string | number | null>
async function records(main: HTMLElement, kind: "history" | "players" | "audit-logs"): Promise<void> {
  const titles = { history: "Game history", players: "Players", "audit-logs": "Audit log" }
  main.append(
    heading(
      titles[kind],
      kind === "players"
        ? "Display names from admitted room joins. These are not registered user identities."
        : "Search and review retained workspace activity."
    )
  )
  const form = node("form", "", "toolbar filters"),
    search = field("Search"),
    from = field("From", "date"),
    to = field("To", "date"),
    game = node("select")
  game.setAttribute("aria-label", "Game filter")
  const all = node("option", "All games")
  all.value = ""
  game.append(all)
  for (const item of catalog) {
    const option = node("option", item.title.en)
    option.value = item.id
    game.append(option)
  }
  const submit = node("button", "Apply filters", "primary")
  form.append(search.label, from.label, to.label)
  if (kind !== "audit-logs") form.append(game)
  form.append(submit)
  const content = node("div"),
    pagination = node("div", "", "pagination")
  main.append(form, content, pagination)
  let page = 1
  async function refresh() {
    content.setAttribute("aria-busy", "true")
    content.replaceChildren(node("p", "Loading records…", "empty"))
    const params = new URLSearchParams({ page: String(page), q: search.input.value, game: game.value })
    if (from.input.value) params.set("from", from.input.value)
    if (to.input.value) params.set("to", to.input.value)
    try {
      const data = await api<{ rows: RecordRow[]; total: number; pageSize: number }>(
        `/api/admin/${kind}?${params}`
      )
      const headers =
        kind === "history"
          ? ["Date · UTC", "Game", "Room reference", "Players", "Count", "Duration", "Status"]
          : kind === "players"
            ? ["Date · UTC", "Display name", "Game", "Room reference"]
            : ["Date · UTC", "Admin", "Action", "Target", "Details"]
      const table = node("table"),
        head = node("thead"),
        hr = node("tr"),
        tbody = node("tbody")
      for (const label of headers) {
        const th = node("th", label)
        th.scope = "col"
        hr.append(th)
      }
      head.append(hr)
      for (const row of data.rows) {
        const tr = node("tr"),
          date = new Date(Number(row.started_at ?? row.created_at))
            .toISOString()
            .replace("T", " ")
            .slice(0, 19)
        const cells =
          kind === "history"
            ? [
                date,
                gameTitle(row.game_id),
                row.room_ref,
                JSON.parse(String(row.players)).join(", "),
                row.player_count,
                row.ended_at
                  ? `${Math.round((Number(row.ended_at) - Number(row.started_at)) / 1000)} s`
                  : "—",
                row.status
              ]
            : kind === "players"
              ? [date, row.player_name, gameTitle(row.game_id), row.room_ref]
              : [date, row.username ?? "Local CLI / anonymous", row.action, row.target, row.metadata]
        for (const value of cells) tr.append(node("td", String(value ?? "—")))
        tbody.append(tr)
      }
      table.append(head, tbody)
      const scroll = node("div", "", "table-scroll panel")
      scroll.tabIndex = 0
      scroll.setAttribute("aria-label", titles[kind])
      scroll.append(table)
      content.replaceChildren(
        data.rows.length ? scroll : node("p", "No records match these filters.", "empty panel")
      )
      const previous = button("← Previous", () => {
          page--
          void refresh()
        }),
        next = button("Next →", () => {
          page++
          void refresh()
        })
      previous.disabled = page === 1
      next.disabled = page * data.pageSize >= data.total
      pagination.replaceChildren(
        node(
          "span",
          `${data.total} records · Page ${page} of ${Math.max(1, Math.ceil(data.total / data.pageSize))}`,
          "muted"
        ),
        previous,
        next
      )
    } catch (err) {
      content.replaceChildren(node("p", (err as Error).message, "form-error"))
    } finally {
      content.setAttribute("aria-busy", "false")
    }
  }
  form.onsubmit = event => {
    event.preventDefault()
    page = 1
    void refresh()
  }
  await refresh()
}
interface AssetEditor {
  element: HTMLElement
  value: () => Promise<string | null>
}
function imageEditor(label: string, current: string | null, fallback: string): AssetEditor {
  const element = node("fieldset", "", "image-editor"),
    legend = node("legend", label),
    image = node("img"),
    input = node("input"),
    status = node("p", "", "muted")
  image.alt = `${label} preview`
  image.src = current ?? fallback
  image.loading = "lazy"
  if (!image.src || (!current && !fallback)) image.hidden = true
  input.type = "file"
  input.accept = "image/jpeg,image/png,image/webp"
  input.setAttribute("aria-label", `Upload ${label}`)
  let selected: File | null = null,
    asset = current?.split("/").pop() ?? null,
    preview = ""
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast("Use JPEG, PNG or WebP up to 5 MiB", true)
      input.value = ""
      return
    }
    selected = file
    if (preview) URL.revokeObjectURL(preview)
    preview = URL.createObjectURL(file)
    image.src = preview
    image.hidden = false
    status.textContent = "New preview · unsaved"
  }
  const reset = button(
    "Restore default",
    () => {
      void confirmAction(`Restore default ${label.toLowerCase()}?`).then(ok => {
        if (!ok) return
        asset = null
        selected = null
        input.value = ""
        image.src = fallback
        image.hidden = !fallback
        status.textContent = "Default selected · save to apply"
      })
    },
    "subtle"
  )
  element.append(legend, image, input, reset, status)
  return {
    element,
    value: async () => {
      if (!selected) return asset
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { "x-csrf-token": csrf, "Content-Type": selected.type },
        body: selected
      })
      const result = (await response.json()) as { id?: string; error?: string }
      if (!response.ok || !result.id) throw new Error(result.error ?? "Upload failed")
      asset = result.id
      selected = null
      status.textContent = "Uploaded"
      return asset
    }
  }
}
async function games(main: HTMLElement): Promise<void> {
  main.append(
    heading(
      "Game library",
      "Curate your worlds. Update artwork, visibility and the order players discover them."
    )
  )
  const data = await api<PublicConfiguration & { catalog: Game[] }>("/api/admin/games")
  const grid = node("div", "", "game-grid")
  for (const game of data.catalog) {
    const override = data.games[game.id],
      card = node("section", "", "panel game-card"),
      form = node("form")
    card.append(node("p", game.id, "eyebrow"), node("h2", game.title.en))
    const enabled = field("Visible & available", "checkbox"),
      order = field("Display order", "number", String(override?.order ?? data.catalog.indexOf(game)))
    enabled.input.checked = override?.enabled !== false
    order.input.min = "-10000"
    order.input.max = "10000"
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
        {
          cover: "Cover image",
          detail: "Detail image",
          cta: "CTA background",
          section: "Section background"
        }[slot]!,
        override?.assets[slot] ?? null,
        fallback
      )
    }))
    const images = node("div", "", "image-grid")
    for (const { editor } of editors) images.append(editor.element)
    const save = node("button", "Save game", "primary")
    form.append(enabled.label, order.label, images, save)
    card.append(form)
    grid.append(card)
    form.onsubmit = event => {
      event.preventDefault()
      void (async () => {
        if (!enabled.input.checked && !(await confirmAction(`Disable ${game.title.en}?`))) return
        save.disabled = true
        const assets: Record<string, string | null> = {}
        for (const { slot, editor } of editors) assets[slot] = await editor.value()
        await api(`/api/admin/games/${game.id}`, "PUT", {
          enabled: enabled.input.checked,
          order: Number(order.input.value),
          assets
        })
        toast(`${game.title.en} saved`)
      })()
        .catch(err => toast((err as Error).message, true))
        .finally(() => {
          save.disabled = false
        })
    }
  }
  main.append(grid)
}
async function branding(main: HTMLElement): Promise<void> {
  main.append(
    heading(
      "Brand identity",
      "Keep every touchpoint unmistakably yours. Empty fields restore the bundled defaults."
    )
  )
  const data = await api<Record<string, string>>("/api/admin/branding"),
    form = node("form", "", "panel branding-form")
  const name = field("Site name", "text", data.siteName ?? ""),
    description = field("Short description", "text", data.description ?? ""),
    footer = field("Footer text", "text", data.footer ?? "")
  name.input.maxLength = 80
  description.input.maxLength = 300
  footer.input.maxLength = 300
  name.input.placeholder = "Yalla Game"
  form.append(name.label, description.label, footer.label)
  const defaults: Record<string, string> = {
    logo: "/assets/logo/yalla-game-mark.webp",
    darkLogo: "/assets/logo/yalla-game-mark.webp",
    favicon: "/assets/logo/favicon-2026.png",
    ogImage: "/assets/logo/yallagame-mark-2026.webp"
  }
  const editors = Object.entries(defaults).map(([key, fallback]) => ({
    key,
    editor: imageEditor(
      {
        logo: "Main logo",
        darkLogo: "Dark background logo",
        favicon: "Favicon",
        ogImage: "Open Graph image"
      }[key]!,
      data[key] ?? null,
      fallback
    )
  }))
  const images = node("div", "", "image-grid")
  for (const { editor } of editors) images.append(editor.element)
  const save = node("button", "Save brand identity", "primary")
  form.append(images, node("p", "JPEG, PNG or WebP · up to 5 MiB · maximum 4096 × 4096", "muted"), save)
  main.append(form)
  form.onsubmit = event => {
    event.preventDefault()
    void (async () => {
      if (!(await confirmAction("Publish brand changes?"))) return
      save.disabled = true
      const body: Record<string, string | null> = {
        siteName: name.input.value,
        description: description.input.value,
        footer: footer.input.value
      }
      for (const { key, editor } of editors) body[key] = await editor.value()
      await api("/api/admin/branding", "PUT", body)
      toast("Brand identity saved")
    })()
      .catch(err => toast((err as Error).message, true))
      .finally(() => {
        save.disabled = false
      })
  }
}
async function system(main: HTMLElement): Promise<void> {
  main.append(heading("System status", "Read-only health and runtime information."))
  const data = await api<{
    version: string
    node: string
    uptimeSeconds: number
    database: string
    lastHealthCheck: number | null
    disk: { totalBytes: number; availableBytes: number } | null
  }>("/api/admin/system")
  const list = node("dl", "", "panel system-list")
  for (const [label, value] of [
    ["Application version", data.version],
    ["Node.js", data.node],
    ["Uptime", `${Math.floor(data.uptimeSeconds / 60)} minutes`],
    ["Database", data.database],
    [
      "Last health check",
      data.lastHealthCheck ? new Date(data.lastHealthCheck).toISOString() : "Not yet checked"
    ],
    [
      "Disk available",
      data.disk
        ? `${(data.disk.availableBytes / 1024 ** 3).toFixed(1)} / ${(data.disk.totalBytes / 1024 ** 3).toFixed(1)} GiB`
        : "Unavailable"
    ]
  ])
    list.append(node("dt", label!), node("dd", value!))
  main.append(list)
}
async function start(): Promise<void> {
  if (location.pathname === "/admin/login") {
    await login()
    return
  }
  root.append(node("p", "Opening control center…", "empty"))
  const session = await api<{ csrf: string; username: string }>("/api/admin/session")
  csrf = session.csrf
  const main = shell(session.username)
  catalog = (await api<{ catalog: Game[] }>("/api/admin/games")).catalog
  switch (location.pathname) {
    case "/admin":
    case "/admin/analytics":
      await dashboard(main)
      break
    case "/admin/games":
      await games(main)
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
    case "/admin/logout":
      main.append(
        heading("Sign out", "End your administrator session on this browser."),
        button(
          "Sign out",
          () => {
            void api("/api/admin/logout", "POST")
              .then(() => location.replace("/admin/login"))
              .catch(err => toast((err as Error).message, true))
          },
          "primary"
        )
      )
      break
  }
}
void start().catch(err => {
  root.append(
    node("p", (err as Error).message, "form-error"),
    button("Retry", () => location.reload())
  )
})
