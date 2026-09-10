import { $, clear, el } from "./dom.js"
import { getLang, t } from "../services/i18n.js"
import { emit, lastPhase, socket } from "../services/socket.js"
import { buildAvatar } from "./avatar.js"
import { showToast } from "./toast.js"
import { vibrate } from "./haptics.js"
import { orchestrate, prefersReducedMotion, type MotionStep } from "./motion.js"
import type { PhaseEvent } from "@shared/events.js"
import type { MostLikelyToPlayer, MostLikelyToView } from "@shared/most-likely-to.js"
import type { BluffTriviaView } from "@shared/bluff-trivia.js"

/**
 * The screen a turn-based game is played on.
 *
 * It lives above whichever room view is mounted — the host stays on the admin
 * room, players stay on their own — and draws whatever the last `game:phase`
 * said, nothing more. Every decision about what is allowed was already made on
 * the server: this only stops asking for what it knows is refused.
 *
 * An idle room projects no view, so the stage hides itself and the room
 * underneath is back.
 */

export interface GameStageOptions {
  code: string
  myPlayerId: string
  /** Only the host holds one. It is what the phase-closing buttons need. */
  adminSecret?: string
}

/** Under this many seconds left, the clock starts asking for attention. */
const URGENT_SECONDS = 5

export function mountGameStage(opts: GameStageOptions): () => void {
  const stage = $<HTMLElement>("#gameStage")
  const isHost = typeof opts.adminSecret === "string" && opts.adminSecret.length > 0

  let phase: PhaseEvent | null = null
  let clockOffset = 0
  let sending = false
  let clockEl: HTMLElement | null = null
  /** Cancels the score-reveal stagger a previous render started, if any. */
  let cancelReveal: (() => void) | null = null

  /** The table shares one countdown, so it runs off the server's clock. */
  const serverNow = (): number => Date.now() + clockOffset

  function drawClock(): void {
    if (clockEl === null || phase === null) return
    if (phase.endsAt === null) {
      clockEl.hidden = true
      return
    }
    const left = Math.max(0, phase.endsAt - serverNow())
    // Rounding up alone showed "21" on a twenty-second phase, because the
    // measured offset leaves a few milliseconds over the nominal length.
    const seconds = Math.max(0, Math.ceil((left - 250) / 1000))
    clockEl.hidden = false
    clockEl.textContent = String(seconds)
    clockEl.classList.toggle("urgent", seconds <= URGENT_SECONDS)
  }

  async function castVote(target: string): Promise<void> {
    if (phase === null || sending) return
    sending = true
    // `seq` is the screen this tap came from; the server refuses one sent from
    // a round it has already closed.
    const r = await emit("game:action", {
      code: opts.code,
      seq: phase.seq,
      action: { type: "vote", target }
    })
    sending = false
    if (r.ok) vibrate("tap")
    else showToast(t("errorVoteRejected"))
  }

  async function submitLie(text: string): Promise<void> {
    if (phase === null || sending) return
    const trimmed = text.trim()
    if (trimmed === "") return
    sending = true
    const r = await emit("game:action", {
      code: opts.code,
      seq: phase.seq,
      action: { type: "lie", text: trimmed }
    })
    sending = false
    if (r.ok) vibrate("tap")
    else showToast(t("errorLieRejected"))
  }

  async function castGuess(optionId: string): Promise<void> {
    if (phase === null || sending) return
    sending = true
    const r = await emit("game:action", {
      code: opts.code,
      seq: phase.seq,
      action: { type: "guess", optionId }
    })
    sending = false
    if (r.ok) vibrate("tap")
    else showToast(t("errorGuessRejected"))
  }

  async function closePhase(): Promise<void> {
    if (phase === null || opts.adminSecret === undefined) return
    const r = await emit("game:advance", { code: opts.code, adminSecret: opts.adminSecret, seq: phase.seq })
    if (!r.ok) showToast(t("errorGeneric"))
  }

  async function endGame(): Promise<void> {
    if (opts.adminSecret === undefined) return
    const r = await emit("game:end", { code: opts.code, adminSecret: opts.adminSecret })
    if (!r.ok) showToast(t("errorGeneric"))
  }

  function avatarOf(person: MostLikelyToPlayer | undefined, name: string, size: number): HTMLElement {
    return buildAvatar(person?.character ?? "", name, getLang(), {
      size,
      lazy: false,
      accessory: person?.accessory ?? ""
    })
  }

  function buildHead(roundNumber: number): HTMLElement {
    clockEl = el("span", { class: "mlt-clock", "aria-live": "off" })
    clockEl.hidden = true
    const head = el("header", { class: "mlt-head" }, [
      el("span", { class: "mlt-round" }, [`${t("mltRound")} ${roundNumber}`]),
      clockEl
    ])

    // The stage covers the room it is drawn over, so the way out of a running
    // game has to be on the stage itself.
    if (isHost) {
      const quit = el("button", { class: "btn btn-ghost mlt-end", type: "button" }, [t("mltEndGame")])
      quit.addEventListener("click", () => void endGame())
      head.appendChild(quit)
    }
    return head
  }

  function buildVoting(view: Extract<MostLikelyToView, { kind: "voting" }>): HTMLElement[] {
    const locked = view.myVote !== null
    const grid = el("div", { class: "mlt-targets" })

    for (const person of view.roster) {
      // Nobody votes for themselves, so the button is not there to be tapped.
      if (person.id === opts.myPlayerId) continue
      const chosen = view.myVote === person.id
      const button = el("button", {
        class: `mlt-target${chosen ? " chosen" : ""}${person.connected ? "" : " off"}`,
        type: "button",
        "aria-pressed": chosen ? "true" : "false"
      }, [
        avatarOf(person, person.name, 52),
        el("span", { class: "mlt-target-name" }, [person.name])
      ]) as HTMLButtonElement
      button.disabled = locked
      button.addEventListener("click", () => void castVote(person.id))
      grid.appendChild(button)
    }

    return [
      grid,
      el("p", { class: "mlt-hint" }, [locked ? t("mltVoteLocked") : t("mltVoteHint")]),
      el("p", { class: "mlt-counter" }, [`${view.votedCount} / ${view.totalPlayers} ${t("mltVoted")}`])
    ]
  }

  function buildReveal(view: Extract<MostLikelyToView, { kind: "result" | "over" } >): HTMLElement[] {
    const byId = new Map(view.roster.map(p => [p.id, p]))
    const bars = el("div", { class: "mlt-bars" })

    for (const row of view.results) {
      const isWinner = view.winnerPlayerIds.includes(row.playerId)
      const fill = el("span", { class: "mlt-bar-fill" })
      // Percentage of the votes actually cast, so an empty round draws nothing.
      fill.style.width = `${row.percentage}%`
      const bar = el("div", { class: `mlt-bar${isWinner ? " winner" : ""}` }, [
        avatarOf(byId.get(row.playerId), row.playerName, 36),
        el("span", { class: "mlt-bar-name" }, [row.playerName]),
        el("span", { class: "mlt-bar-track" }, [fill]),
        el("span", { class: "mlt-bar-count" }, [String(row.voteCount)])
      ])
      // Only a room whose host asked for names gets them; without the setting
      // the field is not in the projection at all.
      if (row.voters !== undefined && row.voters.length > 0) {
        bar.appendChild(el("span", { class: "mlt-bar-voters" }, [
          `${t("mltVotedBy")} ${row.voters.join(", ")}`
        ]))
      }
      bars.appendChild(bar)
    }

    // The verdict is a full line rather than a badge on the row: a badge has
    // to share the row with a name, and a long name pushed it off the phone.
    const winnerNames = view.results
      .filter(r => view.winnerPlayerIds.includes(r.playerId))
      .map(r => r.playerName)
    const verdict =
      view.totalVotes === 0 ? t("mltNoVotes")
      : view.isTie          ? `${t("mltTie")} ${winnerNames.join(" · ")}`
      : `${t("mltMostLikely")}: ${winnerNames[0] ?? ""}`

    const out: HTMLElement[] = [
      el("p", { class: "mlt-eyebrow" }, [view.kind === "over" ? t("mltGameOver") : t("mltResults")]),
      bars,
      el("p", { class: "mlt-verdict" }, [verdict])
    ]

    if (isHost) {
      const label = view.kind === "over" ? t("mltBackToLobby") : t("mltNextRound")
      const button = el("button", { class: "btn btn-primary mlt-advance", type: "button" }, [label])
      button.addEventListener("click", () => void (view.kind === "over" ? endGame() : closePhase()))
      out.push(button)
    } else {
      out.push(el("p", { class: "mlt-counter" }, [t("mltWaitingHost")]))
    }
    return out
  }

  function buildBluffSubmit(view: Extract<BluffTriviaView, { kind: "bluff-submit" }>): HTMLElement[] {
    const locked = view.mySubmission !== null

    const input = el("textarea", {
      class: "bluff-lie-input",
      maxlength: 80,
      rows: 2,
      placeholder: t("bluffLiePlaceholder"),
      "aria-label": t("bluffLiePlaceholder")
    }) as HTMLTextAreaElement
    input.value = view.mySubmission ?? ""
    input.disabled = locked

    const counter = el("span", { class: "bluff-lie-counter" }, [`${input.value.length}/80`])
    input.addEventListener("input", () => {
      counter.textContent = `${input.value.length}/80`
      counter.classList.toggle("limit", input.value.length >= 80)
    })

    const submitBtn = el("button", { class: "btn btn-primary bluff-submit", type: "button" }, [t("bluffSubmit")])
    submitBtn.addEventListener("click", () => void submitLie(input.value))
    if (locked) (submitBtn as HTMLButtonElement).disabled = true

    return [
      el("div", { class: "bluff-lie-row" }, [input, counter, submitBtn]),
      el("p", { class: "mlt-hint" }, [locked ? t("bluffLieLocked") : t("bluffLieHint")]),
      el("p", { class: "mlt-counter" }, [`${view.submittedCount} / ${view.totalPlayers} ${t("bluffSubmitted")}`])
    ]
  }

  function buildBluffGuessing(view: Extract<BluffTriviaView, { kind: "bluff-guessing" }>): HTMLElement[] {
    const lang = getLang()
    const locked = view.myGuess !== null
    const list = el("div", { class: "bluff-options" })

    view.options.forEach((option, index) => {
      const chosen = view.myGuess === option.optionId
      const children: Array<Node | string> = [el("span", { class: "bluff-option-text" }, [option.text[lang]])]
      if (option.isOwn) children.push(el("span", { class: "bluff-reveal-badge" }, [t("bluffOwnOption")]))

      const button = el("button", {
        class: `bluff-option${chosen ? " chosen" : ""}`,
        type: "button",
        style: `--i: ${index}`,
        "aria-pressed": chosen ? "true" : "false"
      }, children) as HTMLButtonElement
      // The server is the one that actually refuses an own lie or a second
      // guess — this only keeps a thumb from tapping what it already knows
      // will be rejected.
      button.disabled = locked || option.isOwn
      button.addEventListener("click", () => void castGuess(option.optionId))
      list.appendChild(button)
    })

    return [
      list,
      el("p", { class: "mlt-hint" }, [locked ? t("bluffGuessLocked") : t("bluffGuessHint")]),
      el("p", { class: "mlt-counter" }, [`${view.guessedCount} / ${view.totalPlayers} ${t("bluffGuessed")}`])
    ]
  }

  function buildBluffReveal(view: Extract<BluffTriviaView, { kind: "bluff-reveal" | "bluff-over" }>): HTMLElement[] {
    const lang = getLang()
    const nameOf = (id: string): string => view.roster.find(p => p.id === id)?.name ?? ""

    const list = el("div", { class: "bluff-reveal-list" })
    const rows: HTMLElement[] = []

    for (const option of view.options) {
      const row = el("div", { class: `bluff-reveal-row ${option.type}` })
      row.append(el("p", { class: "bluff-reveal-row-text" }, [option.text[lang]]))

      if (option.optionId === view.correctOptionId) {
        row.append(el("p", { class: "bluff-reveal-meta" }, [t("bluffCorrectAnswer")]))
      } else if (option.owners.length > 0) {
        row.append(el("p", { class: "bluff-reveal-meta" }, [`${t("bluffWrittenBy")} ${option.owners.map(nameOf).join(", ")}`]))
      }

      const pickedNames = option.selectedBy.map(nameOf)
      row.append(el("p", { class: "bluff-reveal-meta" }, [
        pickedNames.length === 0 ? t("bluffNobodyFooled") : `${t("bluffPickedBy")} ${pickedNames.join(", ")}`
      ]))

      list.appendChild(row)
      rows.push(row)
    }

    // The server already sent the whole reveal in one payload; this stagger
    // is purely a local animation, so a refresh mid-sequence just shows it
    // settled rather than stuck partway through.
    const steps: MotionStep[] = rows.map((row, index) => ({
      at: prefersReducedMotion() ? 0 : index * 900,
      do: () => row.classList.add("shown")
    }))
    cancelReveal = orchestrate(steps)

    // Every seat gets a row, not just the ones `totalScores` has an entry
    // for — a player who scored nothing this game is still in the room.
    const scoreboard = el("div", { class: "bluff-scoreboard" })
    const ranked = [...view.roster].sort((a, b) => (view.totalScores[b.id] ?? 0) - (view.totalScores[a.id] ?? 0))
    for (const player of ranked) {
      const nameChildren: Array<Node | string> = [player.name]
      if (view.truthGuesserPlayerIds.includes(player.id)) {
        nameChildren.push(el("span", { class: "bluff-reveal-badge" }, [t("bluffTruthBonus")]))
      }
      scoreboard.appendChild(el("div", { class: `bluff-score-row${player.id === opts.myPlayerId ? " me" : ""}` }, [
        el("span", { class: "bluff-score-name" }, nameChildren),
        el("span", { class: "bluff-score-points" }, [`${view.totalScores[player.id] ?? 0} ${t("bluffPts")}`])
      ]))
    }

    const out: HTMLElement[] = [
      el("p", { class: "mlt-eyebrow" }, [view.kind === "bluff-over" ? t("bluffGameOver") : t("bluffReveal")]),
      list,
      el("p", { class: "mlt-eyebrow" }, [t("bluffScoreboard")]),
      scoreboard
    ]

    if (isHost) {
      const label = view.kind === "bluff-over" ? t("bluffBackToLobby") : t("bluffNextRound")
      const button = el("button", { class: "btn btn-primary mlt-advance", type: "button" }, [label])
      button.addEventListener("click", () => void (view.kind === "bluff-over" ? endGame() : closePhase()))
      out.push(button)
    } else {
      out.push(el("p", { class: "mlt-counter" }, [t("bluffWaitingHost")]))
    }
    return out
  }

  function render(): void {
    clear(stage)
    clockEl = null
    cancelReveal?.()
    cancelReveal = null

    const view = phase?.view as (MostLikelyToView | BluffTriviaView) | null | undefined
    if (phase === null || view === null || view === undefined) {
      stage.hidden = true
      document.body.classList.remove("stage-open")
      return
    }

    stage.hidden = false
    document.body.classList.add("stage-open")

    const lang = getLang()
    const panel = el("div", { class: "mlt" })
    if (view.kind === "question" || view.kind === "voting") {
      panel.setAttribute("data-category", view.category)
    }

    panel.append(buildHead(view.roundNumber))
    panel.append(el("p", { class: "mlt-question" }, [view.question[lang]]))

    if (view.kind === "question") panel.append(el("p", { class: "mlt-hint" }, [t("mltGetReady")]))
    else if (view.kind === "voting") panel.append(...buildVoting(view))
    else if (view.kind === "result" || view.kind === "over") panel.append(...buildReveal(view))
    else if (view.kind === "bluff-question") panel.append(el("p", { class: "mlt-hint" }, [t("bluffGetReady")]))
    else if (view.kind === "bluff-submit") panel.append(...buildBluffSubmit(view))
    else if (view.kind === "bluff-guessing") panel.append(...buildBluffGuessing(view))
    else if (view.kind === "bluff-reveal" || view.kind === "bluff-over") panel.append(...buildBluffReveal(view))

    stage.appendChild(panel)
    drawClock()
  }

  const onPhase = (payload: PhaseEvent): void => {
    // Another room's round, held by a socket this phone shares. Not ours.
    if (payload.code !== opts.code) return
    // A packet that overtook a newer one must not drag the room backwards.
    if (phase !== null && payload.seq < phase.seq) return
    const moved = phase === null || payload.seq !== phase.seq
    phase = payload
    render()
    if (moved && payload.view !== null) vibrate("tap")
  }

  socket.on("game:phase", onPhase)

  // The phase that arrived while this screen was still being fetched — a
  // reload, or a reconnect into a game that was already running.
  phase = lastPhase(opts.code)

  const ticker = window.setInterval(drawClock, 250)

  void (async () => {
    const sent = Date.now()
    const r = await emit("time:sync", {})
    if (!r.ok) return
    // Half the round trip is the best guess at how stale the answer already is.
    clockOffset = (r.data as { now: number }).now - (sent + (Date.now() - sent) / 2)
    drawClock()
  })()

  render()

  return () => {
    socket.off("game:phase", onPhase)
    window.clearInterval(ticker)
    cancelReveal?.()
    clear(stage)
    stage.hidden = true
    document.body.classList.remove("stage-open")
  }
}
