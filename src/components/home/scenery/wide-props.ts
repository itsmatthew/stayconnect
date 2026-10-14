// Deterministic placements for the wide scene's clouds and small trees, in scene units (the 390×844 phone scene).
import type { SmallTreePalette } from "./small-tree";

/** Scene x range the wide scene may need to cover (about 3.4:1 screens). */
const X_MIN = -1170;
const X_MAX = 1560;

/** Small seeded generator so placements are stable across renders and server/client. */
function random(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const round = (n: number) => Math.round(n * 10) / 10;

export type CloudKind = 1 | 2 | 3;
export type CloudPlacement = { kind: CloudKind; x: number; y: number; scale: number; mirror: boolean };

/** Clouds staggered in height and size across the width. `y` is the cloud's base line. */
export const WIDE_CLOUDS: readonly CloudPlacement[] = (() => {
  const rnd = random(7);
  const out: CloudPlacement[] = [];
  for (let x = X_MIN, i = 0; x < X_MAX; i++) {
    out.push({
      kind: ((i % 3) + 1) as CloudKind,
      x: round(x),
      y: round(188 + rnd() * 100),
      scale: [0.55, 0.7, 0.85, 1, 1.15, 1.3][Math.floor(rnd() * 6)],
      mirror: rnd() < 0.5,
    });
    x += 150 + rnd() * 110;
  }
  return out;
})();

/** Each cloud path's base-left corner in home-background.svg. */
export const CLOUD_ANCHORS: Record<CloudKind, [number, number]> = { 1: [22, 196], 2: [250, 236], 3: [300, 160] };

const PALETTES: readonly SmallTreePalette[] = [
  { canopy: "#3FA7A3", shade: "#2A716E", dark: "#1F5351", light: "#82C5C3" },
  { canopy: "#E0608A", shade: "#98415D", dark: "#703045", light: "#EA97B2" },
  { canopy: "#A77FD6", shade: "#715691", dark: "#533F6B", light: "#C5ABE4" },
  { canopy: "#F08A3A", shade: "#A35D27", dark: "#78451D", light: "#F5B27E" },
  { canopy: "#2F9C98", shade: "#1F6A67", dark: "#174E4C", light: "#77BEBC" },
  { canopy: "#3F78D0", shade: "#2A518D", dark: "#1F3C68", light: "#82A7E0" },
  { canopy: "#9A58C8", shade: "#683B88", dark: "#4D2C64", light: "#BD92DB" },
  { canopy: "#F08A66", shade: "#A35D45", dark: "#784533", light: "#F5B29B" },
];

export type SmallTreePlacement = { cx: number; cy: number; r: number; opacity: number; palette: SmallTreePalette };

/** Three rows of small trees (far, middle, near), sparser and larger toward the front. */
export const WIDE_SMALL_TREES: readonly SmallTreePlacement[] = (() => {
  const rnd = random(42);
  const rows = [
    { y: [376, 382], r: [4, 5], gap: [16, 34], opacity: 0.8 },
    { y: [384, 394], r: [6.5, 8], gap: [34, 70], opacity: 0.92 },
    { y: [400, 406], r: [8, 9], gap: [70, 140], opacity: 1 },
  ];
  const out: SmallTreePlacement[] = [];
  for (const row of rows) {
    for (let x = X_MIN + rnd() * row.gap[1]; x < X_MAX; x += row.gap[0] + rnd() * (row.gap[1] - row.gap[0])) {
      out.push({
        cx: round(x),
        cy: round(row.y[0] + rnd() * (row.y[1] - row.y[0])),
        r: round(row.r[0] + rnd() * (row.r[1] - row.r[0])),
        opacity: row.opacity,
        palette: PALETTES[Math.floor(rnd() * PALETTES.length)],
      });
    }
  }
  return out;
})();

export type Zone = { x0: number; x1: number; y0: number; y1: number };

/** A small tree's footprint: canopy top to trunk foot. */
export const smallTreeBox = (t: Pick<SmallTreePlacement, "cx" | "cy" | "r">): Zone => ({
  x0: t.cx - t.r,
  x1: t.cx + t.r,
  y0: t.cy - t.r,
  y1: t.cy + 2.1 * t.r,
});

export const overlaps = (a: Zone, b: Zone) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
