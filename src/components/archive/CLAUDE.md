# components/archive

The Archive as pure views (spec: `docs/specs/archive.md`), from the designer's "Archive — the feed" prototype on the live design link: `archive-screen.tsx` (header, this week's card, the feed, the picker), `week-card.tsx`, `feed-post.tsx`, `post-picker.tsx`, `archive-photo.tsx` (an image, or `MemoryArt` for placeholder posts; also used by Me).

- A post's color is its author's first shared circle: the ring round their face, the dot by the circle's name, the month/year footer bar and the band under it. Text sits on cream or on the photo's shade, never on the circle's color.
- A week's footer lies over the photo's foot; a month's or year's is a bar under it.
- Gradients (the photo's shade, the band) are SVG, so they port.
- If "post to see" returns (ARC-5, ARC-9), views must get only stand-in colours for hidden posts: never add props that would carry a hidden post's photo, name or date.
