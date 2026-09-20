import { BookOpen, createElement, House, Orbit, Sparkles, Users, type IconNode } from "lucide"
import "../themes/siteHeader.css"

/** Header presentation follows the existing router; it never changes navigation or game state. */
export function initSiteHeader(): void {
  const header = document.querySelector<HTMLElement>(".site-header")
  if (!header) return
  const pages: Record<string, string> = {
    homeView: "home",
    worldsView: "worlds",
    howToPlayView: "how",
    featuresView: "features",
    aboutView: "about"
  }
  const icons: Record<string, IconNode> = {
    home: House,
    worlds: Orbit,
    how: BookOpen,
    features: Sparkles,
    about: Users
  }
  const buttons = [...header.querySelectorAll<HTMLButtonElement>(".main-nav button")]
  for (const button of buttons) {
    const glyph = icons[button.dataset.nav ?? ""]
    if (glyph)
      button.prepend(
        createElement(glyph, {
          width: 17,
          height: 17,
          "stroke-width": 1.7,
          "aria-hidden": "true",
          focusable: "false",
          class: "header-nav-icon"
        })
      )
  }
  for (const button of header.querySelectorAll<HTMLButtonElement>(".lang-switch button")) {
    const name = document.createElement("span")
    name.className = "language-name"
    name.textContent = button.textContent
    const short = document.createElement("span")
    short.className = "language-short"
    short.setAttribute("aria-hidden", "true")
    short.textContent =
      ({ en: "EN", tr: "TR", ar: "ع", ku: "ک" } as Record<string, string>)[button.dataset.lang ?? ""] ?? ""
    button.replaceChildren(name, short)
  }
  let scrollSource: EventTarget | null = null
  let previousScroll = 0
  let scrollTravel = 0
  const reveal = () => {
    header.dataset.scrollHidden = "false"
    scrollTravel = 0
  }
  // Capture also receives the home page's internal stage scroll. Ignore horizontal
  // navigation and other nested scrollers, such as cards or modal content.
  document.addEventListener(
    "scroll",
    (event) => {
      if (header.dataset.layout !== "browse") return
      const target = event.target
      const scroller =
        target === document
          ? document.scrollingElement
          : target instanceof HTMLElement && target.matches(".active-view.home-stage .stage")
            ? target
            : null
      if (!scroller) return
      // Clamp elastic overscroll so bouncing at either end cannot reverse direction.
      const position = Math.max(0, Math.min(scroller.scrollTop, scroller.scrollHeight - scroller.clientHeight))
      if (scrollSource !== target) {
        scrollSource = target
        previousScroll = 0
        scrollTravel = 0
      }
      const delta = position - previousScroll
      previousScroll = position
      if (position <= 24 || header.querySelector(":focus-visible")) {
        reveal()
        return
      }
      if (!delta) return
      scrollTravel = Math.sign(delta) === Math.sign(scrollTravel) ? scrollTravel + delta : delta
      if (scrollTravel > 20) header.dataset.scrollHidden = "true"
      else if (scrollTravel < -12) reveal()
    },
    { capture: true, passive: true }
  )
  // Offscreen navigation remains reachable by keyboard, and appears before use.
  header.addEventListener("focusin", reveal)
  window.addEventListener("pageshow", reveal)
  window.addEventListener("resize", reveal, { passive: true })
  const sync = () => {
    reveal()
    scrollSource = null
    const current = pages[document.querySelector("section.view.active-view")?.id ?? ""]
    header.dataset.layout = current ? "browse" : "play"
    document.body.dataset.headerLayout = header.dataset.layout
    for (const button of buttons) {
      if (button.dataset.nav === current) button.setAttribute("aria-current", "page")
      else button.removeAttribute("aria-current")
    }
    for (const button of header.querySelectorAll<HTMLButtonElement>(".lang-switch button")) {
      const active = button.dataset.lang === document.documentElement.lang
      button.setAttribute("aria-pressed", String(active))
    }
  }
  const observer = new MutationObserver(sync)
  for (const view of document.querySelectorAll("section.view"))
    observer.observe(view, { attributes: true, attributeFilter: ["class"] })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] })
  sync()
}
