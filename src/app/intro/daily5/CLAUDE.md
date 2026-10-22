# app/intro/daily5

Daily 5 wiring (spec: `docs/specs/daily5.md`; tests: `tests/daily5/`).

- Rules are pure in `daily-pick.ts` (eligibility, 3+2 split, faces, seeding). Change them there, with a test, not in `use-daily5.ts`.
- `AppClient` owns the photo store (`useStore`) and closes it on unmount only after tracked work settles. `useDaily5` runs every refresh and import through that `track`; route any new store writes through it too.
- `photo-store.ts` is plain IndexedDB, with metadata and images in separate stores. Photos never leave the browser: don't add uploads or remote image services.
- `face-detector.ts` only *detects* faces (MediaPipe BlazeFace short-range). Never add recognition or embeddings. Its WASM is copied to `public/mediapipe/wasm` by `scripts/copy-mediapipe.mjs` (gitignored) and the model is committed in `public/mediapipe/`.
- Browser-only code (face detection, `createImageBitmap` decoding) is injected so tests can pass stand-ins. Check it by hand in a browser.
