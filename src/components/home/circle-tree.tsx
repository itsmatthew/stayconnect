import { useId, type ReactNode } from "react";
import { Ornament, type OrnamentDefs } from "./ornament";
import type { CircleGroup, Palette } from "./types";

type TreeShapeProps = {
  cx: number;
  cy: number;
  /** Canopy radius. */
  r: number;
  /** y of the trunk's foot (and its shadow). */
  bottom: number;
  shadowRy: number;
  palette: Pick<Palette, "canopy" | "shade" | "highlight">;
  /** The selected tree: its halo glows stronger. */
  glow?: boolean;
  children?: ReactNode;
};

/** A round tree: shadow, trunk, halo, canopy with a smooth radial shading and one soft highlight. */
function TreeShape({ cx, cy, r, bottom, shadowRy, palette, glow = false, children }: TreeShapeProps) {
  const id = useId().replace(/[^\w-]/g, "");
  const blur = `halo${id}`;
  const shading = `canopy${id}`;
  const top = cy + 0.6 * r;
  const trunk = (x0: number, c1: number, c2: number, x3: number) =>
    `M${cx + x0 * r} ${top}C${cx + c1 * r} ${bottom - 20} ${cx + c2 * r} ${bottom - 8} ${cx + x3 * r} ${bottom}H${cx + 0.3 * r}C${cx + 0.2 * r} ${bottom - 8} ${cx + 0.12 * r} ${bottom - 20} ${cx + 0.14 * r} ${top}Z`;
  return (
    <>
      <ellipse cx={cx} cy={bottom} rx={0.55 * r} ry={shadowRy} fill="#3F5A2A" opacity=".35" />
      <path d={trunk(-0.14, -0.12, -0.2, -0.3)} fill="#8C4A2B" />
      <path d={trunk(0.02, 0.04, 0.1, 0.16)} fill="#6F3820" />
      {/* Halo: a soft ring glowing in the canopy's own color. */}
      <g data-halo="" data-glow={glow ? "" : undefined} stroke={palette.canopy} fill="none" opacity={glow ? 1 : 0.75}>
        <filter id={blur} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={glow ? 7 : 4} />
        </filter>
        <circle cx={cx} cy={cy} r={r + (glow ? 8 : 5)} strokeWidth={glow ? 16 : 9} opacity={glow ? 0.85 : 0.6} filter={`url(#${blur})`} />
        <circle cx={cx} cy={cy} r={r + 5} strokeWidth={glow ? 3 : 2.5} opacity={glow ? 0.8 : 0.65} />
      </g>
      <radialGradient id={shading} cx=".35" cy=".3" r=".85">
        <stop offset="0" stopColor={palette.highlight} stopOpacity=".45" />
        <stop offset=".5" stopColor={palette.canopy} stopOpacity="0" />
        <stop offset="1" stopColor={palette.shade} stopOpacity=".4" />
      </radialGradient>
      <circle data-canopy="" cx={cx} cy={cy} r={r} fill={palette.canopy} />
      <circle data-canopy-shading="" cx={cx} cy={cy} r={r} fill={`url(#${shading})`} />
      <ellipse
        data-canopy-highlight=""
        cx={cx - 0.32 * r}
        cy={cy - 0.48 * r}
        rx={0.3 * r}
        ry={0.17 * r}
        fill={palette.highlight}
        opacity=".35"
        transform={`rotate(-18 ${cx - 0.32 * r} ${cy - 0.48 * r})`}
      />
      {children}
    </>
  );
}

export type TreeSlot = "left" | "center" | "right";

/** Ornament placement per slot, as fractions of the canopy radius: [dx, dy, bauble R, string L]. */
const ORNAMENTS: Record<TreeSlot, readonly (readonly [number, number, number, number])[]> = {
  left: [
    [-0.5, -0.1875, 0.265625, 0.125],
    [0.125, -0.4375, 0.265625, 0.09375],
    [-0.125, 0.5, 0.265625, 0.109375],
  ],
  center: [
    [-0.55, 0.1, 0.29, 0.11],
    [0, 0.6, 0.28, 0.07],
    [0.55, 0.08, 0.29, 0.09],
  ],
  right: [
    [0.5, -0.1875, 0.265625, 0.125],
    [-0.125, -0.4375, 0.265625, 0.09375],
    [0.125, 0.5, 0.265625, 0.109375],
  ],
};

/** Where a tree's three ornaments hang, in its canvas: center, bauble radius R and string length L. */
export function ornamentSpots(slot: TreeSlot, cx: number, cy: number, r: number) {
  return ORNAMENTS[slot].map(([dx, dy, R, L]) => ({ cx: cx + dx * r, cy: cy + dy * r, R: R * r, L: L * r }));
}

type CircleTreeProps = Omit<TreeShapeProps, "palette" | "children" | "glow"> & {
  group: CircleGroup;
  slot: TreeSlot;
  /** Gradient ids from the scene: ornament shade and cap. */
  defs: OrnamentDefs;
};

/** A group's tree with its three memories hung as ornaments. */
export function CircleTree({ group, slot, defs, ...shape }: CircleTreeProps) {
  const spots = ornamentSpots(slot, shape.cx, shape.cy, shape.r);
  return (
    <g data-tree="" data-slot={slot} data-group-id={group.id} data-cx={shape.cx}>
      <TreeShape {...shape} palette={group.palette} glow={slot === "center"}>
        {group.memories.map((m, i) => (
          <Ornament key={m.id} {...spots[i]} memory={m} rim={group.palette.rim} defs={defs} />
        ))}
      </TreeShape>
    </g>
  );
}
