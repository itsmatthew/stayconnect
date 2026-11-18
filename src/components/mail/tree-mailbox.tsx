import { useId } from "react";
import { KARLA, NAVY, s } from "../home/units";
import "./mail.css";

/**
 * Your mailbox on your tree (docs/specs/mailbox.md, MAILBOX-1), from Main.dc.html: a tall post, the flag up and a glow
 * with a count while there's new mail, the flag down when there isn't. 74×106 in the design's px. The glow is an SVG
 * radial gradient, which react-native-svg has.
 */
export function TreeMailbox({ count, label, onOpen }: { count: number; label: string; onOpen: () => void }) {
  const id = `tm${useId().replace(/[^\w-]/g, "")}`;
  const has = count > 0;
  return (
    <button type="button" aria-label={label} onClick={onOpen} style={{ position: "relative", width: s(74), height: s(106), minWidth: 44, minHeight: 44, padding: 0, border: 0, background: "none", cursor: "pointer" }}>
      {has && (
        <svg aria-hidden="true" viewBox="0 0 134 116" className="mb-glow" style={{ position: "absolute", left: s(-30), top: s(-30), width: s(134), height: s(116), overflow: "visible" }}>
          <defs>
            <radialGradient id={`${id}-g`} cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="#FFEC78" />
              <stop offset=".38" stopColor="#FFD63C" stopOpacity=".85" />
              <stop offset=".68" stopColor="#FFC428" stopOpacity=".35" />
              <stop offset="1" stopColor="#FFC428" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="67" cy="58" rx="67" ry="58" fill={`url(#${id}-g)`} />
        </svg>
      )}
      <svg width="100%" height="100%" viewBox="0 0 66 96" aria-hidden="true" style={{ position: "relative", display: "block", overflow: "visible" }}>
        <rect x="28" y="44" width="8" height="50" rx="1.5" fill="#8C4A2B" stroke="#5A2E18" strokeWidth="1.5" />
        <path d="M31 47v44" stroke="#A9653D" strokeWidth="2" strokeLinecap="round" />
        <rect x="22" y="44" width="20" height="5" rx="1" fill="#6F3820" />
        <path d="M22 94c2-5 4-5 5 0M36 94c1-6 4-6 6 0M18 94c1-3 3-3 4 0" fill="#6F9B4E" stroke="#4F7A36" strokeWidth="1.2" />
        <g transform="translate(32 46) scale(1.28) translate(-32 -46)">
          {has && (
            <g transform="rotate(-10 8 31)">
              <rect x="0" y="25" width="17" height="12" rx="1.5" fill="#FFFDF6" stroke={NAVY} strokeWidth="1.4" />
              <path d="M0.8 25.8l8 6 8-6" fill="none" stroke={NAVY} strokeWidth="1.2" strokeLinejoin="round" />
              <rect x="2.5" y="33" width="3" height="2.5" fill="#B43A2A" />
            </g>
          )}
          <path d="M9 46V30C9 21 15 17 23 17H44C52 17 56 21 56 30V46Z" fill="#F4E9C8" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 46V30C9 23 11 19 15 18V46Z" fill="#E2D3A8" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" />
          <path d="M13 31v6" stroke={NAVY} strokeWidth="2" strokeLinecap="round" />
          <path d="M20 22C23 20 30 20 40 20" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity=".8" />
          <rect x="30" y="17" width="5" height="29" fill="#B43A2A" opacity=".9" />
          {/* The flag: up when there's mail, down when there isn't. */}
          <g data-mailbox-flag={has ? "up" : "down"} className="mb-flag-turn" style={{ transform: has ? "rotate(0deg)" : "rotate(-90deg)" }}>
            <g className={has ? "mb-flag-wave" : undefined}>
              <rect x="53" y="10" width="3" height="30" rx="1" fill="#B43A2A" stroke="#6E1D13" strokeWidth="1" />
              <path d="M56 10h10v9H56z" fill="#C8402D" stroke="#6E1D13" strokeWidth="1.2" strokeLinejoin="round" />
            </g>
          </g>
        </g>
      </svg>
      {has && (
        <span
          aria-hidden="true"
          style={{ position: "absolute", left: s(-6), top: s(-2), minWidth: s(20), height: s(20), boxSizing: "border-box", padding: `0 ${s(5)}`, borderRadius: s(10), background: "#F7CB4D", border: `${s(2)} solid ${NAVY}`, color: NAVY, fontFamily: KARLA, fontWeight: 800, fontSize: s(12), lineHeight: s(16), textAlign: "center", boxShadow: `0 0 ${s(8)} ${s(2)} rgba(255,214,60,.9)` }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
