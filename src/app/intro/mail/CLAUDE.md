# app/intro/mail

Mailbox drops (spec: `docs/specs/mail.md`; tests: `tests/mail/`).

- `find-query.ts`, `directory.ts`, `drop-limits.ts`, `mail.ts` and `find-me.ts` are plain TypeScript for the mobile app to import unchanged. No React, browser APIs or `@/` imports; a test enforces it.
- Only `local-mail.ts`, `local-find-me.ts` and `browser-share.ts` touch the platform. The local files are fakes, marked `TODO(server)`.
- Privacy rules that must hold: a found person is a minimal card (photo, name, @username, mutual friends) and nothing else; a phone number never lists anyone (whether it has an account is only known after a drop); limits are time-based only, so nothing tells a sender a drop was opened.
- Drops are free: never route them through payment.
