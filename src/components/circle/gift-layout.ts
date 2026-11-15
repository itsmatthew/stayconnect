// Where received gifts stand under Your circle's tree (docs/specs/circle.md, CIRCLE-12). Pure geometry in the
// reference canvas's px (the tree's center is at 195,318): the trunk's base spans 166–224 on the ground line at 566.

export const GROUND = 566;
export const TRUNK_BASE = { x0: 166, x1: 224 } as const;
/** The lid is wider than the box by this much on each side. */
export const LID_OVERHANG = 3;
/** Above the box: lid (6) then bow. */
export const LID_RISE = 6;
export const MAX_GIFTS = 4;

/** `x`/`w` are the box body; `bottom` is where it stands. */
export type GiftSpot = { x: number; w: number; h: number; bottom: number; side: "left" | "right" };

/** Box sizes, nearest the trunk first: a touch smaller than the reference's, shrinking going out. */
const SIZES: readonly { w: number; h: number }[] = [
  { w: 28, h: 20 },
  { w: 26, h: 19 },
  { w: 23, h: 17 },
  { w: 22, h: 16 },
];
/** Space between the trunk and the nearest boxes. */
const TRUNK_GAP = 2;
/** How far a box tucks behind the newer one beside it. */
const OVERLAP = 5;

/**
 * Spots for `n` gifts, newest first: alternating left and right of the trunk, the first pair hugging it,
 * each next one further out on its side and slightly behind its neighbour.
 */
export function giftSpots(n: number): GiftSpot[] {
  const spots: GiftSpot[] = [];
  // The nearest boxes "overlap" a virtual neighbour at the trunk's gap, so they land just clear of it.
  let leftEdge = TRUNK_BASE.x0 - TRUNK_GAP - OVERLAP;
  let rightEdge = TRUNK_BASE.x1 + TRUNK_GAP + OVERLAP;
  for (let i = 0; i < Math.min(n, MAX_GIFTS); i++) {
    const { w, h } = SIZES[i];
    if (i % 2 === 0) {
      // Its right edge (lid included) tucks OVERLAP under the box nearer the trunk.
      const x = leftEdge + OVERLAP - LID_OVERHANG - w;
      spots.push({ x, w, h, bottom: GROUND, side: "left" });
      leftEdge = x - LID_OVERHANG;
    } else {
      const x = rightEdge - OVERLAP + LID_OVERHANG;
      spots.push({ x, w, h, bottom: GROUND, side: "right" });
      rightEdge = x + w + LID_OVERHANG;
    }
  }
  return spots;
}

/** The "+N" chip, on the ground just past the outermost right-hand box. */
export function moreChip() {
  const outer = giftSpots(MAX_GIFTS).filter((s) => s.side === "right").at(-1)!;
  const h = 14;
  return { x: outer.x + outer.w + LID_OVERHANG + 2, y: GROUND - h, w: 24, h };
}

/** Everything the pile covers, bows included, for its accessible label. */
export function pileBox(n: number) {
  const spots = giftSpots(n);
  const x0 = Math.min(...spots.map((s) => s.x - LID_OVERHANG));
  const x1 = n > MAX_GIFTS ? moreChip().x + moreChip().w : Math.max(...spots.map((s) => s.x + s.w + LID_OVERHANG));
  const top = Math.min(...spots.map((s) => s.bottom - s.h - LID_RISE - 12));
  return { x: x0, y: top, w: x1 - x0, h: GROUND - top };
}
