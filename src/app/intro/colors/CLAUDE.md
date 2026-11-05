# app/intro/colors

Group colors (spec: `docs/specs/group-colors.md`; tests: `tests/group-colors/`).

- `palette.ts`, `group-colors.ts`, `color-overrides.ts` and `member-colors.ts` are plain TypeScript for the mobile app to import unchanged. No React, browser APIs or `@/` imports; a test enforces it.
- Only `local-color-overrides.ts` (localStorage) and `use-color-overrides.ts` (React) may touch the platform. Mobile swaps the store, which is why its methods are async.
- Text and logos on a group's color stay cream, so every shade must keep 4.5:1 against cream (COLOR-2). Add or change a shade only with that test passing.
- `AppClient` applies colors once, with `withViewerColors`. Views draw `palette` and know nothing about shades or overrides.
