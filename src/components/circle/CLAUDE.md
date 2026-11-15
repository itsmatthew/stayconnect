# components/circle

Your circle (the "your circle" side of Home's toggle) as pure view components (spec: `docs/specs/circle.md`; tests: `tests/circle/`). Sized in design px × `--s`, like `components/home`; it reuses Home's scenery, header, toggle and nav.

- `ring-layout.ts` is all the geometry, pure and cached: bands, label boxes and typical sizes come from the designer's reference (canopy center 195,318 in the 390×844 canvas). `tests/circle/ring-layout.test.ts` sweeps 0–120 people per ring for overlaps, band, labels and symmetry; run it after touching any number.
- `circle-tree.tsx` owns only UI state: press-and-hold drag (400ms hold, 8px slop), the hovered ring, the "moved to" announcement. Placement itself comes in through `onMove`.
- The gift pile draws only the gifts it's given (newest first). Placement is pure in `gift-layout.ts`: boxes stand on the ground line at the trunk's base, alternate left/right of it (newest nearest), overlap their neighbour slightly, then "+N". `tests/circle/gift-layout.test.ts` checks none touch the trunk. The phone card must start below the ground line (566) or it hides the pile; recheck with a phone screenshot if the card grows. Opening gifts is TODO (memory mailbox).
- `ring-card.tsx` holds the selected tab, the person menu and the add sheet. Over-guide notes are decided by the app (`crowded`); the copy lives here.
- Wide layout: boxes that rescale `--s` for their content take their own offsets in `--d` (`d()`), or they'd be scaled twice.
