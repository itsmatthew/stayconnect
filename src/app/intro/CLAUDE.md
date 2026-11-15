# /intro

Sunrise video that crossfades into the home screen. Specs: `docs/specs/intro.md`, `docs/specs/home.md`; tests: `tests/intro/`, `tests/home/`.

- Intro layering: `intro-sequence.ts` (pure reducer, all timing rules) → `use-intro-sequence.ts` (wires media events/timer) → `intro-client.tsx` → view in `src/components/intro/`.
- Home lives here until it gets its own route: `home-client.tsx` (state) → `src/components/home/home-screen.tsx` (view). Rotation maths is pure in `circle-carousel.ts`.
- Put new timing/rotation rules in the pure modules with a test, not in hooks or views.
- `placeholder-groups.ts` holds every placeholder group, memory and caption, marked `TODO(re-evaluate when groups come from the database)`. That file is the swap point for real data.
- Fonts (Fraunces with its `opsz` axis, Karla) are loaded in `page.tsx` and exposed as `--font-fraunces` / `--font-karla`.
