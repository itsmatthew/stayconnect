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

## Sending and reading memories

Data rules are in `docs/specs/memories-backend.md` (BE-3 to BE-9). Memory responses list their fields explicitly: the storage `photoKey` is never returned, and photos are not accepted over HTTP yet.

- **API-10** `POST /api/memories` with `{ "groupId": uuid, "caption": string }` sends a memory and returns `201` with `{ id }`. The caption is 0 to 500 characters, counted as characters (an emoji counts as one, matching the database). A malformed `groupId` or an invalid caption is `400`. Unknown fields, including `photoKey`, are ignored and not stored. A group the caller is not in, or that does not exist, is `404` (BE-3). A group with no other member is `409` (BE-4). Nothing is stored in any failing case.
- **API-11** `GET /api/memories/inbox` returns `200` with `{ memories: [{ id, groupId, senderId, caption, createdAt, replied }] }`: memories the caller received, newest first (BE-7), never the caller's own sends.
- **API-12** `GET /api/memories/{id}` returns `200` with `{ id, groupId, senderId, caption, createdAt }` to a current recipient, or to the sender once a recipient has replied (BE-8, BE-9). A malformed id, an unknown id, someone else's memory, and the sender's own memory before any reply all return the same `404` with the same body.

## Replying, sent list, and deleting

Data rules are in `docs/specs/memories-backend.md` (BE-8, BE-10 to BE-13). Every id that is malformed, unknown, dead (deleted or expired), or not the caller's to act on returns the same `404` with the same body.

- **API-13** `POST /api/memories/{id}/reply` records the caller's reply and returns `200` with `{ replied: true }`. It needs no body. Only a current recipient may reply; the sender, a stranger, a former member, and a missing or dead memory get `404` and nothing is stored (BE-10). Replying again returns `200` and changes nothing (BE-11). A reply unseals the memory for its sender (API-12, API-14).
- **API-14** `GET /api/memories/sent` returns `200` with `{ memories: [{ id, groupId, senderId, caption, createdAt, replies: [{ userId, createdAt }] }] }`: the caller's own memories that at least one current member has replied to, newest first (BE-8). A memory with no reply is absent from the list, not hidden in it. Replies from people who have left the group are not listed.
- **API-15** `DELETE /api/memories/{id}` deletes the caller's own memory and returns `200` with `{ deleted: true }`. It disappears from every inbox, the sent list, and `GET /api/memories/{id}` (BE-12). Anyone but the sender, including a recipient, gets `404` and the memory is unchanged. A sender who has left the group can still delete (BE-13). Deleting an already deleted memory is `404`.
