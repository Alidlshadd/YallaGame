import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { setView } from "../router.js"
import { clearTheme } from "../themes/loader.js"
import { buildBookCover } from "../ui/bookCover.js"
import { getGames, isCatalogLoadFailed, routeToGame } from "./home.js"

function buildShelfSlide(lang: ReturnType<typeof getLang>): HTMLElement {
  const slide = el("section", { class: "home-slide shelf-slide", "data-slide": "shelf" })

  const header = el("header", { class: "shelf-header" }, [
    el("p", { class: "shelf-eyebrow" }, [
      el("span", { class: "shelf-ornament" }, ["❖"]),
      el("span", {}, [t("exploreEyebrow").toUpperCase()]),
      el("span", { class: "shelf-ornament" }, ["❖"])
    ]),
    el("h2", { class: "shelf-title" }, [t("exploreWorlds")]),
    el("p", { class: "shelf-subtitle" }, [t("exploreWorldsSub")])
  ])

  const rail = el("div", { class: "shelf-rail" })
  getGames().forEach((g, i) => rail.appendChild(buildBookCover(g, lang, i, routeToGame)))

  const shelfFloor = el("div", { class: "shelf-floor", "aria-hidden": "true" })

  const footer = el("footer", { class: "shelf-footer" }, [
    el("span", { class: "shelf-footer-star", "aria-hidden": "true" }, ["✦"]),
    el("h3", { class: "shelf-footer-title" }, [t("moreWorlds")]),
    el("p", { class: "shelf-footer-sub" }, [t("moreWorldsSub")])
  ])

  const backHome = el("button", {
    class: "shelf-back-top",
    type: "button"
  }, [el("span", { "aria-hidden": "true" }, ["⌃"]), el("span", {}, [t("navHome")])])
  backHome.addEventListener("click", () => {
    void setView("homeView", {}, { mode: "replace" })
  })

  slide.append(header, rail, shelfFloor, footer, backHome)
  return slide
}

export const worldsView = {
  id: "worldsView" as const,
  mount() {
    clearTheme()
    const stage = $<HTMLDivElement>("#worldsStage")
    clear(stage)
    const lang = getLang()

    if (getGames().length > 0) {
      stage.appendChild(buildShelfSlide(lang))
    } else if (isCatalogLoadFailed()) {
      stage.appendChild(el("section", { class: "home-slide shelf-slide" }, [
        el("p", { class: "shelf-subtitle" }, [t("catalogUnavailable")])
      ]))
    }

    return () => { clear(stage) }
  }
}
