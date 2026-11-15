# Memory invites — TODO

> **Status: TODO, not built.** This is the plan for the future `memory-invites` branch. Nothing here exists in the app yet, there are no tests for it, and the rows below carry no spec IDs. When the branch starts, each item becomes a numbered row (`INV-1`, …) with a failing test, in the same PR as its implementation.

## Joining

- **Invite-only, through memories.** There is no open sign-up. The only way in is to receive a memory: either a single memory, or a tree's envelope link.

## Sending to non-members

- A memory can be sent to someone who isn't on Now & Then, by phone number.
- They get an **envelope link**, drawn from the designer's art, with a special link preview in iMessage.
- They can open the memory on the web without an account. Replying requires joining, and the reply is what reveals the memory to the sender (the same sealed-until-reply rule as `docs/specs/messages.md`, MSG-4/5).
- Each non-member can have at most one unanswered memory at a time.

## Plant a tree (the main way to create a group)

- "Plant a tree" asks for a name and a colour, and that's all.
- The app creates one envelope link holding an old photo of the group. The user pastes it into the group's existing chat (iMessage etc.).
- Anyone who opens it joins that tree.

## Other ways to form a group

1. **One memory, several people.** Send a memory to several people at once; the sender picks everyone in the photo, with no face recognition. The first reply prompts every recipient "Make this a circle?", with that memory as the circle's first ornament.
2. **Add people manually.**

A group always has 3 or more people. A single person is never a group.

## Your private circle builds itself

- When someone becomes a connection (they reply to your memory, or share a tree with you), a private prompt asks "Where does [name] sit?": **nest**, **branches** or **bloom**.
- Skipping puts them in bloom. They can be moved at any time.
- Only the user ever sees this.

## Growth prompts

- After a reply: "You and [name] have shared N memories — start a circle?" N counts only memories exchanged between the two of them.
- A new recipient is asked "Who else is in this photo?" and can pass the memory on.

## New-user home

- Replaces today's empty sapling (`docs/specs/home.md`, HOME-12): home shows who brought the new user in, "[Name] sent you a memory — start a circle with them?"
- The empty-state buttons become "Plant a tree" and "Send a memory to a friend" (today it's a single "Go to Daily 5").

## Safety

- Block.
- "Don't let this person send me memories."
- "Only people in my circles can send me memories."
