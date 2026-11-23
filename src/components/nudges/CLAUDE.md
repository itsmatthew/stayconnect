# components/nudges

Nudges & check-ins as pure views (spec: `docs/specs/nudges.md`), from the designer's UxNudges, UxReachOut and UxCheckIn references: `nudges-settings.tsx` (the Me screen), `reach-out.tsx` (the sheet, the share screen, the Sent card), `check-in.tsx` (the Sunday card and its steps), and `parts.tsx` (the floating card, faces, the main pill, the switch, the 988 line).

- Never import from `src/app`. Text the app decides (lines, notes, names) comes in as props.
- No pronouns for people: the app doesn't know them ("Their ornament glows… until they write back").
- The 988 line is a `tel:` link wherever a rough week is mentioned.
