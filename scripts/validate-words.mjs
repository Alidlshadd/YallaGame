import { validateWordCategories } from "../src/client/data/word-categories.ts"

const r = validateWordCategories()
console.log("ok:", r.ok)
console.log("totalWords:", r.totalWords)
console.log("perGame:", JSON.stringify(r.perGame))
console.log("categories:", r.perCategory.length)
console.log("errors:", r.errors.length)
if (r.errors.length) {
  for (const e of r.errors.slice(0, 12)) console.log("  -", e)
}
console.log()
for (const c of r.perCategory) {
  const tag = c.games.length === 2 ? "BOTH" : c.games[0] === "spy-game" ? "SPY  " : "WHO  "
  console.log("  " + String(c.count).padStart(3, " "), tag, c.key)
}
