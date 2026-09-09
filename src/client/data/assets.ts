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

const COVERS: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("../assets/worlds/*-cover.*", {
      eager: true,
      query: "?url",
      import: "default"
    })
  ).map(([path, url]) => [path.replace(/^.*\/(.+)-cover\.[^.]+$/, "$1"), url])
)

/**
 * The cover for a theme, or "" for a world that has none yet. Callers put this
 * straight into an `<img src>`; an empty one draws nothing rather than firing
 * a request at a path that was never there.
 */
export function worldCoverPath(theme: string): string {
  return COVERS[theme] ?? ""
}
