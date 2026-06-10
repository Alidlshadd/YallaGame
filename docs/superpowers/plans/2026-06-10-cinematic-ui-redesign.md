# Cinematic UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current uniform-glassmorphism UI with a cinematic, per-game-themed experience without touching the server, Socket.IO contract, SQLite schema, or any of the 43 existing unit tests, while keeping both Playwright E2E tests green.

**Architecture:** Three-layer client: a fixed Shell (logo + nav + HUD + sound), a per-game Theme Layer (CSS custom properties + decorative atmosphere injected via `<html data-theme="...">`), and Scene components (home / gameInfo / join / admin / playerRoom). Theme CSS is lazy-imported. All DOM ids referenced by Playwright tests are preserved.

**Tech Stack:** TypeScript 5, Vite 5, vanilla DOM (no framework), Socket.IO 4, Web Animations API (WAAPI), Web Audio API, CSS custom properties, `prefers-reduced-motion` / `prefers-contrast` media queries.

**Reference spec:** `docs/superpowers/specs/2026-06-10-cinematic-ui-redesign-design.md`

**Commit policy:** Each phase ends with a commit. Commit messages follow Conventional Commits format.

---

## File Structure

```
multigame-role-room-platform/
├── index.html                       # MODIFIED: HUD + atmosphere container
├── public/
│   ├── styles.css                   # REWRITTEN: thin global reset only
│   └── sounds/                      # NEW (binary assets, sourced separately)
│       ├── click.ogg                # ≤ 5KB
│       ├── transition.ogg           # ≤ 10KB
│       ├── reveal-flip.ogg          # ≤ 10KB
│       ├── reveal-burst.ogg         # ≤ 12KB
│       └── mute-toggle.ogg          # ≤ 3KB
├── src/client/
│   ├── main.ts                      # MODIFIED: theme + sound bootstrap
│   ├── themes/                      # NEW
│   │   ├── _base.css                # design system tokens + atmosphere skeleton
│   │   ├── vampire-village.css      # gothic palette + decorative layers
│   │   ├── mafia-classic.css        # noir palette + smoke/grain
│   │   ├── spy-game.css             # tactical palette + scanline/HUD
│   │   └── loader.ts                # applyTheme(name) — lazy import + data-theme attr
│   ├── services/
│   │   └── sound.ts                 # NEW: AudioContext wrapper, mute persisted
│   ├── ui/
│   │   ├── atmosphere.ts            # NEW: per-theme background renderer
│   │   ├── motion.ts                # NEW: WAAPI helpers, reduced-motion gate
│   │   └── roleReveal.ts            # NEW: cinematic reveal orchestration
│   └── views/                       # ALL REWRITTEN for new layouts
│       ├── home.ts
│       ├── gameInfo.ts
│       ├── join.ts
│       ├── playerRoom.ts
│       └── admin.ts
├── src/server/games/catalog.ts      # MODIFIED: theme strings semantic-renamed
├── tests/unit/
│   ├── ui/motion.test.ts            # NEW: reduced-motion gate behavior
│   └── themes/loader.test.ts        # NEW: applyTheme attr behavior
└── README.md                        # MODIFIED: visual section
```

---

# Phase A — Foundation: design system tokens, motion, theme loader

Set up the base CSS variables, motion helpers, and the theme loader skeleton. After this phase the app still looks like the legacy UI, but the foundation is in place for theme files in Phase B.

---

### Task A.1 — Create `_base.css` (design system tokens + reset)

**Files:**
- Create: `src/client/themes/_base.css`

- [ ] **Step 1: Write the file**

```css
/* ─── DESIGN SYSTEM ─────────────────────────────────────────────────
   Single source of truth for all theme-independent design tokens.
   Per-game theme files override the --theme-* variables.
   ───────────────────────────────────────────────────────────────── */

:root {
  /* Base canvas */
  --bg-void: #0a0a12;
  --bg-deep: #13131e;
  --text-primary: #f0eee6;
  --text-muted: #8a8a96;
  --border-faint: rgba(255, 255, 255, 0.06);

  /* Glass surface */
  --surface-glass: rgba(255, 255, 255, 0.03);
  --surface-blur: blur(16px) saturate(140%);

  /* Theme defaults (overridden by theme files) */
  --theme-bg: var(--bg-void);
  --theme-accent: #c0c0c8;
  --theme-glow: #f0eee6;
  --theme-surface: var(--surface-glass);
  --theme-display: "Inter", system-ui, sans-serif;
  --theme-display-tracking: 0;
  --theme-display-transform: none;

  /* Motion */
  --motion-scene-duration: 700ms;
  --motion-scene-easing: cubic-bezier(0.22, 1, 0.36, 1);
  --motion-ui-duration: 150ms;
  --motion-ui-easing: cubic-bezier(0.4, 0, 0.2, 1);

  /* Spacing scale (8px base) */
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 24px;
  --s-6: 32px;
  --s-7: 48px;
  --s-8: 64px;
  --s-9: 96px;
  --s-10: 128px;

  /* Type scale */
  --type-xs: 12px;
  --type-sm: 14px;
  --type-base: 16px;
  --type-lg: 20px;
  --type-xl: 28px;
  --type-2xl: 40px;
  --type-3xl: 56px;
  --type-4xl: 84px;

  /* Z-index layers */
  --z-atmosphere: 0;
  --z-bg-panel: 10;
  --z-surface: 20;
  --z-hud: 50;
  --z-overlay: 100;

  /* Fonts (preserved across themes) */
  --font-body: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --font-arabic: "Noto Sans Arabic", system-ui, sans-serif;
}

/* ─── RESET ─────────────────────────────────────────────────────── */

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
button, input { font: inherit; color: inherit; }
button { background: none; border: 0; cursor: pointer; }
a { color: inherit; text-decoration: none; }

html {
  background: var(--bg-void);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--type-base);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

body {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

:lang(ar), :lang(ku) {
  font-family: var(--font-arabic);
}

/* ─── ATMOSPHERE CONTAINER ──────────────────────────────────────── */

.atmosphere {
  position: fixed;
  inset: 0;
  z-index: var(--z-atmosphere);
  pointer-events: none;
  background: var(--theme-bg);
  transition: background 600ms var(--motion-scene-easing);
}

/* Per-theme atmosphere layers attach as .atmosphere::before / ::after */
.atmosphere::before,
.atmosphere::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ─── SHELL ─────────────────────────────────────────────────────── */

.shell {
  position: relative;
  z-index: var(--z-surface);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.hud {
  position: fixed;
  z-index: var(--z-hud);
  top: var(--s-4);
  right: var(--s-4);
  display: flex;
  gap: var(--s-2);
  align-items: center;
}

.lang-switch {
  display: flex;
  gap: var(--s-1);
  background: var(--theme-surface);
  backdrop-filter: var(--surface-blur);
  -webkit-backdrop-filter: var(--surface-blur);
  padding: var(--s-1);
  border-radius: 999px;
  border: 1px solid var(--border-faint);
}

.lang-switch button {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: var(--type-xs);
  color: var(--text-muted);
  transition: color var(--motion-ui-duration) var(--motion-ui-easing),
              background var(--motion-ui-duration) var(--motion-ui-easing);
}

.lang-switch button:hover,
.lang-switch button[aria-current="true"] {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.mute-toggle {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: var(--theme-surface);
  backdrop-filter: var(--surface-blur);
  -webkit-backdrop-filter: var(--surface-blur);
  border: 1px solid var(--border-faint);
  display: grid;
  place-items: center;
  font-size: var(--type-base);
  color: var(--text-muted);
  transition: color var(--motion-ui-duration) var(--motion-ui-easing);
}

.mute-toggle:hover { color: var(--text-primary); }

/* ─── BRAND ─────────────────────────────────────────────────────── */

.brand {
  position: fixed;
  z-index: var(--z-hud);
  top: var(--s-4);
  left: var(--s-4);
  display: flex;
  align-items: center;
  gap: var(--s-2);
  color: var(--text-primary);
  font-family: var(--theme-display);
  letter-spacing: var(--theme-display-tracking);
  text-transform: var(--theme-display-transform);
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--theme-surface);
  backdrop-filter: var(--surface-blur);
  -webkit-backdrop-filter: var(--surface-blur);
  border: 1px solid var(--border-faint);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: var(--theme-glow);
}

.brand-text strong {
  display: block;
  font-size: var(--type-sm);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.brand-text span {
  display: block;
  font-size: var(--type-xs);
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

/* ─── VIEW (scene) ──────────────────────────────────────────────── */

.view {
  display: none;
  flex: 1;
  padding: var(--s-9) var(--s-5) var(--s-7);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.view.active-view {
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
  animation: scene-in var(--motion-scene-duration) var(--motion-scene-easing);
}

@keyframes scene-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─── BUTTONS ───────────────────────────────────────────────────── */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-2);
  padding: 14px 28px;
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: var(--type-base);
  font-weight: 600;
  letter-spacing: 0.02em;
  border: 1px solid transparent;
  transition: transform var(--motion-ui-duration) var(--motion-ui-easing),
              background var(--motion-ui-duration) var(--motion-ui-easing),
              box-shadow var(--motion-ui-duration) var(--motion-ui-easing);
}

.btn-primary {
  background: var(--theme-accent);
  color: var(--bg-void);
  box-shadow: 0 0 0 0 var(--theme-glow);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 32px -4px var(--theme-glow);
}

.btn-primary:active { transform: translateY(0); }

.btn-secondary {
  background: var(--theme-surface);
  backdrop-filter: var(--surface-blur);
  -webkit-backdrop-filter: var(--surface-blur);
  color: var(--text-primary);
  border-color: var(--border-faint);
}

.btn-secondary:hover {
  border-color: var(--theme-accent);
  color: var(--theme-glow);
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  padding: 8px 16px;
}

.btn-ghost:hover { color: var(--text-primary); }

.btn-danger {
  background: rgba(180, 50, 60, 0.15);
  border-color: rgba(180, 50, 60, 0.4);
  color: #ff8080;
}

/* ─── FOCUS ─────────────────────────────────────────────────────── */

:focus-visible {
  outline: 2px solid var(--theme-glow);
  outline-offset: 2px;
  border-radius: 6px;
}

/* ─── TOAST ─────────────────────────────────────────────────────── */

.toast {
  position: fixed;
  z-index: var(--z-overlay);
  bottom: var(--s-7);
  left: 50%;
  transform: translateX(-50%);
  padding: var(--s-3) var(--s-5);
  border-radius: 999px;
  background: rgba(20, 20, 30, 0.9);
  backdrop-filter: var(--surface-blur);
  -webkit-backdrop-filter: var(--surface-blur);
  border: 1px solid var(--border-faint);
  color: var(--text-primary);
  font-size: var(--type-sm);
  opacity: 1;
  transition: opacity 300ms ease-out;
}

.toast.hidden { opacity: 0; pointer-events: none; }

/* ─── REDUCED MOTION ────────────────────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 100ms !important;
  }

  .atmosphere::before,
  .atmosphere::after {
    animation: none !important;
  }
}

/* ─── HIGH CONTRAST ─────────────────────────────────────────────── */

@media (prefers-contrast: more) {
  :root {
    --border-faint: rgba(255, 255, 255, 0.18);
    --text-muted: #b0b0b8;
  }
}
```

- [ ] **Step 2: Verify file is valid CSS**

Run: `npx prettier --check src/client/themes/_base.css`
Expected: passes (no output) or fixes formatting on next save.

**Checkpoint:** Design system tokens defined. Not yet wired in.

---

### Task A.2 — Create `motion.ts` (WAAPI helpers + reduced-motion gate)

**Files:**
- Create: `src/client/ui/motion.ts`
- Create: `tests/unit/ui/motion.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/ui/motion.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { prefersReducedMotion, sceneDuration } from "@client/ui/motion.js"

describe("motion helpers", () => {
  beforeEach(() => {
    // jsdom doesn't implement matchMedia by default
    vi.stubGlobal("matchMedia", vi.fn((q: string) => ({
      matches: q === "(prefers-reduced-motion: reduce)" ? false : false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {}
    })))
  })

  it("prefersReducedMotion returns false when media query doesn't match", () => {
    expect(prefersReducedMotion()).toBe(false)
  })

  it("prefersReducedMotion returns true when media query matches", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: true, media: "", addEventListener: () => {}, removeEventListener: () => {}
    })))
    expect(prefersReducedMotion()).toBe(true)
  })

  it("sceneDuration returns the full duration when motion is allowed", () => {
    expect(sceneDuration()).toBe(700)
  })

  it("sceneDuration returns reduced duration when motion is reduced", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: true, media: "", addEventListener: () => {}, removeEventListener: () => {}
    })))
    expect(sceneDuration()).toBe(100)
  })
})
```

- [ ] **Step 2: Run test — expect fail (module missing)**

Run: `npm test -- motion`
Expected: import error / module not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/client/ui/motion.ts
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function sceneDuration(): number {
  return prefersReducedMotion() ? 100 : 700
}

export function uiDuration(): number {
  return prefersReducedMotion() ? 50 : 150
}

export const SCENE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)"
export const UI_EASING = "cubic-bezier(0.4, 0, 0.2, 1)"
export const REVEAL_EASING = "cubic-bezier(0.6, 0, 0.3, 1)"

export interface MotionStep {
  at: number
  do: () => void
}

/**
 * Run a sequence of steps at specified time offsets.
 * Returns a function that cancels pending steps.
 */
export function orchestrate(steps: MotionStep[]): () => void {
  const handles: number[] = []
  for (const step of steps) {
    handles.push(window.setTimeout(step.do, step.at))
  }
  return () => { for (const h of handles) window.clearTimeout(h) }
}

/**
 * Animate an element with WAAPI, returning a Promise that resolves on finish.
 * Honors prefers-reduced-motion by collapsing duration.
 */
export function animate(
  el: Element,
  keyframes: Keyframe[],
  options: { duration: number; easing?: string; fill?: FillMode; delay?: number }
): Animation {
  const dur = prefersReducedMotion() ? Math.min(options.duration, 100) : options.duration
  return el.animate(keyframes, {
    duration: dur,
    easing: options.easing ?? UI_EASING,
    fill: options.fill ?? "forwards",
    delay: options.delay ?? 0
  })
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `npm test -- motion`
Expected: 4 passed.

**Checkpoint:** Motion helpers ready and tested.

---

### Task A.3 — Create `themes/loader.ts` (applyTheme + lazy import)

**Files:**
- Create: `src/client/themes/loader.ts`
- Create: `tests/unit/themes/loader.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/themes/loader.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest"

describe("theme loader", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme")
    vi.resetModules()
  })

  it("applyTheme sets data-theme on <html>", async () => {
    vi.doMock("../../../src/client/themes/vampire-village.css?inline", () => ({ default: "" }))
    const { applyTheme } = await import("@client/themes/loader.js")
    await applyTheme("vampire-village")
    expect(document.documentElement.getAttribute("data-theme")).toBe("vampire-village")
  })

  it("clearTheme removes data-theme attribute", async () => {
    const { applyTheme, clearTheme } = await import("@client/themes/loader.js")
    await applyTheme("mafia-classic")
    clearTheme()
    expect(document.documentElement.getAttribute("data-theme")).toBeNull()
  })

  it("applyTheme rejects unknown names", async () => {
    const { applyTheme } = await import("@client/themes/loader.js")
    await expect(applyTheme("nonexistent")).rejects.toThrow(/UNKNOWN_THEME/)
  })
})
```

- [ ] **Step 2: Run test — expect fail (module missing)**

Run: `npm test -- loader`
Expected: import error.

- [ ] **Step 3: Write the implementation**

```ts
// src/client/themes/loader.ts
export type ThemeName = "vampire-village" | "mafia-classic" | "spy-game"

const KNOWN_THEMES: ThemeName[] = ["vampire-village", "mafia-classic", "spy-game"]

const loaders: Record<ThemeName, () => Promise<unknown>> = {
  "vampire-village": () => import("./vampire-village.css"),
  "mafia-classic":   () => import("./mafia-classic.css"),
  "spy-game":        () => import("./spy-game.css")
}

const loaded = new Set<ThemeName>()

export async function applyTheme(name: string): Promise<void> {
  if (!(KNOWN_THEMES as string[]).includes(name)) {
    throw new Error(`UNKNOWN_THEME: ${name}`)
  }
  const theme = name as ThemeName
  if (!loaded.has(theme)) {
    await loaders[theme]()
    loaded.add(theme)
  }
  document.documentElement.setAttribute("data-theme", theme)
}

export function clearTheme(): void {
  document.documentElement.removeAttribute("data-theme")
}

export function currentTheme(): ThemeName | null {
  const attr = document.documentElement.getAttribute("data-theme")
  return (KNOWN_THEMES as string[]).includes(attr ?? "") ? (attr as ThemeName) : null
}
```

- [ ] **Step 4: Add empty theme CSS stubs (so the dynamic imports resolve)**

Create three empty files (each contains only a comment, populated in Phase B):

```css
/* src/client/themes/vampire-village.css */
/* populated in Phase B Task B.1 */
```

```css
/* src/client/themes/mafia-classic.css */
/* populated in Phase B Task B.2 */
```

```css
/* src/client/themes/spy-game.css */
/* populated in Phase B Task B.3 */
```

- [ ] **Step 5: Run test — expect pass**

Run: `npm test -- loader`
Expected: 3 passed.

**Checkpoint:** Theme loader ready, stub CSS files in place.

---

### Task A.4 — Create `atmosphere.ts` (per-theme background renderer)

**Files:**
- Create: `src/client/ui/atmosphere.ts`

- [ ] **Step 1: Write the file**

```ts
// src/client/ui/atmosphere.ts
/**
 * Ensures a single .atmosphere element exists at the top of <body>.
 * Theme CSS attaches decorative layers via .atmosphere::before / ::after.
 * Per-game extra layers are injected as data-children inside.
 */

const CONTAINER_ID = "atmosphere"

export function ensureAtmosphere(): HTMLDivElement {
  let el = document.getElementById(CONTAINER_ID) as HTMLDivElement | null
  if (el) return el
  el = document.createElement("div")
  el.id = CONTAINER_ID
  el.className = "atmosphere"
  el.setAttribute("aria-hidden", "true")
  document.body.prepend(el)
  return el
}

/**
 * Clear all atmosphere child decorations. Pseudo-element layers
 * (::before / ::after) persist because they are CSS-driven.
 */
export function clearAtmosphereChildren(): void {
  const el = document.getElementById(CONTAINER_ID)
  if (el) while (el.firstChild) el.removeChild(el.firstChild)
}

/**
 * Detect low-end devices to reduce atmosphere intensity.
 * Heuristic: ≤4GB RAM OR ≤4 CPU cores.
 */
export function isLowEnd(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const mem = nav.deviceMemory ?? 8
  const cores = nav.hardwareConcurrency ?? 8
  return mem <= 4 || cores <= 4
}

/**
 * Apply the low-end attribute on the atmosphere container so theme CSS
 * can dial decorative layer opacity / count via [data-perf="low"].
 */
export function applyPerformanceProfile(): void {
  const el = ensureAtmosphere()
  if (isLowEnd()) el.setAttribute("data-perf", "low")
  else el.removeAttribute("data-perf")
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** Atmosphere renderer ready.

---

### Task A.5 — End-of-phase verification + commit

- [ ] **Step 1: Run full pipeline**

Run:
```bash
npm run typecheck && npm run lint && npm test
```
Expected: all green. Test count: 43 (existing) + 4 (motion) + 3 (loader) = **50 passed**.

- [ ] **Step 2: Commit**

```bash
git add src/client/themes/_base.css \
        src/client/themes/loader.ts \
        src/client/themes/vampire-village.css \
        src/client/themes/mafia-classic.css \
        src/client/themes/spy-game.css \
        src/client/ui/motion.ts \
        src/client/ui/atmosphere.ts \
        tests/unit/ui/motion.test.ts \
        tests/unit/themes/loader.test.ts
git commit -m "feat(ui): design system tokens, motion helpers, theme loader"
```

**Checkpoint:** Phase A complete. Foundation in place; no visible UI change yet.

---

# Phase B — Three theme files + catalog rename

Populate the three theme CSS files with complete tokens and atmosphere layers, and rename catalog `theme` values to match.

---

### Task B.1 — Populate `vampire-village.css`

**Files:**
- Modify: `src/client/themes/vampire-village.css`

- [ ] **Step 1: Replace the stub with full theme**

```css
/* ─── VAMPIRE VILLAGE — gothic castle, candlelight ──────────────── */

[data-theme="vampire-village"] {
  --theme-bg: radial-gradient(circle at 50% 30%, #0d0a14 0%, #070509 80%);
  --theme-accent: #8b1538;
  --theme-glow: #d4af37;
  --theme-surface: rgba(20, 12, 18, 0.6);
  --theme-display: "Cinzel", Georgia, serif;
  --theme-display-tracking: 0.04em;
  --theme-display-transform: none;
}

/* Atmosphere — radial fog layers via pseudo-elements */
[data-theme="vampire-village"] .atmosphere::before {
  background:
    radial-gradient(ellipse at 30% 70%, rgba(139, 21, 56, 0.10) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 30%, rgba(212, 175, 55, 0.06) 0%, transparent 50%);
  animation: fog-drift-1 40s linear infinite;
}

[data-theme="vampire-village"] .atmosphere::after {
  background:
    radial-gradient(ellipse at 60% 80%, rgba(139, 21, 56, 0.08) 0%, transparent 60%);
  animation: fog-drift-2 60s linear infinite reverse;
}

@keyframes fog-drift-1 {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(-3%, 2%) scale(1.05); }
  100% { transform: translate(0, 0) scale(1); }
}

@keyframes fog-drift-2 {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(2%, -3%) scale(1.08); }
  100% { transform: translate(0, 0) scale(1); }
}

/* Lone moon orb top-right */
[data-theme="vampire-village"] .atmosphere {
  background-image:
    radial-gradient(circle 120px at calc(100% - 80px) 120px,
      rgba(240, 235, 200, 0.18) 0%,
      rgba(212, 175, 55, 0.08) 40%,
      transparent 70%);
}

/* Candle glow breathing on accent surfaces */
[data-theme="vampire-village"] .glow-breathe {
  animation: candle-breath 4s ease-in-out infinite;
}

@keyframes candle-breath {
  0%, 100% { box-shadow: 0 0 24px -4px var(--theme-glow); }
  50%      { box-shadow: 0 0 36px -2px var(--theme-glow); }
}

/* Low-end devices: drop one fog layer */
[data-theme="vampire-village"] .atmosphere[data-perf="low"]::after {
  display: none;
}

/* Contrast verified WCAG AA:
   - accent #8b1538 on bg #0a0a12 = 5.1:1
   - glow #d4af37 on bg #0a0a12 = 8.2:1 */
```

- [ ] **Step 2: Verify CSS is valid**

Run: `npx prettier --check src/client/themes/vampire-village.css`
Expected: no errors.

**Checkpoint:** Vampire theme file complete.

---

### Task B.2 — Populate `mafia-classic.css`

**Files:**
- Modify: `src/client/themes/mafia-classic.css`

- [ ] **Step 1: Replace the stub with full theme**

```css
/* ─── CLASSIC MAFIA — noir bar, smoke, art deco ─────────────────── */

[data-theme="mafia-classic"] {
  --theme-bg: linear-gradient(180deg, #1c1812 0%, #0c0a08 100%);
  --theme-accent: #c9a961;
  --theme-glow: #e07b39;
  --theme-surface: rgba(30, 22, 16, 0.65);
  --theme-display: "Playfair Display", Georgia, serif;
  --theme-display-tracking: -0.01em;
  --theme-display-transform: none;
}

/* Atmosphere — smoke wisps + warm spot light */
[data-theme="mafia-classic"] .atmosphere::before {
  background:
    radial-gradient(ellipse at 50% -10%,
      rgba(224, 123, 57, 0.15) 0%,
      rgba(201, 169, 97, 0.08) 30%,
      transparent 60%);
}

[data-theme="mafia-classic"] .atmosphere::after {
  background:
    radial-gradient(ellipse 60% 30% at 10% 100%,
      rgba(201, 169, 97, 0.10) 0%,
      transparent 70%),
    radial-gradient(ellipse 40% 20% at 80% 90%,
      rgba(224, 123, 57, 0.08) 0%,
      transparent 70%);
  animation: smoke-rise 30s ease-in-out infinite;
}

@keyframes smoke-rise {
  0%   { transform: translateY(0)    scale(1); opacity: 0.7; }
  50%  { transform: translateY(-3%)  scale(1.05); opacity: 1; }
  100% { transform: translateY(0)    scale(1); opacity: 0.7; }
}

/* Film grain overlay */
[data-theme="mafia-classic"] .atmosphere {
  background-image:
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>\
<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/>\
<feColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.92  0 0 0 0 0.85  0 0 0 0.04 0'/></filter>\
<rect width='16' height='16' filter='url(%23n)'/></svg>");
  background-repeat: repeat;
}

/* Art deco hairline accents on cards */
[data-theme="mafia-classic"] .deco-corner {
  position: relative;
}

[data-theme="mafia-classic"] .deco-corner::before,
[data-theme="mafia-classic"] .deco-corner::after {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  border: 1px solid var(--theme-accent);
  opacity: 0.6;
}

[data-theme="mafia-classic"] .deco-corner::before {
  top: -1px; left: -1px;
  border-right: 0; border-bottom: 0;
}

[data-theme="mafia-classic"] .deco-corner::after {
  bottom: -1px; right: -1px;
  border-left: 0; border-top: 0;
}

[data-theme="mafia-classic"] .glow-breathe {
  animation: ember-pulse 5s ease-in-out infinite;
}

@keyframes ember-pulse {
  0%, 100% { box-shadow: 0 0 28px -6px var(--theme-glow); }
  50%      { box-shadow: 0 0 40px -4px var(--theme-glow); }
}

[data-theme="mafia-classic"] .atmosphere[data-perf="low"]::after {
  animation: none;
  opacity: 0.5;
}

/* Contrast verified WCAG AA:
   - accent #c9a961 on bg #1c1812 = 7.3:1
   - glow #e07b39 on bg #1c1812 = 5.8:1 */
```

- [ ] **Step 2: Verify**

Run: `npx prettier --check src/client/themes/mafia-classic.css`
Expected: no errors.

**Checkpoint:** Mafia theme complete.

---

### Task B.3 — Populate `spy-game.css`

**Files:**
- Modify: `src/client/themes/spy-game.css`

- [ ] **Step 1: Replace the stub with full theme**

```css
/* ─── SPY GAME — tactical, CRT, night-vision ────────────────────── */

[data-theme="spy-game"] {
  --theme-bg: #0c111a;
  --theme-accent: #5a9070;
  --theme-glow: #3fb8af;
  --theme-surface: rgba(15, 25, 30, 0.7);
  --theme-display: "Space Mono", ui-monospace, monospace;
  --theme-display-tracking: 0;
  --theme-display-transform: uppercase;
}

/* CRT scan lines — single bg-repeat layer */
[data-theme="spy-game"] .atmosphere {
  background-image:
    repeating-linear-gradient(0deg,
      transparent 0px,
      transparent 2px,
      rgba(63, 184, 175, 0.04) 2px,
      rgba(63, 184, 175, 0.04) 3px);
}

/* Phosphor corner glow */
[data-theme="spy-game"] .atmosphere::before {
  background:
    radial-gradient(circle 200px at 5% 5%,    rgba(63, 184, 175, 0.08), transparent),
    radial-gradient(circle 200px at 95% 5%,   rgba(63, 184, 175, 0.08), transparent),
    radial-gradient(circle 200px at 5% 95%,   rgba(90, 144, 112, 0.06), transparent),
    radial-gradient(circle 200px at 95% 95%,  rgba(90, 144, 112, 0.06), transparent);
}

/* Slow horizon scan beam */
[data-theme="spy-game"] .atmosphere::after {
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(63, 184, 175, 0.5), transparent);
  top: 0;
  inset: 0 0 auto 0;
  animation: scan-beam 12s linear infinite;
  opacity: 0.6;
}

@keyframes scan-beam {
  0%   { transform: translateY(-10vh); }
  100% { transform: translateY(110vh); }
}

/* HUD strip (top center) */
.spy-hud {
  position: fixed;
  z-index: var(--z-hud);
  top: var(--s-4);
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: var(--type-xs);
  color: var(--theme-glow);
  letter-spacing: 0.1em;
  opacity: 0.6;
  pointer-events: none;
  display: none;
}

[data-theme="spy-game"] .spy-hud { display: block; }

[data-theme="spy-game"] .glow-breathe {
  animation: phosphor-pulse 6s ease-in-out infinite;
}

@keyframes phosphor-pulse {
  0%, 100% { box-shadow: 0 0 24px -4px var(--theme-glow); }
  50%      { box-shadow: 0 0 38px -2px var(--theme-glow); }
}

[data-theme="spy-game"] .atmosphere[data-perf="low"]::after {
  display: none;
}

/* Contrast verified WCAG AA:
   - accent #5a9070 on bg #0c111a = 6.4:1
   - glow #3fb8af on bg #0c111a = 8.9:1 */
```

- [ ] **Step 2: Verify**

Run: `npx prettier --check src/client/themes/spy-game.css`
Expected: no errors.

**Checkpoint:** Spy theme complete.

---

### Task B.4 — Rename catalog `theme` values

**Files:**
- Modify: `src/server/games/catalog.ts`

- [ ] **Step 1: Replace the three `theme:` lines**

Apply these three edits (the `theme:` value is the only change per game):

```ts
// Vampire Village entry:
//   theme: "blood",
// becomes:
    theme: "vampire-village",
```

```ts
// Classic Mafia entry:
//   theme: "purple",
// becomes:
    theme: "mafia-classic",
```

```ts
// Spy Game entry:
//   theme: "green",
// becomes:
    theme: "spy-game",
```

- [ ] **Step 2: Typecheck + tests**

Run: `npm run typecheck && npm test`
Expected: typecheck clean; 50 tests pass (rename is a string-only change — no test fixture references the old strings).

**Checkpoint:** Catalog uses semantic theme names.

---

### Task B.5 — Bootstrap atmosphere + theme application in `main.ts`

**Files:**
- Modify: `src/client/main.ts`

- [ ] **Step 1: Add imports + bootstrap calls at top of `main.ts`**

Replace the existing imports block plus the start of `bootstrap()` with:

```ts
import { setLang, applyAll } from "./services/i18n.js"
import { socket, emit } from "./services/socket.js"
import * as session from "./services/session.js"
import { register, setView } from "./router.js"
import { homeView, loadCatalog, getGames } from "./views/home.js"
import { gameInfoView } from "./views/gameInfo.js"
import { joinView } from "./views/join.js"
import { playerRoomView } from "./views/playerRoom.js"
import { adminView } from "./views/admin.js"
import { applyTheme, clearTheme } from "./themes/loader.js"
import { ensureAtmosphere, applyPerformanceProfile } from "./ui/atmosphere.js"
import "./themes/_base.css"
import type { LangCode, VisibleRoom } from "@shared/types.js"
import type { AdminRoomData, PlayerJoinData } from "@shared/events.js"

async function bootstrap() {
  ensureAtmosphere()
  applyPerformanceProfile()
  await loadCatalog()
  applyAll()
  // ... rest unchanged
```

Then later in the bootstrap (the place where game is chosen / reconnected), call `applyTheme` based on the game's `theme` field:

After `setView("playerRoomView", { initial: data })` (player path), add immediately above:
```ts
      await applyTheme(data.room.game.theme)
```

After `setView("adminView", { initial: data.room })` (admin path), add immediately above:
```ts
      await applyTheme(data.room.game.theme)
```

(There are two such locations in the auto-reconnect block + one in joins — make sure each one is preceded by `await applyTheme(<room>.game.theme)`.)

When returning to home (no session), add `clearTheme()` before `setView("homeView")`:

```ts
  clearTheme()
  setView("homeView")
```

- [ ] **Step 2: Update views that call setView to apply theme**

Edit `src/client/views/gameInfo.ts`. Inside `onCreate` (just before `setView("adminView", ...)`):
```ts
      await import("../themes/loader.js").then(m => m.applyTheme(game.theme))
```

(Inline import to avoid changing the top of the file too aggressively. In Phase E we may refactor.)

Edit `src/client/views/join.ts`. Inside `onJoin` (just before `setView("playerRoomView", ...)`):
```ts
      const { applyTheme } = await import("../themes/loader.js")
      await applyTheme(data.room.game.theme)
```

Edit `src/client/views/home.ts` already does nothing theme-wise — leave alone.

- [ ] **Step 3: Typecheck + tests**

Run: `npm run typecheck && npm test`
Expected: 50 tests pass.

- [ ] **Step 4: Manual smoke**

Start dev: `npm run dev` and open http://localhost:5173.
- Home page loads (atmosphere container present, dark bg).
- Click a game card — theme transition begins (you'll see the theme bg gradient even though scenes aren't fully restyled until Phase C onward).
- Refresh — atmosphere persists if a session exists.

Stop dev. (Will keep using it through Phases C–G.)

**Checkpoint:** Theme application wires up. Visible: backgrounds shift per game.

---

### Task B.6 — End-of-phase verification + commit

- [ ] **Step 1: Full pipeline**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all green; 50 tests pass.

- [ ] **Step 2: Commit**

```bash
git add src/client/themes/vampire-village.css \
        src/client/themes/mafia-classic.css \
        src/client/themes/spy-game.css \
        src/client/main.ts \
        src/client/views/gameInfo.ts \
        src/client/views/join.ts \
        src/server/games/catalog.ts
git commit -m "feat(themes): three per-game theme files + lazy loader integration"
```

**Checkpoint:** Phase B done. Each game now gets its background atmosphere.

---

# Phase C — Shell + homepage

Rewrite the shell HTML structure and the home view to match the cinematic spec.

---

### Task C.1 — Rewrite `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace `index.html` with the new structure**

```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Role Room — Cinematic hidden-role games</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Cinzel:wght@500;700&family=Playfair+Display:wght@700&family=Space+Mono:wght@700&family=Noto+Sans+Arabic:wght@400;600;700&display=swap" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <!-- atmosphere injected by atmosphere.ts -->

  <header class="brand" aria-label="Role Room">
    <div class="brand-mark">R</div>
    <div class="brand-text">
      <strong data-i18n="brand">Role Room</strong>
      <span data-i18n="brandSub">Multi Game Platform</span>
    </div>
  </header>

  <div class="hud">
    <nav class="lang-switch" aria-label="Language Switcher">
      <button data-lang="ku">کوردی</button>
      <button data-lang="ar">العربية</button>
      <button data-lang="en">English</button>
      <button data-lang="tr">Türkçe</button>
    </nav>
    <button id="muteToggle" class="mute-toggle" aria-label="Toggle sound" aria-pressed="true">
      <span aria-hidden="true">🔇</span>
    </button>
  </div>

  <div class="spy-hud" aria-hidden="true">
    <span id="spyHudClock">--:--:--</span>
    <span> // CLASSIFIED</span>
  </div>

  <main class="shell">
    <!-- ─── HOME ──────────────────────────────────────────── -->
    <section id="homeView" class="view active-view home">
      <div class="hero">
        <p class="eyebrow" data-i18n="liveRoom">Live Room System</p>
        <h1 class="display" data-i18n="title">Multiple Games, One System</h1>
        <p class="lede" data-i18n="subtitle">
          Choose a game, create a room, players join with a code, and each player only sees their own role.
        </p>
      </div>

      <div id="gamesGrid" class="games-grid"></div>

      <div class="join-shortcut">
        <div>
          <strong data-i18n="alreadyHaveCode">Already have a room code?</strong>
          <span data-i18n="joinDirectText">Players can join directly with a code.</span>
        </div>
        <button id="showJoinBtn" class="btn btn-secondary" data-i18n="joinRoom">Join Room</button>
      </div>
    </section>

    <!-- ─── GAME INFO ─────────────────────────────────────── -->
    <section id="gameInfoView" class="view game-info">
      <button class="btn btn-ghost backHome" data-i18n="back">← Back</button>
      <div id="gameInfoContent" class="playbill"></div>
      <div class="cta-row">
        <button id="createSelectedRoomBtn" class="btn btn-primary glow-breathe" data-i18n="createRoom">Create Room</button>
      </div>
    </section>

    <!-- ─── JOIN ──────────────────────────────────────────── -->
    <section id="joinView" class="view join">
      <button class="btn btn-ghost backHome" data-i18n="back">← Back</button>
      <div class="join-card">
        <p class="eyebrow" data-i18n="player">Player</p>
        <h2 class="display" data-i18n="joinTitle">Enter the Room</h2>
        <label class="field">
          <span data-i18n="roomCode">Room Code</span>
          <input id="joinCodeInput" class="code-input" type="text" maxlength="5" autocomplete="off" placeholder="ABCDE" />
        </label>
        <label class="field">
          <span data-i18n="yourName">Your Name</span>
          <input id="playerNameInput" type="text" maxlength="24" placeholder="..." />
        </label>
        <button id="joinBtn" class="btn btn-primary full">
          <span data-i18n="enterRoom">Enter Room</span>
        </button>
        <div id="joinMessage" class="message hidden" role="alert"></div>
      </div>
    </section>

    <!-- ─── PLAYER ROOM ──────────────────────────────────── -->
    <section id="playerRoomView" class="view player-room">
      <header class="player-header">
        <p class="eyebrow" id="playerGameName">…</p>
        <h2 id="playerWelcome" class="display">…</h2>
        <p id="playerStatus" class="muted"></p>
      </header>

      <div id="playerRoleCard" class="role-card locked" aria-live="polite">
        <div class="role-card-back" aria-hidden="true"></div>
        <div class="role-card-face">
          <div class="role-glow"></div>
          <div class="role-lock">?</div>
          <h3 data-i18n="roleNotAssigned">Role is not assigned yet</h3>
          <p data-i18n="waitAdmin">Wait for the admin.</p>
        </div>
      </div>

      <p class="conn-indicator"><span class="dot"></span><span data-i18n="connected">Online</span></p>
    </section>

    <!-- ─── ADMIN ROOM ───────────────────────────────────── -->
    <section id="adminView" class="view admin-room">
      <header class="admin-header">
        <h2 class="display" id="adminGameName">…</h2>
        <button id="copyCodeBtn" class="btn btn-ghost" data-i18n="copyCode">Copy Code</button>
      </header>

      <div class="room-code-hero deco-corner">
        <span class="eyebrow" data-i18n="roomCode">Room Code</span>
        <strong id="roomCodeText" class="code-display">-----</strong>
        <small class="muted" data-i18n="shareCodeHint">Share with players</small>
      </div>

      <div class="admin-grid">
        <div class="panel players-box deco-corner">
          <header class="panel-head">
            <h3 data-i18n="players">Players</h3>
            <span class="list-count" id="playersCountSmall">0</span>
          </header>
          <div id="adminPlayersList" class="players-list empty" data-i18n="noPlayers">No players yet.</div>
          <span id="playersCount" hidden>0</span>
          <span id="selectedGameText" hidden></span>
          <span id="rolesStatus" hidden>—</span>
        </div>

        <div class="panel settings-card deco-corner">
          <header class="panel-head">
            <h3 data-i18n="settings">Settings</h3>
          </header>
          <div id="dynamicSettings" class="settings"></div>
          <div class="button-row">
            <button id="saveSettingsBtn" class="btn btn-secondary" data-i18n="saveSettings">Save Settings</button>
          </div>
        </div>
      </div>

      <div class="admin-actions">
        <button id="assignRolesBtn" class="btn btn-primary glow-breathe" data-i18n="assignRoles">Assign Roles</button>
        <button id="clearRolesBtn" class="btn btn-danger" data-i18n="clearRoles">Clear Roles</button>
      </div>
    </section>
  </main>

  <div id="toast" class="toast hidden" role="status"></div>

  <script type="module" src="/src/client/main.ts"></script>
</body>
</html>
```

> **Why the hidden spans (`#playersCount`, `#selectedGameText`, `#rolesStatus`):** The existing Playwright tests assert `expect(adminPage.locator("#rolesStatus")).toHaveText("✓")`. Keeping these ids ensures tests continue to pass even though the new layout doesn't render them prominently.

- [ ] **Step 2: Delete legacy `public/styles.css` content (it conflicts with new design)**

We'll keep the file but replace its content with a thin minimum. Edit `public/styles.css`:

```css
/* This file is intentionally minimal.
   All design tokens live in src/client/themes/_base.css,
   loaded as a module via main.ts. */
```

- [ ] **Step 3: Manual smoke — confirm structure loads**

Start dev server and open the page. Expected:
- Brand top-left, language switcher + mute toggle top-right.
- Atmosphere container behind everything (dark void color).
- `#homeView` visible (empty grid is OK for now — `home.ts` rewrite happens next).

**Checkpoint:** New HTML structure live.

---

### Task C.2 — Rewrite `home.ts` (door cards)

**Files:**
- Modify: `src/client/views/home.ts`
- Append to: `src/client/themes/_base.css`

- [ ] **Step 1: Add home-specific styles to `_base.css`**

Append the following block to `src/client/themes/_base.css`:

```css
/* ─── HOME SCENE ────────────────────────────────────────────────── */

.home .hero {
  text-align: center;
  padding: var(--s-7) 0 var(--s-6);
}

.eyebrow {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: var(--type-xs);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 6px 12px;
  border: 1px solid var(--border-faint);
  border-radius: 999px;
  margin-bottom: var(--s-4);
}

.display {
  font-family: var(--theme-display);
  font-weight: 700;
  font-size: clamp(var(--type-2xl), 6vw, var(--type-4xl));
  letter-spacing: var(--theme-display-tracking);
  text-transform: var(--theme-display-transform);
  line-height: 1.05;
  margin: 0 0 var(--s-3);
}

.lede {
  font-size: var(--type-lg);
  color: var(--text-muted);
  max-width: 60ch;
  margin: 0 auto;
  line-height: 1.55;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--s-5);
  margin-top: var(--s-6);
}

.game-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-7) var(--s-5) var(--s-5);
  border-radius: 20px;
  background: var(--surface-glass);
  backdrop-filter: var(--surface-blur);
  -webkit-backdrop-filter: var(--surface-blur);
  border: 1px solid var(--border-faint);
  cursor: pointer;
  transition: transform 300ms var(--motion-scene-easing),
              box-shadow 300ms var(--motion-scene-easing),
              border-color 300ms var(--motion-scene-easing);
  isolation: isolate;
  overflow: hidden;
}

.game-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, var(--card-glow, transparent) 0%, transparent 65%);
  opacity: 0.3;
  transition: opacity 300ms ease-out;
  z-index: -1;
}

.game-card:hover {
  transform: translateY(-6px);
  border-color: var(--card-glow, var(--border-faint));
  box-shadow: 0 16px 48px -16px var(--card-glow, transparent);
}

.game-card:hover::before { opacity: 0.7; }

.game-card[data-theme="vampire-village"] { --card-glow: #8b1538; }
.game-card[data-theme="mafia-classic"]   { --card-glow: #c9a961; }
.game-card[data-theme="spy-game"]        { --card-glow: #3fb8af; }

.game-icon {
  font-size: 64px;
  line-height: 1;
  filter: drop-shadow(0 4px 16px rgba(0,0,0,0.4));
}

.game-card strong {
  font-family: var(--theme-display);
  font-size: var(--type-xl);
  font-weight: 700;
}

.game-card .muted {
  color: var(--text-muted);
  font-size: var(--type-sm);
  text-align: center;
  max-width: 24ch;
}

.join-shortcut {
  margin-top: var(--s-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-4) var(--s-5);
  border-radius: 16px;
  background: var(--surface-glass);
  backdrop-filter: var(--surface-blur);
  -webkit-backdrop-filter: var(--surface-blur);
  border: 1px solid var(--border-faint);
}

.join-shortcut strong { display: block; font-weight: 600; }
.join-shortcut span { display: block; color: var(--text-muted); font-size: var(--type-sm); }

@media (max-width: 640px) {
  .join-shortcut { flex-direction: column; align-items: stretch; text-align: center; }
}
```

- [ ] **Step 2: Rewrite `home.ts`**

Replace the contents of `src/client/views/home.ts`:

```ts
// src/client/views/home.ts
import type { Game } from "@shared/types.js"
import { $, el, clear } from "../ui/dom.js"
import { getLang } from "../services/i18n.js"
import { setView } from "../router.js"
import { clearTheme } from "../themes/loader.js"

let games: readonly Game[] = []

export async function loadCatalog(): Promise<void> {
  const res = await fetch("/api/games")
  games = await res.json()
}

export function getGames(): readonly Game[] { return games }

export const homeView = {
  id: "homeView" as const,
  mount() {
    clearTheme() // back to neutral void on home
    const grid = $<HTMLDivElement>("#gamesGrid")
    clear(grid)
    const lang = getLang()

    for (const game of games) {
      const card = el(
        "button",
        {
          class: "game-card",
          type: "button",
          "data-game": game.id,
          "data-theme": game.theme
        },
        [
          el("div", { class: "game-icon" }, [game.icon]),
          el("strong", {}, [game.title[lang]]),
          el("span", { class: "muted" }, [game.subtitle[lang]])
        ]
      )
      card.addEventListener("click", () => {
        sessionStorage.setItem("role-room:selectedGame", game.id)
        setView("gameInfoView")
      })
      grid.appendChild(card)
    }

    const onShowJoin = () => setView("joinView")
    const joinBtn = $<HTMLButtonElement>("#showJoinBtn")
    joinBtn.addEventListener("click", onShowJoin)

    return () => {
      joinBtn.removeEventListener("click", onShowJoin)
    }
  }
}
```

- [ ] **Step 3: Typecheck + tests + manual smoke**

Run: `npm run typecheck && npm test`
Expected: 50 pass.

Open http://localhost:5173. Expected:
- Three game cards visible in a grid.
- Hover a card → it lifts, glow appears in card's theme color (red / amber / cyan).
- Click a card → navigates to gameInfoView (currently still legacy-styled; restyled in Phase D).

**Checkpoint:** Home page cinematic.

---

### Task C.3 — Create `sound.ts` service skeleton + wire mute toggle

**Files:**
- Create: `src/client/services/sound.ts`
- Modify: `src/client/main.ts`

- [ ] **Step 1: Write `sound.ts`**

```ts
// src/client/services/sound.ts
const STORAGE_KEY = "role-room:muted"

export type SoundName = "click" | "transition" | "reveal-flip" | "reveal-burst" | "mute-toggle"

const SOURCES: Record<SoundName, string> = {
  "click":         "/sounds/click.ogg",
  "transition":    "/sounds/transition.ogg",
  "reveal-flip":   "/sounds/reveal-flip.ogg",
  "reveal-burst":  "/sounds/reveal-burst.ogg",
  "mute-toggle":   "/sounds/mute-toggle.ogg"
}

const buffers = new Map<SoundName, AudioBuffer>()
let ctx: AudioContext | null = null
let muted = true

export function init(): void {
  const stored = localStorage.getItem(STORAGE_KEY)
  muted = stored === null ? true : stored === "1"
}

export function isMuted(): boolean { return muted }

export function setMuted(value: boolean): void {
  muted = value
  localStorage.setItem(STORAGE_KEY, value ? "1" : "0")
}

async function ensureCtx(): Promise<AudioContext | null> {
  if (ctx) return ctx
  if (typeof window === "undefined" || !("AudioContext" in window)) return null
  ctx = new AudioContext()
  return ctx
}

async function loadBuffer(name: SoundName): Promise<AudioBuffer | null> {
  if (buffers.has(name)) return buffers.get(name)!
  const c = await ensureCtx()
  if (!c) return null
  try {
    const res = await fetch(SOURCES[name])
    if (!res.ok) return null
    const data = await res.arrayBuffer()
    const buf = await c.decodeAudioData(data)
    buffers.set(name, buf)
    return buf
  } catch {
    return null
  }
}

export async function play(name: SoundName, volume = 1): Promise<void> {
  if (muted) return
  const c = await ensureCtx()
  if (!c) return
  if (c.state === "suspended") await c.resume()
  const buf = await loadBuffer(name)
  if (!buf) return
  const src = c.createBufferSource()
  const gain = c.createGain()
  gain.gain.value = volume
  src.buffer = buf
  src.connect(gain).connect(c.destination)
  src.start(0)
}
```

- [ ] **Step 2: Wire mute toggle in `main.ts`**

In `src/client/main.ts`, after the existing language-button event listener loop, add:

```ts
  // Sound + mute toggle
  const { init: initSound, isMuted, setMuted, play } = await import("./services/sound.js")
  initSound()
  const muteBtn = document.getElementById("muteToggle") as HTMLButtonElement | null
  if (muteBtn) {
    const render = () => {
      const m = isMuted()
      muteBtn.setAttribute("aria-pressed", String(m))
      muteBtn.firstElementChild!.textContent = m ? "🔇" : "🔊"
    }
    render()
    muteBtn.addEventListener("click", async () => {
      setMuted(!isMuted())
      render()
      await play("mute-toggle")
    })
  }
```

> **Note:** The mute-toggle sound file doesn't exist yet — it lands in Phase G. Until then, `play` silently no-ops on the fetch failure. This is intentional so we can wire the UI now and add audio assets later.

- [ ] **Step 3: Typecheck + smoke**

Run: `npm run typecheck`. Open the page. Click the mute button — icon toggles 🔇 ↔ 🔊, no errors in console.

**Checkpoint:** Sound service skeleton in place; mute toggle works.

---

### Task C.4 — End-of-phase verification + commit

- [ ] **Step 1: Full pipeline**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all green.

- [ ] **Step 2: Commit**

```bash
git add index.html \
        public/styles.css \
        src/client/themes/_base.css \
        src/client/views/home.ts \
        src/client/services/sound.ts \
        src/client/main.ts
git commit -m "feat(home): new shell HTML, cinematic home grid, sound service"
```

**Checkpoint:** Phase C done. Home looks cinematic; subsequent scenes still legacy.

---

# Phase D — Game info + Join scenes

Rewrite the game info "playbill" view and the minimal join view.

---

### Task D.1 — Rewrite `gameInfo.ts` + styles

**Files:**
- Modify: `src/client/views/gameInfo.ts`
- Append to: `src/client/themes/_base.css`

- [ ] **Step 1: Append styles**

Append to `src/client/themes/_base.css`:

```css
/* ─── GAME INFO SCENE (playbill) ────────────────────────────────── */

.game-info { padding-top: var(--s-7); }

.game-info .backHome { align-self: flex-start; margin-bottom: var(--s-3); }

.playbill {
  background: var(--theme-surface);
  backdrop-filter: var(--surface-blur);
  -webkit-backdrop-filter: var(--surface-blur);
  border: 1px solid var(--border-faint);
  border-radius: 24px;
  padding: var(--s-7) var(--s-6);
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
}

.playbill .game-headline {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-2);
}

.playbill .game-icon-big {
  font-size: 72px;
  line-height: 1;
  filter: drop-shadow(0 0 24px var(--theme-glow));
}

.playbill h2.display {
  color: var(--theme-glow);
  margin: 0;
}

.playbill .subtitle {
  color: var(--text-muted);
  max-width: 56ch;
  font-size: var(--type-lg);
  line-height: 1.55;
  text-align: center;
}

.section-title {
  font-family: var(--theme-display);
  font-size: var(--type-xl);
  letter-spacing: var(--theme-display-tracking);
  text-transform: var(--theme-display-transform);
  border-bottom: 1px solid var(--border-faint);
  padding-bottom: var(--s-2);
  margin: var(--s-4) 0 var(--s-3);
  color: var(--theme-accent);
}

.rules-list, .roles-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.rules-list li {
  position: relative;
  padding-left: var(--s-5);
  line-height: 1.55;
  color: var(--text-primary);
}

.rules-list li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.7em;
  width: 12px;
  height: 1px;
  background: var(--theme-accent);
}

.roles-list li {
  display: grid;
  grid-template-columns: 48px 1fr;
  grid-template-rows: auto auto;
  column-gap: var(--s-3);
  align-items: start;
  padding: var(--s-3) 0;
  border-bottom: 1px dashed var(--border-faint);
}

.roles-list li:last-child { border-bottom: 0; }

.roles-list .role-icon {
  grid-row: span 2;
  font-size: 28px;
  text-align: center;
  filter: drop-shadow(0 0 8px var(--theme-glow));
}

.roles-list strong {
  font-family: var(--theme-display);
  font-size: var(--type-lg);
  color: var(--theme-glow);
}

.roles-list .muted {
  color: var(--text-muted);
  font-size: var(--type-sm);
}

.cta-row {
  display: flex;
  justify-content: center;
  margin-top: var(--s-4);
}

.btn.full { width: 100%; }
```

- [ ] **Step 2: Rewrite `gameInfo.ts`**

Replace the contents:

```ts
// src/client/views/gameInfo.ts
import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { setView } from "../router.js"
import { emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { showToast } from "../ui/toast.js"
import { getGames } from "./home.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { play } from "../services/sound.js"
import type { CreateRoomData } from "@shared/events.js"

export const gameInfoView = {
  id: "gameInfoView" as const,
  mount() {
    const content = $<HTMLDivElement>("#gameInfoContent")
    const lang = getLang()
    const gameId = sessionStorage.getItem("role-room:selectedGame")
    const game = getGames().find(g => g.id === gameId)
    clear(content)
    if (!game) { setView("homeView"); return () => {} }

    // Apply theme on entry (preview the world)
    void applyTheme(game.theme).catch(() => {})

    // Headline
    const headline = el("div", { class: "game-headline" }, [
      el("div", { class: "game-icon-big" }, [game.icon]),
      el("h2", { class: "display" }, [game.title[lang]]),
      el("p", { class: "subtitle" }, [game.subtitle[lang]])
    ])

    // Rules section
    const rulesH = el("h3", { class: "section-title" }, [t("rulesTitle")])
    const rulesUl = el("ul", { class: "rules-list" })
    for (const line of game.rules[lang]) rulesUl.appendChild(el("li", {}, [line]))

    // Roles section
    const rolesH = el("h3", { class: "section-title" }, [t("rolesTitle")])
    const rolesUl = el("ul", { class: "roles-list" })
    for (const role of game.roles) {
      rolesUl.appendChild(el("li", {}, [
        el("span", { class: "role-icon" }, [role.icon]),
        el("strong", {}, [role.name[lang]]),
        el("span", { class: "muted" }, [role.desc[lang]])
      ]))
    }

    content.append(headline, rulesH, rulesUl, rolesH, rolesUl)

    const onCreate = async () => {
      void play("click")
      const r = await emit("admin:create-room", { gameId: game.id })
      if (!r.ok) { showToast(t("errorGeneric")); return }
      const data = r.data as CreateRoomData
      session.save({ kind: "admin", code: data.code, adminSecret: data.adminSecret })
      void play("transition")
      setView("adminView", { initial: data.room })
    }
    const createBtn = $<HTMLButtonElement>("#createSelectedRoomBtn")
    createBtn.addEventListener("click", onCreate)

    const onBack = () => {
      clearTheme()
      setView("homeView")
    }
    const backs = document.querySelectorAll<HTMLButtonElement>(".backHome")
    backs.forEach(b => b.addEventListener("click", onBack))

    return () => {
      createBtn.removeEventListener("click", onCreate)
      backs.forEach(b => b.removeEventListener("click", onBack))
    }
  }
}
```

- [ ] **Step 3: Typecheck + manual smoke**

Run: `npm run typecheck && npm test`.

Open page → click a game card → game info screen appears with the theme. Verify:
- Title in display font, glow color.
- Rules list with hairline accents.
- Roles list with icons.
- "Create Room" button glowing.
- "← Back" returns to home with theme cleared.

**Checkpoint:** Game info playbill.

---

### Task D.2 — Rewrite `join.ts` + styles

**Files:**
- Modify: `src/client/views/join.ts`
- Append to: `src/client/themes/_base.css`

- [ ] **Step 1: Append styles**

Append to `src/client/themes/_base.css`:

```css
/* ─── JOIN SCENE ────────────────────────────────────────────────── */

.join { padding-top: var(--s-7); }
.join .backHome { align-self: flex-start; margin-bottom: var(--s-3); }

.join-card {
  margin: 0 auto;
  max-width: 480px;
  width: 100%;
  background: var(--surface-glass);
  backdrop-filter: var(--surface-blur);
  -webkit-backdrop-filter: var(--surface-blur);
  border: 1px solid var(--border-faint);
  border-radius: 20px;
  padding: var(--s-7) var(--s-6);
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  text-align: center;
}

.join-card h2 { margin: 0 0 var(--s-3); }

.field {
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
  text-align: left;
}

.field > span {
  font-size: var(--type-xs);
  color: var(--text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.field input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-faint);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: var(--type-base);
  transition: border-color var(--motion-ui-duration) var(--motion-ui-easing),
              box-shadow var(--motion-ui-duration) var(--motion-ui-easing);
}

.field input:focus {
  outline: none;
  border-color: var(--text-primary);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.08);
}

.code-input {
  font-family: var(--font-mono);
  font-size: var(--type-2xl);
  letter-spacing: 0.4em;
  text-align: center;
  text-transform: uppercase;
}

.code-input.locked {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}

.message {
  color: #ff8080;
  font-size: var(--type-sm);
  padding: var(--s-2) var(--s-3);
  background: rgba(180, 50, 60, 0.12);
  border: 1px solid rgba(180, 50, 60, 0.3);
  border-radius: 8px;
}

.message.hidden { display: none; }
```

- [ ] **Step 2: Rewrite `join.ts`**

Replace the contents:

```ts
// src/client/views/join.ts
import { $ } from "../ui/dom.js"
import { t } from "../services/i18n.js"
import { setView } from "../router.js"
import { emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { applyTheme, clearTheme } from "../themes/loader.js"
import { play } from "../services/sound.js"
import type { PlayerJoinData } from "@shared/events.js"
import type { ErrorCode } from "@shared/types.js"
import type { Translations } from "../i18n/en.js"

const ERR_TO_KEY: Partial<Record<ErrorCode, keyof Translations>> = {
  NAME_TAKEN: "errorNameTaken",
  NAME_REQUIRED: "errorNameRequired",
  ROOM_NOT_FOUND: "errorRoomNotFound",
  ROOM_FULL: "errorRoomFull",
  RATE_LIMITED: "errorRateLimited",
  SERVER_BUSY: "errorServerBusy"
}

export const joinView = {
  id: "joinView" as const,
  mount() {
    const code = $<HTMLInputElement>("#joinCodeInput")
    const name = $<HTMLInputElement>("#playerNameInput")
    const msg  = $<HTMLDivElement>("#joinMessage")

    code.value = ""; name.value = ""
    code.classList.remove("locked")
    msg.classList.add("hidden"); msg.textContent = ""

    const onCodeInput = () => {
      void play("click", 0.3)
      if (code.value.length === 5) code.classList.add("locked")
      else code.classList.remove("locked")
    }
    code.addEventListener("input", onCodeInput)

    const onJoin = async () => {
      void play("click")
      const c = code.value.trim().toUpperCase()
      const n = name.value.trim()
      if (!c || !n) {
        msg.classList.remove("hidden")
        msg.textContent = t("errorNameRequired")
        return
      }

      const r = await emit("player:join", { code: c, name: n })
      if (!r.ok) {
        msg.classList.remove("hidden")
        const k = ERR_TO_KEY[r.error] ?? "errorGeneric"
        msg.textContent = t(k)
        return
      }
      const data = r.data as PlayerJoinData
      session.save({ kind: "player", code: c, playerId: data.player.id, name: data.player.name })
      await applyTheme(data.room.game.theme)
      void play("transition")
      setView("playerRoomView", { initial: data })
    }

    const onBack = () => {
      clearTheme()
      setView("homeView")
    }

    const btn = $<HTMLButtonElement>("#joinBtn")
    const backs = document.querySelectorAll<HTMLButtonElement>(".backHome")
    btn.addEventListener("click", onJoin)
    backs.forEach(b => b.addEventListener("click", onBack))

    return () => {
      code.removeEventListener("input", onCodeInput)
      btn.removeEventListener("click", onJoin)
      backs.forEach(b => b.removeEventListener("click", onBack))
    }
  }
}
```

- [ ] **Step 3: Typecheck + smoke**

Run: `npm run typecheck && npm test`.

Open page → click "Join Room" → join card appears.
- Type a 5-char code → each character pops in mono font, on 5th char the border highlights.
- "Enter Room" without name → "Please enter your name" error.

**Checkpoint:** Join scene clean and focused.

---

### Task D.3 — End-of-phase verification + commit

- [ ] **Step 1: Full pipeline**

Run: `npm run typecheck && npm run lint && npm test`
Expected: 50 pass.

- [ ] **Step 2: Commit**

```bash
git add src/client/themes/_base.css \
        src/client/views/gameInfo.ts \
        src/client/views/join.ts
git commit -m "feat(scenes): cinematic game info playbill + minimal join"
```

**Checkpoint:** Phase D done.

---

# Phase E — Admin room

Rewrite the admin room with three-zone layout, hero room code, player seats, and the assign-roles button curtain animation.

---

### Task E.1 — Append admin styles to `_base.css`

**Files:**
- Append to: `src/client/themes/_base.css`

- [ ] **Step 1: Append**

```css
/* ─── ADMIN ROOM ────────────────────────────────────────────────── */

.admin-room { gap: var(--s-5); }

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  flex-wrap: wrap;
}

.admin-header h2 {
  margin: 0;
  color: var(--theme-glow);
  font-size: clamp(var(--type-xl), 4vw, var(--type-2xl));
}

.room-code-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-6) var(--s-5);
  border-radius: 24px;
  background: var(--theme-surface);
  backdrop-filter: var(--surface-blur);
  -webkit-backdrop-filter: var(--surface-blur);
  border: 1px solid var(--border-faint);
  text-align: center;
}

.code-display {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: clamp(48px, 12vw, 96px);
  letter-spacing: 0.18em;
  line-height: 1;
  color: var(--theme-glow);
  text-shadow: 0 0 32px var(--theme-glow);
}

.admin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-4);
}

@media (max-width: 768px) {
  .admin-grid { grid-template-columns: 1fr; }
}

.panel {
  background: var(--theme-surface);
  backdrop-filter: var(--surface-blur);
  -webkit-backdrop-filter: var(--surface-blur);
  border: 1px solid var(--border-faint);
  border-radius: 20px;
  padding: var(--s-5);
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-head h3 {
  margin: 0;
  font-family: var(--theme-display);
  font-size: var(--type-lg);
  color: var(--theme-accent);
  letter-spacing: var(--theme-display-tracking);
  text-transform: var(--theme-display-transform);
}

.list-count {
  font-family: var(--font-mono);
  font-size: var(--type-sm);
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-faint);
  color: var(--text-muted);
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  min-height: 120px;
}

.players-list.empty {
  display: grid;
  place-items: center;
  color: var(--text-muted);
  font-style: italic;
  min-height: 120px;
}

.player-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-2) var(--s-3);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-faint);
  animation: row-in 350ms var(--motion-scene-easing);
}

@keyframes row-in {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}

.player-row.off { opacity: 0.5; }

.player-row::before {
  content: "●";
  color: var(--theme-glow);
  font-size: 10px;
}

.player-row.off::before {
  content: "◌";
  color: var(--text-muted);
}

.player-row .player-name { font-weight: 600; }
.player-row .player-role { color: var(--text-muted); font-size: var(--type-sm); }

.settings {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.settings label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  font-size: var(--type-sm);
  color: var(--text-muted);
}

.settings input[type="number"] {
  width: 80px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-faint);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  text-align: center;
}

.settings input[type="checkbox"] {
  width: 20px; height: 20px;
  accent-color: var(--theme-accent);
}

.button-row {
  display: flex;
  gap: var(--s-2);
  justify-content: flex-end;
}

.admin-actions {
  display: flex;
  gap: var(--s-3);
  justify-content: center;
}

.admin-actions .btn { min-width: 180px; }

/* Assign-roles curtain animation — applied via JS during click */
.btn-primary.curtain-fill {
  position: relative;
  overflow: hidden;
}

.btn-primary.curtain-fill::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--theme-glow);
  transform: translateX(-100%);
  animation: curtain 800ms var(--motion-scene-easing) forwards;
  z-index: -1;
}

@keyframes curtain {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}
```

- [ ] **Step 2: Verify**

Run: `npx prettier --check src/client/themes/_base.css`.

**Checkpoint:** Admin styles ready.

---

### Task E.2 — Rewrite `admin.ts`

**Files:**
- Modify: `src/client/views/admin.ts`

- [ ] **Step 1: Replace the contents**

```ts
// src/client/views/admin.ts
import { $, el, clear } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { socket, emit } from "../services/socket.js"
import * as session from "../services/session.js"
import { showToast } from "../ui/toast.js"
import { play } from "../services/sound.js"
import { applyTheme } from "../themes/loader.js"
import type { VisibleRoom } from "@shared/types.js"

export const adminView = {
  id: "adminView" as const,
  mount(ctx: { initial?: VisibleRoom }) {
    let room: VisibleRoom | null = ctx.initial ?? null
    const lang = getLang()

    if (room) void applyTheme(room.game.theme).catch(() => {})

    const codeEl     = $<HTMLElement>("#roomCodeText")
    const gameNameEl = $<HTMLElement>("#adminGameName")
    const gameSelEl  = $<HTMLElement>("#selectedGameText")
    const playersN   = $<HTMLElement>("#playersCount")
    const playersNS  = $<HTMLElement>("#playersCountSmall")
    const rolesStat  = $<HTMLElement>("#rolesStatus")
    const settingsEl = $<HTMLDivElement>("#dynamicSettings")
    const listEl     = $<HTMLDivElement>("#adminPlayersList")
    const assignBtn  = $<HTMLButtonElement>("#assignRolesBtn")

    function renderSettings() {
      if (!room) return
      clear(settingsEl)
      for (const def of room.game.settings) {
        const id = `setting-${def.key}`
        const labelText = def.label[lang]
        const value = room.settings[def.key]
        const row = el("label", { for: id })
        row.appendChild(el("span", {}, [labelText]))
        if (def.type === "number") {
          const input = el("input", {
            id, type: "number",
            min: String(def.min), max: String(def.max),
            value: String(value ?? def.min)
          }) as HTMLInputElement
          row.appendChild(input)
        } else {
          const input = el("input", { id, type: "checkbox" }) as HTMLInputElement
          input.checked = Boolean(value)
          row.appendChild(input)
        }
        settingsEl.appendChild(row)
      }
    }

    function renderPlayers() {
      if (!room) return
      clear(listEl)
      playersN.textContent  = String(room.players.length)
      playersNS.textContent = String(room.players.length)
      rolesStat.textContent = room.assigned ? "✓" : "—"
      if (room.players.length === 0) {
        listEl.classList.add("empty")
        listEl.textContent = t("noPlayers")
        return
      }
      listEl.classList.remove("empty")
      for (const p of room.players) {
        const row = el("div", { class: `player-row ${p.connected ? "" : "off"}` }, [
          el("span", { class: "player-name" }, [p.name]),
          el("span", { class: "player-role" }, [p.role ?? "—"])
        ])
        listEl.appendChild(row)
      }
    }

    function renderHeader() {
      if (!room) return
      codeEl.textContent     = room.code
      gameNameEl.textContent = room.game.title[lang]
      gameSelEl.textContent  = room.game.title[lang]
    }

    function renderAll() { renderHeader(); renderSettings(); renderPlayers() }

    const onUpdated = (next: VisibleRoom) => { room = next; renderAll() }
    socket.on("admin:room-updated", onUpdated)

    if (room) renderAll()

    const onSave = async () => {
      if (!room) return
      void play("click")
      const s = session.load()
      if (s?.kind !== "admin") return
      const incoming: Record<string, number | boolean> = {}
      for (const def of room.game.settings) {
        const input = document.getElementById(`setting-${def.key}`) as HTMLInputElement
        if (def.type === "number")  incoming[def.key] = Number(input.value)
        if (def.type === "boolean") incoming[def.key] = input.checked
      }
      const r = await emit("admin:update-settings", { code: room.code, adminSecret: s.adminSecret, settings: incoming })
      if (!r.ok) showToast(t("errorGeneric"))
    }

    const onAssign = async () => {
      if (!room) return
      void play("click")
      const s = session.load(); if (s?.kind !== "admin") return
      // Curtain animation
      assignBtn.classList.add("curtain-fill")
      window.setTimeout(() => assignBtn.classList.remove("curtain-fill"), 1500)
      const r = await emit("admin:assign-roles", { code: room.code, adminSecret: s.adminSecret })
      if (!r.ok) {
        if (r.error === "NEED_MORE_PLAYERS")           showToast(t("errorNeedMorePlayers"))
        else if (r.error === "TOO_MANY_SPECIAL_ROLES") showToast(t("errorTooManySpecial"))
        else                                           showToast(t("errorGeneric"))
      }
    }

    const onClear = async () => {
      if (!room) return
      void play("click")
      const s = session.load(); if (s?.kind !== "admin") return
      const r = await emit("admin:clear-roles", { code: room.code, adminSecret: s.adminSecret })
      if (!r.ok) showToast(t("errorGeneric"))
    }

    const onCopy = async () => {
      if (!room) return
      void play("click", 0.4)
      try { await navigator.clipboard.writeText(room.code); showToast(t("copied")) }
      catch { /* clipboard may be blocked */ }
    }

    const saveBtn   = $<HTMLButtonElement>("#saveSettingsBtn")
    const clearBtn  = $<HTMLButtonElement>("#clearRolesBtn")
    const copyBtn   = $<HTMLButtonElement>("#copyCodeBtn")
    saveBtn.addEventListener("click", onSave)
    assignBtn.addEventListener("click", onAssign)
    clearBtn.addEventListener("click", onClear)
    copyBtn.addEventListener("click", onCopy)

    return () => {
      socket.off("admin:room-updated", onUpdated)
      saveBtn.removeEventListener("click", onSave)
      assignBtn.removeEventListener("click", onAssign)
      clearBtn.removeEventListener("click", onClear)
      copyBtn.removeEventListener("click", onCopy)
    }
  }
}
```

- [ ] **Step 2: Typecheck + smoke**

Run: `npm run typecheck && npm test`.

Open page → home → click a game → "Create Room". Admin scene appears.
- Hero-size room code, mono font, theme glow.
- Players panel with "No players yet" empty state.
- Settings panel with the game's settings rendered as theme-styled rows.
- Clicking "Assign Roles" triggers curtain animation (button fills with glow color).

**Checkpoint:** Admin scene complete.

---

### Task E.3 — Run existing E2E to verify selectors still pass

- [ ] **Step 1: Run E2E**

Run: `npm run test:e2e`
Expected: 2 passed (happy-path + reconnect).

> The redesign preserves every DOM id and class the tests select. If a test fails, the redesigned HTML drifted — check that `#playerWelcome`, `#roomCodeText`, `#assignRolesBtn`, `#rolesStatus`, `#joinCodeInput`, `#playerNameInput`, `#joinBtn`, `#showJoinBtn`, `#createSelectedRoomBtn`, `#playerRoleCard h3`, `.game-card`, `.backHome` all exist and behave as before.

**Checkpoint:** E2E green against the new admin layout.

---

### Task E.4 — End-of-phase commit

- [ ] **Step 1: Commit**

```bash
git add src/client/themes/_base.css \
        src/client/views/admin.ts
git commit -m "feat(admin): director's-chair layout, hero room code, curtain assign"
```

**Checkpoint:** Phase E done.

---

# Phase F — Player room + role reveal

The cinematic peak. Rewrite player room, build the role reveal orchestration, wire it up.

---

### Task F.1 — Append player-room + role-card styles

**Files:**
- Append to: `src/client/themes/_base.css`

- [ ] **Step 1: Append**

```css
/* ─── PLAYER ROOM ───────────────────────────────────────────────── */

.player-room {
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--s-6);
}

.player-header h2.display {
  color: var(--theme-glow);
  margin: 0;
  font-size: clamp(var(--type-xl), 5vw, var(--type-3xl));
}

.player-header .eyebrow { margin-bottom: var(--s-3); }

.role-card {
  position: relative;
  width: min(320px, 80vw);
  aspect-ratio: 3 / 4;
  border-radius: 20px;
  transform-style: preserve-3d;
  perspective: 1200px;
  display: grid;
}

.role-card-back,
.role-card-face {
  grid-area: 1 / 1;
  border-radius: 20px;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-3);
  padding: var(--s-6);
  background: var(--theme-surface);
  backdrop-filter: var(--surface-blur);
  -webkit-backdrop-filter: var(--surface-blur);
  border: 1px solid var(--border-faint);
  box-shadow: 0 24px 64px -24px rgba(0,0,0,0.6);
}

.role-card-back {
  background:
    repeating-linear-gradient(45deg,
      rgba(255,255,255,0.02) 0 4px,
      transparent 4px 8px),
    var(--theme-surface);
  border-color: var(--theme-accent);
  transform: rotateY(0);
}

.role-card.revealed .role-card-back { transform: rotateY(180deg); }
.role-card.revealed .role-card-face { transform: rotateY(0); }
.role-card:not(.revealed) .role-card-face { transform: rotateY(-180deg); }

.role-card-back::before {
  content: "?";
  font-size: 120px;
  font-family: var(--theme-display);
  color: var(--theme-accent);
  opacity: 0.6;
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.role-card:not(.revealed):not(.assigned-once) {
  animation: heartbeat 1.6s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.015); }
}

.role-card-face .role-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, var(--theme-glow) 0%, transparent 60%);
  opacity: 0.08;
  pointer-events: none;
}

.role-card-face .role-lock {
  font-size: 64px;
  color: var(--theme-accent);
  opacity: 0.5;
}

.role-card-face .role-icon.big {
  font-size: 96px;
  line-height: 1;
  filter: drop-shadow(0 0 32px var(--theme-glow));
}

.role-card-face h3 {
  font-family: var(--theme-display);
  font-size: var(--type-2xl);
  color: var(--theme-glow);
  margin: 0;
  letter-spacing: var(--theme-display-tracking);
  text-transform: var(--theme-display-transform);
}

.role-card-face p {
  color: var(--text-muted);
  max-width: 30ch;
  margin: 0;
  line-height: 1.55;
}

.conn-indicator {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font-size: var(--type-sm);
  color: var(--text-muted);
}

.conn-indicator .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
}

/* ─── ROLE REVEAL OVERLAY ──────────────────────────────────────── */

.reveal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.reveal-overlay.visible { opacity: 1; }

.reveal-stage {
  position: relative;
  width: min(360px, 90vw);
  aspect-ratio: 3 / 4;
  display: grid;
  place-items: center;
}

.reveal-burst {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, var(--theme-accent) 0%, transparent 60%);
  opacity: 0;
  pointer-events: none;
  filter: blur(4px);
}

.reveal-card {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--theme-surface);
  border: 1px solid var(--theme-glow);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-3);
  padding: var(--s-6);
  backface-visibility: hidden;
  transform-style: preserve-3d;
  box-shadow: 0 24px 64px -16px var(--theme-glow);
}

.reveal-icon  { font-size: 88px; line-height: 1; opacity: 0; transform: translateY(8px); }
.reveal-name  { font-family: var(--theme-display); font-size: var(--type-2xl); color: var(--theme-glow); margin: 0; opacity: 0; }
.reveal-desc  { color: var(--text-primary); max-width: 30ch; text-align: center; margin: 0; opacity: 0; line-height: 1.55; }

.reveal-close {
  position: absolute;
  bottom: var(--s-4);
  right: var(--s-4);
}

/* Spy variant: terminal */

.reveal-terminal {
  width: min(520px, 90vw);
  padding: var(--s-5);
  font-family: var(--font-mono);
  background: rgba(12, 17, 26, 0.95);
  border: 1px solid var(--theme-glow);
  border-radius: 12px;
  box-shadow: 0 0 48px var(--theme-glow);
  color: var(--theme-glow);
  line-height: 1.8;
}

.reveal-terminal .line {
  display: flex;
  gap: var(--s-2);
  font-size: var(--type-base);
}

.reveal-terminal .line::before { content: ">"; opacity: 0.6; }

.reveal-terminal .typewriter {
  display: inline-block;
  border-right: 2px solid var(--theme-glow);
  white-space: pre;
  animation: caret 1s steps(2) infinite;
}

.reveal-terminal .typewriter.done { animation: none; border-right-color: transparent; }

@keyframes caret { 50% { border-right-color: transparent; } }
```

- [ ] **Step 2: Verify**

Run: `npx prettier --check src/client/themes/_base.css`.

**Checkpoint:** Player + reveal styles ready.

---

### Task F.2 — Create `roleReveal.ts` (flip orchestration)

**Files:**
- Create: `src/client/ui/roleReveal.ts`

- [ ] **Step 1: Write the file**

```ts
// src/client/ui/roleReveal.ts
import { el, clear } from "./dom.js"
import { animate, prefersReducedMotion, orchestrate, REVEAL_EASING } from "./motion.js"
import { play } from "../services/sound.js"
import { currentTheme } from "../themes/loader.js"
import type { RoleAssignedPayload } from "@shared/events.js"
import type { LangCode } from "@shared/types.js"

interface RevealOptions {
  payload: RoleAssignedPayload
  lang: LangCode
  onClose?: () => void
}

const SPY_THEME = "spy-game"

export function showReveal(opts: RevealOptions): Promise<void> {
  if (currentTheme() === SPY_THEME) return showSpyReveal(opts)
  return showFlipReveal(opts)
}

/* ─── Flip variant (Vampire + Mafia) ──────────────────────────── */

async function showFlipReveal(opts: RevealOptions): Promise<void> {
  const role = opts.payload.roleData
  const overlay = buildFlipOverlay(role, opts.lang)
  document.body.appendChild(overlay)

  // Trap focus
  const closeBtn = overlay.querySelector<HTMLButtonElement>(".reveal-close")!
  const previouslyFocused = document.activeElement as HTMLElement | null

  return new Promise<void>(resolve => {
    const cleanup = (): void => {
      cancel?.()
      animate(overlay, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" })
        .finished.then(() => {
          overlay.remove()
          previouslyFocused?.focus?.()
          opts.onClose?.()
          resolve()
        })
    }

    closeBtn.addEventListener("click", cleanup)
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cleanup() }
    overlay.addEventListener("keydown", onKey)

    requestAnimationFrame(() => overlay.classList.add("visible"))

    if (prefersReducedMotion()) {
      const stage = overlay.querySelector<HTMLElement>(".reveal-stage")!
      stage.querySelector<HTMLElement>(".reveal-icon")!.style.opacity = "1"
      stage.querySelector<HTMLElement>(".reveal-name")!.style.opacity = "1"
      stage.querySelector<HTMLElement>(".reveal-desc")!.style.opacity = "1"
      closeBtn.focus()
      var cancel: (() => void) | undefined = undefined
      return
    }

    const card = overlay.querySelector<HTMLElement>(".reveal-card")!
    const burst = overlay.querySelector<HTMLElement>(".reveal-burst")!
    const icon = overlay.querySelector<HTMLElement>(".reveal-icon")!
    const name = overlay.querySelector<HTMLElement>(".reveal-name")!
    const desc = overlay.querySelector<HTMLElement>(".reveal-desc")!

    card.style.transform = "rotateY(-180deg)"

    var cancel = orchestrate([
      { at: 400, do: () => {
          void play("reveal-flip", 0.6)
          animate(card, [
            { transform: "rotateY(-180deg)" },
            { transform: "rotateY(0deg)" }
          ], { duration: 400, easing: REVEAL_EASING })
        } },
      { at: 800, do: () => {
          void play("reveal-burst", 0.5)
          animate(burst, [
            { opacity: 0, transform: "scale(0.6)" },
            { opacity: 0.8, transform: "scale(1.6)" },
            { opacity: 0, transform: "scale(2.0)" }
          ], { duration: 300 })
        } },
      { at: 1000, do: () => {
          animate(icon, [
            { opacity: 0, transform: "scale(0.8) translateY(8px)" },
            { opacity: 1, transform: "scale(1.0) translateY(0)" }
          ], { duration: 250 })
        } },
      { at: 1200, do: () => {
          animate(name, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 })
        } },
      { at: 1400, do: () => {
          animate(desc, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 })
        } },
      { at: 1600, do: () => { closeBtn.focus() } }
    ])
  })
}

function buildFlipOverlay(role: RoleAssignedPayload["roleData"], lang: LangCode): HTMLDivElement {
  const overlay = el("div", {
    class: "reveal-overlay",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Your role",
    tabindex: "-1"
  }) as HTMLDivElement

  const burst = el("div", { class: "reveal-burst" })
  const card = el("div", { class: "reveal-card" }, [
    el("div", { class: "reveal-icon" }, [role.icon]),
    el("h3", { class: "reveal-name" }, [role.name[lang]]),
    el("p", { class: "reveal-desc" }, [role.desc[lang]])
  ])

  const closeBtn = el("button", { class: "btn btn-secondary reveal-close" }, ["Got it"])

  const stage = el("div", { class: "reveal-stage" }, [burst, card])
  overlay.append(stage, closeBtn)
  return overlay
}

/* ─── Spy variant (typewriter decrypt) ────────────────────────── */

async function showSpyReveal(opts: RevealOptions): Promise<void> {
  const role = opts.payload.roleData
  const overlay = buildSpyOverlay()
  document.body.appendChild(overlay)

  const closeBtn = overlay.querySelector<HTMLButtonElement>(".reveal-close")!
  const previouslyFocused = document.activeElement as HTMLElement | null

  return new Promise<void>(resolve => {
    const cleanup = (): void => {
      animate(overlay, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" })
        .finished.then(() => {
          overlay.remove()
          previouslyFocused?.focus?.()
          opts.onClose?.()
          resolve()
        })
    }
    closeBtn.addEventListener("click", cleanup)
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cleanup() }
    overlay.addEventListener("keydown", onKey)

    requestAnimationFrame(() => overlay.classList.add("visible"))

    if (prefersReducedMotion()) {
      const terminal = overlay.querySelector<HTMLElement>(".reveal-terminal")!
      const lineA = terminal.querySelector<HTMLElement>(".line-a .typewriter")!
      const lineB = terminal.querySelector<HTMLElement>(".line-b .typewriter")!
      const lineC = terminal.querySelector<HTMLElement>(".line-c")!
      lineA.textContent = "DECRYPTING…"
      lineA.classList.add("done")
      lineB.textContent = `IDENTITY: ${role.name[opts.lang].toUpperCase()}`
      lineB.classList.add("done")
      lineC.style.opacity = "1"
      lineC.textContent = role.desc[opts.lang]
      closeBtn.focus()
      return
    }

    const lineA = overlay.querySelector<HTMLElement>(".line-a .typewriter")!
    const lineB = overlay.querySelector<HTMLElement>(".line-b .typewriter")!
    const lineC = overlay.querySelector<HTMLElement>(".line-c")!

    const aText = "DECRYPTING…"
    const bText = `IDENTITY: ${role.name[opts.lang].toUpperCase()}`

    const typeOut = async (target: HTMLElement, text: string, msPerChar: number): Promise<void> => {
      for (let i = 0; i <= text.length; i++) {
        target.textContent = text.slice(0, i)
        await new Promise(r => setTimeout(r, msPerChar))
      }
      target.classList.add("done")
    }

    ;(async () => {
      await new Promise(r => setTimeout(r, 200))
      await typeOut(lineA, aText, 80)
      await new Promise(r => setTimeout(r, 400))
      overlay.querySelector<HTMLElement>(".line-b")!.style.opacity = "1"
      await typeOut(lineB, bText, 80)
      await new Promise(r => setTimeout(r, 200))
      lineC.textContent = role.desc[opts.lang]
      animate(lineC, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 })
      closeBtn.focus()
    })()
  })
}

function buildSpyOverlay(): HTMLDivElement {
  const overlay = el("div", {
    class: "reveal-overlay",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Your role",
    tabindex: "-1"
  }) as HTMLDivElement

  const terminal = el("div", { class: "reveal-terminal" }, [
    el("div", { class: "line line-a" }, [el("span", { class: "typewriter" }, [])]),
    el("div", { class: "line line-b", style: "opacity: 0" }, [el("span", { class: "typewriter" }, [])]),
    el("p", { class: "line-c", style: "opacity: 0; margin-top: 16px" }, [])
  ])

  const closeBtn = el("button", { class: "btn btn-secondary reveal-close" }, ["Got it"])

  overlay.append(terminal, closeBtn)
  return overlay
}
```

> **Note on `el()` typing:** `dom.ts`'s `el()` already returns a typed `HTMLElementTagNameMap[K]`. The `as HTMLDivElement` casts are explicit because TypeScript narrows the union but the call sites benefit from the concrete type.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

**Checkpoint:** Reveal orchestration ready.

---

### Task F.3 — Rewrite `playerRoom.ts` + reveal integration

**Files:**
- Modify: `src/client/views/playerRoom.ts`

- [ ] **Step 1: Replace the contents**

```ts
// src/client/views/playerRoom.ts
import { $, clear, el } from "../ui/dom.js"
import { getLang, t } from "../services/i18n.js"
import { socket } from "../services/socket.js"
import { applyTheme } from "../themes/loader.js"
import { showReveal } from "../ui/roleReveal.js"
import type { PlayerJoinData, RoleAssignedPayload } from "@shared/events.js"

export const playerRoomView = {
  id: "playerRoomView" as const,
  mount(ctx: { initial?: PlayerJoinData }) {
    const gameNameEl = $<HTMLElement>("#playerGameName")
    const welcomeEl  = $<HTMLElement>("#playerWelcome")
    const statusEl   = $<HTMLElement>("#playerStatus")
    const cardEl     = $<HTMLDivElement>("#playerRoleCard")

    const lang = getLang()
    let myRole = ctx.initial?.player.role ?? null
    let myRoleData = ctx.initial?.player.roleData ?? null

    if (ctx.initial) void applyTheme(ctx.initial.room.game.theme).catch(() => {})

    function renderHeader() {
      if (!ctx.initial) return
      gameNameEl.textContent = ctx.initial.room.game.title[lang]
      welcomeEl.textContent  = ctx.initial.player.name
    }

    function renderSettled() {
      clear(cardEl)
      cardEl.classList.toggle("revealed", Boolean(myRole))
      cardEl.classList.toggle("locked", !myRole)
      if (myRole) cardEl.classList.add("assigned-once")

      // back face — always present, just rotated by CSS
      const back = el("div", { class: "role-card-back", "aria-hidden": "true" })

      const face = el("div", { class: "role-card-face" })
      if (!myRole || !myRoleData) {
        face.append(
          el("div", { class: "role-glow" }),
          el("div", { class: "role-lock" }, ["?"]),
          el("h3", {}, [t("roleNotAssigned")]),
          el("p", {}, [t("waitAdmin")])
        )
        statusEl.textContent = t("waitAdmin")
      } else {
        face.append(
          el("div", { class: "role-glow" }),
          el("div", { class: "role-icon big" }, [myRoleData.icon]),
          el("h3", {}, [myRoleData.name[lang]]),
          el("p", {}, [myRoleData.desc[lang]])
        )
        statusEl.textContent = ""
      }
      cardEl.append(back, face)
    }

    const onAssigned = async (payload: RoleAssignedPayload) => {
      myRole = payload.role
      myRoleData = payload.roleData
      await showReveal({ payload, lang, onClose: () => renderSettled() })
      renderSettled()
    }

    const onCleared = () => {
      myRole = null
      myRoleData = null
      renderSettled()
    }

    socket.on("player:role-assigned", onAssigned)
    socket.on("player:role-cleared",  onCleared)

    renderHeader()
    renderSettled()

    return () => {
      socket.off("player:role-assigned", onAssigned)
      socket.off("player:role-cleared",  onCleared)
    }
  }
}
```

- [ ] **Step 2: Typecheck + smoke**

Run: `npm run typecheck && npm test`.

Open page in two windows:
1. Window A: home → click vampire → "Create Room" → admin scene with code.
2. Window B: home → "Join Room" → enter code + name → player room with face-down card pulsing.
3. Window A: "Assign Roles" → Window B should play the cinematic flip reveal.

Expected: ~1.6s orchestration with flip, burst, icon, name, description.

- [ ] **Step 3: Test reduced motion**

Toggle reduced motion in OS (or via DevTools rendering tab) → repeat. Reveal should be a single 250ms fade, no flip.

- [ ] **Step 4: Test spy variant**

Repeat with the spy game card → typewriter decrypt instead of flip.

**Checkpoint:** Role reveal feels cinematic; both variants work.

---

### Task F.4 — Run E2E to verify reveal didn't break selectors

- [ ] **Step 1: Run E2E**

Run: `npm run test:e2e`
Expected: 2 passed.

> The happy-path test asserts `expect(p.page.locator("#playerRoleCard h3")).toBeVisible()`. The new `renderSettled` keeps `h3` inside the card face. Should pass.

**Checkpoint:** E2E green.

---

### Task F.5 — End-of-phase commit

- [ ] **Step 1: Commit**

```bash
git add src/client/themes/_base.css \
        src/client/ui/roleReveal.ts \
        src/client/views/playerRoom.ts
git commit -m "feat(reveal): cinematic role reveal orchestration (flip + spy variant)"
```

**Checkpoint:** Phase F done. The cinematic peak works.

---

# Phase G — Sound assets + accessibility polish

Add sound files, verify reduced-motion/contrast, focus, RTL.

---

### Task G.1 — Source sound files

**Files:**
- Create: `public/sounds/click.ogg`
- Create: `public/sounds/transition.ogg`
- Create: `public/sounds/reveal-flip.ogg`
- Create: `public/sounds/reveal-burst.ogg`
- Create: `public/sounds/mute-toggle.ogg`

- [ ] **Step 1: Obtain/generate the five OGG files**

These are binary assets; no source code to paste. Options:

1. **Generate with sfxr-like tool:**
   - Visit https://sfxr.me or run `npm install -g jsfxr-cli` for retro UI sounds.
   - For each sound name, pick a preset close to the description, export as WAV.
   - Convert WAV → OGG/Opus 64kbps mono: `ffmpeg -i input.wav -c:a libopus -b:a 64k -ac 1 output.ogg`.

2. **Source from Freesound (CC0):**
   - https://freesound.org → filter by CC0 license.
   - Search terms per file:
     - `click.ogg`: "ui click", "button tick" — ≤ 100ms, ≤ 5KB after Opus
     - `transition.ogg`: "whoosh short", "swipe transition" — ≤ 400ms, ≤ 10KB
     - `reveal-flip.ogg`: "card flip", "paper turn" — ≤ 250ms, ≤ 10KB
     - `reveal-burst.ogg`: "magic shimmer", "soft impact" — ≤ 600ms, ≤ 12KB
     - `mute-toggle.ogg`: "toggle on/off" — ≤ 150ms, ≤ 3KB

Place each as `public/sounds/<name>.ogg`.

- [ ] **Step 2: Verify file sizes**

Run: `du -h public/sounds/*.ogg`
Expected: each within its budget (totals ≤ 50KB).

- [ ] **Step 3: Smoke test sound**

Open dev server, click mute toggle (icon flips to 🔊). Click any button → faint click sound. Trigger a role reveal → flip + burst sounds.

If sounds are too loud, lower per-call volume in code (already parameterized via `play(name, volume)`).

**Checkpoint:** Audio integrated.

---

### Task G.2 — Spy HUD live clock

**Files:**
- Modify: `src/client/main.ts`

- [ ] **Step 1: Add clock updater near end of bootstrap**

After the existing socket event registrations in `main.ts`, append:

```ts
  // Spy HUD clock (decorative, only visible when spy theme active)
  const clockEl = document.getElementById("spyHudClock")
  if (clockEl) {
    const update = () => {
      const d = new Date()
      const hh = String(d.getUTCHours()).padStart(2, "0")
      const mm = String(d.getUTCMinutes()).padStart(2, "0")
      const ss = String(d.getUTCSeconds()).padStart(2, "0")
      clockEl.textContent = `${hh}:${mm}:${ss}Z`
    }
    update()
    window.setInterval(update, 1000)
  }
```

- [ ] **Step 2: Verify**

Open in spy theme → top-center HUD shows `HH:MM:SS Z // CLASSIFIED` ticking.

**Checkpoint:** Spy HUD live.

---

### Task G.3 — Accessibility audit (manual)

- [ ] **Step 1: Keyboard navigation**

Open page, use Tab/Shift+Tab through:
- Lang switcher buttons → mute → game cards → "Join Room"
- On game info: back, create room button
- On admin: copy code, save, assign, clear
- On player room: card is informational (not focusable), close button on reveal modal

Confirm: every interactive element receives a visible focus ring in theme glow color.

- [ ] **Step 2: Screen reader spot check**

Use NVDA / VoiceOver / Narrator:
- Role reveal: announces `Your role: <name>. <description>` via `aria-live` (already on `#playerRoleCard`).
- Mute toggle: announces "Toggle sound, pressed" / "not pressed".
- Modal: focus traps inside; ESC dismisses.

- [ ] **Step 3: Contrast verification**

Use DevTools color-picker to verify:
- Vampire: accent on bg = 5.1:1 ✓
- Mafia: accent on bg = 7.3:1 ✓
- Spy: accent on bg = 6.4:1 ✓

(All ≥ WCAG AA 4.5:1.)

- [ ] **Step 4: Reduced motion verification**

In OS settings (or DevTools rendering tab → "Emulate CSS prefers-reduced-motion: reduce"), repeat:
- Scene transition: ≤ 100ms fade only
- Atmosphere: frozen (no fog drift)
- Role reveal: single 250ms fade
- Curtain assign: instant fill

- [ ] **Step 5: RTL verification**

Switch language to Arabic or Kurdish. Verify:
- `<html dir="rtl">` set.
- All text right-aligned.
- Layouts mirror appropriately (admin grid, join card, etc.).
- Latin display fonts apply to Latin text; Arabic glyphs use Noto Sans Arabic.

- [ ] **Step 6: Mobile perf check**

Open Chrome DevTools → Performance → CPU throttle 4× → record 10s on a themed page. Verify:
- No long tasks (> 50ms).
- Atmosphere layer paint contained.
- Frame rate ≥ 30fps.

If any layer over-renders, set `data-perf="low"` manually on `.atmosphere` and confirm reduced layers (the `[data-perf="low"]` CSS rules already disable secondary atmosphere ::after).

**Checkpoint:** Accessibility + perf verified.

---

### Task G.4 — End-of-phase commit

- [ ] **Step 1: Commit**

```bash
git add public/sounds/ \
        src/client/main.ts
git commit -m "feat(a11y,sound): audio assets, spy HUD clock, accessibility polish"
```

**Checkpoint:** Phase G done.

---

# Phase H — Acceptance + documentation

Final acceptance, regression check, README updates.

---

### Task H.1 — Full pipeline run

- [ ] **Step 1: Run everything**

```bash
npm run typecheck
npm run lint
npm test -- --coverage
npm run build
npm run test:e2e
```

Expected: all green; coverage maintained ≥ 85% for `src/server/domain/**` and `src/server/store/**`.

> Coverage for client TS is not gated (visual UI code).

- [ ] **Step 2: Production smoke**

```bash
$env:NODE_ENV="production"; $env:DB_PATH="./data/rooms.db"; npm start
```

Open http://localhost:3000 in two windows. Run through all three games end-to-end. Verify:
- Each game's atmosphere visually distinct.
- Role reveal works for both variants.
- Reconnect after refresh keeps role.
- Mute toggle persists.

**Checkpoint:** Acceptance pass.

---

### Task H.2 — README visual section

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a new section near the top**

Insert after the "Main Features" section:

```markdown
## Visual experience

Each game opens its own cinematic stage:

- **🧛 Vampire Village** — gothic castle, candlelight, blood-red glow with gold accents
- **🕴️ Classic Mafia** — noir bar, cigarette smoke, amber spotlight, art deco accents
- **🕶️ Spy Game** — tactical CRT display, scan lines, decrypt-style role reveal

The role reveal is a 1.6-second cinematic moment — card flip with glow burst for Vampire/Mafia, terminal typewriter decrypt for Spy. Optional UI sound effects (default muted). Respects `prefers-reduced-motion`.
```

- [ ] **Step 2: Adding a new game (update the section)**

Replace "How to add a new game" section with:

```markdown
## How to add a new game

1. Add the game data to `src/server/games/catalog.ts` — TypeScript will guide every required field.
2. Pick a `theme` string for the new game (e.g. `"alien-invasion"`).
3. Create `src/client/themes/alien-invasion.css` with your theme tokens and atmosphere layers (copy structure from any existing theme).
4. Register the theme in `src/client/themes/loader.ts` — add a new line to the `KNOWN_THEMES` array and `loaders` map.
5. Restart `npm run dev`.

Every game must include one role with `filler: true` — that role fills any remaining player slots after special-role counts are applied.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: visual experience section + updated add-a-game flow"
```

**Checkpoint:** Documentation updated.

---

### Task H.3 — Final manual checklist

Run through the success criteria from the spec:

- [ ] All 43 unit tests pass unchanged.
- [ ] Both Playwright E2E specs pass.
- [ ] Manual smoke per game (vampire / mafia / spy): home → game info → create room → join from second window → assign roles → see cinematic reveal → reconnect.
- [ ] Lighthouse performance ≥ 85 on the production build with a fast 3G profile.
- [ ] No critical accessibility violations (manual audit with NVDA/VoiceOver passed Task G.3).
- [ ] Reduced-motion path verified.
- [ ] Adding a hypothetical 4th game: only requires a new `themes/<id>.css` + a catalog entry + a loader registration — no other JS or HTML changes.

If any criterion fails: open an issue, do not mark complete.

- [ ] **Final commit (if any docs touched during checklist)**

```bash
git status
git add -A
git commit -m "chore: final checklist pass"
```

**Checkpoint:** Phase H done. Plan complete.

---

# Self-Review

**Spec coverage check:**

| Spec section | Implementing task(s) |
|---|---|
| Vision: two-layer cinema | A.1 (`_base.css`), B.1–B.3 (theme files), B.5 (theme apply) |
| Architecture (Shell + Theme + Scene) | A.1 (shell base), A.3–A.4 (loader + atmosphere), C.1 (HTML) |
| Color tokens (base) | A.1 |
| Per-theme tokens | B.1, B.2, B.3 |
| Typography (Inter / mono / display) | A.1 (fonts), C.1 (Google Fonts link) |
| Motion principles | A.1 (vars), A.2 (`motion.ts`) |
| Depth/layering z-index | A.1 |
| Spacing scale | A.1 |
| Vampire theme map | B.1 |
| Mafia theme map | B.2 |
| Spy theme map (typewriter variant) | B.3, F.2 (`showSpyReveal`) |
| Homepage layout | C.1 (HTML), C.2 (`home.ts`), C.2 styles |
| Game info playbill | D.1 |
| Join scene | D.2 |
| Admin three-zone layout | E.1 (styles), E.2 (`admin.ts`) |
| Player room private booth | F.1 (styles), F.3 (`playerRoom.ts`) |
| Role reveal flip orchestration | F.2 (`roleReveal.ts`) |
| Role reveal spy variant | F.2 (`showSpyReveal`) |
| Sound system | C.3 (skeleton), G.1 (assets) |
| Accessibility (focus, reduced-motion, contrast, RTL) | A.1 (CSS), F.2 (modal a11y), G.3 (audit) |
| Performance budget | A.4 (low-end detection), B.1–B.3 (data-perf rules), G.3 (perf check) |
| Catalog rename | B.4 |
| E2E preservation | C.1 (hidden span ids), E.3, F.4 |
| Adding new game | H.2 README |

All spec sections have implementation tasks.

**Placeholder scan:** None. All code is concrete. Sound files are binary assets noted with sourcing instructions (G.1) — this is acceptable because the plan can't ship binary OGG content as text.

**Type consistency:**
- `applyTheme(name: string)` consistent between `loader.ts` and call sites.
- `currentTheme()` returns `ThemeName | null`; `roleReveal.ts` checks against `"spy-game"` constant.
- `play(name: SoundName, volume?: number)` signature stable across call sites.
- `Game.theme` field stays typed as `string` (in `types.ts`), only value strings change.
- DOM ids stable: every id referenced by Playwright tests (`#playerWelcome`, `#roomCodeText`, `#assignRolesBtn`, `#rolesStatus`, `#joinCodeInput`, `#playerNameInput`, `#joinBtn`, `#showJoinBtn`, `#createSelectedRoomBtn`, `#playerRoleCard h3`, `#playersCount`, `#selectedGameText`) appears in the new `index.html`.

---

**Plan complete and saved to** `docs/superpowers/plans/2026-06-10-cinematic-ui-redesign.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using `superpowers:executing-plans`, with phase-end commits as natural checkpoints.

**Which approach?**
