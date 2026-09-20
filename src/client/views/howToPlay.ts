import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { clearTheme } from "../themes/loader.js"
import { showToast } from "../ui/toast.js"
import { getGames, openCreatePicker } from "./home.js"

function buildHowStep(index: number, titleKey: "howPlayStep1Title" | "howPlayStep2Title" | "howPlayStep3Title" | "howPlayStep4Title", descKey: "howPlayStep1Desc" | "howPlayStep2Desc" | "howPlayStep3Desc" | "howPlayStep4Desc"): HTMLElement {
  return el("div", { class: "how-step" }, [
    el("div", { class: "how-step-number" }, [String(index).padStart(2, "0")]),
    el("h3", { class: "how-step-title" }, [t(titleKey)]),
    el("p", { class: "how-step-desc" }, [t(descKey)])
  ])
}

function buildHowToPlaySlide(hasGames: boolean): HTMLElement {
  const slide = el("section", { class: "home-slide how-slide", "data-slide": "how" })
  const atmosphere = el("div", { class: "how-atmosphere", "aria-hidden": "true" })

  const header = el("header", { class: "how-header" }, [
    el("p", { class: "how-eyebrow" }, [
      el("span", { class: "how-ornament", "aria-hidden": "true" }, ["◆"]),
      el("span", {}, [t("howPlayEyebrow").toUpperCase()]),
      el("span", { class: "how-ornament", "aria-hidden": "true" }, ["◆"])
    ]),
    el("h2", { class: "how-title" }, [t("howPlayTitle")]),
    el("p", { class: "how-sub" }, [t("howPlaySub")])
  ])

  const steps = el("div", { class: "how-steps" }, [
    buildHowStep(1, "howPlayStep1Title", "howPlayStep1Desc"),
    el("span", { class: "how-step-arrow", "aria-hidden": "true" }, ["→"]),
    buildHowStep(2, "howPlayStep2Title", "howPlayStep2Desc"),
    el("span", { class: "how-step-arrow", "aria-hidden": "true" }, ["→"]),
    buildHowStep(3, "howPlayStep3Title", "howPlayStep3Desc"),
    el("span", { class: "how-step-arrow", "aria-hidden": "true" }, ["→"]),
    buildHowStep(4, "howPlayStep4Title", "howPlayStep4Desc")
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
    el("p", { class: "about-closing-title" }, [t("howPlayClosingTitle")]),
    el("p", { class: "about-closing-sub" }, [t("howPlayClosingSub")]),
    closingCta
  ])

  slide.append(atmosphere, header, steps, closing)
  return slide
}

export const howToPlayView = {
  id: "howToPlayView" as const,
  mount() {
    clearTheme()
    const stage = $<HTMLDivElement>("#howStage")
    clear(stage)
    stage.appendChild(buildHowToPlaySlide(getGames().length > 0))
    return () => { clear(stage) }
  }
}
