# components/messages

Messages as pure views (spec: `docs/specs/messages.md`): `messages-screen.tsx` (pinned ornament rows, chat list, search), `chat-thread.tsx`, `avatar.tsx` (shared with the Daily 5 send sheet), `logo-sheet.tsx`, `dev-sealed-panel.tsx`.

- Styled from the designer's Messages and group chat references. The header's "now/then" photos are placeholder `MemoryArt` until circles have real photos.
- Group logos (`docs/specs/group-logo.md`): `PartyAvatar` shows the party's `logo` image, else its `initials` (computed by the app, `src/app/intro/logos/initials.ts`), always ringed in the canopy colour. A group thread's header logo is a button only when `onChangeLogo` is passed.
- Views never know about sealed memories. The app layer hands them only what the sender may see. The dev strip renders only when `onSimulateReply` is passed.
