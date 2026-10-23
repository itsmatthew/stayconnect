# tests/server

Vitest against an in-memory Postgres (PGlite) with the real migration files applied (`helpers.ts`), so nothing touches Neon. Mirror `docs/specs/memories-backend.md` and tag each test with its spec id (`BE-8`). Add a test for every new access rule, including the "someone else's id" case.
