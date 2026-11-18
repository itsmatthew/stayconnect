import { useId } from "react";
import { s } from "../home/units";
import { PaperDefs, PaperFill } from "./wrap-pattern";

/** A small wrapped gift, for the checkout sheet: the paper, the ribbon's cross and a knot. */
export function MiniWrapped({ pattern, ribbon }: { pattern: string; ribbon: string }) {
  const id = `mini${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg viewBox="0 0 64 50" aria-hidden="true" style={{ display: "block", width: s(64), height: s(50), flex: "none", transform: "rotate(-4deg)" }}>
      <defs>
        <PaperDefs id={id} pattern={pattern} />
      </defs>
      <rect x="1" y="3" width="64" height="50" fill="#4A2C14" opacity=".2" />
      <PaperFill id={id} pattern={pattern} shape={(fill) => <rect width="62" height="48" rx="2" fill={fill} />} />
      <rect x="28" width="6" height="48" fill={ribbon} />
      <rect y="21" width="62" height="6" fill={ribbon} />
      <circle cx="31" cy="24" r="5" fill={ribbon} stroke="rgba(0,0,0,.2)" />
    </svg>
  );
}
