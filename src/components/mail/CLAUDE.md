# components/mail

Mailbox drops and your mailbox as pure views (specs: `docs/specs/mail.md`, `docs/specs/mailbox.md`; tests: `tests/mail/`). Sized in the design's px × `--s`, scaled from 390×844.

- Sending: `drop-sheet.tsx`, `mailbox-scene.tsx`, `mailbox-icon.tsx`. Receiving: `tree-mailbox.tsx` (on your tree), `mail-viewer.tsx` (new mail), `kept-sheet.tsx`, `photo-zoom.tsx`, `mail-menu.tsx` (⋯), `mail-note.tsx`.
- Data comes in already shaped (`mail-types.ts`): never import from `src/app`.
- Mobile rules: glows, skies, airmail stripes and stamp perforations are SVG (gradients, patterns, dots), not CSS filters or repeating gradients. Motion is transforms and opacity in `mail.css`, off under reduced motion.
- Photos are drawn (`mail-picture.tsx`) until the server stores real ones: TODO(server).
