# Yalla Game

Room-code platform for multiple hidden-role games. Admin creates a room, players join with a code, each player sees only their own role.

## Main Features

- 3 games included: Vampire Village, Classic Mafia, Spy Game.
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
| `MAX_PLAYERS_PER_ROOM` | `25` | Per-room cap |
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
npm test               # Vitest unit tests (domain + store)
npm test -- --coverage # with coverage report
npm run test:e2e       # Playwright (boots build + start, then runs)
```

E2E tests assert role privacy at the WebSocket frame level — not just the rendered DOM.

## Files

- `src/server/` — bootstrap, config, logger, socket handlers, domain, store
- `src/client/` — views, services (socket/session/i18n), router, UI helpers
- `src/shared/` — types and event contracts used by both sides
- `public/styles.css` — design (served as Vite publicDir)
- `index.html` — entry HTML (Vite root)
- `tests/unit/` — Vitest unit tests
- `tests/e2e/` — Playwright specs
- `.github/workflows/ci.yml` — typecheck, lint, unit, e2e
