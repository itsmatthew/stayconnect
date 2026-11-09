import { useId } from "react";
import { CAVEAT, KARLA, s } from "../home/units";
import "./gifts.css";
import { PaperDefs, PaperFill } from "./wrap-pattern";

type WrappedGiftProps = {
  to: string;
  pattern: string;
  ribbon: string;
  /** "Nov 12", or "later" before a day is picked, for a gift that opens on a chosen day. */
  opens?: string;
  /** Skip the wrapping motion: it is already wrapped (the sent screen). */
  still?: boolean;
};

/** The torn halves of the paper, from the design's polygons, in the card's 296×226 space (with a pixel's bleed). */
const pts = (xs: readonly number[], edge: number) =>
  [`${edge},-1`, ...xs.map((x, i) => `${(x / 100) * 298 - 1},${([0, 9, 19, 30, 41, 52, 63, 74, 86, 100][i] / 100) * 228 - 1}`), `${edge},227`].join(" ");
const LEFT = pts([53, 48, 54, 49, 55, 48, 53, 48, 54, 50], -1);
const RIGHT = pts([52, 47, 53, 48, 54, 47, 52, 47, 53, 49], 297);

/** Splits the tag's words into lines of about `width` characters, so a long group name stays on the tag. */
function tagLines(label: string, width: number): string[] {
  const lines: string[] = [];
  for (const word of label.split(" ")) {
    const last = lines.at(-1);
    if (last !== undefined && last.length + word.length < width) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

/**
 * The wrapping laid over the card (docs/specs/gifts.md, GIFT-8), as in the design: two torn halves slide in, the
 * ribbons run along and across, the bow pops on, the tag swings into place. All SVG and transforms, so it ports.
 */
export function WrappedGift({ to, pattern, ribbon, opens, still = false }: WrappedGiftProps) {
  const motion = (c: string) => (still ? undefined : c);
  const id = `wrap${useId().replace(/[^\w-]/g, "")}`;
  const label = `to ${to}`;
  const long = label.length > 12;
  const lines = long ? tagLines(label, 20) : [label];
  const lh = long ? 14 : 18;
  const tagW = long ? 128 : 84;
  const tagH = Math.max(40, 12 + lines.length * lh + (opens ? 11 : 0));
  const notch = tagW * 0.14 * (84 / tagW);
  return (
    <svg data-pattern={pattern} viewBox="0 0 296 226" role="img" aria-label={`A wrapped gift for ${to}`} style={{ position: "absolute", left: 0, top: 0, width: s(296), height: s(226), display: "block", overflow: "visible" }}>
      <defs>
        <PaperDefs id={id} pattern={pattern} />
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".16" />
          <stop offset=".4" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity=".18" />
        </linearGradient>
        <linearGradient id={`${id}-rv`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity=".14" />
          <stop offset=".35" stopColor="#FFFFFF" stopOpacity=".24" />
          <stop offset="1" stopColor="#000000" stopOpacity=".10" />
        </linearGradient>
        <linearGradient id={`${id}-rh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".24" />
          <stop offset="1" stopColor="#000000" stopOpacity=".14" />
        </linearGradient>
      </defs>
      <g className={motion("gf-paper-l")}>
        <PaperFill id={id} pattern={pattern} shape={(fill) => <polygon points={LEFT} fill={fill} />} />
        <polygon points={LEFT} fill={`url(#${id}-sheen)`} />
      </g>
      <g className={motion("gf-paper-r")}>
        <PaperFill id={id} pattern={pattern} shape={(fill) => <polygon points={RIGHT} fill={fill} />} />
        <polygon points={RIGHT} fill={`url(#${id}-sheen)`} />
      </g>
      <g className={motion("gf-ribbon-v")}>
        <rect data-ribbon="" x="134" y="-1" width="28" height="228" fill={ribbon} />
        <rect x="134" y="-1" width="28" height="228" fill={`url(#${id}-rv)`} stroke="rgba(0,0,0,.1)" />
      </g>
      <g className={motion("gf-ribbon-h")}>
        <rect x="-1" y="99" width="298" height="28" fill={ribbon} />
        <rect x="-1" y="99" width="298" height="28" fill={`url(#${id}-rh)`} stroke="rgba(0,0,0,.1)" />
      </g>
      <g transform="translate(84 72) scale(.8)">
        <g className={motion("gf-bow")}>
          {/* A soft shadow under the bow, drawn rather than filtered. */}
          <g transform="translate(0 5)" fill="#000000" opacity=".18">
            <path d="M80 50 C 58 6, 10 0, 6 30 C 2 62, 52 68, 80 50 Z" />
            <path d="M80 50 C 102 6, 150 0, 154 30 C 158 62, 108 68, 80 50 Z" />
          </g>
          <polygon points="80,50 52,102 66,95 73,108 88,56" fill={ribbon} />
          <polygon points="80,50 108,102 94,95 87,108 72,56" fill={ribbon} />
          <polygon points="80,50 52,102 66,95 73,108 88,56" fill="rgba(0,0,0,0.16)" />
          <path d="M80 50 C 58 6, 10 0, 6 30 C 2 62, 52 68, 80 50 Z" fill={ribbon} />
          <path d="M80 50 C 102 6, 150 0, 154 30 C 158 62, 108 68, 80 50 Z" fill={ribbon} />
          <path d="M72 48 C 56 26, 30 18, 20 30 C 34 28, 54 38, 72 48 Z" fill="rgba(0,0,0,0.20)" />
          <path d="M88 48 C 104 26, 130 18, 140 30 C 126 28, 106 38, 88 48 Z" fill="rgba(0,0,0,0.20)" />
          <path d="M14 24 C 22 10, 46 10, 60 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" />
          <path d="M146 24 C 138 10, 114 10, 100 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" />
          <rect x="67" y="36" width="26" height="28" rx="8" fill={ribbon} />
          <rect x="67" y="36" width="26" height="28" rx="8" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" />
        </g>
      </g>
      <g transform={`translate(${long ? 150 : 168} 118)`}>
        <g data-tag="" className={still ? undefined : "gf-tag"} transform={still ? "rotate(10 8 20)" : undefined}>
          <polygon points={`${notch},0 ${tagW},0 ${tagW},${tagH} ${notch},${tagH} 0,${tagH / 2}`} fill="#E9D2A2" stroke="#A8834F" />
          <circle cx="10.5" cy={tagH / 2} r="3.5" fill="#F6ECCD" stroke="#A8834F" />
          {lines.map((line, i) => (
            <text key={i} data-tag-line="" x="18" y={21 + i * lh - (opens ? 4 : 0)} fontSize={long ? 15 : 18} fontWeight="700" fill="#2B3350" style={{ fontFamily: CAVEAT }}>
              {line}
            </text>
          ))}
          {opens && (
            <text x="18" y={21 + lines.length * lh - 6} fontSize="8.5" fontWeight="800" fill="#5C4A2A" style={{ fontFamily: KARLA }}>
              open {opens}
            </text>
          )}
        </g>
      </g>
    </svg>
  );
}
