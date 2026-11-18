# app/intro/onboarding

Starting a circle (spec: `docs/specs/onboarding.md`, ONB-7 to ONB-13; tests: `tests/onboarding/`). The welcome letter itself is mail: its rules are in `mail/inbox.ts`.

- `start-circle.ts` (the steps, as a reducer) and `my-circles.ts` (circles you started, as groups) are plain TypeScript: no React or browser APIs.
- `start-circle-client.tsx` holds a draft and the picked photos, shares the invite and hands `AppClient` a `NewCircle`. `AppClient` saves it (`use-my-circles.ts`), sets its logo as ornament `LOGO` and its photos as header photos, the same as the profile would.
- `local-my-circles.ts` and `local-circle-invites.ts` are fakes, marked `TODO(server)`: circles live in this browser, and the invite link carries the circle itself (`/intro?invite=…`).
- Circles you started go first in `groups`, before the colors and names are applied, so every screen sees them.
