import { realpathSync } from "node:fs"
import path from "node:path"

/** Resolve existing parents too, so a symlink/junction cannot bypass the boundary. */
function canonical(candidate: string): string {
  try { return realpathSync(candidate) }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    const parent = path.dirname(candidate)
    if (parent === candidate) throw error
    return path.join(canonical(parent), path.basename(candidate))
  }
}

export function privateStoragePath(candidate: string, label: string, root = process.cwd()): string {
  const resolved = path.resolve(candidate)
  const physical = canonical(resolved)
  for (const directory of ["public", "dist"]) {
    const boundary = path.resolve(root, directory)
    for (const [base, target] of [[boundary, resolved], [canonical(boundary), physical]]) {
      const relative = path.relative(base!, target!)
      if (!relative || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) {
        throw new Error(`${label} must be outside dist and public`)
      }
    }
  }
  return resolved
}
