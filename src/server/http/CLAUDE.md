# src/server/http

HTTP adapter for the API (`docs/specs/memories-api.md`). Pure handlers `(req, deps) => Promise<Response>`: no Clerk import, no SQL, no `next/*` import. They call `src/server` functions for data.

- Every endpoint is wrapped in `handle()` (`kit.ts`). It runs the shared rules in order: session 401, Origin 403, JSON 415, then your code. Don't skip it: route handlers are public and the proxy only guards `/dashboard`.
- `userId` comes from `deps.getUserId()` only. Never read it from the body, URL, or a header.
- Validate bodies with `parseBody(req, schema)` and a zod schema in `schemas.ts`. Error bodies carry codes and field names, never submitted values.
- Throw `NotFoundError`/`NoRecipientsError`/`GroupFullError`/`RateLimitedError` (mapped to 404/409/409/429) or `HttpError`. Don't build error responses by hand, and never put `err.message` in a response.
- Responses go through `json()` so `Cache-Control: private, no-store` is always set.
- Tests: `tests/server/http/`, with a fake `getUserId` and the in-memory database. Tag each test with its API id.
- Return explicit fields, never a data-layer object as is: `photoKey` and other storage details stay server-side (`memories.ts` `view`).
- Dynamic ids come from the route's awaited `params` and are passed to the handler as an argument. A malformed id is a 404, not a 400, so it answers like an unknown id.
- Invite tokens arrive as the last URL segment (`join.ts`), so they appear in hosting request logs. Never log one, never put one in a response, and never put one in an error message.
- `invites.ts` (owner management): the only response that ever contains a token is the one from creating it. List and revoke never do. A POST with no body means defaults, so check `req.body === null` before parsing.
- `members.ts`: `DELETE` is both leave and remove, so the handler only checks the target id length (400) and leaves who-may-do-what to the data layer. `LastOwnerError` maps to 409 `last_owner` in `kit.ts`.
