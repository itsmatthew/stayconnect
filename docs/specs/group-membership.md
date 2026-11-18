# Group membership: leaving and removing

Governed by `docs/adr/0001-privacy-and-storage-model.md`. Builds on `docs/specs/memories-backend.md` (BE-13: leaving ends access at once) and `docs/specs/group-invites-backend.md`. Code: `src/server/members.ts`. Tests: `tests/server/members.test.ts`. HTTP: API-22 in `docs/specs/memories-api.md`.
Callers pass the acting `userId` (the verified Clerk user id). This layer never reads identity from anywhere else.

`removeGroupMember(db, userId, groupId, targetUserId)` removes `targetUserId` from the group. Leaving is the case where `userId` and `targetUserId` are the same.

- **GM-1** The owner can remove any other member.
- **GM-2** Any member can remove themself (leave).
- **GM-3** A member who is not the owner cannot remove someone else. That, a non-member caller, a group that does not exist, a malformed group id, a target who is not in the group, and an owner of a different group all throw the same `NotFoundError`, and nothing changes.
- **GM-4** The last owner of a group cannot leave or be removed: `LastOwnerError`, and nothing changes. There is no ownership transfer in v1 and every group is created with one owner, so in practice the owner of a group cannot leave it. If a group ever had two owners, either could leave while the other remained.
- **GM-5** Removal ends access at once (BE-13): the removed person's inbox, reading, and replying for that group stop working, and later memories no longer go to them. Memories they sent stay with the remaining recipients, and they can still delete what they sent.

Known edge: removal is not a ban. If the person still holds an unrevoked, unexpired invite link they can join again. To keep someone out, revoke the link first (INV-5).

Tracking: #32.
