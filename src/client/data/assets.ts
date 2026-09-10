/*
 * World cover art.
 *
 * The files live under `src/client/assets/worlds/` rather than `public/` so
 * the bundler gives each one a content-hashed name. That is not tidiness: a
 * cover in `public/` keeps its URL forever, and replacing one left every
 * phone drawing the old art — the browser and the service worker both had a
 * perfectly good copy at that address and no reason to ask for another. A
 * hashed name means new art is a new URL, so nothing can serve the old bytes.
 *
 * Adding a world's cover is dropping `<theme>-cover.<ext>` into that folder.
 * Nothing here needs editing, and the extension no longer needs declaring.
 */

/**
 * Turns a glob of hashed files into a lookup keyed by whatever `keyPattern`
 * pulls out of each path — the theme for a cover, the bare file name for a
 * backdrop. One helper so a third hashed-asset category is one call, not a
 * third copy of the glob plumbing.
 */
function hashedAssetMap(files: Record<string, string>, keyPattern: RegExp): Record<string, string> {
  return Object.fromEntries(
    Object.entries(files).map(([path, url]) => [path.replace(keyPattern, "$1"), url])
  )
}

const COVERS: Record<string, string> = hashedAssetMap(
  import.meta.glob<string>("../assets/worlds/*-cover.*", { eager: true, query: "?url", import: "default" }),
  /^.*\/(.+)-cover\.[^.]+$/
)

/**
 * The cover for a theme, or "" for a world that has none yet. Callers put this
 * straight into an `<img src>`; an empty one draws nothing rather than firing
 * a request at a path that was never there.
 */
export function worldCoverPath(theme: string): string {
  return COVERS[theme] ?? ""
}

/*
 * The cinematic backdrops behind a world's detail page, hashed for the same
 * reason as the covers. Keyed on the file's own name rather than on the theme,
 * because a world has several — a hero, a sections panel, a closing CTA — and
 * they were never named to a single pattern.
 */
const BACKGROUNDS: Record<string, string> = hashedAssetMap(
  import.meta.glob<string>("../assets/world-bg/*", { eager: true, query: "?url", import: "default" }),
  /^.*\/(.+)\.[^.]+$/
)

/** A backdrop by file name, e.g. `worldBackground("spy-game-detail")`. */
export function worldBackground(name: string): string {
  return BACKGROUNDS[name] ?? ""
}
