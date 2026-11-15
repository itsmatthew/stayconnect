# app/intro/messages

Chats and the sealed-until-reply rule (spec: `docs/specs/messages.md`; tests: `tests/messages/`).

- `conversations.ts` is the pure reducer and selectors. Sealed memories live in `state.sealed`, never in a conversation's messages, until a reply moves them in. Every sender-facing selector (thread, list order, glow, Delivered) must keep ignoring `sealed`.
- `use-chat.ts` keeps state in localStorage (`TODO` until there's a database). `messages-client.tsx` maps state to view props and passes the dev-only `onSimulateReply` outside production. It also opens a group's profile (`../profile/profile-client.tsx`) and the logo sheet over it.
- `use-photo-urls.ts` turns memory photo ids into object URLs (thread and profile).
