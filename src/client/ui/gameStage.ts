import { $, clear, el } from "./dom.js"
import { getLang, t } from "../services/i18n.js"
import { emit, lastPhase, socket } from "../services/socket.js"
import { buildAvatar } from "./avatar.js"
import { showToast } from "./toast.js"
import { vibrate } from "./haptics.js"
import { orchestrate, prefersReducedMotion, type MotionStep } from "./motion.js"
import type { PhaseEvent } from "@shared/events.js"
import type { MostLikelyToView } from "@shared/most-likely-to.js"
import type { BluffTriviaView } from "@shared/bluff-trivia.js"
import type { PoliticianPlayer, PoliticianView } from "@shared/secret-politician.js"

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
type StageView = MostLikelyToView | BluffTriviaView | PoliticianView

// Progress from another player should not replace buttons, restart reveals,
// or destroy the textarea under somebody's fingers.
function contentKey(view: unknown): string | undefined {
  if (view === null || typeof view !== "object") return JSON.stringify(view)
  const content = { ...view } as Record<string, unknown>
  for (const key of ["votedCount", "submittedCount", "guessedCount", "totalPlayers", "totalVoters"]) delete content[key]
  return JSON.stringify(content)
}

function progressText(view: StageView | null | undefined): string | null {
  if (view?.kind === "voting") return `${view.votedCount} / ${view.totalPlayers} ${t("mltVoted")}`
  if (view?.kind === "bluff-submit") return `${view.submittedCount} / ${view.totalPlayers} ${t("bluffSubmitted")}`
  if (view?.kind === "bluff-guessing") return `${view.guessedCount} / ${view.totalPlayers} ${t("bluffGuessed")}`
  if (view?.kind === "politician-vote") return `${view.votedCount} / ${view.totalVoters} ${t("politicianVoted")}`
  return null
}

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
    if (clockEl.textContent !== String(seconds)) clockEl.textContent = String(seconds)
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

  /** Every Secret Politician move shares the same shape of round-trip; only the action body and the toast differ. */
  async function politicianAct(
    action: { type: string } & Record<string, string | number | boolean | undefined>,
    errorKey: Parameters<typeof t>[0]
  ): Promise<void> {
    if (phase === null || sending) return
    sending = true
    const r = await emit("game:action", { code: opts.code, seq: phase.seq, action })
    sending = false
    if (r.ok) vibrate("tap")
    else showToast(t(errorKey))
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

  function avatarOf(person: { character: string; accessory: string } | undefined, name: string, size: number): HTMLElement {
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

  function politicianRoleLabel(role: string | undefined): string {
    if (role === "leader") return t("politicianRoleLeader")
    if (role === "traitor") return t("politicianRoleTraitor")
    return t("politicianRoleInnocent")
  }

  function politicianPowerLabel(power: string): string {
    if (power === "investigate") return t("politicianPowerInvestigate")
    if (power === "specialElection") return t("politicianPowerSpecialElection")
    if (power === "peek") return t("politicianPowerPeek")
    return t("politicianPowerExecute")
  }

  /** The board, and — only during a vote — the three-strike election tracker beside it. */
  function buildPoliticianBoard(board: { good: number; bad: number }, tracker?: number): HTMLElement {
    const goodPips = el("div", { class: "politician-track" },
      Array.from({ length: 5 }, (_, i) => el("span", { class: `politician-pip good${i < board.good ? " filled" : ""}` })))
    const badPips = el("div", { class: "politician-track" },
      Array.from({ length: 6 }, (_, i) => el("span", { class: `politician-pip bad${i < board.bad ? " filled" : ""}` })))
    const row = el("div", { class: "politician-board" }, [goodPips, badPips])
    if (tracker !== undefined) {
      row.appendChild(el("div", { class: "politician-tracker" },
        Array.from({ length: 3 }, (_, i) => el("span", { class: `politician-pip${i < tracker ? " filled" : ""}` }))))
    }
    return row
  }

  /** "Tap the one person you mean" — the same interaction Most Likely To already built, reused as-is. */
  function buildPoliticianTargets(
    ids: string[], roster: PoliticianPlayer[], onPick: (id: string) => void,
    locked = false, chosenId: string | null = null
  ): HTMLElement {
    const grid = el("div", { class: "mlt-targets" })
    for (const id of ids) {
      const person = roster.find(p => p.id === id)
      const chosen = id === chosenId
      const button = el("button", { class: `mlt-target${chosen ? " chosen" : ""}`, type: "button" }, [
        avatarOf(person, person?.name ?? "", 52),
        el("span", { class: "mlt-target-name" }, [person?.name ?? ""])
      ]) as HTMLButtonElement
      // A phase's broadcast lands a little before it actually turns over —
      // locking on the acted-upon state (not just the button click) keeps a
      // repeat broadcast from leaving a second, still-live "pick again" screen.
      button.disabled = locked
      button.addEventListener("click", () => onPick(id))
      grid.appendChild(button)
    }
    return grid
  }

  function buildPoliticianRoleReveal(view: Extract<PoliticianView, { kind: "politician-role-reveal" }>): HTMLElement[] {
    const badge = el("div", { class: "politician-role-badge" }, [
      el("p", { class: "politician-role-name" }, [politicianRoleLabel(view.myRole)]),
      el("p", { class: "politician-role-side" }, [
        view.myRole === "innocent" ? t("politicianSideInnocents") : t("politicianSideTraitors")
      ])
    ])
    const out: HTMLElement[] = [badge]

    if (view.allies.length > 0) {
      out.push(
        el("p", { class: "mlt-eyebrow" }, [t("politicianAlliesTitle")]),
        el("div", { class: "politician-allies" }, view.allies.map(a => el("div", { class: "politician-ally-row" }, [
          el("span", {}, [a.name]),
          ...(a.isLeader ? [el("span", { class: "badge" }, [t("politicianRoleLeader")])] : [])
        ])))
      )
    } else if (view.myRole !== "innocent") {
      out.push(el("p", { class: "mlt-hint" }, [t("politicianNoAllies")]))
    }

    if (isHost) {
      const button = el("button", { class: "btn btn-primary mlt-advance", type: "button" }, [t("politicianContinue")])
      button.addEventListener("click", () => void closePhase())
      out.push(button)
    } else {
      out.push(el("p", { class: "mlt-counter" }, [t("bluffWaitingHost")]))
    }
    return out
  }

  function buildPoliticianNomination(view: Extract<PoliticianView, { kind: "politician-nomination" }>): HTMLElement[] {
    const out: HTMLElement[] = [buildPoliticianBoard(view.board, view.tracker)]

    if (view.lastVote !== null) {
      out.push(el("p", { class: "politician-summary" }, [
        view.lastVote.approved ? t("politicianLastVoteApproved") : t("politicianLastVoteRejected")
      ]))
    }
    if (view.lastExecutive !== null) {
      const targetName = view.lastExecutive.targetId !== null
        ? view.roster.find(p => p.id === view.lastExecutive!.targetId)?.name ?? ""
        : ""
      const label = politicianPowerLabel(view.lastExecutive.power)
      out.push(el("p", { class: "politician-summary" }, [targetName ? `${label}: ${targetName}` : label]))
    }

    if (opts.myPlayerId === view.presidentId) {
      const locked = view.chancellorNomineeId !== null
      out.push(
        el("p", { class: "mlt-hint" }, [t("politicianNominateHint")]),
        buildPoliticianTargets(
          view.eligibleIds, view.roster,
          id => void politicianAct({ type: "nominate", targetId: id }, "errorNominateRejected"),
          locked, view.chancellorNomineeId
        )
      )
    } else {
      out.push(el("p", { class: "mlt-hint" }, [t("politicianWaitingNomination")]))
    }
    return out
  }

  function buildPoliticianVote(view: Extract<PoliticianView, { kind: "politician-vote" }>): HTMLElement[] {
    const nomineeName = view.roster.find(p => p.id === view.chancellorNomineeId)?.name ?? ""
    const locked = view.myVote !== null

    const yesBtn = el("button", { class: "bluff-option", type: "button" }, [t("politicianVoteYes")]) as HTMLButtonElement
    const noBtn = el("button", { class: "bluff-option", type: "button" }, [t("politicianVoteNo")]) as HTMLButtonElement
    yesBtn.disabled = locked
    noBtn.disabled = locked
    if (view.myVote === true) yesBtn.classList.add("chosen")
    if (view.myVote === false) noBtn.classList.add("chosen")
    yesBtn.addEventListener("click", () => void politicianAct({ type: "vote", approve: true }, "errorVoteRejected"))
    noBtn.addEventListener("click", () => void politicianAct({ type: "vote", approve: false }, "errorVoteRejected"))

    return [
      buildPoliticianBoard(view.board),
      el("p", { class: "politician-summary" }, [`${t("politicianNomineeLabel")}: ${nomineeName}`]),
      el("p", { class: "mlt-hint" }, [locked ? t("politicianVoteLocked") : t("politicianVoteHint")]),
      el("div", { class: "bluff-options" }, [yesBtn, noBtn]),
      el("p", { class: "mlt-counter" }, [`${view.votedCount} / ${view.totalVoters} ${t("politicianVoted")}`])
    ]
  }

  function buildPoliticianLegislative(view: Extract<PoliticianView, { kind: "politician-legislative" }>): HTMLElement[] {
    const out: HTMLElement[] = [buildPoliticianBoard(view.board)]

    if (view.hand === null) {
      out.push(el("p", { class: "mlt-hint" }, [
        t(view.actingRole === "president" ? "politicianWaitingPresident" : "politicianWaitingChancellor")
      ]))
      if (view.vetoOffered) out.push(el("p", { class: "politician-summary" }, [t("politicianVetoOffered")]))
      return out
    }

    // A successful discard/enact shrinks the hand but the phase itself does
    // not turn over for another ~1.2s — without this, the actor's own next
    // broadcast would show the same "pick one" screen with fresh indices,
    // still live to tap again.
    const locked = view.hand.length !== (view.actingRole === "president" ? 3 : 2)
    const cardLabel = (card: string): string => card === "good" ? t("politicianCardGood") : t("politicianCardBad")
    const list = el("div", { class: "bluff-options" })
    view.hand.forEach((card, index) => {
      const button = el("button", { class: `bluff-option ${card}`, type: "button" }, [cardLabel(card)]) as HTMLButtonElement
      button.disabled = locked
      button.addEventListener("click", () => void politicianAct(
        { type: view.actingRole === "president" ? "discard" : "enact", index },
        "errorHandRejected"
      ))
      list.appendChild(button)
    })

    out.push(
      el("p", { class: "mlt-hint" }, [t(view.actingRole === "president" ? "politicianHandDiscardHint" : "politicianHandEnactHint")]),
      list
    )

    if (view.actingRole === "chancellor" && view.vetoAvailable) {
      const vetoBtn = el("button", { class: "btn btn-ghost", type: "button" }, [t("politicianVetoOffer")])
      vetoBtn.addEventListener("click", () => void politicianAct({ type: "veto" }, "errorVetoRejected"))
      out.push(vetoBtn)
    }
    return out
  }

  function buildPoliticianVetoConfirm(view: Extract<PoliticianView, { kind: "politician-veto-confirm" }>): HTMLElement[] {
    const out: HTMLElement[] = [buildPoliticianBoard(view.board), el("p", { class: "politician-summary" }, [t("politicianVetoOffered")])]

    if (opts.myPlayerId === view.presidentId) {
      const locked = view.myDecision !== null
      const approveBtn = el("button", { class: "bluff-option", type: "button" }, [t("politicianVetoApprove")]) as HTMLButtonElement
      const rejectBtn = el("button", { class: "bluff-option", type: "button" }, [t("politicianVetoReject")]) as HTMLButtonElement
      approveBtn.disabled = locked
      rejectBtn.disabled = locked
      if (view.myDecision === true) approveBtn.classList.add("chosen")
      if (view.myDecision === false) rejectBtn.classList.add("chosen")
      approveBtn.addEventListener("click", () => void politicianAct({ type: "vetoDecision", approve: true }, "errorVetoRejected"))
      rejectBtn.addEventListener("click", () => void politicianAct({ type: "vetoDecision", approve: false }, "errorVetoRejected"))
      out.push(el("div", { class: "bluff-options" }, [approveBtn, rejectBtn]))
    } else {
      out.push(el("p", { class: "mlt-hint" }, [t("politicianVetoWaitingPresident")]))
    }
    return out
  }

  function buildPoliticianBoardUpdate(view: Extract<PoliticianView, { kind: "politician-board-update" }>): HTMLElement[] {
    return [
      buildPoliticianBoard(view.board),
      el("p", { class: "mlt-eyebrow" }, [view.enacted === "good" ? t("politicianBoardUpdateGood") : t("politicianBoardUpdateBad")])
    ]
  }

  function buildPoliticianExecutiveAction(view: Extract<PoliticianView, { kind: "politician-executive-action" }>): HTMLElement[] {
    const out: HTMLElement[] = [buildPoliticianBoard(view.board), el("p", { class: "mlt-eyebrow" }, [politicianPowerLabel(view.power)])]

    if (opts.myPlayerId !== view.presidentId) {
      out.push(el("p", { class: "mlt-hint" }, [t("politicianWaitingPower")]))
      return out
    }

    if (view.power === "peek") {
      const cardLabel = (card: string): string => card === "good" ? t("politicianCardGood") : t("politicianCardBad")
      const list = el("div", { class: "bluff-options" },
        (view.peekCards ?? []).map(card => el("div", { class: `bluff-option ${card}` }, [cardLabel(card)])))
      const ackBtn = el("button", { class: "btn btn-primary mlt-advance", type: "button" }, [t("politicianPeekAck")]) as HTMLButtonElement
      ackBtn.disabled = view.resolved
      ackBtn.addEventListener("click", () => void politicianAct({ type: "peekAck" }, "errorPowerRejected"))
      out.push(list, ackBtn)
      return out
    }

    if (view.power === "investigate" && view.investigationResult !== null) {
      const targetName = view.roster.find(p => p.id === view.investigationResult!.targetId)?.name ?? ""
      const resultLabel = view.investigationResult.side === "innocent"
        ? t("politicianInvestigationResultInnocent") : t("politicianInvestigationResultTraitor")
      out.push(el("p", { class: "politician-summary" }, [`${targetName}: ${resultLabel}`]))
      return out
    }

    const hintKey = view.power === "investigate" ? "politicianPowerHintInvestigate"
      : view.power === "specialElection" ? "politicianPowerHintSpecialElection"
      : "politicianPowerHintExecute"
    out.push(
      el("p", { class: "mlt-hint" }, [t(hintKey)]),
      buildPoliticianTargets(
        view.eligibleIds, view.roster,
        id => void politicianAct({ type: view.power, targetId: id }, "errorPowerRejected"),
        view.resolved
      )
    )
    return out
  }

  function buildPoliticianOver(view: Extract<PoliticianView, { kind: "politician-over" }>): HTMLElement[] {
    const list = el("div", { class: "politician-roles-list" }, view.roster.map(p => el("div", { class: "politician-role-row" }, [
      el("span", {}, [p.name]),
      el("span", { class: "politician-role-tag" }, [politicianRoleLabel(view.roles[p.id])])
    ])))

    const out: HTMLElement[] = [
      el("p", { class: "mlt-eyebrow" }, [t("politicianGameOver")]),
      el("p", { class: "mlt-verdict" }, [view.winner === "innocents" ? t("politicianWinInnocents") : t("politicianWinTraitors")]),
      el("p", { class: "mlt-eyebrow" }, [t("politicianRolesReveal")]),
      list
    ]

    if (isHost) {
      const button = el("button", { class: "btn btn-primary mlt-advance", type: "button" }, [t("politicianBackToLobby")])
      button.addEventListener("click", () => void endGame())
      out.push(button)
    }
    return out
  }

  function render(): void {
    clear(stage)
    clockEl = null
    cancelReveal?.()
    cancelReveal = null

    const view = phase?.view as (MostLikelyToView | BluffTriviaView | PoliticianView) | null | undefined
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
    // Only Most Likely To and Bluff Trivia carry a question to show up here —
    // Secret Politician's screens build their own heading out of the board.
    if (
      view.kind === "question" || view.kind === "voting" || view.kind === "result" || view.kind === "over" ||
      view.kind === "bluff-question" || view.kind === "bluff-submit" || view.kind === "bluff-guessing" ||
      view.kind === "bluff-reveal" || view.kind === "bluff-over"
    ) {
      panel.append(el("p", { class: "mlt-question" }, [view.question[lang]]))
    }

    if (view.kind === "question") panel.append(el("p", { class: "mlt-hint" }, [t("mltGetReady")]))
    else if (view.kind === "voting") panel.append(...buildVoting(view))
    else if (view.kind === "result" || view.kind === "over") panel.append(...buildReveal(view))
    else if (view.kind === "bluff-question") panel.append(el("p", { class: "mlt-hint" }, [t("bluffGetReady")]))
    else if (view.kind === "bluff-submit") panel.append(...buildBluffSubmit(view))
    else if (view.kind === "bluff-guessing") panel.append(...buildBluffGuessing(view))
    else if (view.kind === "bluff-reveal" || view.kind === "bluff-over") panel.append(...buildBluffReveal(view))
    else if (view.kind === "politician-role-reveal") panel.append(...buildPoliticianRoleReveal(view))
    else if (view.kind === "politician-nomination") panel.append(...buildPoliticianNomination(view))
    else if (view.kind === "politician-vote") panel.append(...buildPoliticianVote(view))
    else if (view.kind === "politician-legislative") panel.append(...buildPoliticianLegislative(view))
    else if (view.kind === "politician-veto-confirm") panel.append(...buildPoliticianVetoConfirm(view))
    else if (view.kind === "politician-board-update") panel.append(...buildPoliticianBoardUpdate(view))
    else if (view.kind === "politician-executive-action") panel.append(...buildPoliticianExecutiveAction(view))
    else if (view.kind === "politician-over") panel.append(...buildPoliticianOver(view))

    stage.appendChild(panel)
    drawClock()
  }

  const onPhase = (payload: PhaseEvent): void => {
    // Another room's round, held by a socket this phone shares. Not ours.
    if (payload.code !== opts.code) return
    // A packet that overtook a newer one must not drag the room backwards.
    if (phase !== null && payload.seq < phase.seq) return
    const moved = phase === null || payload.seq !== phase.seq
    const unchanged = !moved && contentKey(phase?.view) === contentKey(payload.view)
    const input = !moved ? stage.querySelector<HTMLTextAreaElement>(".bluff-lie-input:not(:disabled)") : null
    const draft = input ? {
      text: input.value, focused: document.activeElement === input,
      start: input.selectionStart, end: input.selectionEnd, direction: input.selectionDirection
    } : null
    phase = payload
    if (unchanged) {
      const counter = stage.querySelector<HTMLElement>(".mlt-counter")
      const text = progressText(payload.view as StageView | null)
      if (counter && text !== null && counter.textContent !== text) counter.textContent = text
      drawClock()
    } else {
      render()
      // Roster changes can still require a rebuild within the submission phase.
      const nextInput = draft ? stage.querySelector<HTMLTextAreaElement>(".bluff-lie-input:not(:disabled)") : null
      if (nextInput && draft) {
        nextInput.value = draft.text
        nextInput.dispatchEvent(new Event("input"))
        if (draft.focused) {
          nextInput.focus({ preventScroll: true })
          nextInput.setSelectionRange(draft.start, draft.end, draft.direction)
        }
      }
    }
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
