# UI Sound Effects

This directory should contain 5 short OGG/Opus 64kbps mono files:

| File | Size budget | Description |
|---|---|---|
| `click.ogg` | ≤ 5KB | Button press, code character entry |
| `transition.ogg` | ≤ 10KB | Scene change whoosh |
| `reveal-flip.ogg` | ≤ 10KB | Role reveal card flip |
| `reveal-burst.ogg` | ≤ 12KB | Role reveal glow burst |
| `mute-toggle.ogg` | ≤ 3KB | User toggles mute |

## Sourcing options

**Option A — Generate with sfxr-like tool:**
- Visit https://sfxr.me for retro UI sounds
- Export each as WAV
- Convert to OGG/Opus: `ffmpeg -i input.wav -c:a libopus -b:a 64k -ac 1 output.ogg`

**Option B — Source from Freesound (CC0):**
- https://freesound.org → filter by CC0 license
- Search terms per file (see plan for specifics)

## Default behavior

The app loads with **muted = true**. Users opt in via the mute toggle in the HUD (top-right). If sound files are missing, `sound.ts` silently no-ops via the `loadBuffer` try/catch — the app continues to work, just without audio.
