/** Per-route <title>/description, for the routed pages that need their own
 * (How to Play, Features, About). Captures whatever was in place the first
 * time it's called — by then loadPublicConfiguration() has already applied
 * any admin branding override, so the "default" resetPageMeta() restores is
 * always the real one for this session, not a hardcoded fallback. */
let defaultTitle: string | null = null
let defaultDescription: string | null = null

function captureDefaults(): void {
  if (defaultTitle !== null) return
  defaultTitle = document.title
  defaultDescription = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? ""
}

export function setPageMeta(title: string, description: string): void {
  captureDefaults()
  document.title = title
  document.querySelector('meta[name="description"]')?.setAttribute("content", description)
}

export function resetPageMeta(): void {
  if (defaultTitle === null) return
  document.title = defaultTitle
  document.querySelector('meta[name="description"]')?.setAttribute("content", defaultDescription ?? "")
}
