# app/intro/mail

Mailbox drops and your mailbox (specs: `docs/specs/mail.md`, `docs/specs/mailbox.md`; tests: `tests/mail/`).

- `find-query.ts`, `directory.ts`, `drop-limits.ts`, `mail.ts`, `find-me.ts`, `mailbox-setting.ts`, `search-rank.ts` and `inbox.ts` are plain TypeScript for the mobile app to import unchanged. No React, browser APIs or `@/` imports; a test enforces it.
- Only `local-mail.ts`, `local-find-me.ts`, `local-mailbox-setting.ts`, `local-inbox.ts`, `browser-share.ts`, the `use-*.ts` hooks and the `*-client.tsx` files touch the platform. `mailbox-client.tsx` (`useMailbox`) turns the inbox into the mailbox screens; `HomeClient` hosts it, and `AppClient` holds the inbox so it lasts across tabs. The local files are fakes, marked `TODO(server)`.
- Privacy rules that must hold: a found person is a minimal card (photo, name, @username, mutual friends) and nothing else; a phone number never lists anyone (whether it has an account is only known after a drop); limits are time-based only, so nothing tells a sender a drop was opened; a mailbox that turns you away says so neutrally, never which setting.
- Drops are free: never route them through payment.
- Your mailbox never tells a sender anything: not opened, kept, removed, blocked or reported. Keep it that way.
