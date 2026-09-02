# Yalla Game

Room-code platform for multiple hidden-role games. Admin creates a room, players join with a code, each player sees only their own role.

## Main Features

- 5 games included: Vampire Village, Classic Mafia, Spy Game, Who Am I, Football Player Guess.
- Two ways to play: **rooms** (everyone on their own phone) and **Local Play** (one phone passed around, no server needed).
- Admin sees all players and all roles. Each player sees only their own.
- 4 languages: Kurdish Sorani, Arabic, English, Turkish (with RTL for ku/ar).
- Reconnect-safe: page refresh keeps the player bound to their slot.
- Persistent rooms via SQLite (configurable; ephemeral in-memory fallback for dev).

## Visual experience

Each game opens its own cinematic stage:

- **🧛 Vampire Village** — gothic castle, candlelight, blood-red glow with gold accents
- **🕴️ Classic Mafia** — noir bar, cigarette smoke, amber spotlight, art deco accents
- **🕶️ Spy Game** — tactical CRT display, scan lines, decrypt-style role reveal

The role reveal is a 1.6-second cinematic moment — card flip with glow burst for Vampire/Mafia, terminal typewriter decrypt for Spy. Optional UI sound effects (default muted). Respects `prefers-reduced-motion`.

## On a phone

The app is built for phones first, and every one of these is covered by tests
in `tests/e2e/`:

- **Back button** — the hardware/gesture back and every in-page back control
  walk the same stack (`src/client/services/navigation.ts`). Back closes a
  modal, steps one screen back through the Local Play wizard, and asks before
  it abandons a room. Nothing is a dead end that needs a reload.
- **Install to the home screen** — `public/manifest.webmanifest` plus a service
  worker (`public/sw.js`), so the game opens in a standalone window with no
  browser chrome.
- **Works with no signal** — the worker precaches the build (it reads the
  hashed file names out of `asset-manifest.json`) and the game catalog is kept
  on the device, so Local Play runs in airplane mode after one online visit.
  Rooms always need the network and are never served from cache.
- **Screen stays awake** during a round, and the phone buzzes on a role reveal
  or a timer running out.
- **Connection is honest** — a dropped socket shows a banner instead of a
  static "Online" label.

## Run (dev)

Needs Node.js 18 or newer.

```bash
npm install
npm run dev
```

This starts the TS server (port 3000) and Vite dev server (port 5173) together. Open http://localhost:5173 — Vite proxies `/socket.io` and `/api` to the server.

## Run (prod)

```bash
npm run build
DB_PATH=./data/rooms.db NODE_ENV=production npm start
```

PowerShell:
```powershell
npm run build
$env:NODE_ENV="production"; $env:DB_PATH="./data/rooms.db"; npm start
```

Open http://localhost:3000.

### Environment variables

| Var | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | `production` requires `DB_PATH` (fail-fast) |
| `PORT` | `3000` | |
| `DB_PATH` | (unset → MemoryStore) | Path to SQLite file. Required in prod. `:memory:` also works. |
| `ALLOWED_ORIGIN` | unset (all) | CORS origin for Socket.IO |
| `ROOM_TTL_HOURS` | `8` | Rooms older than this are GC'd |
| `LOG_LEVEL` | `info` | pino level |
| `MAX_ROOMS_PER_SOCKET` | `5` | Anti-abuse per admin socket |
| `MAX_TOTAL_ROOMS` | `10000` | Server-wide cap |

## Phone testing on same Wi-Fi

Find your local IP (e.g. `192.168.1.50`). Players open `http://192.168.1.50:3000`.

## Online deployment

Needs a WebSocket-capable Node.js host: VPS, Fly.io, Render, Railway, DigitalOcean, etc. GitHub Pages won't work — there's no Node runtime.

Render/Railway free tiers use ephemeral disk → either mount a persistent volume at the `DB_PATH` directory, or accept that restarts wipe rooms.

## How to add a new game

1. Add the game data to `src/server/games/catalog.ts` — TypeScript will guide every required field.
2. Pick a `theme` string for the new game (e.g. `"alien-invasion"`).
3. Create `src/client/themes/alien-invasion.css` with your theme tokens and atmosphere layers (copy structure from any existing theme).
4. Register the theme in `src/client/themes/loader.ts` — add a new line to the `KNOWN_THEMES` array and `loaders` map.
5. Restart `npm run dev`.

Every game must include one role with `filler: true` — that role fills any remaining player slots after special-role counts are applied.

## Testing

```bash
npm test               # Vitest unit tests (domain, store, navigation, views)
npm test -- --coverage # with coverage report
npm run test:e2e       # Playwright (boots build + start, then runs)
```

E2E tests assert role privacy at the WebSocket frame level — not just the
rendered DOM — and cover the phone paths: back navigation through every flow,
the offline cold start, and installability.

## Files

- `src/server/` — bootstrap, config, logger, socket handlers, domain, store
- `src/client/` — views, services (socket/session/i18n), router, UI helpers
- `src/shared/` — types and event contracts used by both sides
- `public/manifest.webmanifest`, `public/sw.js` — installable app + offline shell
- `public/styles.css` — design (served as Vite publicDir)
- `index.html` — entry HTML (Vite root)
- `tests/unit/` — Vitest unit tests
- `tests/e2e/` — Playwright specs
- `.github/workflows/ci.yml` — typecheck, lint, unit, e2e
