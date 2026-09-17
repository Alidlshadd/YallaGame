import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

export async function verifyServerBuild(root = path.resolve("dist/server")) {
  let count = 0
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const name = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(name)
        continue
      }
      if (!entry.name.endsWith(".js")) continue
      // Source maps and backup files are intentionally not candidates.
      const source = await readFile(name, "utf8")
      if (/(?:from\s*|import\s*\(?\s*|require\s*\(\s*)["']@shared\//.test(source))
        throw new Error(`Unresolved @shared import: ${name}`)
      count++
    }
  }
  await walk(root)
  if (!count) throw new Error("No server build found")
  return count
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Verified ${await verifyServerBuild()} server modules`)
}
