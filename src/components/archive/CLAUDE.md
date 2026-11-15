# components/archive

The 65 Archive as pure views (spec: `docs/specs/archive.md`): `archive-screen.tsx` (title, explainer, your slots, feed pages, picker), `my-slots.tsx`, `post-card.tsx`, `feed-section.tsx`, `post-picker.tsx`, `explainer.tsx`, `archive-photo.tsx` (an image, or `MemoryArt` for placeholder posts; also used by Me).

- Built from the designer's feed reference: card in the first shared circle's colour, avatar, name, time, cream tag pills with a tiny tree, the photo on a lighter mat. Circle lines are stacked `box-shadow` rings (`circleLines`).
- Monthly, yearly and bonus-week cards are framed and bigger; keep weekly cards plain, as in the reference.
- Views get only what the gate allows: locked sections arrive as stand-in colours, so never add props that would carry a hidden post's photo, name or date.
