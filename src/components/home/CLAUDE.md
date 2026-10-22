# components/home

Home — Your Circles, as pure view components (spec: `docs/specs/home.md`). Everything is sized in design px × `--s` (`units.ts`); the layout sets `--s` per canvas.

- Phone positions in `home-screen.tsx` and the tree/ornament fractions in `circle-tree.tsx` / `memory-art.tsx` are copied from the designer's reference. Don't "tidy" the numbers; compare against `docs/design/your-circles.jpg` after any change.
- `scenery/scene-layers.tsx` is generated from `public/home-background.svg` by `node scripts/svg-to-scene-layers.mjs`. Regenerate; never hand-edit. `tests/home/scenery.test.tsx` checks the phone scene against that SVG element for element.
- SVG ids come from `useId` (`useSceneIds`, ornaments, thumbnails) so several scenes can share a page.
- Wide-only scenery: clouds and small trees are placed by seeded generators in `scenery/wide-props.ts` (stable across server and client). Small trees skip `clearZones`; `home-screen.tsx` derives those from the label boxes (`wideLabelZones`), so moving a label moves its clear zone with it.
- Wide row geometry is pure in `wide-row.ts`: always five trees in the mockup's fixed slots, the center tree at canvas x 656 (the screen's center). Label boxes and clear zones come from there too.
- No river on wide screens (HOME-11): neither the wide scenery nor the tree row draws one. The phone scenery keeps the generated river.
- Ornaments (HOME-13): the tree SVG stays `aria-hidden`, so each bauble gets a round HTML `<button>` overlay placed with `ornamentSpots` from `circle-tree.tsx` (the same fractions the drawing uses). A `Memory` with `src` shows that photo (`MemoryPicture` in `memory-art.tsx`), otherwise its art.
- `ornament-sheet.tsx` is pure: the app passes each ornament's memory, attribution line and `canUndo`, plus the picked photo's preview URL. It never decodes files or knows the rules. Its frame, picker and cropper come from `../shared/`; Save hands back the cropper's area.
