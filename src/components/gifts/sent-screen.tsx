import { useId } from "react";
import type { Party } from "../home/types";
import { FRAUNCES, KARLA, NAVY, s } from "../home/units";
import { PartyAvatar } from "../messages/avatar";
import "./gifts.css";
import { WrappedGift } from "./wrapped-gift";

type SentScreenProps = {
  recipient?: Party;
  /** "On its way to Maya". */
  title: string;
  line: string;
  wrap: { to: string; pattern: string; ribbon: string; opens?: string };
  /** The tree's rings, outside in. A person's tree is the design's; a group's is drawn in its colors. */
  rings: readonly [string, string, string];
  onDone: () => void;
};

const LIGHTS = [
  [128, 548, 5, 2.2, 0],
  [268, 560, 5, 2.8, 0.4],
  [150, 660, 4, 2.5, 0.8],
  [246, 648, 4, 3, 0.2],
  [210, 540, 4, 2.4, 1],
] as const;

/**
 * Sent (docs/specs/gifts.md, GIFT-16), from the end of GiftCompose.dc.html: a dark sky, their tree, the gift flying in and
 * shaking underneath, then who it's for, the line, and Done. The scene is the design's 390×844, scaled to fit the screen.
 * Skies and glows are SVG radial gradients, which react-native-svg has.
 */
export function SentScreen({ recipient, title, line, wrap, rings, onDone }: SentScreenProps) {
  const id = `sent${useId().replace(/[^\w-]/g, "")}`;
  const titleId = useId();
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-50 overflow-hidden [--s:min(calc(100vw/390),calc(100dvh/844))]" style={{ background: "#141628", fontFamily: KARLA }}>
      <div style={{ position: "relative", width: s(390), height: s(844), margin: "0 auto" }}>
        <svg className="gf-fade" viewBox="0 0 390 844" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}>
          <defs>
            <radialGradient id={`${id}-sky`} cx=".5" cy=".7" r=".75">
              <stop offset="0" stopColor="#3A345C" stopOpacity=".92" />
              <stop offset=".72" stopColor="#141628" stopOpacity=".97" />
            </radialGradient>
            <radialGradient id={`${id}-tree`} cx=".5" cy=".5" r=".5">
              <stop offset=".7" stopColor="#F6E25A" stopOpacity=".55" />
              <stop offset="1" stopColor="#F6E25A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-glow`} cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="#FFE06A" stopOpacity=".95" />
              <stop offset=".68" stopColor="#FFE06A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="390" height="844" fill={`url(#${id}-sky)`} />
        </svg>
        <svg className="gf-tree" viewBox="0 0 390 844" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}>
          <ellipse cx="195" cy="750" rx="150" ry="12" fill="#000000" opacity=".35" />
          <path d="M183 680c2 30 0 50-12 70h48c-12-20-14-40-12-70z" fill="#8C4A2B" />
          <path d="M196 680c2 30 4 50 12 70h11c-12-20-14-40-12-70z" fill="#6F3820" />
          <circle cx="195" cy="596" r="120" fill={`url(#${id}-tree)`} />
          <circle cx="195" cy="596" r="100" fill={rings[0]} stroke="rgba(0,0,0,.15)" strokeWidth="2" />
          <circle cx="195" cy="596" r="68" fill={rings[1]} stroke="rgba(0,0,0,.12)" strokeWidth="2" />
          <circle cx="195" cy="596" r="36" fill={rings[2]} stroke="rgba(0,0,0,.15)" strokeWidth="2" />
          <g fill="#FFF3C4">
            {LIGHTS.map(([cx, cy, r, dur, delay]) => (
              <circle key={`${cx}-${cy}`} className="gf-twinkle" cx={cx} cy={cy} r={r} style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }} />
            ))}
          </g>
          <g transform="translate(120 722)">
            <rect x="0" y="8" width="30" height="22" rx="3" fill="#4F8F8B" stroke="#2C5552" strokeWidth="1.5" />
            <rect x="11" y="8" width="8" height="22" fill="#F7CB4D" />
            <rect x="-3" y="3" width="36" height="8" rx="2.5" fill="#63A6A1" stroke="#2C5552" strokeWidth="1.5" />
            <rect x="11" y="3" width="8" height="8" fill="#F7CB4D" />
          </g>
          <g transform="translate(154 730)">
            <rect x="0" y="6" width="22" height="16" rx="3" fill="#7A4E8C" stroke="#432650" strokeWidth="1.5" />
            <rect x="8" y="6" width="6" height="16" fill="#F4E9C8" />
            <rect x="-2" y="2" width="26" height="7" rx="2" fill="#9668A8" stroke="#432650" strokeWidth="1.5" />
          </g>
          <circle className="gf-glow" cx="232" cy="735" r="40" fill={`url(#${id}-glow)`} />
        </svg>

        <div className="gf-rise" role="status" style={{ position: "absolute", left: 0, top: s(104), width: s(390), boxSizing: "border-box", padding: `0 ${s(28)}`, display: "flex", flexDirection: "column", alignItems: "center", gap: s(10), textAlign: "center" }}>
          {recipient && (
            <span aria-hidden="true" style={{ width: s(54), height: s(54), boxSizing: "border-box", borderRadius: "50%", border: `${s(2)} solid #FFF3C4`, boxShadow: `0 0 0 ${s(2)} #FFD75E, 0 0 ${s(16)} ${s(6)} rgba(255,221,96,.75)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PartyAvatar party={recipient} size={50} />
            </span>
          )}
          <h2 id={titleId} className="gf-two-lines" style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(30), letterSpacing: s(-0.5), lineHeight: 1.15, color: "#FFF6DA" }}>
            {title}
          </h2>
          <p style={{ margin: 0, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 500, fontSize: s(16), lineHeight: 1.4, color: "#F2E3B6" }}>{line}</p>
        </div>

        {/* The gift itself: up, then into the tree, then shaking under it. */}
        <div data-sent-gift="" className="gf-send" style={{ position: "absolute", left: s(47), top: s(182), width: s(296), height: s(226) }}>
          <div className="gf-shake" style={{ position: "relative", width: "100%", height: "100%" }}>
            <WrappedGift {...wrap} still />
          </div>
        </div>

        <button type="button" className="gf-done" onClick={onDone} style={{ position: "absolute", left: s(110), top: s(776), width: s(170), height: s(48), minHeight: 44, borderRadius: s(24), border: `${s(2)} solid #FFF6DA`, background: "#FFF6DA", color: NAVY, fontWeight: 800, fontSize: s(15), cursor: "pointer" }}>
          Done
        </button>
      </div>
    </div>
  );
}
