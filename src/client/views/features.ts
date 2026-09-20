import { $, el, clear } from "../ui/dom.js"
import { t } from "../services/i18n.js"
import { clearTheme } from "../themes/loader.js"

function buildFeatureCard(icon: string, title: string, desc: string, accent: string, index: number): HTMLElement {
  const card = el("div", { class: "feat-card", "data-accent": accent })
  card.style.setProperty("--tile-delay", `${index * 90}ms`)
  card.append(
    el("div", { class: "feat-icon" }, [icon]),
    el("div", { class: "feat-text" }, [
      el("strong", {}, [title]),
      el("span", {}, [desc])
    ])
  )
  return card
}

function buildFeaturesSlide(): HTMLElement {
  const slide = el("section", { class: "home-slide features-slide", "data-slide": "features" })
  const atmosphere = el("div", { class: "about-atmosphere", "aria-hidden": "true" })

  const header = el("header", { class: "how-header" }, [
    el("p", { class: "how-eyebrow" }, [
      el("span", { class: "how-ornament", "aria-hidden": "true" }, ["◆"]),
      el("span", {}, [t("featuresEyebrow").toUpperCase()]),
      el("span", { class: "how-ornament", "aria-hidden": "true" }, ["◆"])
    ]),
    el("h2", { class: "how-title" }, [t("featuresTitle")]),
    el("p", { class: "how-sub" }, [t("featuresSub")])
  ])

  const grid = el("div", { class: "feature-grid" }, [
    buildFeatureCard("⬡", t("featRoomCode"),    t("featRoomCodeDesc"),    "violet", 0),
    buildFeatureCard("♛", t("featHostControl"), t("featHostControlDesc"), "gold",   1),
    buildFeatureCard("◈", t("featSecretRoles"), t("featSecretRolesDesc"), "red",    2),
    buildFeatureCard("✦", t("featMultiLang"),   t("featMultiLangDesc"),   "cyan",   3),
    buildFeatureCard("⛶", t("featLocalPlay"),   t("featLocalPlayDesc"),   "violet", 4),
    buildFeatureCard("⟲", t("featReconnect"),   t("featReconnectDesc"),   "gold",   5)
  ])

  slide.append(atmosphere, header, grid)
  return slide
}

export const featuresView = {
  id: "featuresView" as const,
  mount() {
    clearTheme()
    const stage = $<HTMLDivElement>("#featuresStage")
    clear(stage)
    stage.appendChild(buildFeaturesSlide())
    return () => { clear(stage) }
  }
}
