# app/intro/group-names

Group renaming (spec: `docs/specs/group-rename.md`; tests: `tests/group-rename/`).

- `group-names.ts` is plain TypeScript for the mobile app to import unchanged. No React, browser APIs or `@/` imports; a test enforces it.
- Only `local-group-names.ts` (localStorage) and `use-group-names.ts` (React) may touch the platform. Replace the fake with a real store once the API route exists.
- `AppClient` applies names once, in `viewerData`, so views just read `name`. Never key anything by a group's name: two groups can share one.
- Nothing shows until the save succeeds, so there's never a note for a rename that didn't happen.
