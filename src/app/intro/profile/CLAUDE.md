# app/intro/profile

A group's profile, wired (spec: `docs/specs/group-profile.md`; tests: `tests/group-profile/`, `tests/home/countdown.test.tsx`).

- `goals.ts` is pure: one goal per group (label + optional "YYYY-MM-DD"), who's in, the countdown text and expiry. Only a date change resets who's in (GP-8). Put goal rules here, with a test.
- `use-goals.ts` keeps goals in localStorage (`nowandthen.goals.v1` + the demo suffix). It's a `TODO` stand-in for the database; AppClient owns it so Home's tags and the profile share it.
- `then-memory.ts` picks the "then" memory. Pass it visible messages only, so sealed memories never surface; `fileDated` memories never count.
- `profile-client.tsx` maps chat, groups, Your circle placements and goals to the pure views in `src/components/profile/`. Opened by `messages-client.tsx` from a group thread.
