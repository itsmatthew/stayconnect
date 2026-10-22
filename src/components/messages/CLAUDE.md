# components/messages

Messages as pure views (spec: `docs/specs/messages.md`): `messages-screen.tsx` (pinned ornament rows, chat list, search), `chat-thread.tsx`, `avatar.tsx` (shared with the Daily 5 send sheet), `logo-sheet.tsx`, `dev-sealed-panel.tsx`.

- Styled from the designer's Messages and group chat references. A friend's header "now/then" is placeholder `MemoryArt`; a group's is its header photos (`docs/specs/group-profile.md`, GP-12).
- Group logos (`docs/specs/group-logo.md`): `PartyAvatar` shows the party's `logo` image, else its `initials` (computed by the app, `src/app/intro/logos/initials.ts`), always ringed in the canopy colour. A group thread's header logo, name and filled header photos open the group profile only when `onOpenProfile` is passed; an empty header photo is a picker only when `onPickHeader` is passed. The logo and set photos are changed from the profile (`../profile/`).
- Views never know about sealed memories. The app layer hands them only what the sender may see. The dev strip renders only when `onSimulateReply` is passed.
