# /intro

Sunrise video that crossfades into home. Spec: `docs/specs/intro.md`; tests: `tests/intro/`.

- Layering: `intro-sequence.ts` (pure reducer, all timing rules) → `use-intro-sequence.ts` (wires media events/timer) → `intro-client.tsx` → view in `src/components/intro/`.
- Put new timing rules in the reducer with a reducer test, not in the hook or view.
- Home is a static screenshot placeholder (`HomePlaceholder`), marked `TODO(re-evaluate when the real homepage components are built)`.
