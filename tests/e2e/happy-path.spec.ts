import { test, expect, type Page } from "@playwright/test"
import { createRoom, joinAs } from "./helpers.js"
import { io, type Socket } from "socket.io-client"
import type { AckResult, AdminRoomData, ClientToServerEvents, ServerToClientEvents } from "../../src/shared/events.js"

interface CapturedFrame { dir: "in" | "out"; payload: string }

function attachFrameCapture(page: Page): CapturedFrame[] {
  const frames: CapturedFrame[] = []
  page.on("websocket", ws => {
    ws.on("framereceived", f => frames.push({ dir: "in",  payload: typeof f.payload === "string" ? f.payload : f.payload.toString() }))
    ws.on("framesent",     f => frames.push({ dir: "out", payload: typeof f.payload === "string" ? f.payload : f.payload.toString() }))
  })
  return frames
}

test("vampire: unsaved count deals two vampires to four players, with a moderator host and private roles", async ({ browser }) => {
  test.setTimeout(60_000)
  const adminCtx = await browser.newContext()
  const adminPage = await adminCtx.newPage()
  const adminFrames = attachFrameCapture(adminPage)

  const code = await createRoom(adminPage)
  await expect(adminPage.locator("#playersCountSmall")).toHaveText("0")
  await expect(adminPage.locator("#setting-vampireCount")).not.toHaveAttribute("max")
  await adminPage.locator("#setting-vampireCount").fill("2")

  const players: Array<{ ctx: Awaited<ReturnType<typeof browser.newContext>>; page: Page; frames: CapturedFrame[]; name: string }> = []
  // Distinct characters: a room will not seat two people behind the same face.
  for (const [name, character] of [["Ada","ruby"],["Bea","pebble"],["Cem","gizmo"],["Dan","silver"]] as const) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    const frames = attachFrameCapture(page)
    await joinAs(page, code, name, character)
    players.push({ ctx, page, frames, name })
  }

  await adminPage.click("#assignRolesBtn")
  await expect(adminPage.locator("#rolesStatus")).toHaveText("✓")
  await expect(adminPage.locator("#playersCountSmall")).toHaveText("4")
  await expect(adminPage.locator(".player-row.is-host")).toHaveCount(0)
  await expect(adminPage.locator("#adminPlayersList .player-role", { hasText: "Night Vampire" })).toHaveCount(2)
  expect(adminFrames.some(f => f.dir === "in" && f.payload.includes('"player:role-assigned"'))).toBe(false)

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

  await adminPage.reload()
  await expect(adminPage.locator("#setting-vampireCount")).toHaveValue("2")
  await expect(adminPage.locator("#adminPlayersList .player-role", { hasText: "Night Vampire" })).toHaveCount(2)
  await expect(adminPage.locator(".player-row.is-host")).toHaveCount(0)

  for (const p of players) await p.ctx.close()
  await adminCtx.close()
})

test("eight online players can all be vampires without a fixed count limit", async ({ baseURL }) => {
  const clients: Socket<ServerToClientEvents, ClientToServerEvents>[] = []
  const connect = () => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(baseURL!, { forceNew: true })
    clients.push(socket)
    return socket
  }
  try {
    const host = connect()
    const created = await host.timeout(5000).emitWithAck("admin:create-room", {
      gameId: "vampire-village", hostName: "Moderator", hostCharacter: "ace", isPublic: false, requireApproval: false
    })
    if (!created.ok) throw new Error(created.error)
    const { code, adminSecret } = created.data
    const players = []
    for (let i = 0; i < 8; i++) {
      const player = connect()
      const joined = await player.timeout(5000).emitWithAck("player:join", { code, name: `Player ${i}` })
      if (!joined.ok) throw new Error(joined.error)
      players.push(player)
    }
    const reveals = players.map(player => new Promise<string>(resolve => player.once("player:role-assigned", payload => resolve(payload.role))))
    const assigned: AckResult<AdminRoomData> = await host.timeout(5000).emitWithAck("admin:assign-roles", {
      code, adminSecret, settings: { vampireCount: 8, doctor: false, detective: false }
    })
    if (!assigned.ok) throw new Error(assigned.error)
    expect(assigned.data.room.settings.vampireCount).toBe(8)
    expect(assigned.data.room.players).toHaveLength(8)
    expect(assigned.data.room.players.every(p => p.role === "vampire" && p.id !== created.data.hostPlayerId)).toBe(true)
    expect(await Promise.all(reveals)).toEqual(Array(8).fill("vampire"))
  } finally {
    clients.forEach(client => client.disconnect())
  }
})
