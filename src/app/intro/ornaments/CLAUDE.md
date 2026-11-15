# app/intro/ornaments

Changing a group's ornaments (spec: `docs/specs/home.md`, HOME-14–18; tests: `tests/home/ornaments.test.ts`, `ornament-store.test.ts`, `ornament-sheet.test.tsx`).

- `ornaments.ts` is pure: the reducer (`change`, one-level `undo`), caption normalizing, `withOrnaments` (merges changes into groups), `changedLine` and `unreachableImages`. Only changed ornaments are in the state; `previous: "original"` means undo goes back to the group's own art.
- `ornament-store.ts` keeps the state and photos in IndexedDB (`nowandthen-ornaments` + the demo suffix). It's a `TODO` stand-in for the database, so "everyone in the group" is this browser for now.
- `use-ornaments.ts` opens the store itself and makes every change wait until it's open and loaded. `AppClient` owns it; `home-client.tsx` owns the open sheet and the picked (downscaled) photo.
