# app/intro/ornaments

Changing a group's ornaments and its logo (specs: `docs/specs/home.md`, HOME-14–18; `docs/specs/group-logo.md`, LOGO-4–6; tests: `tests/home/ornaments.test.ts`, `ornament-store.test.ts`, `ornament-sheet.test.tsx`, `tests/group-logo/`).

- The logo is one more slot, `LOGO`, beside the ornament indexes (`Slot = number | "logo"`), with an empty caption. So change, undo, storage, image cleanup and URLs are shared; `withOrnaments` also sets `CircleGroup.logo`.

- `ornaments.ts` is pure: the reducer (`change`, one-level `undo`), caption normalizing, `withOrnaments` (merges changes into groups), `changedLine` and `unreachableImages`. Only changed ornaments are in the state; `previous: "original"` means undo goes back to the group's own art.
- `ornament-store.ts` keeps the state and photos in IndexedDB (`nowandthen-ornaments` + the demo suffix). It's a `TODO` stand-in for the database, so "everyone in the group" is this browser for now.
- `use-ornaments.ts` opens the store itself and makes every change wait until it's open and loaded. `AppClient` owns it; `home-client.tsx` owns the open sheet and the picked (downscaled) photo.
