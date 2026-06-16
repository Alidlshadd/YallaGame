/**
 * Tiny lazy-image fade-in binder.
 *
 * Any <img loading="lazy"> in the DOM (now or in the future) gets a
 * `.lazy-loaded` class once its bitmap has decoded. CSS pairs that class
 * with an opacity transition (defined in _base.css) to give every below-
 * the-fold image a clean fade-in instead of popping in.
 *
 * Implementation notes:
 *   • One MutationObserver watches body for added <img> nodes
 *   • Images already cached fire the load synchronously — we detect this
 *     with img.complete and apply the class immediately so they don't
 *     stay invisible.
 *   • No IntersectionObserver needed — the browser's own lazy-loading
 *     already throttles the load event by viewport proximity.
 *   • No layout shift: width/height attributes on the <img> are required
 *     at the call-site (already added across the views).
 */

const LOADED_CLASS = "lazy-loaded"

function markLoaded(img: HTMLImageElement): void {
  img.classList.add(LOADED_CLASS)
}

function bindImage(img: HTMLImageElement): void {
  if (img.dataset.lazyBound === "1") return
  img.dataset.lazyBound = "1"
  // Cached images are .complete and naturalWidth>0 immediately.
  if (img.complete && img.naturalWidth > 0) {
    markLoaded(img)
    return
  }
  img.addEventListener("load", () => markLoaded(img), { once: true })
  // If the image errors out, still reveal it so we don't leave a permanent
  // dark hole in the layout (alt text + placeholder is friendlier).
  img.addEventListener("error", () => markLoaded(img), { once: true })
}

function scanRoot(root: ParentNode): void {
  const imgs = root.querySelectorAll?.<HTMLImageElement>('img[loading="lazy"]')
  if (imgs) for (const img of imgs) bindImage(img)
}

let started = false

export function initLazyImageFade(): void {
  if (started) return
  started = true

  scanRoot(document)

  const observer = new MutationObserver(records => {
    for (const r of records) {
      for (const node of r.addedNodes) {
        if (!(node instanceof Element)) continue
        if (node instanceof HTMLImageElement) {
          if (node.loading === "lazy") bindImage(node)
        } else {
          scanRoot(node)
        }
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
