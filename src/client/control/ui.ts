import {
  createElement,
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  Clock3,
  Database,
  Eye,
  EyeOff,
  Gamepad2,
  Globe2,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Palette,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  UploadCloud,
  Users,
  X,
  type IconNode
} from "lucide"
import {
  bind,
  language,
  number,
  setLanguage,
  t,
  textNode,
  type Copy,
  type Key,
  type Language
} from "./i18n.js"

const icons = {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  Clock3,
  Database,
  Eye,
  EyeOff,
  Gamepad2,
  Globe2,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Palette,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  UploadCloud,
  Users,
  X
}
export type Icon = keyof typeof icons
export function icon(name: Icon): SVGElement {
  return createElement(icons[name] as IconNode, {
    width: 20,
    height: 20,
    "stroke-width": 1.7,
    "aria-hidden": "true",
    focusable: "false",
    class: "icon"
  })
}
export function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  copy: Copy = "",
  className = ""
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  if (copy) el.append(textNode(copy))
  el.className = className
  return el
}
export function button(copy: Copy, action: () => void, className = "", glyph?: Icon): HTMLButtonElement {
  const el = node("button", "", className)
  el.type = "button"
  if (glyph) el.append(icon(glyph))
  el.append(node("span", copy))
  el.onclick = action
  return el
}
export function setText(el: HTMLElement, copy: Copy): void {
  el.replaceChildren(textNode(copy))
}
export function field(label: Copy, type = "text", value = "") {
  const wrap = node("label", label),
    input = node("input")
  input.type = type
  input.value = value
  wrap.append(input)
  input.oninvalid = () => input.setCustomValidity(t(input.validity.valueMissing ? "required" : "invalid")())
  input.oninput = () => input.setCustomValidity("")
  return { label: wrap, input }
}
document.addEventListener("admin-language", () => {
  document.querySelectorAll<HTMLInputElement>("input").forEach(input => {
    if (input.validity.customError)
      input.setCustomValidity(t(input.validity.valueMissing ? "required" : "invalid")())
  })
})
export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches
export function dismiss(el: HTMLElement, done: () => void): void {
  if (reducedMotion()) {
    done()
    return
  }
  el.classList.add("leaving")
  window.setTimeout(done, 160)
}
export function toast(copy: Copy, error = false): void {
  document.querySelectorAll(".toast").forEach(el => el.remove())
  const el = node("div", "", `toast ${error ? "error" : ""}`)
  el.setAttribute("role", error ? "alert" : "status")
  el.setAttribute("aria-atomic", "true")
  el.append(icon(error ? "ShieldCheck" : "CheckCheck"), node("span", copy))
  document.body.append(el)
  window.setTimeout(() => dismiss(el, () => el.remove()), 6000)
}
export function trapDialog(dialog: HTMLDialogElement): void {
  dialog.addEventListener("keydown", event => {
    if (event.key !== "Tab") return
    const controls = [
      ...dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]'
      )
    ].filter(control => control.getClientRects().length > 0)
    const first = controls[0],
      last = controls.at(-1)
    if (!first || !last) {
      event.preventDefault()
      dialog.focus()
      return
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  })
}
export function confirmAction(title: Copy): Promise<boolean> {
  return new Promise(resolve => {
    const previous = document.activeElement as HTMLElement | null
    const modal = node("dialog", "", "confirmation"),
      heading = node("h2", title)
    heading.id = "confirm-title"
    modal.setAttribute("aria-labelledby", heading.id)
    let closing = false
    const done = (value: boolean) => {
      if (closing) return
      closing = true
      dismiss(modal, () => {
        modal.close()
        modal.remove()
        previous?.focus()
        resolve(value)
      })
    }
    const cancel = button(t("cancel"), () => done(false))
    modal.append(
      icon("ShieldCheck"),
      heading,
      node("p", t("applies"), "muted"),
      cancel,
      button(t("confirm"), () => done(true), "primary")
    )
    modal.oncancel = event => {
      event.preventDefault()
      done(false)
    }
    trapDialog(modal)
    document.body.append(modal)
    modal.showModal()
    cancel.focus()
  })
}
export function preferences(): HTMLElement {
  const group = node("div", "", "preferences"),
    select = node("select", "", "language-select")
  bind(select, t("language"), "aria-label")
  for (const [value, label] of [
    ["en", "English"],
    ["tr", "Türkçe"],
    ["ar", "العربية"],
    ["ku", "کوردی"]
  ]) {
    const option = node("option", label!)
    option.value = value!
    select.append(option)
  }
  select.value = language
  select.onchange = () => setLanguage(select.value as Language)
  const theme = button(
    "",
    () => {
      const value = document.documentElement.dataset.theme === "dark" ? "light" : "dark"
      try {
        localStorage.setItem("yalla-admin-theme", value)
      } catch {
        /* session preference still works */
      }
      applyTheme(value)
    },
    "icon-button theme-toggle"
  )
  const update = () => {
    const dark = document.documentElement.dataset.theme === "dark"
    bind(theme, t(dark ? "light" : "dark"), "aria-label")
    bind(theme, t(dark ? "light" : "dark"), "title")
    theme.replaceChildren(icon(dark ? "Sun" : "Moon"))
  }
  document.addEventListener("admin-theme", update)
  update()
  const languageWrap = node("div", "", "language-control")
  languageWrap.append(icon("Globe2"), select)
  group.append(languageWrap, theme)
  return group
}
function applyTheme(value: string): void {
  document.documentElement.dataset.theme = value
  document.dispatchEvent(new Event("admin-theme"))
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", event => {
  try {
    if (localStorage.getItem("yalla-admin-theme")) return
  } catch {
    /* system preference */
  }
  applyTheme(event.matches ? "dark" : "light")
})
export function skeleton(copy: Key = "loading"): HTMLElement {
  const el = node("div", "", "loading-state")
  el.setAttribute("role", "status")
  el.append(node("span", t(copy), "muted"))
  const grid = node("div", "", "skeleton-grid")
  grid.setAttribute("aria-hidden", "true")
  for (let i = 0; i < 6; i++) grid.append(node("div", "", "skeleton"))
  el.append(grid)
  return el
}
export function empty(copy: Key): HTMLElement {
  const el = node("div", "", "empty")
  el.append(icon("Layers3"), node("p", t(copy)))
  return el
}
export function countUp(el: HTMLElement, from: number, to: number): void {
  // Only runs while a value changes; never a continuous background animation loop.
  if (reducedMotion() || from === to) {
    setText(el, () => number(to))
    return
  }
  const start = performance.now()
  const frame = (now: number) => {
    const progress = Math.min(1, (now - start) / 650)
    if (!el.isConnected) return
    const current = from + (to - from) * (1 - (1 - progress) ** 3)
    el.textContent = number(Number.isInteger(to) ? Math.round(current) : current)
    if (progress < 1 && !reducedMotion()) requestAnimationFrame(frame)
    else setText(el, () => number(to))
  }
  // Final accessible value is available immediately, independent of the decorative animation.
  bind(el, () => number(to), "aria-label")
  requestAnimationFrame(frame)
}
const dirtyForms = new Set<HTMLFormElement>()
export function trackForm(form: HTMLFormElement) {
  const status = node("p", t("saved"), "save-status")
  status.setAttribute("aria-live", "polite")
  form.append(status)
  const mark = (event?: Event) => {
    // File editors explicitly notify only after a valid selection or confirmed reset.
    if (event?.target instanceof HTMLInputElement && event.target.type === "file") return
    dirtyForms.add(form)
    form.dataset.dirty = "true"
    setText(status, t("unsaved"))
  }
  form.addEventListener("input", mark)
  form.addEventListener("change", mark)
  return {
    mark,
    saved: () => {
      dirtyForms.delete(form)
      delete form.dataset.dirty
      setText(status, t("saved"))
    }
  }
}
window.addEventListener("beforeunload", event => {
  if ([...dirtyForms].some(form => form.isConnected)) {
    event.preventDefault()
    event.returnValue = ""
  }
})
