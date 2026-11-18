# app/intro/archive

The Archive's wiring (spec: `docs/specs/archive.md`; tests: `tests/archive/`). Not connected to Daily 5 or its pools.

- Rules are pure and tested: `periods.ts` (ISO weeks, the bonus week, windows, labels, Me-grid order), `capture-check.ts` (only photos taken in the period), `gate.ts` (who sees what, with "post to see" off behind `POST_TO_SEE`), `feed.ts` (the feed, newest first, and this week's card) and `copy.ts` (every row, footer and locked line). Change rules there, with a test, not in the client or hook.
- Posts go through AppClient's `track` (via `useMyPosts`), so the store closes only after a post started before unmount has saved.
- `archive-store.ts` is its own IndexedDB (`nowandthen-archive`, `.demo` suffix in demo mode). Posts are keyed by period, so IndexedDB refuses a second post: never switch `add` to `put`.
- Only the EXIF capture date counts. Never fall back to `file.lastModified` here (Daily 5 does; the Archive must not).
- The gate is applied before anything reaches a view. If "post to see" comes back, hidden posts must reach views only as stand-in colours, never photos, names or times.
- Captions (ARC-13) are cleaned by `cleanCaption` in `copy.ts` and saved with the post in one `add`. Never add an update path: neither the photo nor the caption can change after posting.
