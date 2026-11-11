# app/intro/gifts

Gifts (spec: `docs/specs/gifts.md`; tests: `tests/gifts/`).

- `gift.ts`, `gift-catalog.ts`, `gift-recipients.ts`, `gift-store.ts`, `gift-events.ts` and `received.ts` are plain TypeScript for the mobile app to import unchanged. No React, browser APIs or `@/` imports; a test enforces it.
- Only `local-gift-store.ts`, `local-gift-events.ts`, `local-received.ts`, the `use-*.ts` hooks and the `*-client.tsx` files may touch the platform. The local files are fakes, marked `TODO(server)`.
- A gift stores catalog ids, never looks. Add an item to the catalog with its `access`; never copy a color or style onto a gift.
- A gift must never be lost: save before anything that can fail. Rules for that go here, with a test, not in hooks or views.
- Receiving (GIFT-18 to GIFT-22): `received.ts` holds the rules (`waiting` decides what pops up), `received-client.tsx` turns a received gift into the card's look and runs the pop-ups (`useGiftPopups`). AppClient holds the list (`use-received.ts`) and shows waiting gifts once the intro has ended (`AppShown`, from `../app-shown.ts`), oldest first, with no way to close one unopened; Me shows opened ones on your shelf. Opening is never told to anyone: keep it that way.
- Events are for our own analysis. Never show them in the app or send them to a third party.
