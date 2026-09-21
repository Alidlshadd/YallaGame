# Admin Avatar Management

Date: 2026-09-21
Status: Approved, not yet implemented

## Problem

Player-selectable avatars ("characters") are entirely compile-time today:
`src/shared/characters.ts` exports a hardcoded `CHARACTERS` array. Twenty of
them are slices of one hand-cropped sprite atlas (`avatar-atlas.webp`,
positioned via `src/client/ui/portraitGeometry.ts`); three (`ali`, `mahmud`,
`morinji`) are standalone images. Names are hardcoded in four languages
(en/tr/ar/ku). None of this is reachable from the admin control panel.

The admin wants to add, edit, and delete avatars from the control panel —
including the 23 that ship today — without a developer touching code.

## Scope

**In scope:**
- Add a brand-new avatar (image + name in all four languages).
- Edit any avatar's name and/or image, including the 23 built-in ones.
- Hide a built-in avatar (soft; "delete" for built-ins means hidden, since
  their `id` is a code constant validated elsewhere — see Data model).
- Truly delete an admin-added avatar.
- Reorder avatars (sort order), same as the existing game library page.

**Out of scope (deliberately, to keep this change small and low-risk):**
- Accessories (hats/overlays) — a separate system (`src/shared/accessories.ts`,
  `src/client/ui/accessory.ts`), not touched.
- The legacy animal-icon roster (`LEGACY_CHARACTERS` in `characters.ts`) —
  kept only for validating/rendering old saved room state; it was already not
  selectable in `characterPicker.ts` and stays that way.
- A "revert to built-in default" button on an edited name. If an admin wants
  the original name back, they retype it. No default-tracking per field.
- Any change to the sprite-atlas mechanism itself. A built-in avatar that
  gets a new uploaded image simply stops using the atlas (same code path
  already used by `ali`/`mahmud`/`morinji` today — no new rendering logic).

## Approach

Mirror the existing, working "game asset override" pattern
(`game_asset_overrides` table + `admin_uploads` + `/api/admin/games`) instead
of moving avatars fully into the database. One new table,
`avatar_overrides`, holds both kinds of row:

- A row whose `id` matches a `CHARACTERS[].id` **overrides** that built-in
  entry (name/image/visibility/order).
- A row whose `id` does not match any built-in **is** a fully admin-created
  avatar (name/image required, no code-side fallback).

This was chosen over fully migrating all avatars into the database (see
prior discussion) because it reuses proven, already-audited infrastructure
(`admin_uploads`, `saveUpload`, `assertAsset`, `cleanupUploads`, the audit
log) and — critically — keeps `CHARACTERS`/`findCharacter`/`isCharacterId`
synchronous and unchanged for every existing call site
(`playerRoom.ts`, `gameStage.ts`, `pending.ts`, socket handlers, etc.). Only
`src/client/ui/avatar.ts` and `src/client/ui/characterPicker.ts` need to
learn about the override layer; everything else keeps working exactly as
today if the override list is empty, missing, or fails to load.

## Data model

```sql
CREATE TABLE IF NOT EXISTS avatar_overrides (
  id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  name_en TEXT, name_tr TEXT, name_ar TEXT, name_ku TEXT,
  image TEXT REFERENCES admin_uploads(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

For a built-in override, `name_*`/`image` are nullable — null means "use the
code default for this field". For a custom avatar, application code (zod)
requires all four names and an image; the schema doesn't need to enforce
that separately, matching how `game_asset_overrides` leans on the route
handler + zod rather than SQL constraints.

Added to `ADMIN_SCHEMA` in `src/server/control/database.ts`, same
`CREATE TABLE IF NOT EXISTS` migration style as every other table there — no
separate migration step needed.

## Merge logic

New helper in `src/server/control/content.ts`, `effectiveAvatarCatalog(db)`,
following the exact shape of `effectiveCatalog()`:

```
function effectiveAvatarCatalog(db):
  overrides = Map<id, row> from SELECT * FROM avatar_overrides
  merged = []
  for def of CHARACTERS:
    o = overrides.get(def.id)
    if o?.enabled === 0: continue
    merged.push({
      id: def.id,
      name: { en: o?.name_en ?? def.name.en, tr: ..., ar: ..., ku: ... },
      image: o?.image ? `/uploads/${o.image}` : null,   // null = client uses its own atlas/own-image logic
      sortOrder: o?.sort_order ?? <index in CHARACTERS>
    })
  for row of overrides where row.id is not a CHARACTERS id:
    if row.enabled === 0: continue
    merged.push({ id: row.id, name: {...row}, image: `/uploads/${row.image}`, sortOrder: row.sort_order })
  return merged sorted by sortOrder
```

`publicConfiguration(db)` gains an `avatars` field returning this merged,
already-filtered (enabled-only) list — delivered through the existing
`/api/public-config` fetch the client already awaits at boot
(`loadPublicConfiguration()` in `src/client/services/publicConfig.ts`), no
new network round trip on the critical path.

## API (mirrors `/api/admin/games` exactly)

All under the existing authenticated `/api/admin` router in
`src/server/control/routes.ts`:

- `GET /api/admin/avatars` → `{ catalog: CHARACTERS, overrides }` — admin
  sees the full picture, disabled rows included, so a hidden built-in can be
  turned back on.
- `PUT /api/admin/avatars/:id` — `id` must be a known `CHARACTERS` id.
  Body: `{ enabled: boolean, order: number, name: {en,tr,ar,ku} | null, image: idSchema }`.
  Upserts one override row. `name: null` clears all four language
  overrides back to "use code default" in one step (used by an explicit
  "reset name" control if we add one later — not required for v1 UI).
- `POST /api/admin/avatars` — creates a custom avatar.
  Body: `{ name: {en,tr,ar,ku} (all non-empty, zod), image: uploadId (required) }`.
  Server generates a fresh id (`custom-<token()>`), inserts, returns `{ id }`.
- `DELETE /api/admin/avatars/:id` — 400 if `id` is a known `CHARACTERS` id
  (built-ins are never truly deleted — hide via `PUT .../enabled:false`
  instead, so the "delete" button is simply not rendered for them in the
  UI). Otherwise deletes the row.
- Image upload reuses the existing `POST /api/admin/uploads` endpoint
  unchanged (`saveUpload`, `assertAsset`, `validateImage` — same 5 MiB /
  4096×4096 / static-JPEG-PNG-WebP-only rules as game covers).

Every mutating call gets an `audit()` entry, matching `game_status_changed` /
`game_image_changed` (`avatar_status_changed`, `avatar_image_changed`,
`avatar_created`, `avatar_deleted`).

## Server-side id validation

`src/shared/characters.ts`'s `isCharacterId()` stays as-is (pure, sync,
code-only — still correct for id *shape*, and both game and admin socket
handlers need a *pure* fast check available without threading a db handle
through every call). A new, db-aware check,
`isSelectableCharacterId(db, id)`, is added in
`src/server/control/content.ts` next to `effectiveAvatarCatalog`, and used at
the two join/host points that currently call `isCharacterId`
(`src/server/sockets/player-handlers.ts`, `src/server/sockets/admin-handlers.ts`):
valid if `id` is a built-in with no override or an override with
`enabled=1`, OR `id` is a custom row with `enabled=1`. This is a small,
targeted change to two call sites, not a rewrite of validation.

## Client-side integration

- `src/client/services/publicConfig.ts`: `PublicConfiguration` gains
  `avatars: { id: string; name: LocalizedText; image: string | null }[]`.
- `src/client/ui/avatar.ts`: `characterImagePath`/`characterName` first check
  the live `avatars` list (by id) for a name/image override; only fall back
  to `findCharacter()` (today's code path, atlas included) when there's no
  entry or the config hasn't loaded yet — same resilience contract
  `loadPublicConfiguration()` already documents ("existing bundled artwork
  and copy remain available offline"). A brand-new custom avatar (id not in
  `CHARACTERS` at all) is only resolvable through this list; if the config
  hasn't loaded, it's simply not offered yet (same as a brand-new game would
  not appear).
- `src/client/ui/characterPicker.ts`: iterates the merged list instead of
  importing `CHARACTERS` directly, so custom avatars appear as pickable
  options with the same UI (tile, claimed-state, "surprise me").
- No changes needed in `playerRoom.ts`, `gameStage.ts`, `pending.ts`, or any
  other consumer — they all render avatars through `buildAvatar()` /
  `characterName()`, which already carry the resolution logic above.

## Admin UI

New sidebar nav entry "Avatars" (`nav-label`/`nav a` pattern already in
`control/style.css`), page built the same way as the existing Game Library
page (`.game-grid` of `.game-card`s → here a denser grid of avatar tiles,
since there's no per-game settings form beneath each one):

- Each tile: portrait thumbnail (reuses `.image-editor`/upload-zone
  component), name in the admin's current UI language, an enabled toggle,
  an Edit button, and — only for custom avatars — a Delete button with the
  existing `.confirmation` dialog / `confirmAction()` helper already used
  elsewhere in `main.ts`.
- "Add avatar" opens the same form (image upload zone + four name fields,
  same `field()` helper already used on the branding page) whether creating
  new or editing an existing one; editing a built-in pre-fills the form with
  its *effective* (already-overridden, if any) values.
- Reordering: numeric `order` field per tile for v1 (matches how game order
  is currently set — no drag-and-drop exists yet for games either, so this
  introduces no new UI pattern).

## Testing

- Server: `effectiveAvatarCatalog` merge logic (built-in override, hide,
  custom add, sort order) — unit tests alongside the existing
  `effectiveCatalog` tests.
- Server: the four new routes (`GET`/`PUT`/`POST`/`DELETE`), auth-gated,
  zod validation rejects bad payloads, `DELETE` 400s on a built-in id —
  same style as existing `games`/`branding` route tests.
- Server: `isSelectableCharacterId` — built-in default, built-in hidden,
  custom enabled, custom disabled, unknown id.
- Client: `avatar.ts`'s resolution order (override present / absent /
  config not loaded yet) with a couple of unit tests, same style as
  existing `avatar.ts`-adjacent tests if any exist, otherwise colocated
  with the closest existing suite for this module.
- Full suite (`npm run typecheck`, `npm run lint`, `npm run test`,
  `npm run build`) must stay green, matching how every other change in this
  session was verified.
