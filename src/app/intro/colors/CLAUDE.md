# app/intro/colors

Group colors (spec: `docs/specs/group-colors.md`; tests: `tests/group-colors/`).

- `palette.ts`, `group-colors.ts`, `color-overrides.ts` and `member-colors.ts` are plain TypeScript for the mobile app to import unchanged. No React, browser APIs or `@/` imports; a test enforces it.
- Only `local-color-overrides.ts` (localStorage) and `use-color-overrides.ts` (React) may touch the platform. Mobile swaps the store, which is why its methods are async.
- Text and logos on a group's color stay cream. Base shades are the designer's exact values; clash shades may never have worse contrast against cream than their base, so they only go darker (COLOR-2).
- `AppClient` applies colors once, with `withViewerColors`. Views draw `palette` and know nothing about shades or overrides.
