# components/profile

A group's profile as pure views (spec: `docs/specs/group-profile.md`; tests: `tests/group-profile/`): `group-profile.tsx` (the page), `members-string.tsx`, `next-card.tsx` (then + next time together + who's in), `photo-grid.tsx` (grid, full-screen "See all"), `goal-sheet.tsx`, `ornament-view.tsx`, `types.ts`.

- Built from the designer's circle profile reference, minus the superlatives, the "most active" aura and sparkles, the gift shelf and the settings gear. Never add a ranking of members.
- Views know nothing about sealed memories, goals' rules or dates: the app (`src/app/intro/profile/`) hands them visible photos, the "then" pick and ready-made goal text.
- "See all" loads more with an `IntersectionObserver` on the end of the grid; jsdom has none, so tests stub it.
