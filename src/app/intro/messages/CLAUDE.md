# app/intro/messages

Chats and the sealed-until-reply rule (spec: `docs/specs/messages.md`; tests: `tests/messages/`).

- `conversations.ts` is the pure reducer and selectors. Sealed memories live in `state.sealed`, never in a conversation's messages, until a reply moves them in. Every sender-facing selector (thread, list order, glow, Delivered) must keep ignoring `sealed`.
- `use-chat.ts` keeps state in localStorage (`TODO` until there's a database). `messages-client.tsx` maps state to view props and passes the dev-only `onSimulateReply` outside production.
