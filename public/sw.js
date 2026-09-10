/*
 * Yalla Game service worker.
 *
 * Goal: the app opens instantly on a phone and Local Play (which needs no
 * server at all) keeps working with no signal. Rooms still need the network,
 * so nothing about the socket or the API is ever served from cache.
 *
 * Strategy:
 *   - navigations      → network first, fall back to the cached shell offline
 *   - build assets     → cache first (Vite gives them content-hashed names)
 *   - images / sounds  → stale-while-revalidate
 *   - /api, socket.io  → never touched
 */

/*
 * Bump this whenever a file under `public/` is replaced in place.
 *
 * Vite's own output is content-hashed, so a new build is a new URL and the
 * cache sorts itself out. Everything hand-placed in `public/` — the world
 * covers above all — keeps its name forever, and `staleWhileRevalidate` hands
 * back the copy it already has before it goes looking for a newer one. That
 * is right for art that never changes and wrong the day it does: the phone
 * shows the old cover until the visit after next. Changing the version drops
 * both caches on activate, which is the only thing that fixes it that visit.
 */
const VERSION = "v3"
const SHELL_CACHE = `yalla-shell-${VERSION}`
const ASSET_CACHE = `yalla-assets-${VERSION}`
const SHELL_URL = "/"

/*
 * Precache the build assets the shell references. The worker is written by
 * hand rather than generated, so it has no list of content-hashed file names —
 * it reads them out of the shell HTML instead. Without this the very first
 * visit caches nothing (those requests are made before the worker takes
 * control), and the second visit would be the first one able to work offline.
 */
async function precacheShellAssets() {
  const shellCache = await caches.open(SHELL_CACHE)
  const response = await fetch(SHELL_URL, { cache: "reload" })
  if (!response.ok) throw new Error("shell unavailable")
  await shellCache.put(SHELL_URL, response.clone())

  const html = await response.text()
  const assets = new Set()
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)) {
    assets.add(match[1])
  }

  // The lazily imported views (Local Play above all) are not referenced by the
  // shell HTML, so take their hashed names from the build manifest. Without
  // them the offline home screen would open and then fail to enter a game.
  try {
    const manifest = await fetch("/asset-manifest.json", { cache: "reload" })
    if (manifest.ok) {
      for (const entry of Object.values(await manifest.json())) {
        // Offline play needs code and styles, not every world's poster art.
        if (entry.file && /\.(js|css|woff2?)$/.test(entry.file)) assets.add(`/${entry.file}`)
        for (const css of entry.css ?? []) assets.add(`/${css}`)
      }
    }
  } catch {
    /* Older build without a manifest: runtime caching still fills in. */
  }

  if (assets.size > 0) {
    const assetCache = await caches.open(ASSET_CACHE)
    const queue = [...assets]
    // Keep bandwidth available for the page the player is actually opening.
    await Promise.all(Array.from({ length: 2 }, async () => {
      while (queue.length > 0) {
        const url = queue.shift()
        await assetCache.add(url).catch(() => {})
      }
    }))
  }
  await shellCache.add("/manifest.webmanifest").catch(() => {})
}

self.addEventListener("install", event => {
  event.waitUntil(
    precacheShellAssets()
      .catch(() => { /* Offline at install time; runtime caching fills in later. */ })
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL_CACHE && k !== ASSET_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

function isBuildAsset(url) {
  return url.pathname.startsWith("/assets/") && /\.(js|css|woff2?)$/.test(url.pathname)
}

function isMedia(url) {
  return /\.(png|jpe?g|webp|avif|svg|gif|ogg|mp3|wav)$/.test(url.pathname)
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE)
      cache.put(SHELL_URL, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(SHELL_URL)
    if (cached) return cached
    return new Response("Offline", { status: 503, statusText: "Offline" })
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(ASSET_CACHE)
    cache.put(request, response.clone())
  }
  return response
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => cached)
  return cached ?? network
}

self.addEventListener("fetch", event => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Live data must never come from a cache.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/socket.io/")) return
  if (url.pathname === "/healthz") return

  if (request.mode === "navigate") { event.respondWith(networkFirst(request)); return }
  if (isBuildAsset(url))           { event.respondWith(cacheFirst(request)); return }
  if (isMedia(url))                { event.respondWith(staleWhileRevalidate(request)); return }
})
