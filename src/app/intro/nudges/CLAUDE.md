# app/intro/nudges

Nudges & check-ins (spec: `docs/specs/nudges.md`; tests: `tests/nudges/`).

- Rules are plain TypeScript: `settings.ts` (check-in people, Sunday switch, how often, quiet hours), `schedule.ts` (week keys, the week's seeded reach-out times, quiet hours, when the check-in is due), `reach-out.ts` (who comes up, their lines, memories you two share), `check-in.ts` (moods, the steps, the text you send), `state.ts` (settings plus what has shown, and reading what was saved). Change rules there, with a test.
- Who comes up is only about time since you last talked. Keep it that way: a nudge never means anything about anyone.
- Check-in answers never leave this browser, even once there's a server. "Let my people know" opens the share sheet with the text so the person sends it; never say their people know unless a message really left (TODO(server)).
- `use-nudges.ts` loads and saves through `local-nudges.ts` (a fake, TODO(server)). `nudges-client.tsx` holds `NudgesHost` (what shows by itself, one thing at a time, only when `free`) and the settings screen's wiring. `AppClient` decides `free` and opens the settings from Me.
