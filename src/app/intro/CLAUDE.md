# /intro

Sunrise video that crossfades into the app: Circles (home), Daily 5 and Messages tabs. Specs: `docs/specs/intro.md`, `docs/specs/home.md`, `docs/specs/daily5.md`, `docs/specs/messages.md`; tests: `tests/intro/`, `tests/home/`, `tests/daily5/`, `tests/messages/`, `tests/app/`.

- Intro layering: `intro-sequence.ts` (pure reducer, all timing rules) → `use-intro-sequence.ts` (wires media events/timer) → `intro-client.tsx` → view in `src/components/intro/`.
- The app lives here until it gets routes: `app-client.tsx` holds the tab and the shared chat state (a Daily 5 send must land in Messages), then `home-client.tsx`, `daily5/` and `messages/` (each has its own CLAUDE.md). Rotation maths and the opening view are pure in `circle-carousel.ts`.
- Put new timing/rotation rules in the pure modules with a test, not in hooks or views.
- `placeholder-data.ts` holds *all* placeholder data: groups (closest first, with a `closest` flag), friends, seed conversations and simulated replies. It's marked `TODO(re-evaluate when groups come from the database)` and is the swap point for real data. Keep fake data in that one file.
- Fonts (Fraunces with its `opsz` axis, Karla) and Caveat (Daily 5 dates) are loaded in `page.tsx` and exposed as `--font-fraunces` / `--font-karla` / `--font-caveat`.
