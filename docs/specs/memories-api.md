# Memories HTTP API

Governed by `docs/adr/0001-privacy-and-storage-model.md`. Data rules: `docs/specs/memories-backend.md`. Code: `src/server/http/` (handlers), `src/app/api/` (wiring). Tests: `tests/server/http/`.

Route Handlers are public endpoints and the proxy only guards `/dashboard`, so every handler authenticates itself. The acting user id comes only from the verified session, never from the body or URL.

## Shared rules (every endpoint)

Checks run in this order, and the first to fail answers.

- **API-1** A signed-out request gets `401` and nothing is read or stored.
- **API-2** A request that changes data (`POST`, `PUT`, `PATCH`, `DELETE`) with an `Origin` header that does not match the request host gets `403`. A missing `Origin` is allowed (non-browser clients).
- **API-3** A request with a body must be `application/json`, otherwise `415`.
- **API-4** Input is validated before any data access. Invalid input gets `400` with `{ "error": "invalid_request" }` and a list of field names that failed. The body never contains SQL, stack traces, or the submitted values.
- **API-5** `NotFoundError` is `404` with `{ "error": "not_found" }`. `NoRecipientsError` is `409` with `{ "error": "no_recipients" }`.
- **API-6** Any other error is `500` with `{ "error": "internal" }`. The log line has the error name and message only: never the request body or headers.
- **API-7** Every response, including errors, carries `Cache-Control: private, no-store`.

## Groups

- **API-8** `POST /api/groups` with `{ "name": string }` creates a group (BE-1, BE-15) and returns `201` with `{ id, name }`. The name is 1 to 80 characters after trimming. Extra fields are ignored.
- **API-9** `GET /api/groups` returns `200` with `{ groups: [{ id, name, role }] }`: only the caller's groups, newest first (BE-16).
