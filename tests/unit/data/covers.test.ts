import { describe, it, expect } from "vitest"
import { worldCoverPath } from "@client/data/assets.js"
import { GAME_CATALOG } from "@server/games/catalog.js"

/**
 * The covers are resolved from the folder they sit in rather than from a path
 * built out of the theme name, so a world whose art was never added no longer
 * fails as a broken image on the home shelf — it fails here.
 */
describe("world covers", () => {
  it("has one for every world in the catalogue", () => {
    const missing = GAME_CATALOG.filter(game => worldCoverPath(game.theme) === "")
    expect(missing.map(g => g.theme)).toEqual([])
  })

  it("says so plainly for a world that does not exist", () => {
    expect(worldCoverPath("no-such-world")).toBe("")
  })
})
