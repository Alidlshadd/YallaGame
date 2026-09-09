/*
 * World covers live in `public/assets/worlds/` under a name derived from the
 * theme, so replacing one keeps its URL. The service worker caches media
 * stale-while-revalidate, which means a swapped cover keeps showing the old
 * art until the visit after next — bump `VERSION` in `public/sw.js` whenever
 * you replace one.
 */
const COVER_EXTENSIONS: Record<string, string> = {
  "football-player-guess": "png"
}

export function worldCoverPath(theme: string): string {
  const ext = COVER_EXTENSIONS[theme] ?? "webp"
  return `/assets/worlds/${theme}-cover.${ext}`
}
