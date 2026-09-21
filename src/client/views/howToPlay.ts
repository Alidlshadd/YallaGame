import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { clearTheme } from "../themes/loader.js"
import { showToast } from "../ui/toast.js"
import { setView } from "../router.js"
import { getGames, openCreatePicker } from "./home.js"
import { sectionHeading, ctaButton } from "../ui/pageSections.js"
import { setPageMeta, resetPageMeta } from "../ui/seo.js"
import { scrollReveal } from "../ui/motion.js"

function buildHero(hasGames: boolean): HTMLElement {
  const hero = el("section", { class: "htp-hero" })
  hero.append(
    el("div", { class: "htp-hero-nodes", "aria-hidden": "true" }, [
      el("span", { class: "htp-hero-node n1" }),
      el("span", { class: "htp-hero-node n2" }),
      el("span", { class: "htp-hero-node n3" }),
      el("span", { class: "htp-hero-node n4" })
    ]),
    sectionHeading({ eyebrow: t("howPlayEyebrow"), title: t("howPlayTitle"), description: t("howPlaySub") })
  )
  const actions = el("div", { class: "htp-hero-actions" }, [
    ctaButton(t("howPlayHeroPrimaryCta"), {
      variant: "primary",
      glyph: "+",
      onClick: () => { if (hasGames) openCreatePicker(getLang()); else showToast(t("catalogUnavailableToast")) }
    }),
    ctaButton(t("howPlayHeroSecondaryCta"), {
      variant: "secondary",
      onClick: () => { void setView("joinView") }
    })
  ])
  const note = el("p", { class: "htp-hero-note" }, [
    el("span", { class: "hero-hint-icon", "aria-hidden": "true" }, ["▹"]),
    el("span", {}, [t("howPlayHeroNote")])
  ])
  hero.append(actions, note)
  return hero
}

function buildWayCard(title: string, text: string, badge: string, glyph: string): HTMLElement {
  return el("div", { class: "htp-way-card" }, [
    el("span", { class: "htp-way-icon", "aria-hidden": "true" }, [glyph]),
    el("h3", { class: "htp-way-title" }, [title]),
    el("p", { class: "htp-way-text" }, [text]),
    el("span", { class: "htp-way-badge" }, [badge])
  ])
}

function buildWaySection(): HTMLElement {
  const section = el("section", { class: "htp-way" })
  const cards = [
    buildWayCard(t("howPlayWayLocalTitle"), t("howPlayWayLocalText"), t("howPlayWayLocalBadge"), "▣"),
    buildWayCard(t("howPlayWayCreateTitle"), t("howPlayWayCreateText"), t("howPlayWayCreateBadge"), "+"),
    buildWayCard(t("howPlayWayJoinTitle"), t("howPlayWayJoinText"), t("howPlayWayJoinBadge"), "▹")
  ]
  cards.forEach((card, i) => card.style.setProperty("--tile-delay", `${i * 80}ms`))
  const grid = el("div", { class: "htp-way-grid" }, cards)
  section.append(sectionHeading({ title: t("howPlayWayTitle"), description: t("howPlayWayDesc") }), grid)
  return section
}

function buildStep(index: number, title: string, text: string): HTMLElement {
  return el("div", { class: "htp-step", "data-step": String(index) }, [
    el("div", { class: "htp-step-number" }, [String(index).padStart(2, "0")]),
    el("h3", { class: "htp-step-title" }, [title]),
    el("p", { class: "htp-step-text" }, [text])
  ])
}

function buildStepsSection(): { section: HTMLElement; track: HTMLElement; steps: HTMLElement[] } {
  const section = el("section", { class: "htp-steps" })
  const steps = [
    buildStep(1, t("howPlayStep1Title"), t("howPlayStep1Desc")),
    buildStep(2, t("howPlayStep2Title"), t("howPlayStep2Desc")),
    buildStep(3, t("howPlayStep3Title"), t("howPlayStep3Desc")),
    buildStep(4, t("howPlayStep4Title"), t("howPlayStep4Desc"))
  ]
  const track = el("div", { class: "htp-steps-track" }, steps)
  section.append(sectionHeading({ title: t("howPlayStepsTitle") }), track)
  return { section, track, steps }
}

function buildDuringSection(): HTMLElement {
  const section = el("section", { class: "htp-during" })
  const items = [t("howPlayDuringItem1"), t("howPlayDuringItem2"), t("howPlayDuringItem3"), t("howPlayDuringItem4")]
  const list = el("ul", { class: "htp-during-list" }, items.map(item =>
    el("li", { class: "htp-during-item" }, [
      el("span", { class: "htp-during-check", "aria-hidden": "true" }, ["✓"]),
      el("span", {}, [item])
    ])
  ))
  section.append(
    sectionHeading({ title: t("howPlayDuringTitle") }),
    list,
    el("p", { class: "htp-during-note" }, [t("howPlayDuringNote")])
  )
  return section
}

function buildTipsSection(): HTMLElement {
  const section = el("section", { class: "htp-tips" })
  const tips = [t("howPlayTip1"), t("howPlayTip2"), t("howPlayTip3"), t("howPlayTip4")]
  const grid = el("div", { class: "htp-tips-grid" }, tips.map((tip, i) => {
    const card = el("div", { class: "htp-tip-card" }, [
      el("span", { class: "htp-tip-index", "aria-hidden": "true" }, [String(i + 1).padStart(2, "0")]),
      el("p", {}, [tip])
    ])
    card.style.setProperty("--tile-delay", `${i * 70}ms`)
    return card
  }))
  section.append(sectionHeading({ title: t("howPlayTipsTitle") }), grid)
  return section
}

function buildFinalCta(hasGames: boolean): HTMLElement {
  const primary = ctaButton(t("howPlayFinalPrimary"), {
    variant: "primary",
    glyph: "+",
    onClick: () => { if (hasGames) openCreatePicker(getLang()); else showToast(t("catalogUnavailableToast")) }
  })
  const secondary = ctaButton(t("howPlayFinalSecondary"), {
    variant: "secondary",
    onClick: () => { void setView("worldsView") }
  })
  return el("div", { class: "about-closing" }, [
    el("p", { class: "about-closing-title" }, [t("howPlayClosingTitle")]),
    el("p", { class: "about-closing-sub" }, [t("howPlayClosingSub")]),
    el("div", { class: "page-final-actions" }, [primary, secondary])
  ])
}

/** Tracks how far the visitor has scrolled through the four steps and drives
 * the connecting line + active/done number colors — a small bespoke observer
 * rather than the generic one-shot scrollReveal, since this one updates a
 * continuous "progress" rather than a single reveal moment. */
function wireStepsProgress(track: HTMLElement, steps: HTMLElement[]): () => void {
  if (!("IntersectionObserver" in window)) return () => {}
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const stepEl = entry.target as HTMLElement
      const index = Number(stepEl.dataset.step)
      if (entry.isIntersecting) {
        stepEl.classList.add("is-active")
        track.style.setProperty("--htp-progress", `${(index / steps.length) * 100}%`)
        steps.forEach(s => { if (Number(s.dataset.step) < index) s.classList.add("is-done") })
      }
    }
  }, { threshold: 0.55, rootMargin: "0px 0px -10% 0px" })
  steps.forEach(s => observer.observe(s))
  return () => observer.disconnect()
}

function buildHowToPlaySlide(hasGames: boolean): { slide: HTMLElement; cleanup: () => void } {
  const slide = el("section", { class: "home-slide how-slide", "data-slide": "how" })
  const atmosphere = el("div", { class: "how-atmosphere", "aria-hidden": "true" })

  const hero = buildHero(hasGames)
  const way = buildWaySection()
  const { section: stepsSection, track, steps } = buildStepsSection()
  const during = buildDuringSection()
  const tips = buildTipsSection()
  const finalCta = buildFinalCta(hasGames)

  slide.append(atmosphere, hero, way, stepsSection, during, tips, finalCta)

  const revealTargets = [
    ...way.querySelectorAll<HTMLElement>(".htp-way-card"),
    ...during.querySelectorAll<HTMLElement>(".htp-during-item"),
    ...tips.querySelectorAll<HTMLElement>(".htp-tip-card")
  ]
  const stopReveal = scrollReveal(revealTargets, { hiddenClass: "htp-reveal", visibleClass: "htp-reveal-visible" })
  const stopProgress = wireStepsProgress(track, steps)

  return { slide, cleanup: () => { stopReveal(); stopProgress() } }
}

export const howToPlayView = {
  id: "howToPlayView" as const,
  mount() {
    clearTheme()
    setPageMeta(t("howPlaySeoTitle"), t("howPlaySeoDescription"))
    const stage = $<HTMLDivElement>("#howStage")
    clear(stage)
    const { slide, cleanup } = buildHowToPlaySlide(getGames().length > 0)
    stage.appendChild(slide)
    return () => { cleanup(); resetPageMeta(); clear(stage) }
  }
}
