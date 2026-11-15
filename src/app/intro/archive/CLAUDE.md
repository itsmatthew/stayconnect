# app/intro/archive

The 65 Archive's wiring (spec: `docs/specs/archive.md`; tests: `tests/archive/`). Not connected to Daily 5 or its pools.

- Rules are pure and tested: `periods.ts` (ISO weeks, the bonus week, windows, labels, Me-grid order), `capture-check.ts` (only photos taken in the period), `gate.ts` (who sees what, circle lines, feed sections) and `copy.ts` (every slot, ribbon and locked line). Change rules there, with a test, not in the client or hook.
- `archive-store.ts` is its own IndexedDB (`nowandthen-archive`, `.demo` suffix in demo mode). Posts are keyed by period, so IndexedDB refuses a second post: never switch `add` to `put`.
- Only the EXIF capture date counts. Never fall back to `file.lastModified` here (Daily 5 does; the Archive must not).
- The gate is applied before anything reaches a view: locked posts become stand-in colours only, never photos, names or times.
- Captions (ARC-13) are cleaned by `cleanCaption` in `copy.ts` and saved with the post in one `add`. Never add an update path: neither the photo nor the caption can change after posting.
