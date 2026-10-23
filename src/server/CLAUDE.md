# src/server

Data-access layer for groups and memories (`docs/specs/memories-backend.md`, ADR `docs/adr/0001-privacy-and-storage-model.md`).

- Every function takes `(db, userId, ...)`. `userId` is the verified Clerk id from the session, never from a request body or URL.
- Every group-scoped call starts with `requireMember` or joins `group_members` for the caller. Deny by default.
- Unknown ids and ids you may not see throw the same `NotFoundError`. Don't add a distinct "forbidden" error: it leaks which ids exist.
- A write that touches several tables is one SQL statement (CTE). Neon's HTTP driver can't hold a transaction across separate queries.
- Only this folder talks to the database. Pages, components, and route handlers call these functions.
- Migrations live in `db/migrations`, must be idempotent, and run in numeric order (`npm run db:migrate`).
