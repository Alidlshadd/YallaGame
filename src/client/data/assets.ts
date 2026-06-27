const COVER_EXTENSIONS: Record<string, string> = {
  "football-player-guess": "png"
}

export function worldCoverPath(theme: string): string {
  const ext = COVER_EXTENSIONS[theme] ?? "webp"
  return `/assets/worlds/${theme}-cover.${ext}`
}
