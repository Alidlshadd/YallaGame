# Character artwork

The active roster is the 20 human and fantasy portraits approved on 2026-09-07.
`avatar-atlas.png` is the original approved image generated with the built-in
imagegen tool. `src/client/ui/avatar.ts` displays individual portrait viewports;
the bitmap is preserved intact and downloaded only once.

`references/accessories-approved.png` records the approved accessory direction.
The 12 wearable accessories are transparent, scalable SVG UI layers in
`src/client/ui/accessory.ts`, fitted using the measured landmarks in
`src/client/ui/portraitGeometry.ts`. Players can
combine any of the 20 portraits with any accessory, or remove the accessory.
These overlays are not flattened into the portrait bitmap.

Each portrait has separate eye centers/radii, a hat contact line and tilt,
headphone ear/top positions, and a neck position. Coordinates are measured in
pixels on the original atlas, then converted to the same viewport as the face.
Keep these landmarks with the crop when adding or adjusting a portrait. Blinky
has one eye, so all four eyewear styles render a single fitted lens. Transparent
lenses preserve facial expressions. Wearables disappear with failed artwork
instead of floating over a fallback initial.

The accessory picker previews all 12 options on the selected character. The
2026-09-08 fitting review covered all 240 portrait/accessory combinations, plus
enlarged eyewear checks for every character and mobile Turkish/Arabic layouts.

The atlas order is left to right, top to bottom:

    ace ruby pebble gizmo silver
    fuzz wisp nova bolt splash
    rusty luna ember blinky cosmo
    jade pixie mochi onyx milo

Shared catalogs and localized names live in `src/shared/characters.ts` and
`src/shared/accessories.ts`. Character ids and accessory ids are persisted in
room player/queue JSON and sent together in room projections.

Retired animal ids remain valid for saved rooms. Their optional fallback artwork
still uses one file per character id:

    owl.webp  fox.webp  raven.webp  wolf.webp  cat.webp    bear.webp
    stag.webp moth.webp serpent.webp hound.webp hare.webp  lion.webp

Legacy artwork: **512 x 512, transparent background, WebP.**

Missing or unavailable artwork falls back to the player's initial.
