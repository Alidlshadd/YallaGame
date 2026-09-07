# Character artwork

One file per character id in `src/shared/characters.ts`, named exactly after
the id:

    owl.webp  fox.webp  raven.webp  wolf.webp  cat.webp    bear.webp
    stag.webp moth.webp serpent.webp hound.webp hare.webp  lion.webp

**512 x 512, transparent background, WebP.** The app crops them to a circle and
renders them as small as 30 px, so the subject must fill the frame and read at
thumbnail size.

Until a file exists the app draws the player's initial instead — it degrades,
it does not break — so the art can land one file at a time.
