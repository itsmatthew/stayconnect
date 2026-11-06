# components/gifts

Gifts as pure views (spec: `docs/specs/gifts.md`). Nothing here imports from `src/app`; a test enforces it. Rules live in `src/app/intro/gifts/`.

- `gift-maker.tsx` is the frame (title, chips, live card, Back and Next), `gift-steps.tsx` the five panels. `gift-card.tsx` shows `framed-photo.tsx`, `postcard.tsx` or `wrapped-gift.tsx`.
- Everything must port to React Native. No CSS `filter`, blend modes, `backdrop-filter` or repeating gradients; a test enforces it. Draw patterns as SVG (`wrap-pattern.tsx`) and tint with a colored overlay.
- Tailwind's reset makes every `svg` and `img` a block. Set `display` when one sits inline.
- Sizes are `s()` design px, which shrink on narrow phones, so give anything tappable a real `minHeight: 44`.
