# app/intro/mail

Mailbox drops (spec: `docs/specs/mail.md`; tests: `tests/mail/`).

- `find-query.ts`, `directory.ts`, `drop-limits.ts`, `mail.ts`, `find-me.ts`, `mailbox-setting.ts` and `search-rank.ts` are plain TypeScript for the mobile app to import unchanged. No React, browser APIs or `@/` imports; a test enforces it.
- Only `local-mail.ts`, `local-find-me.ts`, `local-mailbox-setting.ts`, `browser-share.ts` and the `use-*.ts` hooks touch the platform. The local files are fakes, marked `TODO(server)`.
- Privacy rules that must hold: a found person is a minimal card (photo, name, @username, mutual friends) and nothing else; a phone number never lists anyone (whether it has an account is only known after a drop); limits are time-based only, so nothing tells a sender a drop was opened; a mailbox that turns you away says so neutrally, never which setting.
- Drops are free: never route them through payment.
