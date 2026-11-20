# app/intro/me

The Me tab's wiring (spec: `docs/specs/me.md`; tests: `tests/me/`). It reads your own posts with the Archive's `use-my-posts.ts` and lays them on `periodsOfYear` (`../archive/periods.ts`). Other people's posts never fill your slots.

- Your profile (ME-5 to ME-8): `profile.ts` is plain TypeScript (no React or browser APIs): the line, the answers (this week's question's id carries its week), who sees each memory, and the weekly bank (TODO(design)). `use-profile.ts` loads and saves it through `local-profile.ts` (a fake, `TODO(server)`). Photos are ornaments under `ME_PROFILE`: now is `LAST`, then is `FIRST`, memories are 0 to 2, with the caption on the ornament. `AppClient` builds `ProfilePhotos` from its ornaments.
