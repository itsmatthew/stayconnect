# Memories backend (server core)

Governed by `docs/adr/0001-privacy-and-storage-model.md`. Code: `src/server/`. Tests: `tests/server/`.
Scope of this slice: data model and access rules only. Photo upload, invites, and HTTP routes are separate slices.

Callers pass the acting `userId` (the verified Clerk user id). This layer never reads identity from anywhere else.

## Groups

- **BE-1** A user can create a group and becomes its `owner`. Each group has one or more `members`; the role is `owner` or `member`.
- **BE-2** `requireMember(userId, groupId)` succeeds only for a current member. For a non-member and for a group that does not exist it throws the same `NotFoundError`, so a caller cannot probe which groups exist.
- **BE-16** `listGroups(userId)` returns the groups the user currently belongs to, each with its id, name, and the user's role, newest group first. It returns nothing for groups the user left or never joined, and an empty list for a user with no groups.

## Sending

- **BE-3** Only a member of a group can send a memory to it. A non-member gets `NotFoundError` and nothing is stored.
- **BE-4** A memory's recipients are every other current member of the group at send time. The sender is never a recipient. Sending to a group with no other member is rejected (`NoRecipientsError`) and stores nothing.
- **BE-5** A memory and its recipients are stored together or not at all.
- **BE-6** A memory expires 60 days after it is sent. Expired memories are never returned to anyone.

## Reading

- **BE-7** `listInbox(userId)` returns memories the user received, newest first, only while they are still a member of that group, and never deleted or expired.
- **BE-8** Sealed until reply: `listSent(userId)` returns a memory the user sent only once at least one recipient who is still a member of the group has replied to it. Before that it is absent, not merely hidden in the response. After a reply it includes who replied.
- **BE-9** `getMemory(userId, memoryId)` returns a memory only to one of its current recipients, or to its sender once it is unsealed (BE-8). Every other case, including an id that does not exist, throws the same `NotFoundError`.

## Replying and deleting

- **BE-10** Only a recipient who is still a member can reply. Anyone else, including the sender, gets `NotFoundError`.
- **BE-11** Replying twice as the same recipient is allowed and changes nothing (idempotent).
- **BE-12** Only the sender can delete a memory. Deleting removes it for everyone (inbox, sent, get). Anyone else gets `NotFoundError` and the memory is unchanged.

## Membership change

- **BE-13** A user who leaves or is removed from a group immediately loses access to that group's memories (BE-7, BE-9, BE-10), including ones sent before. Memories they sent stay with the remaining recipients, and the sender can still delete them (BE-12) after leaving, so a person can retract what they sent.

- **BE-15** A group name is 1 to 80 characters after trimming, and a caption is at most 500 characters. Longer or empty values are rejected and nothing is stored.

## Schema

- **BE-14** Migrations apply in numeric order from an empty database, and re-running them is harmless.
