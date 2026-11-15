# components/home

Home — Your Circles, as pure view components (spec: `docs/specs/home.md`). Everything is sized in design px × `--s` (`units.ts`); the layout sets `--s` per canvas.

- Phone positions in `home-screen.tsx` and the tree/ornament fractions in `circle-tree.tsx` / `memory-art.tsx` are copied from the designer's reference. Don't "tidy" the numbers; compare against `docs/design/your-circles.jpg` after any change.
- `scenery/scene-layers.tsx` is generated from `public/home-background.svg` by `node scripts/svg-to-scene-layers.mjs`. Regenerate; never hand-edit. `tests/home/scenery.test.tsx` checks the phone scene against that SVG element for element.
- SVG ids come from `useId` (`useSceneIds`, ornaments, thumbnails) so several scenes can share a page.
- Wide-only scenery: clouds and small trees are placed by seeded generators in `scenery/wide-props.ts` (stable across server and client). Small trees skip `clearZones`; `home-screen.tsx` derives those from the label boxes (`wideLabelZones`), so moving a label moves its clear zone with it.
- Wide row geometry is pure in `wide-row.ts`: always five trees in the mockup's fixed slots, the center tree at canvas x 656 (the screen's center). Label boxes and clear zones come from there too.
- The wide river is `wide-river.tsx`, drawn in the tree row's SVG behind the trees. Its waypoints are offsets from the center tree, so move the tree and the river follows. `tests/home/wide-row.test.tsx` checks it never touches another canopy, a trunk or the center badge. The wide scenery draws no river of its own; the phone scenery keeps the generated one.
