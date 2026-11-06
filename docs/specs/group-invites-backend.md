# Group invites (server core)

Governed by `docs/adr/0001-privacy-and-storage-model.md` decision 8. Builds on `docs/specs/memories-backend.md` (groups, members). Code: `src/server/invites.ts`. Tests: `tests/server/invites*.test.ts`. HTTP: `docs/specs/memories-api.md`.
Callers pass the acting `userId` (the verified Clerk user id). This layer never reads identity from anywhere else.

## Managing invites (owner)

- **INV-1** Only a group's owner can create an invite. A member who is not the owner, a non-member, a group that does not exist, and a malformed group id all throw the same `NotFoundError`, and nothing is stored.
- **INV-2** The token is 32 random bytes encoded as base64url. Only its SHA-256 (hex) is stored. The plaintext is returned once, by create, and never by list or anything else.
- **INV-3** `expiresInDays` is a whole number from 1 to 30 (default 7). `maxUses` is a whole number from 1 to 50 (default 10). Any other value is rejected (`RangeError`) and nothing is stored.
- **INV-4** The owner can list the group's active invites: not revoked and not expired. Each has `id`, `createdAt`, `expiresAt`, `maxUses`, `useCount`, never the token or its hash. Newest first. Another group's invites are never included, and a non-owner gets `NotFoundError`.
- **INV-5** The owner can revoke an invite of that group. A non-owner, an invite of another group, an unknown id, a malformed id, and an already revoked invite all throw `NotFoundError`, and the invite is left as it was.

## Joining (any signed-in user holding a token)

A token is "usable" when it matches an invite that is not revoked, not expired, and has uses left. The caller does not need to be in the group or in the `users` table yet; both preview and join create the caller's user row first.

- **INV-6** `previewInvite(db, userId, token)` returns `{ groupName, inviterId, memberCount, alreadyMember }` for a usable token. It adds nobody and consumes no use. The inviter is the Clerk id, since names are not stored yet.
- **INV-7** A malformed, unknown, expired, revoked, or used-up token all throw the same `NotFoundError`, from both preview and join, so a caller cannot tell which case it was. Nothing is stored.
- **INV-8** `joinWithInvite` adds the caller as `member`, adds one to `useCount`, and returns `{ groupId, groupName, joined: true }`, all in one SQL statement. When no uses are left the next join throws `NotFoundError` and adds nobody. Two joins racing for the last use cannot both succeed: the use count is re-checked when it is incremented.
- **INV-9** A caller who is already a member gets `joined: false`, uses no use, and keeps their role (an owner opening their own link stays owner). The token must still be usable.
- **INV-10** A group that already has 30 members rejects a new member with `GroupFullError`, and no use is consumed. A preview of such a group still works. Joins racing for the last slot can overshoot the cap by the number of racers; the cap bounds growth and is not a security boundary.
- **INV-11** After 10 failed token lookups (any lookup that ended in `NotFoundError` because of the token) by one user within the past hour, every further lookup by that user, preview or join, throws `RateLimitedError` before the token is looked up. Blocked calls are not counted, successful lookups never count, failures older than an hour stop counting, and one user's failures never affect another.

Known edge: the same user double-submitting a join at the same instant can use two uses for one membership. That is safe (the cap is never exceeded) but wasteful.

Tracking: #28 (INV-1 to INV-5), #29 (INV-6 to INV-11).
