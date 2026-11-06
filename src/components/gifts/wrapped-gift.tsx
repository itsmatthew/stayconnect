import { useId } from "react";
import { CAVEAT, s } from "../home/units";
import { WrapPattern } from "./wrap-pattern";

type WrappedGiftProps = {
  to: string;
  pattern: string;
  ribbon: string;
  /** "Nov 12", for a gift that opens on a chosen day. */
  opens?: string;
};

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

/** The gift in its paper, ribbon and tag (docs/specs/gifts.md, GIFT-8). */
export function WrappedGift({ to, pattern, ribbon, opens }: WrappedGiftProps) {
  const id = `wrap${useId().replace(/[^\w-]/g, "")}`;
  const label = `to ${to}`;
  const long = label.length > 11;
  const lines = long ? tagLines(label, 20) : [label];
  const lineHeight = long ? 14 : 20;
  const width = long ? 128 : 92;
  const left = long ? 150 : 178;
  const height = 16 + lines.length * lineHeight + (opens ? 14 : 0);
  return (
    <svg data-pattern={pattern} viewBox="0 0 300 200" role="img" aria-label={`A wrapped gift for ${to}`} style={{ display: "block", width: s(300), height: s(200), overflow: "visible" }}>
      <defs>
        <WrapPattern id={id} pattern={pattern} />
      </defs>
      <ellipse cx="150" cy="197" rx="135" ry="6" fill="#4A2C14" opacity=".18" />
      <rect x="6" y="4" width="288" height="188" rx="4" fill={`url(#${id})`} />
      <rect x="6" y="4" width="288" height="188" rx="4" fill="none" stroke="#2A1608" strokeOpacity=".18" />
      <rect data-ribbon="" x="135" y="4" width="30" height="188" fill={ribbon} />
      <rect x="6" y="84" width="288" height="28" fill={ribbon} />
      <path d="M150 98C122 66 88 74 96 96c5 15 34 13 54 2Z" fill={ribbon} stroke="#2A1608" strokeOpacity=".25" />
      <path d="M150 98C178 66 212 74 204 96c-5 15-34 13-54 2Z" fill={ribbon} stroke="#2A1608" strokeOpacity=".25" />
      <path d="M144 104L122 142L138 136L146 150L154 106Z" fill={ribbon} stroke="#2A1608" strokeOpacity=".25" />
      <path d="M156 104L178 142L162 136L154 150L146 106Z" fill={ribbon} stroke="#2A1608" strokeOpacity=".25" />
      <circle cx="150" cy="98" r="12" fill={ribbon} stroke="#2A1608" strokeOpacity=".3" />
      <g transform="rotate(10 222 136)">
        <rect x={left} y="116" width={width} height={height} rx="3" fill="#F3E2BC" stroke="#A98F5F" />
        <circle cx={left + 10} cy="130" r="3" fill="none" stroke="#A98F5F" />
        {lines.map((line, i) => (
          <text key={i} data-tag-line="" x={left + 20} y={134 + i * lineHeight} fontSize={long ? 13 : 17} fontWeight="700" fill="#2B3350" style={{ fontFamily: CAVEAT }}>
            {line}
          </text>
        ))}
        {opens && (
          <text x={left + 20} y={134 + lines.length * lineHeight} fontSize="12" fontWeight="700" fill="#5F5F66" style={{ fontFamily: CAVEAT }}>
            open {opens}
          </text>
        )}
      </g>
    </svg>
  );
}
