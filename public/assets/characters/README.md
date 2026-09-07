# Character artwork

The active roster is the 20 human and fantasy portraits approved on 2026-09-07.
`avatar-atlas.png` is the original approved image generated with the built-in
imagegen tool. `src/client/ui/avatar.ts` displays individual portrait viewports;
the bitmap is preserved intact and downloaded only once.

`references/accessories-approved.png` records the approved accessory direction.
The 12 wearable accessories are transparent, scalable SVG UI layers in
`src/client/ui/accessory.ts`, positioned using each face's anchors. Players can
combine any of the 20 portraits with any accessory, or remove the accessory.
These overlays are not flattened into the portrait bitmap.

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
