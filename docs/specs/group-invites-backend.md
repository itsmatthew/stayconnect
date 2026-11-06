# Group invites (server core)

Governed by `docs/adr/0001-privacy-and-storage-model.md` decision 8. Builds on `docs/specs/memories-backend.md` (groups, members). Code: `src/server/invites.ts`. Tests: `tests/server/invites*.test.ts`. HTTP: `docs/specs/memories-api.md`.
Callers pass the acting `userId` (the verified Clerk user id). This layer never reads identity from anywhere else.

## Managing invites (owner)

- **INV-1** Only a group's owner can create an invite. A member who is not the owner, a non-member, a group that does not exist, and a malformed group id all throw the same `NotFoundError`, and nothing is stored.
- **INV-2** The token is 32 random bytes encoded as base64url. Only its SHA-256 (hex) is stored. The plaintext is returned once, by create, and never by list or anything else.
- **INV-3** `expiresInDays` is a whole number from 1 to 30 (default 7). `maxUses` is a whole number from 1 to 50 (default 10). Any other value is rejected (`RangeError`) and nothing is stored.
- **INV-4** The owner can list the group's active invites: not revoked and not expired. Each has `id`, `createdAt`, `expiresAt`, `maxUses`, `useCount`, never the token or its hash. Newest first. Another group's invites are never included, and a non-owner gets `NotFoundError`.
- **INV-5** The owner can revoke an invite of that group. A non-owner, an invite of another group, an unknown id, a malformed id, and an already revoked invite all throw `NotFoundError`, and the invite is left as it was.

Tracking: #28.
