import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { clearTheme } from "../themes/loader.js"
import { showToast } from "../ui/toast.js"
import { setView } from "../router.js"
import { getGames, openCreatePicker } from "./home.js"
import { sectionHeading, ctaButton } from "../ui/pageSections.js"
import { setPageMeta, resetPageMeta } from "../ui/seo.js"
import { scrollReveal } from "../ui/motion.js"

type FeatureKey =
  | ["feat1Title", "feat1Text"] | ["feat2Title", "feat2Text"] | ["feat3Title", "feat3Text"]
  | ["feat4Title", "feat4Text"] | ["feat5Title", "feat5Text"] | ["feat6Title", "feat6Text"]
  | ["feat7Title", "feat7Text"] | ["feat8Title", "feat8Text"] | ["feat9Title", "feat9Text"]

/** One hand-drawn, single-weight glyph per feature — no icon library, kept
 * to the same stroke language as the rest of the brand (no play triangles,
 * no gamepad clichés). */
const FEATURE_ICONS = ["◌", "⛉", "❖", "◉", "⌂", "◈", "▣", "文", "▦"] as const

function buildFeatureCard(titleKey: FeatureKey[0], textKey: FeatureKey[1], glyph: string, index: number): HTMLElement {
  const card = el("div", { class: "feat-card-v2" })
  card.style.setProperty("--tile-delay", `${index * 70}ms`)
  card.append(
    el("div", { class: "feat-card-v2-icon", "aria-hidden": "true" }, [glyph]),
    el("h3", { class: "feat-card-v2-title" }, [t(titleKey)]),
    el("p", { class: "feat-card-v2-text" }, [t(textKey)])
  )
  return card
}

function buildHero(hasGames: boolean): HTMLElement {
  const hero = el("section", { class: "htp-hero features-hero-v2" })
  hero.append(sectionHeading({ eyebrow: t("featuresEyebrow"), title: t("featuresTitle"), description: t("featuresSub") }))
  hero.append(el("div", { class: "htp-hero-actions" }, [
    ctaButton(t("featuresHeroPrimaryCta"), {
      variant: "primary",
      glyph: "+",
      onClick: () => { if (hasGames) openCreatePicker(getLang()); else showToast(t("catalogUnavailableToast")) }
    }),
    ctaButton(t("featuresHeroSecondaryCta"), {
      variant: "secondary",
      onClick: () => { void setView("howToPlayView") }
    })
  ]))
  return hero
}

function buildGrid(): HTMLElement {
  const pairs: FeatureKey[] = [
    ["feat1Title", "feat1Text"], ["feat2Title", "feat2Text"], ["feat3Title", "feat3Text"],
    ["feat4Title", "feat4Text"], ["feat5Title", "feat5Text"], ["feat6Title", "feat6Text"],
    ["feat7Title", "feat7Text"], ["feat8Title", "feat8Text"], ["feat9Title", "feat9Text"]
  ]
  return el("div", { class: "feature-grid-v2" }, pairs.map(([titleKey, textKey], i) =>
    buildFeatureCard(titleKey, textKey, FEATURE_ICONS[i] ?? "◌", i)
  ))
}

function buildExperience(): HTMLElement {
  const section = el("section", { class: "features-experience" })
  section.append(
    el("div", { class: "features-experience-nodes", "aria-hidden": "true" }, [
      el("span", { class: "features-node" }), el("span", { class: "features-node" }), el("span", { class: "features-node" })
    ]),
    sectionHeading({ eyebrow: t("featuresExperienceEyebrow"), title: t("featuresExperienceTitle"), description: t("featuresExperienceText") })
  )
  return section
}

function buildFinalCta(hasGames: boolean): HTMLElement {
  const button = ctaButton(t("featuresFinalButton"), {
    variant: "primary",
    glyph: "+",
    onClick: () => { if (hasGames) openCreatePicker(getLang()); else showToast(t("catalogUnavailableToast")) }
  })
  return el("div", { class: "about-closing" }, [
    el("p", { class: "about-closing-title" }, [t("featuresFinalTitle")]),
    el("p", { class: "about-closing-sub" }, [t("featuresFinalText")]),
    el("div", { class: "page-final-actions" }, [button])
  ])
}

function buildFeaturesSlide(hasGames: boolean): { slide: HTMLElement; cleanup: () => void } {
  const slide = el("section", { class: "home-slide features-slide", "data-slide": "features" })
  const atmosphere = el("div", { class: "about-atmosphere", "aria-hidden": "true" })

  const hero = buildHero(hasGames)
  const grid = buildGrid()
  const experience = buildExperience()
  const finalCta = buildFinalCta(hasGames)

  slide.append(atmosphere, hero, grid, experience, finalCta)

  const stopReveal = scrollReveal([...grid.querySelectorAll<HTMLElement>(".feat-card-v2")], {
    hiddenClass: "htp-reveal",
    visibleClass: "htp-reveal-visible"
  })

  return { slide, cleanup: stopReveal }
}

export const featuresView = {
  id: "featuresView" as const,
  mount() {
    clearTheme()
    setPageMeta(t("featuresSeoTitle"), t("featuresSeoDescription"))
    const stage = $<HTMLDivElement>("#featuresStage")
    clear(stage)
    const { slide, cleanup } = buildFeaturesSlide(getGames().length > 0)
    stage.appendChild(slide)
    return () => { cleanup(); resetPageMeta(); clear(stage) }
  }
}
