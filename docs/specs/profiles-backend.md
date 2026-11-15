# Profiles: display name and avatar

Governed by `docs/adr/0001-privacy-and-storage-model.md`. Builds on `docs/specs/memories-backend.md` (users are keyed by their Clerk user id; BE-2 membership checks). Code: `src/server/profiles.ts`, migration `db/migrations/0005_profiles.sql`. Tests: `tests/server/profiles.test.ts`. HTTP arrives in later tasks (`/api/me`, member list, sender and inviter profiles).
Callers pass the acting `userId` (the verified Clerk user id). This layer never reads identity from anywhere else and never imports Clerk: the Clerk fields it needs are passed in as plain values.

A user has an optional **display name** (1 to 50 characters) and an optional **avatar URL**. Both are stored on `users` and are `null` until set.

- **PRF-1** `resolveName({ displayName, firstName, username })` returns the first of those three that is not blank after trimming, in that order, and `"Someone"` if none is. The result is never empty. Used wherever a name is shown, so a person without a name still appears.
- **PRF-2** `seedProfile(db, userId, clerk)` creates the user row if needed and fills in the profile from Clerk's values:
  - the display name is set from Clerk's first name, else username, **only if the user has no display name yet**; a name the user chose is never overwritten;
  - a name from Clerk is cut to 50 characters; if Clerk has no usable name the display name stays `null`;
  - the avatar is Clerk's `imageUrl` when Clerk says the user has an image (`hasImage`), refreshed on every call; otherwise `null`;
  - an avatar URL is stored only if it starts with `https://` and is at most 2048 characters; anything else is stored as `null`, so a hostile value can never reach a page as a link;
  - `clerk` of `null` (Clerk could not be reached) changes nothing and does not fail;
  - returns the user's profile `{ id, displayName, avatarUrl }` with the name resolved by PRF-1.
- **PRF-3** `updateDisplayName(db, userId, name)` sets the display name to the trimmed value and returns the profile. A name that is blank after trimming, or longer than 50 characters (counted as characters, so an emoji is one), is rejected and nothing changes; the database enforces the same limits. It creates the user row if needed and leaves the avatar alone.
- **PRF-4** `getProfiles(db, userId, groupId)` returns every member of the group as `{ id, displayName, avatarUrl, role }`, owner first, then by when they joined. It is for members only: a non-member caller, a group that does not exist, and a malformed group id all throw the same `NotFoundError`. It returns nothing about people the caller shares no group with.

Avatar privacy: an avatar URL is Clerk's own CDN link. It is public and unguessable, unlike the signed URLs ADR 0001 requires for memory photos. This layer only returns it to people who share a group with the user (PRF-4); anyone who is given the link can open it.

Tracking: #48 (epic #47).
