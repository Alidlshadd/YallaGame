import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { clearTheme } from "../themes/loader.js"
import { showToast } from "../ui/toast.js"
import { setView } from "../router.js"
import { getGames, openCreatePicker } from "./home.js"
import { sectionHeading, ctaButton } from "../ui/pageSections.js"
import { setPageMeta, resetPageMeta } from "../ui/seo.js"
import { scrollReveal } from "../ui/motion.js"

function buildHero(): HTMLElement {
  const hero = el("section", { class: "htp-hero about-hero-v2" })
  hero.append(
    el("div", { class: "about-hero-lines", "aria-hidden": "true" }, [
      el("span", { class: "about-hero-line l1" }),
      el("span", { class: "about-hero-line l2" }),
      el("span", { class: "about-hero-line l3" })
    ]),
    sectionHeading({ eyebrow: t("aboutEyebrow"), title: t("aboutHeroTitle"), description: t("aboutHeroBody") }),
    el("div", { class: "htp-hero-actions" }, [
      ctaButton(t("aboutHeroCta"), { variant: "primary", glyph: "▹", onClick: () => { void setView("worldsView") } })
    ])
  )
  return hero
}

function buildMission(): HTMLElement {
  return el("section", { class: "about-mission" }, [
    sectionHeading({ eyebrow: t("aboutMissionEyebrow"), title: t("aboutMissionTitle"), description: t("aboutMissionText") })
  ])
}

function buildWhy(): HTMLElement {
  const cycle = el("p", { class: "about-why-cycle", "aria-hidden": "true" }, [
    el("span", { class: "is-active" }, ["Yalla"]),
    el("span", {}, ["→"]),
    el("span", {}, ["Gather"]),
    el("span", {}, ["→"]),
    el("span", {}, ["Play"])
  ])
  return el("section", { class: "about-why" }, [
    cycle,
    el("h2", { class: "how-title" }, [t("aboutWhyTitle")]),
    el("p", { class: "how-sub" }, [t("aboutWhyText")]),
    el("p", { class: "about-why-note" }, [t("aboutWhyNote")])
  ])
}

function buildBrandSymbol(): HTMLElement {
  const colors: [string, string][] = [
    ["lime", t("aboutColorLime")],
    ["warm", t("aboutColorWarmWhite")],
    ["coral", t("aboutColorCoral")],
    ["black", t("aboutColorBlack")]
  ]
  const lineEls = ["lime", "warm", "coral"].map(tone =>
    el("span", { class: `about-symbol-line ${tone}`, tabindex: "0", "data-tone": tone })
  )
  const meanings = el("ul", { class: "about-symbol-meanings" }, colors.map(([tone, text]) =>
    el("li", { class: `about-symbol-meaning ${tone}`, "data-tone": tone }, [text])
  ))
  // Hovering (or focusing, for keyboard users) a line highlights its meaning
  // below — the meanings are always visible in the list either way, so this
  // is a bonus cross-reference, not the only way to reach the information.
  for (const line of lineEls) {
    const tone = line.dataset.tone
    const highlight = (on: boolean) => meanings.querySelector(`[data-tone="${tone}"]`)?.classList.toggle("is-highlighted", on)
    line.addEventListener("mouseenter", () => highlight(true))
    line.addEventListener("mouseleave", () => highlight(false))
    line.addEventListener("focus", () => highlight(true))
    line.addEventListener("blur", () => highlight(false))
  }
  const lines = el("div", { class: "about-symbol-lines" }, lineEls)
  return el("section", { class: "about-symbol" }, [
    el("div", { class: "about-symbol-visual" }, [lines]),
    el("div", { class: "about-symbol-copy" }, [
      el("h2", { class: "how-title" }, [t("aboutSymbolTitle")]),
      el("p", { class: "how-sub" }, [t("aboutSymbolText")]),
      meanings
    ])
  ])
}

function buildValueCard(title: string, text: string): HTMLElement {
  return el("div", { class: "about-value-card" }, [
    el("h3", { class: "about-value-title" }, [title]),
    el("p", { class: "about-value-text" }, [text])
  ])
}

function buildValues(): HTMLElement {
  const cards = [
    buildValueCard(t("aboutValue1Title"), t("aboutValue1Text")),
    buildValueCard(t("aboutValue2Title"), t("aboutValue2Text")),
    buildValueCard(t("aboutValue3Title"), t("aboutValue3Text")),
    buildValueCard(t("aboutValue4Title"), t("aboutValue4Text"))
  ]
  // Pairs open together, not one-by-one: same delay within each pair of two.
  cards.forEach((card, i) => card.style.setProperty("--tile-delay", `${Math.floor(i / 2) * 110}ms`))
  return el("section", { class: "about-values" }, [
    sectionHeading({ title: t("aboutValuesTitle") }),
    el("div", { class: "about-values-grid" }, cards)
  ])
}

function buildBuiltFor(): HTMLElement {
  const items = [
    t("aboutBuiltFor1"), t("aboutBuiltFor2"), t("aboutBuiltFor3"), t("aboutBuiltFor4"), t("aboutBuiltFor5")
  ]
  return el("section", { class: "about-built-for" }, [
    el("h2", { class: "how-title" }, [t("aboutBuiltForTitle")]),
    el("ul", { class: "about-built-for-list" }, items.map(item => el("li", {}, [item])))
  ])
}

function buildVision(): HTMLElement {
  return el("section", { class: "about-vision" }, [
    el("div", { class: "about-vision-paths", "aria-hidden": "true" }, [
      el("span", { class: "about-vision-path p1" }),
      el("span", { class: "about-vision-path p2" }),
      el("span", { class: "about-vision-path p3" })
    ]),
    sectionHeading({ title: t("aboutVisionTitle"), description: t("aboutVisionText") })
  ])
}

function buildFinalCta(hasGames: boolean): HTMLElement {
  const primary = ctaButton(t("aboutFinalPrimary"), {
    variant: "primary",
    glyph: "+",
    onClick: () => { if (hasGames) openCreatePicker(getLang()); else showToast(t("catalogUnavailableToast")) }
  })
  const secondary = ctaButton(t("aboutFinalSecondary"), {
    variant: "secondary",
    onClick: () => { void setView("howToPlayView") }
  })
  return el("div", { class: "about-closing" }, [
    el("p", { class: "about-closing-title" }, [t("aboutClosingTitle")]),
    el("p", { class: "about-closing-sub" }, [t("aboutClosingSub")]),
    el("div", { class: "page-final-actions" }, [primary, secondary])
  ])
}

function buildAboutSlide(hasGames: boolean): { slide: HTMLElement; cleanup: () => void } {
  const slide = el("section", { class: "home-slide about-slide", "data-slide": "about" })
  const atmosphere = el("div", { class: "about-atmosphere", "aria-hidden": "true" })

  const hero = buildHero()
  const mission = buildMission()
  const why = buildWhy()
  const symbol = buildBrandSymbol()
  const values = buildValues()
  const builtFor = buildBuiltFor()
  const vision = buildVision()
  const finalCta = buildFinalCta(hasGames)

  slide.append(atmosphere, hero, mission, why, symbol, values, builtFor, vision, finalCta)

  const stopReveal = scrollReveal(
    [...values.querySelectorAll<HTMLElement>(".about-value-card"), ...builtFor.querySelectorAll<HTMLElement>("li")],
    { hiddenClass: "htp-reveal", visibleClass: "htp-reveal-visible" }
  )

  // "Yalla → Gather → Play" cycles gently while the section is visible;
  // decorative only (aria-hidden), so no live-region announcements needed.
  const cycleWords = [...why.querySelectorAll<HTMLElement>(".about-why-cycle span")].filter(n => n.textContent !== "→")
  let cycleTimer = 0
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let active = 0
    cycleTimer = window.setInterval(() => {
      cycleWords[active]?.classList.remove("is-active")
      active = (active + 1) % cycleWords.length
      cycleWords[active]?.classList.add("is-active")
    }, 1800)
  }

  return { slide, cleanup: () => { stopReveal(); window.clearInterval(cycleTimer) } }
}

export const aboutView = {
  id: "aboutView" as const,
  mount() {
    clearTheme()
    setPageMeta(t("aboutSeoTitle"), t("aboutSeoDescription"))
    const stage = $<HTMLDivElement>("#aboutStage")
    clear(stage)
    const { slide, cleanup } = buildAboutSlide(getGames().length > 0)
    stage.appendChild(slide)
    return () => { cleanup(); resetPageMeta(); clear(stage) }
  }
}
