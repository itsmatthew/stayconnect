# tests

Vitest + React Testing Library + jsdom (`npm test`). Mirror the spec: `tests/<feature>/` ↔ `docs/specs/<feature>.md`, and tag assertions with spec IDs (e.g. `INTRO-4`).
jsdom has no media playback, so stub `HTMLMediaElement` `play`/`pause`/`readyState` (see `tests/intro/intro-crossfade.test.tsx`).
Golden files: `tests/home/scenery.test.tsx` compares rendered SVG with `public/home-background.svg`; a mismatch means the generator or the asset changed.
IndexedDB: import `fake-indexeddb/auto` and open a uniquely named store per test. jsdom lacks `URL.createObjectURL`, so stub it. Browser-only pieces (face detection, image decoding) are injected as stand-ins.
App data: vitest runs with `NODE_ENV=test`, so the demo switch is off. Tests that render `AppClient` pass `data` explicitly (`demoData` from `@/app/intro/app-data`, or a small fixture like `tests/archive/fixtures.ts`), and an `openArchive` with a unique store name.
The suite is jsdom-heavy, so `vitest.config.mts` allows 15s per test; don't lower it to chase speed.
