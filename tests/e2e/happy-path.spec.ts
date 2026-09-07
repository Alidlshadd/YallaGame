import { test, expect, type Page } from "@playwright/test"
import { createRoom, joinAs } from "./helpers.js"

interface CapturedFrame { dir: "in" | "out"; payload: string }

function attachFrameCapture(page: Page): CapturedFrame[] {
  const frames: CapturedFrame[] = []
  page.on("websocket", ws => {
    ws.on("framereceived", f => frames.push({ dir: "in",  payload: typeof f.payload === "string" ? f.payload : f.payload.toString() }))
    ws.on("framesent",     f => frames.push({ dir: "out", payload: typeof f.payload === "string" ? f.payload : f.payload.toString() }))
  })
  return frames
}

test("happy path: 4 players, role visibility, wire-level privacy", async ({ browser }) => {
  const adminCtx = await browser.newContext()
  const adminPage = await adminCtx.newPage()
  attachFrameCapture(adminPage)

  const code = await createRoom(adminPage)

  const players: Array<{ ctx: Awaited<ReturnType<typeof browser.newContext>>; page: Page; frames: CapturedFrame[]; name: string }> = []
  // Distinct characters: a room will not seat two people behind the same face.
  for (const [name, character] of [["Ada","fox"],["Bea","raven"],["Cem","wolf"],["Dan","cat"]] as const) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    const frames = attachFrameCapture(page)
    await joinAs(page, code, name, character)
    players.push({ ctx, page, frames, name })
  }

  await adminPage.click("#assignRolesBtn")
  await expect(adminPage.locator("#rolesStatus")).toHaveText("✓")

  for (const p of players) {
    await expect(p.page.locator("#playerRoleCard h3")).toBeVisible()
  }

  for (const p of players) {
    const others = players.filter(o => o !== p).map(o => o.name)
    for (const frame of p.frames.filter(f => f.dir === "in")) {
      const payload = frame.payload
      if (!payload.includes("role")) continue
      for (const other of others) {
        if (payload.includes(`"name":"${other}"`)) {
          const match = payload.match(new RegExp(`"name":"${other}"[^}]*"role":"([^"]*)"`))
          if (match) expect(match[1]).toBe("null")
        }
      }
    }
  }

  for (const p of players) await p.ctx.close()
  await adminCtx.close()
})
