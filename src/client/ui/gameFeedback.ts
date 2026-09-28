import type { Game, LangCode } from "@shared/types.js"
import { getLang } from "../services/i18n.js"
import { dismissLayer, pushLayer, type LayerHandle } from "../services/navigation.js"
import { el } from "./dom.js"
import "../themes/feedback.css"

const copy = {
  en: { title: "How was the game?", hint: "Your opinion helps us make the next game better. This is optional.", stars: "Rate out of 5 stars", comment: "A suggestion, complaint or problem?", placeholder: "Tell us what you liked or what we can improve… (optional)", send: "Send feedback", sending: "Sending…", close: "Close", thanks: "Thank you!", received: "Your feedback made it. Thanks for helping us improve the game.", error: "We couldn't send your feedback. Please try again when you're connected." },
  tr: { title: "Oyun nasıldı?", hint: "Fikrin, oyunu daha iyi yapmamıza yardımcı olur. Katılmak tamamen isteğe bağlı.", stars: "5 üzerinden yıldız ver", comment: "Önerin, şikâyetin veya yaşadığın bir sorun var mı?", placeholder: "Neyi beğendin, neyi geliştirebiliriz? (İsteğe bağlı)", send: "Değerlendirmeyi gönder", sending: "Gönderiliyor…", close: "Kapat", thanks: "Teşekkürler!", received: "Değerlendirmen bize ulaştı. Oyunu geliştirmemize yardımcı olduğun için teşekkürler.", error: "Değerlendirmen gönderilemedi. Bağlantını kontrol edip tekrar dene." },
  ar: { title: "كيف كانت اللعبة؟", hint: "رأيك يساعدنا على تحسين اللعبة. المشاركة اختيارية تماماً.", stars: "قيّم من 5 نجوم", comment: "هل لديك اقتراح أو شكوى أو مشكلة؟", placeholder: "أخبرنا بما أعجبك أو ما يمكننا تحسينه… (اختياري)", send: "إرسال التقييم", sending: "جارٍ الإرسال…", close: "إغلاق", thanks: "شكراً لك!", received: "وصلنا تقييمك. شكراً لمساعدتنا على تحسين اللعبة.", error: "تعذر إرسال تقييمك. تحقق من اتصالك وحاول مجدداً." },
  ku: { title: "یارییەکە چۆن بوو؟", hint: "ڕای تۆ یارمەتیمان دەدات یارییەکە باشتر بکەین. بەشداریکردن ئارەزوومەندانەیە.", stars: "لە ٥ ئەستێرە هەڵسەنگاندن بکە", comment: "پێشنیار، سکاڵا یان کێشەیەکت هەیە؟", placeholder: "چیت بە دڵ بوو یان چی باشتر بکەین؟ (ئارەزوومەندانە)", send: "ناردنی هەڵسەنگاندن", sending: "دە نێردرێت…", close: "داخستن", thanks: "سوپاس!", received: "هەڵسەنگاندنەکەت گەیشت. سوپاس بۆ یارمەتیدانت بۆ باشترکردنی یارییەکە.", error: "هەڵسەنگاندنەکەت نەنێردرا. پەیوەندییەکەت بپشکنە و دووبارە هەوڵ بدە." }
} satisfies Record<LangCode, Record<string, string>>

const seenInMemory = new Set<string>()
const keyFor = (gameId: string) => `yalla:feedback:seen:${gameId}`
let active: (() => void) | null = null

/** A dismissal counts too. Anonymous players are remembered on this browser, across rooms and reloads. */
export function offerGameFeedback(game: Pick<Game, "id" | "title">): void {
  if (active || seenInMemory.has(game.id)) return
  try { if (localStorage.getItem(keyFor(game.id))) return } catch { /* Session memory is still available. */ }
  seenInMemory.add(game.id)
  try { localStorage.setItem(keyFor(game.id), "1") } catch { /* Private storage may be unavailable. */ }

  const lang = getLang(), text = copy[lang]
  let rating = 0, closed = false, submitting = false
  let layer: LayerHandle | null = null
  let thankYouTimer: number | undefined
  const controller = new AbortController()
  const previousFocus = document.activeElement as HTMLElement | null
  const previousOverflow = document.body.style.overflow
  const background = Array.from(document.body.children).filter((node): node is HTMLElement => node instanceof HTMLElement)
    .map(node => ({ node, inert: node.inert }))
  const overlay = el("div", { id: "gameFeedbackOverlay", class: "feedback-overlay", dir: lang === "ar" || lang === "ku" ? "rtl" : "ltr" })
  const panel = el("section", { class: "feedback-panel", role: "dialog", "aria-modal": "true", "aria-labelledby": "gameFeedbackTitle", "aria-describedby": "gameFeedbackHint" })
  const close = () => {
    if (closed) return
    closed = true
    controller.abort()
    window.clearTimeout(thankYouTimer)
    dismissLayer(layer)
    overlay.remove()
    background.forEach(({ node, inert }) => { node.inert = inert })
    document.body.style.overflow = previousOverflow
    active = null
    if (previousFocus?.isConnected) previousFocus.focus()
  }
  active = close
  const closeButton = el("button", { class: "feedback-close", type: "button", "aria-label": text.close }, ["×"])
  closeButton.addEventListener("click", close)
  const heading = el("h2", { id: "gameFeedbackTitle" }, [text.title])
  const hint = el("p", { id: "gameFeedbackHint", class: "feedback-hint" }, [text.hint])
  const stars = el("div", { class: "feedback-stars", role: "radiogroup", "aria-label": text.stars, dir: "ltr" })
  const submit = el("button", { class: "feedback-submit", type: "submit", disabled: true }, [text.send])
  const ratingLabel = el("p", { class: "feedback-rating", "aria-live": "polite" }, [text.stars])
  const starButtons: HTMLButtonElement[] = []
  const selectRating = (value: number) => {
    rating = value
    starButtons.forEach((button, i) => {
      button.classList.toggle("selected", i < rating)
      button.setAttribute("aria-checked", String(i + 1 === rating))
      button.tabIndex = i + 1 === rating ? 0 : -1
    })
    ratingLabel.textContent = `${rating} / 5`
    submit.disabled = false
  }
  for (let value = 1; value <= 5; value++) {
    const button = el("button", { type: "button", class: "feedback-star", role: "radio", "aria-checked": "false", "aria-label": `${value} / 5`, tabindex: value === 1 ? 0 : -1 }, ["★"])
    button.addEventListener("click", () => selectRating(value))
    button.addEventListener("keydown", event => {
      const next = event.key === "ArrowRight" || event.key === "ArrowUp" ? value % 5 + 1
        : event.key === "ArrowLeft" || event.key === "ArrowDown" ? (value + 3) % 5 + 1 : null
      if (next === null) return
      event.preventDefault(); selectRating(next); starButtons[next - 1]?.focus()
    })
    starButtons.push(button); stars.append(button)
  }
  const comment = el("textarea", { id: "gameFeedbackComment", maxlength: 2000, rows: 3, placeholder: text.placeholder })
  const error = el("p", { class: "feedback-error", role: "alert" })
  const form = el("form", { class: "feedback-form" }, [
    stars, ratingLabel, el("label", { for: comment.id }, [text.comment]), comment, error, submit
  ])
  form.addEventListener("submit", event => {
    event.preventDefault()
    if (!rating || submitting) return
    submitting = true; submit.disabled = true; submit.textContent = text.sending; error.textContent = ""
    void fetch("/api/feedback", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: game.id, rating, comment: comment.value.trim() }),
      signal: controller.signal
    }).then(async response => {
      if (!response.ok || (await response.json() as { saved?: boolean }).saved !== true) throw new Error("FEEDBACK_FAILED")
      if (closed) return
      form.remove()
      heading.textContent = text.thanks
      hint.textContent = text.received
      panel.classList.add("feedback-thanks")
      const celebration = el("div", { class: "feedback-celebration", "aria-hidden": "true" }, [el("span", { class: "feedback-check" }, ["✓"])])
      for (let i = 0; i < 12; i++) {
        const spark = el("i", { class: "feedback-spark" })
        spark.style.setProperty("--angle", `${i * 30}deg`)
        celebration.append(spark)
      }
      panel.insertBefore(celebration, heading)
      heading.tabIndex = -1; heading.focus()
      thankYouTimer = window.setTimeout(close, 3200)
    }).catch(() => {
      if (closed) return
      submitting = false; submit.disabled = false; submit.textContent = text.send; error.textContent = text.error
    })
  })
  panel.append(closeButton, el("p", { class: "feedback-game" }, [game.title[lang]]), heading, hint, form)
  overlay.append(panel)
  overlay.addEventListener("click", event => { if (event.target === overlay) close() })
  overlay.addEventListener("keydown", event => {
    if (event.key !== "Tab") return
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), textarea'))
    const first = focusable[0], last = focusable.at(-1)
    if (event.shiftKey && (document.activeElement === first || document.activeElement === heading)) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  })
  background.forEach(({ node }) => { node.inert = true })
  document.body.style.overflow = "hidden"
  document.body.append(overlay)
  layer = pushLayer(close, "game-feedback")
  closeButton.focus()
}
