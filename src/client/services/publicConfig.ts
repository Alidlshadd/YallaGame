export interface PublicConfiguration {
  branding: Record<string, string>
  games: Record<string, { enabled: boolean; order: number; assets: Record<string, string | null> }>
}
let configuration: PublicConfiguration = { branding: {}, games: {} }
export function getPublicConfiguration(): PublicConfiguration {
  return configuration
}
export async function loadPublicConfiguration(): Promise<void> {
  try {
    const response = await fetch("/api/public-config", {
      signal: AbortSignal.timeout(3000),
      cache: "no-store"
    })
    if (response.ok) configuration = (await response.json()) as PublicConfiguration
  } catch {
    /* Existing bundled artwork and copy remain available offline. */
  }
  const brand = configuration.branding
  if (brand.siteName) {
    document.title = brand.siteName
    document.querySelectorAll(".app-footer-brand,.brand-text strong").forEach(node => {
      node.textContent = brand.siteName!
      node.removeAttribute("data-i18n")
    })
  }
  if (brand.description)
    document.querySelector('meta[name="description"]')?.setAttribute("content", brand.description)
  if (brand.favicon) document.querySelector('link[rel="icon"]')?.setAttribute("href", brand.favicon)
  if (brand.footer) {
    const footer = document.querySelector(".app-footer-text")
    if (footer) footer.textContent = brand.footer
  }
  document.querySelectorAll<HTMLImageElement>(".brand-mark").forEach(image => {
    image.src = brand.darkLogo ?? brand.logo ?? image.src
  })
}
export function brandLogo(dark = false): string {
  const brand = configuration.branding
  return (dark ? brand.darkLogo : undefined) ?? brand.logo ?? "/assets/logo/yalla-game-mark.webp"
}
export function gameAsset(gameId: string, slot: string): string | undefined {
  const url = configuration.games[gameId]?.assets[slot]
  return url && /^\/uploads\/[a-f0-9]{64}\.webp$/.test(url) ? url : undefined
}
