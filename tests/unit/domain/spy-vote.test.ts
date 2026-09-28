import { describe, it, expect, afterEach } from "vitest"
import type { Room } from "@shared/types.js"
import type { SpyVoteView } from "@shared/spy-vote.js"
import { MemoryStore } from "@server/store/memory-store.js"
import { cancelAllTimers } from "@server/domain/scheduler.js"
import { startGame, stopGame, submitAction, hostAdvance, type EngineDeps } from "@server/domain/engine.js"
import { resolveEngine } from "@server/games/engines.js"
import { SPY_RESULT, SPY_VOTING, spyVoteEngine } from "@server/games/spy-vote.js"

const WORD = { word: { en: "Bread", tr: "Ekmek", ar: "خبز", ku: "نان" }, categoryLabel: null }

function mkRoom(overrides: Partial<Room> = {}): Room {
  const now = Date.now()
  return {
    code: "SPY01", gameId: "spy-game", adminSecret: "s3cret", assigned: true,
    settings: { spyCount: 1, spyVoteSeconds: 60, spyShowVoters: false },
    players: [
      { id: "p1", name: "Ali", role: "normal", connected: true, character: "owl" },
      { id: "p2", name: "Mahmud", role: "spy", connected: true, character: "fox" },
      { id: "p3", name: "Morinji", role: "normal", connected: true, character: "wolf" }
    ],
    createdAt: now, updatedAt: now,
    hostPlayerId: "p1", isPublic: false, requireApproval: false, pending: [],
    phase: "idle", phaseSeq: 0, phaseEndsAt: null, round: 0,
    gameState: { spyWord: WORD, spyRecent: ["Bread"] }, scores: {},
    ...overrides
  }
}

async function harness(room: Room) {
  const store = new MemoryStore()
  await store.create(room)
  const views = new Map<string, SpyVoteView>()
  const deps: EngineDeps = {
    store, resolveEngine, rng: () => 0,
    emitPhase: (_code, playerId, payload) => { views.set(playerId, payload.view as SpyVoteView) },
    emitOver: () => {}
  }
  return { store, deps, views }
}

afterEach(() => cancelAllTimers())

describe("spy vote", () => {
  it("is the engine resolved for the Spy Game", () => {
    expect(resolveEngine("spy-game")).toBe(spyVoteEngine)
  })

  it("refuses to open before the roles are dealt", async () => {
    const { deps } = await harness(mkRoom({ assigned: false }))
    await expect(startGame(deps, "SPY01", "s3cret")).rejects.toThrow("INVALID_INPUT")
  })

  it("collects one vote each, closes early, and reveals the spy anonymously by default", async () => {
    const { deps, store, views } = await harness(mkRoom())
    const started = await startGame(deps, "SPY01", "s3cret")
    expect(started.phase).toBe(SPY_VOTING)
    const seq = started.phaseSeq

    await expect(submitAction(deps, "SPY01", "p1", seq, { type: "vote", target: "p1" })).rejects.toThrow("INVALID_INPUT")
    await submitAction(deps, "SPY01", "p1", seq, { type: "vote", target: "p2" })
    await expect(submitAction(deps, "SPY01", "p1", seq, { type: "vote", target: "p3" })).rejects.toThrow("INVALID_INPUT")
    await submitAction(deps, "SPY01", "p3", seq, { type: "vote", target: "p2" })
    await submitAction(deps, "SPY01", "p2", seq, { type: "vote", target: "p1" })

    await hostAdvance(deps, "SPY01", "s3cret", seq)
    const view = views.get("p3")!
    expect(view.kind).toBe("spy-result")
    if (view.kind !== "spy-result") return
    expect((await store.get("SPY01"))!.phase).toBe(SPY_RESULT)
    expect(view.topPlayerIds).toEqual(["p2"])
    expect(view.spyIds).toEqual(["p2"])
    expect(view.word?.tr).toBe("Ekmek")
    expect(view.results[0]).toEqual({ playerId: "p2", playerName: "Mahmud", voteCount: 2 })
  })

  it("names the voters only when the host asked for it", async () => {
    const { deps, views } = await harness(mkRoom({ settings: { spyVoteSeconds: 60, spyShowVoters: true } }))
    const { phaseSeq } = await startGame(deps, "SPY01", "s3cret")
    await submitAction(deps, "SPY01", "p1", phaseSeq, { type: "vote", target: "p2" })
    await hostAdvance(deps, "SPY01", "s3cret", phaseSeq)
    const view = views.get("p1")!
    if (view.kind !== "spy-result") throw new Error("expected result")
    expect(view.results.find(r => r.playerId === "p2")?.voters).toEqual(["Ali"])
  })

  it("keeps the dealt word and history when the vote ends", async () => {
    const { deps } = await harness(mkRoom())
    await startGame(deps, "SPY01", "s3cret")
    const stopped = await stopGame(deps, "SPY01", "s3cret")
    expect(stopped.gameState).toEqual({ spyWord: WORD, spyRecent: ["Bread"] })
  })
})
