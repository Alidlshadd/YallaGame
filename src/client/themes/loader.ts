export type ThemeName =
  | "vampire-village" | "mafia-classic" | "spy-game" | "who-am-i"
  | "football-player-guess" | "most-likely-to" | "bluff-trivia" | "secret-politician"

const KNOWN_THEMES: ThemeName[] = [
  "vampire-village", "mafia-classic", "spy-game", "who-am-i",
  "football-player-guess", "most-likely-to", "bluff-trivia", "secret-politician"
]

const loaders: Record<ThemeName, () => Promise<unknown>> = {
  "vampire-village": () => import("./vampire-village.css"),
  "mafia-classic":   () => import("./mafia-classic.css"),
  "spy-game":        () => import("./spy-game.css"),
  "who-am-i":        () => import("./who-am-i.css"),
  "football-player-guess": () => import("./football-player-guess.css"),
  "most-likely-to":  () => import("./most-likely-to.css"),
  "bluff-trivia":    () => import("./bluff-trivia.css"),
  "secret-politician": () => import("./secret-politician.css")
}

const loaded = new Set<ThemeName>()

export async function applyTheme(name: string): Promise<void> {
  if (!(KNOWN_THEMES as string[]).includes(name)) {
    throw new Error(`UNKNOWN_THEME: ${name}`)
  }
  const theme = name as ThemeName
  if (!loaded.has(theme)) {
    await loaders[theme]()
    loaded.add(theme)
  }
  document.documentElement.setAttribute("data-theme", theme)
}

export function clearTheme(): void {
  document.documentElement.removeAttribute("data-theme")
}

export function currentTheme(): ThemeName | null {
  const attr = document.documentElement.getAttribute("data-theme")
  return (KNOWN_THEMES as string[]).includes(attr ?? "") ? (attr as ThemeName) : null
}
