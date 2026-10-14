import { useId } from "react";
import { MemoryArt } from "./memory-art";
import type { ArtKind } from "./types";

export type OrnamentDefs = { ornShade: string; ornCap: string };

type OrnamentProps = {
  cx: number;
  cy: number;
  /** Bauble radius. */
  R: number;
  /** Length of the hanging string. */
  L: number;
  art: ArtKind;
  rim: string;
  defs: OrnamentDefs;
};

/** A glass bauble holding a memory's art, hung on a string (proportions from the reference). */
export function Ornament({ cx, cy, R, L, art, rim, defs }: OrnamentProps) {
  const clip = `orn${useId().replace(/[^\w-]/g, "")}`;
  return (
    <g data-ornament="">
      <ellipse cx={cx + 0.14 * R} cy={cy + 0.3 * R} rx={1.04 * R} ry={R} fill="#2A0E06" opacity=".2" />
      <path
        d={`M${cx} ${cy - R - 4}q${0.12 * R} ${-L} ${-0.05 * R} ${-2 * L}`}
        fill="none"
        stroke="#FFF3D0"
        strokeWidth="1.1"
        opacity=".85"
      />
      <rect
        x={cx - 0.2 * R}
        y={cy - R - 4.5}
        width={0.4 * R}
        height="6"
        rx="1.6"
        fill={`url(#${defs.ornCap})`}
        stroke="#9A7016"
        strokeWidth=".8"
      />
      <clipPath id={clip}>
        <circle cx={cx} cy={cy} r={R} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <MemoryArt kind={art} cx={cx} cy={cy} R={R} />
      </g>
      <circle cx={cx} cy={cy} r={R} fill={`url(#${defs.ornShade})`} />
      <circle cx={cx} cy={cy} r={R - 0.8} fill="none" stroke={rim} strokeWidth="1.8" opacity=".95" />
      <path
        d={`M${cx - 0.72 * R} ${cy + 0.5 * R}A${0.88 * R} ${0.88 * R} 0 0 0 ${cx + 0.72 * R} ${cy + 0.5 * R}`}
        fill="none"
        stroke={rim}
        strokeWidth={0.16 * R}
        strokeLinecap="round"
        opacity=".4"
      />
      <ellipse
        cx={cx - 0.36 * R}
        cy={cy - 0.5 * R}
        rx={0.36 * R}
        ry={0.16 * R}
        fill="#fff"
        opacity=".9"
        transform={`rotate(-30 ${cx - 0.36 * R} ${cy - 0.5 * R})`}
      />
      <circle cx={cx - 0.66 * R} cy={cy - 0.12 * R} r={0.07 * R} fill="#fff" opacity=".8" />
    </g>
  );
}
