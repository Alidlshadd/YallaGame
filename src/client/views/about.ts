import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { clearTheme } from "../themes/loader.js"
import { showToast } from "../ui/toast.js"
import { getGames, openCreatePicker } from "./home.js"

function buildAboutSlide(hasGames: boolean): HTMLElement {
  const slide = el("section", { class: "home-slide about-slide", "data-slide": "about" })
  const atmosphere = el("div", { class: "about-atmosphere", "aria-hidden": "true" })

  const copy = el("div", { class: "about-copy" }, [
    el("p", { class: "about-eyebrow" }, [
      el("span", { class: "how-ornament", "aria-hidden": "true" }, ["◆"]),
      el("span", {}, [t("aboutEyebrow").toUpperCase()]),
      el("span", { class: "how-ornament", "aria-hidden": "true" }, ["◆"])
    ]),
    el("h2", { class: "about-title" }, [t("aboutHeroTitle")]),
    el("p", { class: "about-body" }, [t("aboutHeroBody")]),
    el("div", { class: "about-stats" }, [
      el("div", { class: "about-stat" }, [el("strong", {}, [t("aboutStatWorldsValue")]), el("span", {}, [t("aboutStatWorldsLabel")])]),
      el("div", { class: "about-stat" }, [el("strong", {}, [t("aboutStatLangValue")]), el("span", {}, [t("aboutStatLangLabel")])]),
      el("div", { class: "about-stat" }, [el("strong", {}, [t("aboutStatInstallValue")]), el("span", {}, [t("aboutStatInstallLabel")])])
    ]),
    el("div", { class: "about-languages" }, [
      el("span", { class: "about-language-chip" }, ["English"]),
      el("span", { class: "about-language-chip" }, ["Türkçe"]),
      el("span", { class: "about-language-chip", dir: "rtl" }, ["العربية"]),
      el("span", { class: "about-language-chip", dir: "rtl" }, ["کوردی"])
    ])
  ])

  const closingCta = el("button", { class: "about-cta", type: "button" }, [
    el("span", { class: "cta-icon", "aria-hidden": "true" }, ["+"]),
    el("span", {}, [t("createRoom")])
  ])
  closingCta.addEventListener("click", () => {
    if (hasGames) openCreatePicker(getLang())
    else showToast(t("catalogUnavailableToast"))
  })

  const closing = el("div", { class: "about-closing" }, [
    el("p", { class: "about-closing-title" }, [t("aboutClosingTitle")]),
    el("p", { class: "about-closing-sub" }, [t("aboutClosingSub")]),
    closingCta
  ])

  slide.append(atmosphere, copy, closing)
  return slide
}

export const aboutView = {
  id: "aboutView" as const,
  mount() {
    clearTheme()
    const stage = $<HTMLDivElement>("#aboutStage")
    clear(stage)
    stage.appendChild(buildAboutSlide(getGames().length > 0))
    return () => { clear(stage) }
  }
}
