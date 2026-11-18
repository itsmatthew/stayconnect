# Group rename

Any member can rename a group from its profile. The rules are plain TypeScript in `src/app/intro/group-names/`, so the mobile app can import them unchanged.
TODO(server: group rename needs an API route): names are saved in this browser, so a rename only reaches this device.
Tests: `tests/group-rename/`.

| ID | Behaviour |
|----|-----------|
| RENAME-1 | **Valid names.** Spaces are trimmed from both ends. An empty name, or one of only spaces, is rejected. A name is at most 40 characters after trimming, and an emoji counts as one. |
| RENAME-2 | **Tap the name.** On the Home group card and the group profile, the group's name is the way in: a small pencil sits right after it, and tapping either one opens the rename sheet. They're one button, labelled "Rename ‹Group›", at least 44px tall, shared by both places, with one sheet and one save. The tap stays on the button, so nothing around it fires. Any member can use it. |
| RENAME-3 | **Rename sheet.** A dialog titled "Rename group" with a "Group name" field holding the current name, Cancel and Save. Save is off until the name is valid and different from the current one. A name that's too long shows "Keep it to 40 characters." The field doesn't cut off typing or pasting, so a pasted name is judged after trimming. |
| RENAME-4 | **Saving.** The name goes through `GroupNameStore`, whose methods are async so a server can replace it. The new name and the note appear only once the save succeeds. If it fails the sheet stays open with "Couldn't save. Try again." and nothing changes. |
| RENAME-5 | **Note.** After a rename the group's thread shows a small centered note in order with its messages: "‹Name› renamed the group to ‹new name›.", or "You renamed the group to ‹new name›." for the user. It's not a bubble, and it isn't a memory. |
| RENAME-6 | **Note in the chat list.** With the note last, the Messages row previews its text with no "Name:" prefix, the chat moves up the list, and the thread shows no "Delivered". |
| RENAME-7 | **Everywhere.** The new name shows on the tree label, the group card, the profile, the thread, the Messages list, the Daily 5 send sheet and Archive tags. Groups are keyed by id, so goals, ornaments, colors and chats carry over. A default logo's initials follow the new name. A custom logo stays. |
| RENAME-8 | **Kept.** Names live in localStorage under `nowandthen.groupNames.v1` plus the demo suffix (`docs/specs/demo.md`, DEMO-3). Missing or corrupt data means no renames. Blocked storage fails the save (RENAME-4). |
| RENAME-9 | **Portable.** Files in `src/app/intro/group-names/` use no React or browser APIs, apart from the localStorage adapter and the thin React hook. |
