// Where avatars sit in the tree's rings (docs/specs/circle.md, CIRCLE-3/7). Pure geometry, in design px
// as offsets from the canopy's center. Bands, labels and the typical-count sizes are the designer's reference
// (canopy radii 58 / 104 / 148, avatars 27 / 23 / 17, labels at 263 / 218 / 174 over a center at 318).
import type { Ring } from "./types";

export type Spot = { dx: number; dy: number; size: number };

export const BANDS: Readonly<Record<Ring, { inner: number; outer: number }>> = {
  nest: { inner: 0, outer: 58 },
  branches: { inner: 58, outer: 104 },
  bloom: { inner: 104, outer: 148 },
};

/** Each ring's label, centered over the trunk near the top of its band: its text box. */
export const LABELS: Readonly<Record<Ring, { top: number; bottom: number; halfWidth: number }>> = {
  nest: { top: -55, bottom: -41, halfWidth: 13 },
  branches: { top: -100, bottom: -86, halfWidth: 27 },
  bloom: { top: -144, bottom: -130, halfWidth: 19 },
};

/** Avatar sizes: the reference's at typical counts, down to the smallest that still reads as a face. */
export const SIZES: Readonly<Record<Ring, { max: number; min: number }>> = {
  nest: { max: 27, min: 12 },
  branches: { max: 23, min: 10 },
  bloom: { max: 17, min: 8 },
};

/** The tree's box: the glow around the canopy, the trunk and the gift pile below it. */
export const TREE_BOX = { width: 340, height: 420, cx: 170, cy: 170 } as const;

/** Clear space between avatars, and between an avatar and its band's edges. */
const GAP = 3;
const PAD = 1;
const RING_ORDER: readonly Ring[] = ["nest", "branches", "bloom"];

const hitsLabel = (dx: number, dy: number, size: number) =>
  RING_ORDER.some((r) => {
    const l = LABELS[r];
    return Math.abs(dx) < l.halfWidth + size / 2 + PAD && dy + size / 2 > l.top - PAD && dy - size / 2 < l.bottom + PAD;
  });

/** How far round from the top (radians) a row must start so its avatars clear the labels, even ones it only grazes partway round. */
function topGap(r: number, size: number): number {
  const step = Math.PI / 720;
  let gap = 0;
  for (let phi = 0; phi <= Math.PI; phi += step) if (hitsLabel(r * Math.sin(phi), -r * Math.cos(phi), size)) gap = phi + step;
  return Math.min(gap, Math.PI);
}

type Row = { r: number; gap: number; capacity: number };

function row(r: number, size: number): Row {
  const gap = topGap(r, size);
  const span = 2 * Math.PI - 2 * gap;
  const chord = (size + GAP) / (2 * r);
  // A row too tight for two holds one, at the bottom.
  if (chord >= 1) return { r, gap, capacity: span > 0 ? 1 : 0 };
  return { r, gap, capacity: Math.floor(span / (2 * Math.asin(chord)) + 1e-9) };
}

/** Rows for `k` rows of `size` in a band: one row sits at the reference's radius, more spread evenly across it. */
function rows(ring: Ring, size: number, k: number): Row[] | undefined {
  const key = `${ring}/${size}/${k}`;
  if (!rowCache.has(key)) rowCache.set(key, computeRows(ring, size, k));
  return rowCache.get(key);
}
const rowCache = new Map<string, Row[] | undefined>();

function computeRows(ring: Ring, size: number, k: number): Row[] | undefined {
  const { inner, outer } = BANDS[ring];
  const lo = (inner > 0 ? inner + PAD : 0) + size / 2;
  const hi = outer - PAD - size / 2;
  if (hi < lo) return undefined;
  if (k === 1) return [row(Math.min(hi, Math.max(lo, SINGLE_ROW[ring])), size)];
  if ((hi - lo) / (k - 1) < size + GAP) return undefined;
  return Array.from({ length: k }, (_, j) => row(hi - (j * (hi - lo)) / (k - 1), size));
}
const SINGLE_ROW: Readonly<Record<Ring, number>> = { nest: 33, branches: 81, bloom: 127 };

/** Splits `count` across rows in proportion to what each holds (largest remainder), never past a row's capacity. */
function share(count: number, caps: number[]): number[] {
  const total = caps.reduce((a, b) => a + b, 0);
  const exact = caps.map((c) => (count * c) / total);
  const out = exact.map(Math.floor);
  const order = exact.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let left = count - out.reduce((a, b) => a + b, 0), i = 0; left > 0; i++) {
    const j = order[i % order.length][1];
    if (out[j] < caps[j]) {
      out[j]++;
      left--;
    }
  }
  return out;
}

/** Evenly round a row, clear of the labels at the top: one side is computed, the other mirrors it exactly. */
function place(r: Row, n: number, size: number): Spot[] {
  const span = 2 * Math.PI - 2 * r.gap;
  const side: Spot[] = [];
  for (let i = 0; i < Math.floor(n / 2); i++) {
    // Angle from the top, clockwise; the row's middle is at the bottom.
    const a = r.gap + (span * (i + 0.5)) / n;
    side.push({ dx: r.r * Math.sin(a), dy: -r.r * Math.cos(a), size });
  }
  const middle: Spot[] = n % 2 ? [{ dx: 0, dy: r.r, size }] : [];
  return [...side, ...middle, ...side.map((p) => ({ ...p, dx: -p.dx })).reverse()];
}

/**
 * Spots for `count` avatars in a ring, as large as they can be: more rows first, then smaller.
 * Past what fits at the smallest size, the last spot is a "+N" chip and `shown` people get real spots.
 */
export function layoutRing(ring: Ring, count: number): Layout {
  const key = `${ring}/${count}`;
  let l = cache.get(key);
  if (!l) cache.set(key, (l = compute(ring, count)));
  return l;
}
type Layout = { spots: Spot[]; shown: number };
const cache = new Map<string, Layout>();

function compute(ring: Ring, count: number): Layout {
  if (count === 0) return { spots: [], shown: 0 };
  const { max, min } = SIZES[ring];
  if (ring === "nest" && count === 1) return { spots: [{ dx: 0, dy: 0, size: max }], shown: 1 };
  let best: { rows: Row[]; size: number } | undefined;
  for (let size = max; size >= min; size--) {
    for (let k = 1; ; k++) {
      const rs = rows(ring, size, k);
      if (!rs) break;
      const cap = rs.reduce((a, r) => a + r.capacity, 0);
      if (cap >= count) return fill(rs, count, size, count);
      if (!best || cap > best.rows.reduce((a, r) => a + r.capacity, 0)) best = { rows: rs, size };
    }
  }
  const cap = best!.rows.reduce((a, r) => a + r.capacity, 0);
  return fill(best!.rows, cap, best!.size, cap - 1);
}

function fill(rs: Row[], n: number, size: number, shown: number) {
  const counts = share(n, rs.map((r) => r.capacity));
  return { spots: rs.flatMap((r, i) => place(r, counts[i], size)), shown };
}

/** The ring under a point (offsets from the canopy's center), or none outside the canopy. */
export function ringAt(dx: number, dy: number): Ring | undefined {
  const d = Math.hypot(dx, dy);
  return RING_ORDER.find((r) => d <= BANDS[r].outer);
}
