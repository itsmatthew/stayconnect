// The wide home's river (docs/specs/home.md, HOME-11), drawn in the tree row's canvas so it can follow the
// center tree: up at the horizon beside the sun, behind the center canopy, out at its lower right, down the gap
// before the right neighbour, and under the card. The phone keeps the scenery's own river.

import { WIDE_SCENE } from "./scenery/scenery";
import { WIDE_CANVAS } from "./wide-row";

/** One solid colour, the phone river gradient's middle stop, so the wide river reads the same top to bottom. */
export const RIVER_FILL = "#3FA9F0";
const RIVER_EDGE = "#1F6FBF";

/** The scenery's horizon beside the sun (scene y 376), in canvas px. */
const HORIZON_Y = ((376 - WIDE_SCENE.top) * WIDE_CANVAS.height) / WIDE_SCENE.height;
/** Where the river ends, under the card. */
const END_Y = 740;

type Tree = { cx: number; cy: number; r: number };
export type RiverPoint = { x: number; y: number; /** half-width */ w: number };

/**
 * Waypoints as offsets from the center tree, in canopy radii. The glint at the horizon sits just outside the
 * center tree's halo; the river comes out between the two canopies and passes right of the center tree's
 * friend-count badge (at 0.71r, 0.98r) and left of the right neighbour's trunk.
 */
function waypoints({ cx, cy, r }: Tree): [number, number][] {
  return [
    [cx + 0.77 * r, HORIZON_Y],
    [cx + 0.6 * r, cy - 0.45 * r], // behind the canopy
    [cx + 0.62 * r, cy + 0.3 * r],
    [cx + 1.0 * r, cy + 0.66 * r], // out between the two canopies
    [cx + 1.25 * r, cy + 1.2 * r], // down past the badge
    [cx + 1.05 * r, cy + 1.55 * r],
    [cx + 0.75 * r, END_Y], // under the card
  ];
}

const STEPS = 24;
const catmullRom = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

/** The river's centerline, sampled, with its half-width growing from a thread at the horizon to a stream in front. */
export function wideRiver(center: Tree): { points: RiverPoint[]; d: string } {
  const wp = waypoints(center);
  const at = (i: number) => wp[Math.max(0, Math.min(wp.length - 1, i))];
  const points: RiverPoint[] = [];
  const total = (wp.length - 1) * STEPS;
  for (let seg = 0; seg < wp.length - 1; seg++) {
    for (let s = 0; s < STEPS || (seg === wp.length - 2 && s === STEPS); s++) {
      const t = s / STEPS;
      const [a, b, c, d] = [at(seg - 1), at(seg), at(seg + 1), at(seg + 2)];
      const u = (seg * STEPS + s) / total;
      points.push({ x: catmullRom(a[0], b[0], c[0], d[0], t), y: catmullRom(a[1], b[1], c[1], d[1], t), w: 2.5 + 17.5 * u ** 1.2 });
    }
  }
  const fmt = (n: number) => n.toFixed(1);
  const left = points.map((p) => `${fmt(p.x - p.w)} ${fmt(p.y)}`);
  const right = points.map((p) => `${fmt(p.x + p.w)} ${fmt(p.y)}`).reverse();
  return { points, d: `M${left.join("L")}L${right.join("L")}Z` };
}

/** Canvas boxes covering the river, so the scenery keeps its small trees off it. */
export function riverZones(points: readonly RiverPoint[], pad = 4) {
  const zones = [];
  for (let i = 0; i < points.length - 1; i += 8) {
    const chunk = points.slice(i, i + 9);
    zones.push({
      x0: Math.min(...chunk.map((p) => p.x - p.w)) - pad,
      x1: Math.max(...chunk.map((p) => p.x + p.w)) + pad,
      y0: Math.min(...chunk.map((p) => p.y)) - pad,
      y1: Math.max(...chunk.map((p) => p.y)) + pad,
    });
  }
  return zones;
}

/** Drawn behind the trees; the flow lines animate like the phone river's and stop under reduced motion. */
export function WideRiver({ center }: { center: Tree }) {
  const { points, d } = wideRiver(center);
  const mid = `M${points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L")}`;
  // Flow lines run only where the river is wide enough to hold them.
  const lower = points.filter((p) => p.w > 6);
  const flow = (dx: number) => `M${lower.map((p) => `${(p.x + dx * p.w).toFixed(1)} ${p.y.toFixed(1)}`).join("L")}`;
  return (
    <g data-river="" data-center-x={center.cx}>
      <path data-river-body="" d={d} fill={RIVER_FILL} stroke={RIVER_EDGE} strokeWidth="2.2" strokeLinejoin="round" />
      <g fill="none" stroke="#FFFFFF" strokeLinecap="round">
        <path className="hm-anim" d={mid} strokeWidth="1.3" strokeDasharray="9 27 4 31 7 22" style={{ animation: "5.5s linear 0s infinite normal none running hm-flow" }} />
        <path className="hm-anim" d={flow(-0.45)} strokeWidth="1.1" strokeDasharray="5 33 8 24 4 26" opacity=".85" style={{ animation: "6.5s linear -2s infinite normal none running hm-flow" }} />
        <path className="hm-anim" d={flow(0.45)} strokeWidth="1.1" strokeDasharray="7 25 3 34 9 22" opacity=".85" style={{ animation: "6s linear -3.5s infinite normal none running hm-flow" }} />
      </g>
    </g>
  );
}
