# tests/server

Vitest against an in-memory Postgres (PGlite) with the real migration files applied (`helpers.ts`), so nothing touches Neon. Mirror `docs/specs/memories-backend.md` and tag each test with its spec id (`BE-8`). Add a test for every new access rule, including the "someone else's id" case.
`npm run test:coverage` measures `src/server` and fails below the thresholds in `package.json`. Raise them when coverage improves; never lower them to make a change pass. Line coverage is not the goal: a rule is covered when a test breaks if the rule does, so check new tests by breaking the code on purpose.
`neon.integration.test.ts` runs the real Neon driver and `scripts/migrate.mjs`. It is skipped unless `NEON_INTEGRATION=1`, and `DATABASE_URL` must point at a throwaway Neon branch, never the main database. Run it with `NEON_INTEGRATION=1 node --env-file=.env.neon-test node_modules/vitest/vitest.mjs run tests/server/neon.integration.test.ts` (`.env.neon-test` is git-ignored).
`http/` tests the HTTP handlers (`docs/specs/memories-api.md`, tag tests `API-n`) with a fake `getUserId`; `http/route.test.ts` is the one test through the real route wiring.
