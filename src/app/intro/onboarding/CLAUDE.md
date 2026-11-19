# app/intro/onboarding

Starting a circle, the tour, and joining one from an invite link (spec: `docs/specs/onboarding.md`, ONB-7 to ONB-22; tests: `tests/onboarding/`). The welcome letter itself is mail: its rules are in `mail/inbox.ts`.

- `start-circle.ts` (the steps, as a reducer), `my-circles.ts` (circles you started or joined, as groups) and `invite.ts` (reading and writing the invite link) are plain TypeScript: no React or browser APIs.
- `start-circle-client.tsx` holds a draft and the picked photos, shares the invite and hands `AppClient` a `NewCircle`. `AppClient` saves it (`use-my-circles.ts`), sets its logo as ornament `LOGO` and its photos as header photos, the same as the profile would.
- `local-my-circles.ts` and `local-circle-invites.ts` are fakes, marked `TODO(server)`: circles live in this browser, and the invite link carries the circle itself (`/intro?invite=…`).
- Circles you started go first in `groups`, before the colors and names are applied, so every screen sees them.
- The tour (ONB-14 to ONB-18): `tour.ts` holds the stops and how you walk them (plain TypeScript, for the mobile app too). `AppClient` holds its state, starts it after "Go to my circle" and switches tabs on its taps; `tour-client.tsx` finds what each stop points at and draws it. Screens mark those spots with `data-tour="…"` (the names are in `tour.ts`); keep a tag when you move what it's on.
- Invite links (ONB-19 to ONB-22): `AppClient` reads `invite=` once (and clears it from the address bar), then, once your saved circles and mailbox have loaded, joins the circle, sends the welcome letter and starts the tour after the intro. A joined circle is a `MyCircle` with `joined` and `from`.
