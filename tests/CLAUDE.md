# tests

Vitest + React Testing Library + jsdom (`npm test`). Mirror the spec: `tests/<feature>/` ↔ `docs/specs/<feature>.md`, and tag assertions with spec IDs (e.g. `INTRO-4`).
jsdom has no media playback, so stub `HTMLMediaElement` `play`/`pause`/`readyState` (see `tests/intro/intro-crossfade.test.tsx`).
