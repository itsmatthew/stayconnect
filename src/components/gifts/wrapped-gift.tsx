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

/** The gift in its paper, ribbon and tag (docs/specs/gifts.md, GIFT-8). */
export function WrappedGift({ to, pattern, ribbon, opens }: WrappedGiftProps) {
  const id = `wrap${useId().replace(/[^\w-]/g, "")}`;
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
      <g transform="rotate(12 222 136)">
        <rect x="178" y="116" width="92" height={opens ? 46 : 36} rx="3" fill="#F3E2BC" stroke="#A98F5F" />
        <circle cx="188" cy="130" r="3" fill="none" stroke="#A98F5F" />
        <text x="198" y="136" fontSize="17" fontWeight="700" fill="#2B3350" style={{ fontFamily: CAVEAT }}>
          to {to}
        </text>
        {opens && (
          <text x="198" y="152" fontSize="12" fontWeight="700" fill="#5F5F66" style={{ fontFamily: CAVEAT }}>
            open {opens}
          </text>
        )}
      </g>
    </svg>
  );
}
