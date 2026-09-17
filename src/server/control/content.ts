import type Database from "better-sqlite3"
import sharp from "sharp"
import path from "node:path"
import { mkdir, writeFile, unlink } from "node:fs/promises"
import { token } from "./auth.js"
import { audit } from "./database.js"
import { GAME_CATALOG } from "../games/catalog.js"

export const assetSlots = ["cover", "detail", "cta", "section"] as const
export const brandAssets = ["logo", "darkLogo", "favicon", "ogImage"] as const
export const brandTexts = ["siteName", "description", "footer"] as const
export const uploadId = /^[a-f0-9]{64}\.webp$/
export const MAX_UPLOAD = 5 * 1024 * 1024
export interface GameOverride {
  game_id: string
  enabled: number
  sort_order: number
  cover: string | null
  detail: string | null
  cta: string | null
  section: string | null
}
export const assetUrl = (id: string | null): string | null => (id ? `/uploads/${id}` : null)
export function brandedHtml(html: string, branding: Record<string, string>, origin = ""): string {
  const escape = (value: string) =>
    value.replace(
      /[&<>"']/g,
      char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!
    )
  if (branding.siteName)
    html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${escape(branding.siteName!)}</title>`)
  if (branding.description)
    html = html.replace(
      /<meta name="description" content="[^"]*"\s*\/?\s*>/,
      () => `<meta name="description" content="${escape(branding.description!)}">`
    )
  if (branding.favicon)
    html = html.replace(
      /<link rel="icon"[^>]*>/,
      () => `<link rel="icon" type="image/webp" href="${escape(branding.favicon!)}">`
    )
  const tags = [`<meta property="og:title" content="${escape(branding.siteName ?? "Yalla Game")}">`]
  if (branding.description)
    tags.push(`<meta property="og:description" content="${escape(branding.description)}">`)
  if (branding.ogImage) tags.push(`<meta property="og:image" content="${escape(origin + branding.ogImage)}">`)
  return html.replace("</head>", () => tags.join("\n") + "\n</head>")
}
export function publicConfiguration(db: Database.Database) {
  const branding: Record<string, string> = {}
  for (const row of db.prepare("SELECT key,value FROM site_settings").all() as Array<{
    key: string
    value: string
  }>) {
    if ((brandTexts as readonly string[]).includes(row.key)) branding[row.key] = row.value
    if ((brandAssets as readonly string[]).includes(row.key) && uploadId.test(row.value))
      branding[row.key] = `/uploads/${row.value}`
  }
  const games = Object.fromEntries(
    (db.prepare("SELECT * FROM game_asset_overrides").all() as GameOverride[]).map(row => [
      row.game_id,
      {
        enabled: row.enabled === 1,
        order: row.sort_order,
        assets: Object.fromEntries(assetSlots.map(slot => [slot, assetUrl(row[slot])]))
      }
    ])
  )
  return { branding, games }
}
export function effectiveCatalog(db: Database.Database) {
  const { games } = publicConfiguration(db)
  return [...GAME_CATALOG]
    .filter(game => games[game.id]?.enabled !== false)
    .sort(
      (a, b) =>
        (games[a.id]?.order ?? GAME_CATALOG.indexOf(a)) - (games[b.id]?.order ?? GAME_CATALOG.indexOf(b))
    )
}
export async function validateImage(input: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  if (!input.length || input.length > MAX_UPLOAD) throw new Error("Image must be at most 5 MiB")
  const image = sharp(input, { limitInputPixels: 16_000_000, failOn: "warning", animated: false })
  const metadata = await image.metadata()
  if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages ?? 1) !== 1)
    throw new Error("Only static JPEG, PNG and WebP images are accepted")
  if (!metadata.width || !metadata.height || metadata.width > 4096 || metadata.height > 4096)
    throw new Error("Maximum dimensions: 4096 × 4096; 16 megapixels")
  // Decode every pixel, strip EXIF and other metadata, and produce a known-safe format.
  const { data, info } = await image.rotate().webp({ quality: 88 }).toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}
export function persistentUploads(directory: string): string {
  const resolved = path.resolve(directory)
  const dist = path.resolve("dist")
  const relative = path.relative(dist, resolved)
  if (!relative || (!relative.startsWith("..") && !path.isAbsolute(relative)))
    throw new Error("UPLOAD_DIR must be outside dist")
  return resolved
}
export async function saveUpload(
  db: Database.Database,
  directory: string,
  input: Buffer,
  admin: number
): Promise<string> {
  const result = await validateImage(input)
  const id = `${token()}.webp`
  await mkdir(directory, { recursive: true, mode: 0o700 })
  await writeFile(path.join(directory, id), result.data, { flag: "wx", mode: 0o600 })
  try {
    db.transaction(() => {
      db.prepare(
        "INSERT INTO admin_uploads(id,created_by,created_at,bytes,width,height) VALUES(?,?,?,?,?,?)"
      ).run(id, admin, Date.now(), result.data.length, result.width, result.height)
      audit(db, admin, "image_uploaded", id, {
        bytes: result.data.length,
        width: result.width,
        height: result.height
      })
    })()
  } catch (error) {
    await unlink(path.join(directory, id))
    throw error
  }
  return id
}
export function assertAsset(db: Database.Database, id: string | null): void {
  if (id === null) return
  if (
    !uploadId.test(id) ||
    !db.prepare("SELECT 1 FROM admin_uploads WHERE id=? AND retired_at IS NULL").get(id)
  )
    throw new Error("Unknown upload")
}
/** Mark unused files first; delete only on a later run after a seven-day grace period. */
export async function cleanupUploads(
  db: Database.Database,
  directory: string,
  dryRun = true
): Promise<string[]> {
  const candidates = db
    .transaction(() => {
      const referenced = new Set<string>()
      for (const row of db.prepare("SELECT * FROM game_asset_overrides").all() as GameOverride[])
        for (const slot of assetSlots) if (row[slot]) referenced.add(row[slot]!)
      for (const row of db.prepare("SELECT key,value FROM site_settings").all() as Array<{
        key: string
        value: string
      }>)
        if ((brandAssets as readonly string[]).includes(row.key)) referenced.add(row.value)
      const removed: string[] = []
      for (const row of db.prepare("SELECT id,retired_at FROM admin_uploads").all() as Array<{
        id: string
        retired_at: number | null
      }>) {
        if (referenced.has(row.id) || !uploadId.test(row.id)) continue
        if (row.retired_at === null) {
          if (!dryRun) db.prepare("UPDATE admin_uploads SET retired_at=? WHERE id=?").run(Date.now(), row.id)
          continue
        }
        if (row.retired_at > Date.now() - 7 * 86400_000) continue
        removed.push(row.id)
      }
      return removed
    })
    .immediate()
  if (!dryRun)
    for (const id of candidates) {
      await unlink(path.join(directory, id)).catch((err: NodeJS.ErrnoException) => {
        if (err.code !== "ENOENT") throw err
      })
      db.prepare("DELETE FROM admin_uploads WHERE id=? AND retired_at IS NOT NULL").run(id)
    }
  if (!dryRun) audit(db, null, "upload_cleanup", "uploads", { deleted: candidates.length })
  return candidates
}
