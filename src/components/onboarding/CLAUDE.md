# components/onboarding

How a brand-new person meets the app, as pure views (spec: `docs/specs/onboarding.md`; tests: `tests/onboarding/`), from WelcomeLetter.dc.html and InviteReceive.dc.html. Sized in the design's px × `--s`, scaled from 390×844.

- `tap-hint.tsx`: the navy callouts and the pulsing ring with a tapping hand (ONB-2). They never take taps.
- `welcome-mail.tsx`: the welcome letter, sealed (`WelcomeEnvelope`), open (`WelcomeLetter`) and kept (`WelcomeTile`). `useMailbox` (`src/app/intro/mail/`) shows them.
- Motion is transforms and opacity in `onboarding.css`, off under reduced motion. No CSS filters (mobile rules, as in `components/mail`).
- TODO(design): the Now & Then mark is drawn until the real illustrations are exported.
