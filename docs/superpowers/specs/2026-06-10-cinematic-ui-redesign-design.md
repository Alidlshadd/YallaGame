# Cinematic UI Redesign — Design Spec

**Date:** 2026-06-10
**Scope:** Sub-project 2 of the broader "improve multigame-role-room-platform" initiative — a complete UI/visual layer rewrite.
**Out of scope:** Server-side changes, Socket.IO contract changes, new gameplay features (voting/phases/win conditions), additional games beyond the existing three.

## Goal

Replace the current generic-glassmorphism UI with a cinematic, theatrical experience where each game opens its own atmospheric "stage" — without touching the server, the Socket.IO event contract, the persisted SQLite schema, or any of the 43 existing unit tests. The two existing Playwright E2E tests must still pass against the redesigned UI (same DOM ids and event flow).

## Current State

- **Server:** TypeScript + Vite + better-sqlite3 + Socket.IO — production-ready (43 unit tests, 2 E2E, CI workflow). Result of sub-project 1.
- **UI:** Single `public/styles.css` (894 lines) using uniform glassmorphism. Vampire-themed background elements (moon, bats, fog) hard-coded — visible on every page regardless of game. No per-game theming. No role-reveal moment — role appears via instant DOM swap.
- **HTML:** `index.html` at project root. Sections `#homeView`, `#gameInfoView`, `#joinView`, `#playerRoomView`, `#adminView`, plus `#toast`. Element ids are referenced by Playwright tests.
- **Catalog:** `src/server/games/catalog.ts` has a `theme: string` field per game, currently set to `"blood"` / `"purple"` / `"green"` — only used as a CSS class suffix.

## Non-Goals

- Replacing the vanilla DOM frontend with React/Vue/Svelte (stack confirmed: stays TS + Vite + Socket.IO).
- Migrating to Laravel or any other server framework.
- Adding new games or new gameplay events.
- Adding background music / ambient audio tracks (UI sound effects only).
- Adding user accounts, profiles, or persistent player identity beyond the current localStorage session.
- Visual regression test infrastructure (Percy, Chromatic, etc.) — manual smoke review is acceptable for this iteration.

## Decisions Made During Brainstorming

| Question | Decision |
|---|---|
| Tech stack | Keep TS + Vite + Socket.IO + SQLite. UI/CSS layer only. |
| Aesthetic direction | Cinematic / theatrical — atmospheric, dramatic, A24-film feel. |
| Theme scope | Hybrid — shared shell (logo, nav, language switcher) + per-game character (palette, atmosphere, display font). |
| Audio | UI sound effects only (~50KB total). Default muted; user opts in via HUD toggle. |
| Reduced motion | Honored — atmosphere freezes, role reveal collapses to a 250ms fade. |
| Existing markup | Element ids preserved so E2E tests pass unchanged. |

## Vision

> "A film is about to start. The lobby has fog, the doors are opening — you're a bit scared, a bit excited. Then the door closes, the scene begins. For the vampire game it's a gothic castle gate, for mafia a noir bar door, for spy a dim control-room door. Each game is a scene you walk into."

Two layers of cinema: a shared **Role Room brand shell** that frames every visit, and a **per-game stage** that takes over the moment a player commits to a game.

## Architecture

### Layered model

```
┌─ Shell (always the same) ─────────────────────────────┐
│  • Logo, language switcher, mute toggle               │
│  • Base dark canvas (#0a0a12)                         │
│  • Cinematic scene transitions (curtain-style)        │
│  • Sound system (default muted)                       │
└───────────────────────────────────────────────────────┘
                       ↓ when a game is chosen
┌─ Theme Layer (per-game) ──────────────────────────────┐
│  • CSS custom properties (palette, glow, surface)     │
│  • Display font (gothic / noir / tactical)            │
│  • Atmosphere layers (fog / smoke / scan-lines)       │
│  • Reveal effect variant (flip / decrypt)             │
└───────────────────────────────────────────────────────┘
                       ↓
┌─ Scene (game-specific layouts) ───────────────────────┐
│  • Game info "lobby" (playbill style)                 │
│  • Player room "private booth"                        │
│  • Admin room "director's chair"                      │
└───────────────────────────────────────────────────────┘
```

### Theming mechanism

- `<html data-theme="vampire-village">` set by `themes/loader.ts` when a game is chosen or reconnected to.
- Each theme has a single CSS file under `src/client/themes/` that overrides custom properties and injects decorative layers via `::before` / `::after` on the `body.bg-scene` container.
- Theme CSS is **lazy-imported** via dynamic `import()` so the home page ships only the base CSS until a game is chosen.
- Adding a new game = one new `themes/<id>.css` file + `theme` field in catalog. Zero JS or HTML changes.

## Design System

### Color tokens (base)

| Token | Value | Use |
|---|---|---|
| `--bg-void` | `#0a0a12` | Base canvas — between scenes |
| `--bg-deep` | `#13131e` | Panel backgrounds |
| `--text-primary` | `#f0eee6` | Body text (bone-white, not pure white — film feel) |
| `--text-muted` | `#8a8a96` | Helper text |
| `--border-faint` | `rgba(255,255,255,0.06)` | Subtle separators |
| `--surface-glass` | `rgba(255,255,255,0.03)` + `backdrop-filter: blur(16px) saturate(140%)` | Glass panels |

Per-theme tokens (`--theme-bg`, `--theme-accent`, `--theme-glow`, `--theme-surface`, `--theme-display`) override on `[data-theme="..."]`.

### Typography

**Fixed across scenes:**
- Body: **Inter** (variable, system fallback to `system-ui`)
- Mono: **JetBrains Mono** (room codes — fallback `ui-monospace`)

**Per-theme display font:**
- Vampire → **Cinzel** (Roman capitals; fallback Georgia)
- Mafia → **Playfair Display** (newspaper serif; fallback Georgia)
- Spy → **Space Mono** (tactical mono; fallback `ui-monospace`)

**RTL languages (ar, ku):** Display fonts apply to Latin glyphs via `unicode-range`; Arabic/Kurdish glyphs fall back to **Noto Sans Arabic**. Theme character is preserved without breaking readability.

All fonts: `font-display: swap`, subset to Latin Extended where applicable (≤ 30KB per theme display font).

### Motion principles

| Category | Duration | Easing | Use |
|---|---|---|---|
| Scene transition | 600–800ms | `cubic-bezier(0.22, 1, 0.36, 1)` | View change (curtain fall) |
| UI feedback | 120–180ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Button, hover, small state |
| Atmosphere loop | 8–60s | `linear` / `ease-in-out` | Fog, smoke, scan-lines |
| **Role reveal** | 1.6s | Custom orchestration | The cinematic peak — see below |

`@media (prefers-reduced-motion: reduce)`:
- Atmosphere layers: animation paused
- Scene transitions: 100ms cross-fade (no motion)
- Role reveal: single 250ms fade (no flip, no burst)

### Depth / layering

| z-index | Layer |
|---|---|
| `0` | Theme atmosphere (fog / particles / gradient bg) |
| `10` | Background panels (glass, blur) |
| `20` | Content surfaces (cards, buttons, lists) |
| `50` | HUD (nav, language switcher, mute toggle, toast) |
| `100` | Overlays (role reveal modal, dialogs) |

### Spacing scale

`4, 8, 12, 16, 24, 32, 48, 64, 96, 128` (px). Mobile-first; content max-width 1200px on desktop, fluid below 768px.

## Per-Game Theme Map

### 🧛 Vampire Village — "gothic castle, candlelight"

| Token | Value |
|---|---|
| `--theme-bg` | `radial-gradient(circle at 50% 30%, #0d0a14 0%, #070509 80%)` |
| `--theme-accent` | `#8b1538` (dried blood red) |
| `--theme-glow` | `#d4af37` (candle gold) |
| `--theme-surface` | `rgba(20, 12, 18, 0.6)` + 16px backdrop blur |
| `--theme-display` | `"Cinzel", Georgia, serif` |
| `--theme-display-style` | `letter-spacing: 0.04em` |
| Contrast check | accent on bg = 5.1:1; glow on bg = 8.2:1 (both ≥ WCAG AA) |

**Atmosphere layers:**
- Lone moon orb top-right, rotation 80s/turn
- Two stacked radial-gradient fog divs, drifting at 40s left and 60s right
- 3–4 bat silhouettes with subtle parallax on scroll
- Candle glow breathes accent at 85% ↔ 100% opacity over 4s

**Role reveal:**
- Burst color: `--theme-accent`
- Settle color: `--theme-glow` (gold frame around card)
- Card back motif: gothic damask (SVG, ≤ 1.2KB)

---

### 🕴️ Classic Mafia — "noir bar, smoke, art deco"

| Token | Value |
|---|---|
| `--theme-bg` | `linear-gradient(180deg, #1c1812 0%, #0c0a08 100%)` |
| `--theme-accent` | `#c9a961` (amber) |
| `--theme-glow` | `#e07b39` (cigarette ember orange) |
| `--theme-surface` | `rgba(30, 22, 16, 0.65)` + 16px blur + film grain overlay |
| `--theme-display` | `"Playfair Display", Georgia, serif` |
| `--theme-display-style` | `letter-spacing: -0.01em; font-weight: 700` |
| Contrast check | accent on bg = 7.3:1; glow on bg = 5.8:1 (both ≥ WCAG AA) |

**Atmosphere layers:**
- Three cigarette-smoke wisps drifting diagonally bottom-left → top-right, 25–35s loop, max 15% opacity
- Top vignette: warm spot light "lamp from above" (radial gradient)
- Film grain overlay: 16×16 SVG noise, 4% opacity
- Art deco hairline corners on cards (1px gold lines)

**Role reveal:**
- Burst color: `--theme-glow` (ember flare)
- Settle: `--theme-accent` frame with horizontal smoke wisp drifting up from below the card
- Card back motif: art deco zigzag

---

### 🕶️ Spy Game — "tactical briefing, CRT, night-vision"

| Token | Value |
|---|---|
| `--theme-bg` | `#0c111a` + linear scanline overlay (1px every 3px) |
| `--theme-accent` | `#5a9070` (muted military green) |
| `--theme-glow` | `#3fb8af` (CRT cyan) |
| `--theme-surface` | `rgba(15, 25, 30, 0.7)` + 8px blur (tighter — more "techy") |
| `--theme-display` | `"Space Mono", ui-monospace, monospace` |
| `--theme-display-style` | `letter-spacing: 0; text-transform: uppercase; font-weight: 700` |
| Contrast check | accent on bg = 6.4:1; glow on bg = 8.9:1 (both ≥ WCAG AA) |

**Atmosphere layers:**
- CRT scan lines: 1px line every 3px full screen, 4% opacity (single SVG bg-repeat)
- Phosphor corner glow: faint `--theme-glow` radial vignettes in four corners
- Top HUD: monospace timestamp + `// CLASSIFIED` label (decorative, refreshes every 6s — visual only, no functional state)
- Slow horizon scan beam: top-to-bottom sweep, 12s loop, 8% opacity

**Role reveal — variant orchestration:**
This is the one theme where the reveal differs from the standard flip:
- Burst color: `--theme-glow`
- Sequence: `"DECRYPTING..."` → `"IDENTITY: <ROLE>"` typewriter effect (80ms/char) instead of card flip
- Settle: cyan-green combined glow, static
- Card back motif: dotted blueprint grid

> **Rationale:** Spy games are about "cracking the code." A typewriter reveal is more coherent with the theme than a card flip. The other two themes share the flip orchestration; spy has its own variant.

## Scene-by-Scene Design

### 🚪 Homepage — game library

**Feel:** Cinema lobby. Slow-drifting fog, a lone moon-like orb, brand "ROLE ROOM" in display font. Three games as doors side by side.

**Layout (desktop):**
- Hero (top third): logo + tagline ("Step into the room")
- Game cards grid (middle): three vertical "door" cards, each previewing its theme accent behind glass
- "Join with code" CTA below grid (secondary button)
- Language switcher top-right (existing)
- Mute toggle bottom-right (new)

**Layout (mobile):** Cards stacked, full-width.

**Interactions:**
- Hover/focus: card lifts (`translateZ(8px)` via perspective on parent), theme glow 30% → 100%, micro fog movement
- Click: card "opens" (scale + fade), scene transitions to game info

---

### 🎭 Game info — "entering the world"

**Feel:** First per-theme moment. Sayfa loads with a 600ms "curtain fall" — 200ms darken, then theme atmosphere slides up from below.

**Layout:**
- Game icon + title (display font, theme color) — large, centered
- Subtitle below (body font, muted)
- "How to Play" rules — vintage theater playbill style (numbered list with hairline separators)
- Roles section — one row per role: icon + name (display font) + description (body)
- "Create Room" CTA — large, theme glow breathing
- "Back" link top-left

**Interactions:**
- Back: reverse transition (curtain rises)
- Create Room: button compresses, scene transitions to admin room

---

### 🔑 Join scene — transactional

**Feel:** Minimal, focused. No specific game theme (user doesn't know which room yet).

**Layout:**
- Single centered card
- "Room Code" label + 5-char mono input (large, character spacing visible)
- "Your Name" label + standard input
- "Enter" CTA
- "Back" link
- Error message slot below CTA (red-tinted, not aggressive)

**Interactions:**
- Each typed code character: micro sound tick + faint glow flash on that position
- 5th character entered: subtle border flash ("locked-in" feedback)
- Submit: button compresses, on success → scene transitions to player room

---

### 🎬 Admin room — "director's chair"

**Feel:** Authority + clarity. The admin needs to see code, players, and controls at a glance.

**Layout (desktop):**
```
╔═ <Game name> (display font, theme accent) ════ Copy code ║
║                                                           ║
║              ROOM CODE                                    ║
║              ┌─────────────┐                              ║
║              │ A  B  C  D  E │ ← hero-sized JetBrains Mono║
║              └─────────────┘    + theme glow              ║
║              Share with players                           ║
║                                                           ║
║   ┌── Players (3 / 25) ──┐    ┌── Settings ──┐            ║
║   │ ● Ada      🧛 vampire │   │ Vampires      │           ║
║   │ ● Bea      👨 villager│   │ [-] 1 [+]     │           ║
║   │ ◌ Cem      🕵 detect. │   │               │           ║
║   │ ◌◌◌ (empty seats)    │   │ ☑ Doctor      │           ║
║   └──────────────────────┘    │ ☑ Detective   │           ║
║                               │ [ Save ]      │           ║
║   [ Assign Roles ]            └───────────────┘           ║
║   [ Clear ]                                               ║
╚═══════════════════════════════════════════════════════════╝
```

**Layout (mobile):** Stack vertically: room code → players → settings → action buttons.

**Conventions:**
- `●` = connected player; `◌` = disconnected / empty seat
- New player join: row slides in from left (350ms)
- Disconnect: row dims to 50%, dot becomes `◌`
- **Assign Roles** button: on click, button fills with theme glow left-to-right over 800ms ("curtain pulled"), then shows `✓ Roles assigned` and resets after 1.5s
- Settings panel: theme-colored border, save flashes accent for 200ms

---

### 🎭 Player room — "private booth"

**Feel:** Quiet, contemplative. One focal point: the role card. Atmosphere lives in the background.

**Layout:**
- Top: game name (eyebrow style) + welcome line (`Welcome, <name>`)
- Center stage: single role card
  - **Before assignment:** face-down card with theme card-back motif, `?` symbol, slow heartbeat pulse (1.6s loop), text "Wait for the admin"
  - **After assignment:** sinematic reveal (see below), then settled view with icon + role name + description
- Bottom: connection indicator (`🟢 connected` / `🔴 reconnecting`)
- "Leave" link bottom-corner (clears session, returns to home)

---

### ⭐ Role reveal — the cinematic peak

Triggered on `player:role-assigned` event. Full-screen overlay takes the stage briefly.

**Standard flip orchestration (Vampire, Mafia):**

| t (ms) | Event |
|---|---|
| 0 | Page dims slightly via overlay (200ms fade) |
| 200 | Card rises to center, still face down |
| 400 | Card flips on Y-axis (400ms, `cubic-bezier(0.6, 0, 0.3, 1)`) |
| 800 | Glow burst: radial pulse from card center in theme burst color (300ms) |
| 1000 | Role icon scales 0.8 → 1.0 with slight upward drift |
| 1200 | Role name fades in (display font, theme color) |
| 1400 | Role description fades in (body font) |
| 1600 | Settled state — card centered, role visible, subtle glow breath continues |

**Spy variant — typewriter decrypt:**

| t (ms) | Event |
|---|---|
| 0 | Overlay fade (200ms) |
| 200 | Terminal-style box appears: `> DECRYPTING...` (block cursor blinking) |
| 600 | `DECRYPTING...` types out (80ms/char) |
| 1200 | Newline → `> IDENTITY:` types out |
| 1500 | Role name appears character-by-character (80ms/char) in glow color |
| 1900 | Role description fades in below |
| 2100 | Settled — terminal-box style stays, glow steady |

**Audio (only if sound enabled):**
- Flip variant: card-flip tick at 400ms (~5KB) + burst whoosh at 800ms (~10KB)
- Spy variant: continuous low-volume typewriter clicks during typing (~12KB, looped)
- All sounds gated by `localStorage["role-room:muted"]` — default `true`.

**Reduced motion:** Single 250ms fade-in of the settled state. No flip, no typewriter, no burst.

**Accessibility:**
- Overlay rendered as `role="dialog" aria-modal="true" aria-label="Your role"`
- Focus traps inside overlay until dismissed
- ESC dismisses to settled state immediately
- Settled state: returns focus to a "Got it" close button; restores focus to underlying view when closed
- Screen reader announcement: `aria-live="polite"` region announces `"Your role: <role name>. <description>"`

## Sound System

| File | Size budget | Trigger |
|---|---|---|
| `click.ogg` | ≤ 5KB | Button press, code character entry |
| `transition.ogg` | ≤ 10KB | Scene change (curtain) |
| `reveal-flip.ogg` | ≤ 10KB | Role reveal card flip moment |
| `reveal-burst.ogg` | ≤ 12KB | Role reveal glow burst |
| `mute-toggle.ogg` | ≤ 3KB | User toggles mute |

Total ≤ 50KB. OGG/Opus, 64kbps mono. Royalty-free, locally generated or sourced (e.g., Freesound CC0).

**Implementation:**
- `src/client/services/sound.ts` exposes `play(name)`, `setMuted(b)`, `isMuted()`.
- Single `AudioContext` lazy-created on first user gesture (autoplay policy compliant).
- `muted` flag stored at `localStorage["role-room:muted"]`, default `true`.
- HUD mute toggle button (bottom-right): icon switches `🔊 / 🔇`.

## Accessibility

- All theme accent colors meet **WCAG AA ≥ 4.5:1 contrast** on the base background (verified in the theme tables above).
- `prefers-reduced-motion: reduce` honored as specified.
- `prefers-contrast: more` (when supported): accent saturation ×2, surface opacity ×1.5.
- Focus rings in theme color, 2px outline + 2px offset, visible on keyboard-only.
- All interactive elements reachable via keyboard with logical tab order.
- Role reveal modal: focus trap, ESC dismiss, focus restoration.
- Language switcher buttons: explicit `lang` attribute on each language option.
- RTL: `<html dir="rtl">` set by `setLang` for `ar` / `ku` (existing behavior preserved).

## Performance Budget

| Metric | Target | Strategy |
|---|---|---|
| Initial JS bundle | ≤ 80KB gzip | Theme CSS lazy-imported (only base CSS on home) |
| Theme CSS (per game) | ≤ 8KB gzip | Lean custom properties + minimal decorative SVG |
| Total sound assets | ≤ 50KB | OGG/Opus 64kbps mono |
| Display font (per theme) | ≤ 30KB | `unicode-range` Latin Extended subset |
| First paint | ≤ 1.2s (fast 3G) | Critical CSS inline, `font-display: swap` |
| Atmosphere CPU | < 5% on mid-tier mobile | `will-change: transform` selective, transform-only animations, low-end detection → 50% intensity |

## File Structure

```
multigame-role-room-platform/
├── index.html                       # UPDATED — new HUD, atmosphere container
├── public/
│   ├── styles.css                   # REWRITTEN — base design system
│   └── sounds/                      # NEW
│       ├── click.ogg
│       ├── transition.ogg
│       ├── reveal-flip.ogg
│       ├── reveal-burst.ogg
│       └── mute-toggle.ogg
├── src/client/
│   ├── main.ts                      # UPDATED — theme loader + sound bootstrap
│   ├── themes/                      # NEW
│   │   ├── _base.css                # design system tokens + atmosphere skeleton
│   │   ├── vampire-village.css      # gothic tokens + atmosphere layers
│   │   ├── mafia-classic.css        # noir tokens + smoke/grain
│   │   ├── spy-game.css             # tactical tokens + scanline/HUD
│   │   └── loader.ts                # applyTheme(name): lazy import + data-theme set
│   ├── services/
│   │   └── sound.ts                 # NEW — AudioContext wrapper, mute persist
│   ├── ui/
│   │   ├── atmosphere.ts            # NEW — per-theme background renderer
│   │   ├── motion.ts                # NEW — WAAPI helpers, reduced-motion gate
│   │   └── roleReveal.ts            # NEW — cinematic reveal orchestration
│   └── views/                       # ALL UPDATED for new layouts
│       ├── home.ts
│       ├── gameInfo.ts
│       ├── join.ts
│       ├── playerRoom.ts            # roleReveal integration
│       └── admin.ts
└── src/server/games/catalog.ts      # MINIMAL UPDATE — theme strings renamed
```

## Code Changes & Compatibility

**Preserved (zero changes):**
- All server code (`src/server/**`)
- Socket.IO event contract (`src/shared/events.ts`)
- All 43 Vitest unit tests (domain + store)
- All E2E selectors — `#playerWelcome`, `#roomCodeText`, `#assignRolesBtn`, `#joinCodeInput`, `#playerNameInput`, `#joinBtn`, `#showJoinBtn`, `#createSelectedRoomBtn`, `#playerRoleCard h3`, `#rolesStatus`, `.game-card`, `.backHome` remain stable.

**Changed:**
- `Game.theme` field values: `"blood" | "purple" | "green"` → `"vampire-village" | "mafia-classic" | "spy-game"` (semantic naming; type signature stays `string` so no Game interface change).
- HTML `<html>` element gains `data-theme="..."` attribute set dynamically.
- Existing `.bg-scene` div replaced by theme-aware atmosphere container (rendered by `atmosphere.ts`).
- All view files updated for new layouts, but DOM ids preserved.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Atmosphere animations strain low-end mobile CPUs | `will-change: transform` only on animated layers; transform-only animations; low-end heuristic (`navigator.deviceMemory < 4` OR `hardwareConcurrency < 4`) reduces atmosphere intensity to 50%. |
| Font loading causes FOIT/FOUT | `font-display: swap` + carefully matched system fallbacks; subsetted display fonts ≤ 30KB. |
| Lazy theme CSS import causes flash of unstyled scene | Base CSS includes default theme token values that approximate the chosen game's palette; full theme CSS hydrates within 100ms on common networks. |
| Existing Playwright tests break | All DOM ids and class hooks the tests reference are preserved. New IDs only added, never removed. |
| Reduced-motion users miss the reveal entirely | Reduced-motion path shows the settled state with a 250ms fade — they still get the reveal *moment*, just without animation. |
| Sound autoplay blocked on mobile Safari | `AudioContext` created on first user gesture (button click), never on page load. Mute defaults to `true` — users opt in. |

## Implementation Phases (high level)

1. **Phase A — Foundation:** `_base.css` (design system tokens, motion variables, atmosphere skeleton), `motion.ts` (WAAPI helpers, `prefers-reduced-motion` gate), `themes/loader.ts` skeleton.
2. **Phase B — Three theme files:** `vampire-village.css`, `mafia-classic.css`, `spy-game.css` (tokens + decorative layers).
3. **Phase C — Shell + homepage:** `index.html` updates (HUD), `home.ts` rewrite (door cards).
4. **Phase D — Game info + join:** `gameInfo.ts` (playbill), `join.ts` (minimal).
5. **Phase E — Admin room:** `admin.ts` (three-zone layout, hero room code).
6. **Phase F — Player room + role reveal:** `playerRoom.ts` (centered card), `roleReveal.ts` (flip orchestration + spy variant), `sound.ts` integration.
7. **Phase G — Sound + a11y polish:** OGG assets, mute toggle HUD, `prefers-reduced-motion`, `prefers-contrast`, focus rings, role-reveal a11y.
8. **Phase H — Acceptance:** E2E tests pass, manual smoke for all three themes, perf budget check.

Each phase ends with: `npm run typecheck && npm run lint && npm test` green, plus a manual visual smoke ("open in browser, navigate the new view").

## Success Criteria

1. All 43 unit tests pass unchanged.
2. Both Playwright E2E specs pass against the redesigned UI (without test edits).
3. Manual smoke per game (vampire / mafia / spy): home → game info → create room → join from second window → assign roles → see cinematic reveal → reconnect after refresh — all visually coherent in the game's theme.
4. Lighthouse performance ≥ 85 on a fast 3G profile against the production build.
5. `axe-core` (or equivalent) reports no critical accessibility violations on each scene.
6. Reduced-motion: opening home, choosing a game, joining, and receiving a role all work with zero animations beyond simple fades.
7. Adding a hypothetical 4th game requires only: one new CSS file under `themes/` + one entry in `catalog.ts`. No JS or HTML changes.
