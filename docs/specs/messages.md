# Messages

The user's chats with their circles and friends, built from the designer's Messages and group chat references (phone, 390×844).
A memory sent from Daily 5 is **sealed until reply**: the sender sees no trace of it until a recipient answers. There is no "did they see it and ignore it" moment.
Tests: `tests/messages/`.

| ID | Behaviour |
|----|-----------|
| MSG-1 | **Recents.** The screen has a "Messages" title, a "New message" button (does nothing yet, TODO) and a search box ("search friends and circles") that filters everything below by name, ignoring case. The closest circles are pinned as a row of ornaments, then the closest friends as a second row. Below them, every other conversation that has a visible message, most recent activity first, each showing name, last visible message ("Name: text" in groups, "You: text" for mine) and time. Seed data lives in `src/app/intro/placeholder-data.ts` and loads only through the demo switch (`docs/specs/demo.md`). |
| MSG-2 | **Something new.** A pinned ornament or list row glows, and its label reads "<name>, new messages" instead of "<name>, nothing new", when its last visible message is from someone else and arrived after the user last opened that chat. Opening the chat clears it. |
| MSG-3 | **Thread.** The header has two panes, "now" on the left and "then" on the right (placeholder art), a band in the tree colours, the circle's logo (`docs/specs/group-logo.md`, LOGO-1–5; tapping it changes it) or the friend's avatar on the seam, the name beneath, and "Back to messages". Bubbles follow the reference: others' on the left (in groups with the sender's avatar and name), mine on the right in red. A memory shows as a small polaroid with its date, and under it the sender's answer to the Daily 5 prompt, if any (`docs/specs/daily5.md`, D5-11). "Delivered" shows under my last message only when it is the last visible message. The composer ("message <name>") sends text: the text appears, the chat rises to the top of the list, and "Delivered" shows. "Add a photo" does nothing yet (TODO). |
| MSG-4 | **Sealed on send.** Sending a memory seals it for the sender. It isn't in the thread, doesn't change the chat's last activity or its place in the list, doesn't make a pinned circle or friend glow, and shows no "Delivered" line. A conversation with no visible messages isn't listed at all. |
| MSG-5 | **Unsealed by a reply.** A reply from any recipient (the friend, or any member of the group) unseals all of that conversation's sealed memories. They appear in the thread, followed directly by the reply. The chat's activity becomes the reply's time, so it rises to the top of the list (or glows if pinned), and no "Delivered" line shows. A reply in another conversation unseals nothing. |
| MSG-6 | **Simulate reply (dev only).** Outside production builds, a dev strip on the recents screen lists each conversation holding sealed memories, each with a "simulate reply" button. The reply comes from a member, with placeholder text. The strip never renders when `NODE_ENV` is `production`. |
| MSG-7 | **Kept.** Conversations, sealed memories and last-opened times are kept in localStorage and survive a reload. Memory photos are loaded from the Daily 5 photo store (IndexedDB) by id. |
| MSG-8 | **No messages yet.** With no pinned circles or people and no listed chats, the screen shows "No messages yet. Send a memory to start one." under the search box. |

Layout and glow animation are visual and checked against the designer's references. The tests pin structure, labels, order and the sealed rules.
