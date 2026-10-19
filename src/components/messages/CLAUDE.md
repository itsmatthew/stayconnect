# components/messages

Messages as pure views (spec: `docs/specs/messages.md`): `messages-screen.tsx` (pinned ornament rows, chat list, search), `chat-thread.tsx`, `avatar.tsx` (shared with the Daily 5 send sheet), `dev-sealed-panel.tsx`.

- Styled from the designer's Messages and group chat references. The header's "now/then" photos are placeholder `MemoryArt` until circles have real photos.
- Views never know about sealed memories. The app layer hands them only what the sender may see. The dev strip renders only when `onSimulateReply` is passed.
