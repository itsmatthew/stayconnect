# app/intro/gifts

Gifts (spec: `docs/specs/gifts.md`; tests: `tests/gifts/`).

- `gift.ts`, `gift-catalog.ts`, `gift-recipients.ts`, `gift-store.ts` and `gift-events.ts` are plain TypeScript for the mobile app to import unchanged. No React, browser APIs or `@/` imports; a test enforces it.
- Only `local-gift-store.ts`, `local-gift-events.ts`, `use-gift-draft.ts` and `gift-maker-client.tsx` may touch the platform. The local files are fakes, marked `TODO(server)`.
- A gift stores catalog ids, never looks. Add an item to the catalog with its `access`; never copy a color or style onto a gift.
- A gift must never be lost: save before anything that can fail. Rules for that go here, with a test, not in hooks or views.
- Events are for our own analysis. Never show them in the app or send them to a third party.
