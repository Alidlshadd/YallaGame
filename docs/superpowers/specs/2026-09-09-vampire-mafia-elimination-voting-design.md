# Vampire Village & Classic Mafia — Online Elimination Voting

Date: 2026-09-09
Status: Approved, not yet implemented

## Problem

Vampire Village and Classic Mafia currently only distribute roles. Their own
catalog text says so: *"This version only distributes roles; day/night
gameplay is managed outside the system."* Once the host presses Assign Roles,
the server has no further part in the evening — night actions, discussion,
and the lynch vote all happen out loud at the table.

The request is to bring the **daytime lynch vote** onto the server, the same
way Most Likely To brought a party-game vote onto the server: a phone-based,
secret, timed vote with a reveal. Night actions (the vampire/mafia picking a
victim, the doctor protecting, the detective investigating) stay exactly
where they are — spoken at the table, outside the system. Only the "who do we
vote out" moment moves online.

## Scope

**In scope:**
- A server-run daytime vote: everyone votes in secret, the room reveals the
  count together, the top vote is eliminated.
- Elimination that persists across rounds (an eliminated player can't vote or
  be targeted again) and a win condition the server checks after every
  elimination.
- Tie handling: a revote among tied candidates, and — if that ties again — a
  fair, table-visible way to break it (detailed below).
- An optional room setting that reveals who voted for whom, same pattern as
  Most Likely To's `showVoters`.

**Out of scope (unchanged):**
- Night phases. The vampire/mafia's kill, the doctor's save, the detective's
  investigation stay spoken at the table. No secret night-action UI.
- Any change to the five other games, or to Most Likely To.
- Automatic game start. The host still presses Assign Roles first, by hand.

## Flow

```
[Admin: Assign Roles]                          ← unchanged
        |
   ROLES_ASSIGNED   (no clock; host decides when the table is ready)
        |
[Admin: Start Voting]                          ← refused if the win
        |                                        condition is already met
        v
   DAY_VOTE          (secret, host's configured seconds — default 60)
        |
   DAY_RESULT        (votes open together)
        |
        +-- clear winner -> ELIMINATED, then check win condition
        |
        +-- tie (1st time) -> TIEBREAK_VOTE (only the tied names are
        |         |            votable; same duration)
        |         v
        |    TIEBREAK_RESULT
        |         |
        |         +-- clear winner -> ELIMINATED, check win condition
        |         |
        |         +-- tie again (2nd time in a row) -> METHOD_VOTE
        |                   (everyone votes: Spin or Cards?)
        |                   |
        |                   +-- Spin wins -> SPIN_RESULT (wheel animation,
        |                   |     one of the tied players is picked by the
        |                   |     server's rng) -> ELIMINATED, check win
        |                   |
        |                   +-- Cards wins, OR the method vote itself
        |                         ties -> CARD_VOTE (see below)
        |                                |
        |                           CARD_RESULT
        |                                |
        |                                +-- one card has strictly more
        |                                |    votes -> that card opens,
        |                                |    the name under it is
        |                                |    ELIMINATED, check win
        |                                |
        |                                +-- cards tie too -> CARD_VOTE
        |                                      again (new random card/name
        |                                      mapping). After 3 attempts
        |                                      with no winner, the server
        |                                      opens one card at random on
        |                                      that 3rd attempt rather than
        |                                      trying a 4th time.
        v
   win condition met -> GAME_OVER
   win condition not met -> [Admin: Next Round] -> DAY_VOTE
```

### The card scenario

One tied name per card, face down — no name printed on the card itself, only
a color or number. Two tied players means two cards (red/blue, styled like
two pills); three or more tied players means one card per player, numbered
instead of colored. Which card holds which name is decided by the server the
moment `CARD_VOTE` opens and is never sent to any client, host included —
`view()` only reveals it once `CARD_RESULT` opens the winning card. Everyone
still alive votes for a card, exactly like a normal round; the card with
strictly more votes opens.

## Win condition

Checked after every elimination (normal vote, tiebreak, spin, or card):

- Living evil count is **0** → good side wins, game ends.
- Living evil count **≥** living good count → evil side wins, game ends.
- Otherwise → host presses **Next Round**, a fresh `DAY_VOTE` opens.

"Evil" is whichever role id the engine was built with (`vampire` or `mafia`);
every other assigned role (including the filler villager/citizen) counts as
good. Doctor and detective count as good — they have no special weight in
the vote itself, since their night powers stay outside the system.

Checked once more, before the first vote ever opens: if the win condition is
already true right after roles are assigned (e.g. a 3-player room with 2
vampires), **Start Voting is refused** with a toast — a room that starts
already decided is a bug, not a game.

## Elimination

An eliminated player stays in the room and keeps watching every later round
— they see results and the eventual winner — but cannot vote and cannot be
voted for. Their screen says so plainly ("You've been eliminated") instead of
showing voting buttons.

## Settings

Added to both games' `settings`, next to the existing `vampireCount` /
`mafiaCount`, `doctor`, `detective`:

| key | type | range / default |
|---|---|---|
| `dayVoteSeconds` | number | 10–120, default 60 |
| `showVoters` | boolean | default **off** |

`showVoters` follows the same rule Most Likely To's does: while a vote is
open, nobody's choice is visible to anyone but themselves — the setting only
governs what the *result* screen shows afterward. Off shows a count per
target; on also lists who voted for whom.

## Data model

Reuses the existing turn engine (`src/server/domain/engine.ts`) and its
`GameState`/`gameState` JSON column — no migration. Per-room game state:

```ts
interface EliminationState extends GameState {
  eliminated: string[]                    // player ids, out for the rest of the game
  votes: Vote[]                           // this round's votes only
  tieStreak: number                       // consecutive ties this round, 0 normally
  tieCandidates: string[]                 // who a TIEBREAK_VOTE is narrowed to
  cardAttempt: number                     // CARD_VOTE retries this tie, 0-2
  cardAssignment: Record<string, string>  // cardId -> playerId, server-only,
                                           // never serialized into a view()
}

interface Vote {
  round: number
  voterId: string
  /** A player id in DAY_VOTE/TIEBREAK_VOTE, "spin"|"cards" in METHOD_VOTE,
      a card id in CARD_VOTE. Meaning depends on the phase, same shape
      throughout — mirrors Most Likely To's Vote. */
  target: string
  createdAt: number
}
```

Phases (string constants, opaque to the generic engine exactly like Most
Likely To's): `ROLES_ASSIGNED`, `DAY_VOTE`, `DAY_RESULT`, `TIEBREAK_VOTE`,
`TIEBREAK_RESULT`, `METHOD_VOTE`, `SPIN_RESULT`, `CARD_VOTE`, `CARD_RESULT`,
`GAME_OVER`.

## Engine

One factory, not two copied files — the two games differ only in which role
id is "evil":

```ts
// src/server/games/elimination-vote.ts
export interface EliminationConfig {
  gameId: string
  evilRoleId: string
}

export function createEliminationEngine(config: EliminationConfig): GameEngine
```

```ts
// src/server/games/vampire-village.ts   (existing file, engine added)
export const vampireVillageEngine = createEliminationEngine({
  gameId: "vampire-village", evilRoleId: "vampire"
})

// src/server/games/mafia-classic.ts     (existing file, engine added)
export const mafiaClassicEngine = createEliminationEngine({
  gameId: "mafia-classic", evilRoleId: "mafia"
})
```

Both register in `src/server/games/engines.ts` alongside `mostLikelyToEngine`.

`start()` reads roles off `room.players` (assumed already dealt — the engine
never assigns roles itself), runs the pre-check above, and opens
`ROLES_ASSIGNED` with no clock. `act()` validates a vote the same way Most
Likely To's does (no self-vote isn't relevant here, but: can't vote outside
the current vote phase, can't vote twice, can't vote for/as an eliminated
player, target must exist and — in `DAY_VOTE`/`TIEBREAK_VOTE` — must not
already be eliminated). `next()` holds the branching above. `view()` never
leaks `cardAssignment` before `CARD_RESULT`, never leaks another player's
vote before a result phase, and always tells a player plainly whether they're
eliminated.

## Admin screen

The room-actions row grows a third mode. Today it's binary — `turnBased ?
Start/End : Assign/Clear` (`src/client/views/admin.ts`, `renderActions()`).
These two games need **both**, in sequence:

1. Room opens: **Assign Roles** / **Clear Roles** visible, as today.
2. Host assigns roles: the same two stay, and **Start Voting** now appears
   next to them — hidden until `room.assigned` is true, since starting a
   vote before anyone has a role makes no sense.
3. Host starts voting: the stage takes over (existing pattern — ending the
   game lives on the stage's own header, same as Most Likely To). Assign/
   Clear Roles disappear while a round is live, the same way Most Likely To
   hides Start once a round is underway.

`Game.turnBased` stays a plain boolean; the new case is `turnBased === true
&& game.roles.length > 0`, which only these two games satisfy today.

## Client rendering

`src/client/ui/gameStage.ts` currently only knows Most Likely To's view
shapes. Splitting it:

- `gameStage.ts` keeps the shell: mount/unmount, the stage `<div>`, the
  server clock, `game:phase` subscription, seq tracking — everything that
  doesn't know what game is running.
- A new `src/client/ui/stages/mostLikelyTo.ts` gets the existing render
  logic moved into it wholesale (no behavior change).
- A new `src/client/ui/stages/eliminationVote.ts` renders this feature's
  phases: the vote grid (reusing the same large-touch-target button pattern
  as Most Likely To), the result bars, the wheel animation for `SPIN_RESULT`,
  the face-down card grid for `CARD_VOTE`/`CARD_RESULT`.
- `gameStage.ts` picks the renderer by `room.gameId` — a small lookup, not a
  growing switch buried in render logic.

Shared types for the new views go in `src/shared/elimination-vote.ts`,
mirroring `src/shared/most-likely-to.ts`.

## Testing

Unit (engine, mirrors `tests/unit/domain/most-likely-to.test.ts`):
- Both engines are registered; the five other games are not touched.
- Start refuses when the win condition is already met at assignment.
- A normal vote eliminates the top target; an eliminated player can't vote
  or be targeted again.
- A tie opens `TIEBREAK_VOTE` narrowed to the tied names only.
- Two ties in a row opens `METHOD_VOTE`; a method tie resolves to Cards.
- Spin picks one of the tied names via the injected rng (deterministic in
  tests) and eliminates them.
- Card assignment is never present in any `view()` before `CARD_RESULT`.
- A card win opens the right card and eliminates the right name.
- Three tied card votes in a row force a random open on the third.
- Win condition triggers correctly for both "evil hits zero" and "evil ≥
  good", after every kind of elimination (vote, tiebreak, spin, card).
- `showVoters` off omits the field entirely from every result view; on
  includes it only in results, never during an open vote.

E2E (mirrors `tests/e2e/most-likely-to.spec.ts`):
- Assign Roles → Start Voting → a full round → elimination → next round →
  win condition ends the game, for both games.
- A phone that reloads mid-vote comes back to the vote, not the lobby (same
  fix Most Likely To needed).
- Start Voting is hidden until roles are assigned; Assign/Clear Roles are
  hidden once voting starts.

## Open implementation questions

None — every branch above was walked through and confirmed. The only thing
left to decide during implementation is naming detail (exact CSS class
names, exact i18n keys), which follows existing patterns closely enough not
to need a design decision.
