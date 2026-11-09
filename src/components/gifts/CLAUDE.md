# components/gifts

Design source: `design-ref/project/GiftCompose.dc.html` and `MeGifts.dc.html` (phone screens only; never the `Web*` files). Match its numbers; on wider screens, extend the phone design.

Gifts as pure views (spec: `docs/specs/gifts.md`). Nothing here imports from `src/app`; a test enforces it. Rules live in `src/app/intro/gifts/`.

- `gift-maker.tsx` is the frame (title, chips, live card, Back and Next), `gift-steps.tsx` the five panels. `gift-card.tsx` is the one bobbing card: `framed-photo.tsx` on the front, `postcard.tsx` on the back, `wrapped-gift.tsx` laid over it. Motion lives in `gifts.css`, transforms and opacity only, all off under reduced motion; `motion.ts` skips timed waits then.
- Everything must port to React Native. No CSS `filter`, blend modes, `backdrop-filter` or repeating gradients; a test enforces it. Draw patterns as SVG (`wrap-pattern.tsx`) and tint with a colored overlay.
- Tailwind's reset makes every `svg` and `img` a block. Set `display` when one sits inline.
- Sizes are `s()` design px, which shrink on narrow phones, so give anything tappable a real `minHeight: 44`.
