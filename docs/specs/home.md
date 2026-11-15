# Home — Your Circles

The home screen `/intro` crossfades into: the user's circles drawn as trees in a sunrise landscape.
Built from the designer's reference (phone, 390×844) and `docs/design/your-circles-desktop.png` (wide).
Tests: `tests/home/`.

| ID | Behaviour |
|----|-----------|
| HOME-1 | Placeholder groups live in one file (`src/app/intro/placeholder-groups.ts`, marked TODO): five groups in order Uni Mates, Apt 4B, Madrid Crew, Hoops Since ’14, Work Mates. Each has an id, name, palette, friend count, three memories (ornament art + caption) and a last-memory line. Madrid Crew starts in the center. |
| HOME-2 | Next moves the following group into the center, Previous the preceding one; both wrap around. Neighbours shown are center ±1 on phones and center ±2 on wide screens. |
| HOME-3 | Each visible group is a tree: canopy in its palette, shaded by one smooth radial gradient in its own colors (lighter top-left, slightly darker bottom-right) with one soft highlight, its three memories hung as ornaments, a name label and a friend-count badge. A soft halo ring glows around each canopy in that canopy's own color. The center tree is larger, its halo glows stronger, and it stands in a dotted ring of lights. The group trees are the only full-size trees; the scenery keeps just its small distant trees on the hills. |
| HOME-4 | The card shows the center group: its name on its color, "swap photos", "N FRIENDS", the three memories (thumbnail + caption) and the last-memory line, under a garland of lights. It updates on rotation and is announced politely (`aria-live`). |
| HOME-5 | The "your circles" / "your circle" toggle has exactly one option pressed, "your circles" initially. Content doesn't change yet (TODO until the "your circle" view is designed). |
| HOME-6 | Header: the 365 logo (`public/logo-365.png`, as tall as the wordmark) then the "Now & Then" wordmark, Search, Notifications (1 new, red dot) and Your account (J avatar). Nav: Circles (current page), Daily 5, Archive, Messages, Me, with Me shown as the person icon in both layouts (the J avatar appears only as Your account). These buttons do nothing yet (TODO). |
| HOME-7 | Below 768px the layout matches the reference phone design (390×844), scaled uniformly to the viewport. The scenery is exactly `public/home-background.svg`, with its animations. Bottom nav, arrows at the lower left/right, card above the nav. |
| HOME-8 | At 768px and up the layout follows the desktop mockup: nav across the top (wordmark left, nav items centered, icons right), sitting directly on the sky with no bar, shadow or border behind it; the sky gradient reaches the top of the screen, toggle below it, centered on the screen's width, five trees in a row (center largest), arrows at the row's sides, card centered at the bottom. The scenery widens to fill the screen: sky, ridges, ground and hills stretch; sun, clouds, town and river keep their shape. There is one church tower, centered behind the middle tree, and only the plain houses repeat. Clouds are staggered at different heights and sizes. Small background trees spread across the width but stay clear of the group name labels: none overlaps or sits behind label text. |
| HOME-9 | The fog drifts, the river flows and the ring of lights pulses; all of it stops under `prefers-reduced-motion`. Decorative SVG is `aria-hidden`; the arrows are labelled "Previous circle" and "Next circle". |

Pixel layout, the wide-scenery stretch and the animations are visual: jsdom can't lay out or animate. The tests pin the structure: layers, `preserveAspectRatio`, animation classes, and the phone scenery matching `home-background.svg` element for element. Fidelity is checked against the screenshots in `docs/design/`.
