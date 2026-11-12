import { useId } from "react";
import { FRAUNCES, NAVY, s } from "../home/units";
import type { BirthdayCardView, BirthdayTileView } from "./mail-types";
import "./mail.css";

const CREAM = "#FFF6DA";
const GOLD = "#F7CB4D";
/** Confetti falling through the card, as the design's: left, size, color, which fall, how long, delay. */
const CONFETTI: readonly (readonly [number, number, number, string, 1 | 2, number])[] = [
  [24, 5, 5, "#63A6A1", 2, -3.3],
  [45, 7, 10, "#63A6A1", 1, -1.6],
  [64, 8, 4, "#7FC4F0", 2, -5.2],
  [96, 5, 5, "#63A6A1", 1, -4],
  [123, 5, 10, "#7FC4F0", 2, -1.5],
  [152, 8, 4, "#C792E0", 1, -1.7],
  [169, 6, 6, "#F0B429", 2, -4.6],
  [204, 8, 8, CREAM, 1, -3.6],
  [216, 7, 10, "#E0482B", 2, -1],
  [240, 7, 4, "#C792E0", 1, -0.3],
  [267, 5, 10, "#7FC4F0", 2, -4.9],
  [303, 8, 9, "#63A6A1", 1, -1],
  [325, 5, 10, GOLD, 2, -0.3],
];

/**
 * A birthday coming up (docs/specs/mailbox.md, MAILBOX-11), from MailOpen.dc.html: a card, not a letter. A navy card
 * with a gold edge, confetti and balloons, their face in a party hat, "birthday coming up", their name, the day and a
 * countdown. Under it, "Schedule a gift", or, once you've sent one, a green note saying so (MAILBOX-12). The card's
 * glow and sky are SVG; motion is transforms only, off under reduced motion.
 */
export function BirthdayCard({ card, onAction }: { card: BirthdayCardView; onAction: () => void }) {
  const id = `bd${useId().replace(/[^\w-]/g, "")}`;
  return (
    <div className="mb-up" style={{ position: "absolute", left: s(20), top: s(40), width: s(350) }}>
      <section aria-label={`Birthday coming up: ${card.name}, ${card.dayLong}`} style={{ position: "relative", width: s(350), height: s(236), borderRadius: s(10), overflow: "hidden", boxShadow: `0 ${s(20)} ${s(44)} rgba(0,0,0,.6)` }}>
        <svg viewBox="0 0 350 236" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}>
          <defs>
            <radialGradient id={`${id}-sky`} cx=".28" cy=".4" r=".9">
              <stop offset="0" stopColor="#3A4578" />
              <stop offset=".62" stopColor="#222A4C" />
              <stop offset="1" stopColor="#1A2040" />
            </radialGradient>
          </defs>
          <rect width="350" height="236" rx="10" fill={`url(#${id}-sky)`} />
          <rect x="1" y="1" width="348" height="234" rx="9" fill="none" stroke={GOLD} strokeWidth="2" />
          <rect x="6.5" y="6.5" width="337" height="223" rx="6" fill="none" stroke="rgba(247,203,77,.55)" strokeWidth="1" />
        </svg>
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {CONFETTI.map(([left, w, h, color, fall, delay], i) => (
            <span key={i} className={`mb-conf${fall}`} style={{ position: "absolute", left: s(left), top: s(-14), width: s(w), height: s(h), borderRadius: w === h ? "50%" : s(1.5), background: color, animationDelay: `${delay}s` }} />
          ))}
        </div>
        {/* Balloons. */}
        <svg width={s(86)} height={s(120)} viewBox="0 0 86 120" aria-hidden="true" className="mb-sway" style={{ position: "absolute", right: s(8), top: s(-6), display: "block" }}>
          <path d="M28 58c2 18-6 30 4 62M58 50c-4 22 6 36-2 70" fill="none" stroke="rgba(255,246,218,.55)" strokeWidth="1.4" />
          <ellipse cx="58" cy="30" rx="20" ry="24" fill="#E0482B" />
          <path d="M54 53l4 5 4-5z" fill="#B43A2A" />
          <ellipse cx="51" cy="20" rx="5" ry="8" fill="rgba(255,255,255,.35)" transform="rotate(-20 51 20)" />
          <ellipse cx="27" cy="40" rx="17" ry="20" fill={GOLD} />
          <path d="M24 59l4 4 3-4z" fill="#D79A22" />
          <ellipse cx="21" cy="32" rx="4" ry="7" fill="rgba(255,255,255,.4)" transform="rotate(-20 21 32)" />
        </svg>
        {/* Them, in a party hat. */}
        <div aria-hidden="true" style={{ position: "absolute", left: s(22), top: s(44), width: s(100), height: s(130) }}>
          <span style={{ position: "absolute", left: s(4), top: s(34), width: s(92), height: s(92), boxSizing: "border-box", borderRadius: "50%", border: `${s(3)} solid ${CREAM}`, boxShadow: `0 0 0 ${s(3)} ${GOLD}, 0 0 ${s(26)} ${s(8)} rgba(247,203,77,.55)`, background: card.face }} />
          <svg width={s(50)} height={s(48)} viewBox="0 0 46 44" style={{ position: "absolute", left: s(34), top: 0, display: "block", transform: "rotate(14deg)" }}>
            <path d="M23 2L42 40H4z" fill={GOLD} stroke="#1A2040" strokeWidth="2" strokeLinejoin="round" />
            <path d="M17 14h12M12 24h22M8 33h30" stroke="#E0482B" strokeWidth="4" />
            <circle cx="23" cy="3" r="4.5" fill={CREAM} stroke="#1A2040" strokeWidth="1.5" />
          </svg>
        </div>
        <div style={{ position: "absolute", left: s(140), top: s(52), width: s(196), display: "flex", flexDirection: "column", gap: s(4), textAlign: "left" }}>
          <span style={{ fontSize: s(11), fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: GOLD }}>birthday coming up</span>
          <span style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(card.name.length > 8 ? 30 : 40), lineHeight: 1, letterSpacing: s(-1), color: CREAM, overflowWrap: "anywhere" }}>{card.name}</span>
          <span style={{ fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(19), color: "#FFD9A0" }}>{card.dayLong}</span>
        </div>
        <span style={{ position: "absolute", left: s(140), top: s(168), height: s(30), padding: `0 ${s(13)}`, borderRadius: s(15), background: GOLD, color: "#1A2040", fontSize: s(13), fontWeight: 800, lineHeight: s(30), boxShadow: `0 ${s(2)} 0 #B5801F` }}>{card.countdown}</span>
      </section>
      {card.done ? (
        <div role="status" className="mb-pop" style={{ width: s(350), minHeight: s(56), marginTop: s(22), boxSizing: "border-box", padding: `${s(8)} ${s(14)}`, borderRadius: s(16), background: "#E4EED8", border: `${s(2)} solid #4F7A36`, display: "flex", alignItems: "center", gap: s(10), textAlign: "left", color: NAVY }}>
          <span aria-hidden="true" style={{ flex: "none", width: s(28), height: s(28), borderRadius: "50%", background: "#4F7A36", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={s(14)} height={s(14)} viewBox="0 0 24 24" fill="none" stroke={CREAM} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
              <path d="M5 12l5 5 9-10" />
            </svg>
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: s(1) }}>
            <span style={{ fontSize: s(15), fontWeight: 800 }}>{card.done.title}</span>
            <span style={{ fontSize: s(12.5), fontWeight: 700, color: "#4A5A3E" }}>{card.done.line}</span>
          </span>
        </div>
      ) : card.action && (
        <button type="button" onClick={onAction} style={{ width: s(350), height: s(56), minHeight: 44, marginTop: s(22), boxSizing: "border-box", borderRadius: s(28), border: `2px solid ${CREAM}`, background: "#E0482B", color: CREAM, boxShadow: `0 ${s(4)} 0 #8E2A1E`, display: "flex", alignItems: "center", justifyContent: "center", gap: s(9), fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(20), cursor: "pointer" }}>
          <svg width={s(19)} height={s(19)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
            <rect x="4" y="11" width="16" height="10" rx="1.5" />
            <rect x="2.5" y="7" width="19" height="4" rx="1" />
            <path d="M12 7v14" />
            <path d="M12 7c-4-6-8-2-5 0zm0 0c4-6 8-2 5 0z" />
          </svg>
          {card.action}
        </button>
      )}
    </div>
  );
}

/**
 * A seen reminder among kept mail (MAILBOX-13), as the design's: a card in a gold-and-red striped border (SVG, as
 * airmail is), their face, "Leo · Fri" and a chip, "reminder" or, in green, "gift scheduled". Tapping it opens the card.
 */
export function BirthdayTile({ tile, onOpen }: { tile: BirthdayTileView; onOpen: () => void }) {
  const id = `bt${useId().replace(/[^\w-]/g, "")}`;
  return (
    <button type="button" aria-label={`Birthday reminder for ${tile.name}`} onClick={onOpen} style={{ padding: 0, border: 0, background: "none", textAlign: "left", color: NAVY, display: "flex", flexDirection: "column", gap: s(6), cursor: "pointer" }}>
      <span style={{ position: "relative", display: "block", width: "100%", height: s(156), boxSizing: "border-box", padding: s(6), borderRadius: s(5), boxShadow: `0 ${s(6)} ${s(12)} rgba(74,44,20,.3)`, transform: "rotate(1.2deg)", overflow: "hidden" }}>
        <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}>
          <defs>
            <pattern id={id} width="32" height="32" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="32" height="32" fill="#FBF6EA" />
              <rect width="9" height="32" fill="#F0B429" />
              <rect x="16" width="9" height="32" fill="#B43A2A" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${id})`} />
        </svg>
        <span style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: s(6), width: "100%", height: "100%", borderRadius: s(3), background: "#FBF6EA" }}>
          <span aria-hidden="true" style={{ width: s(46), height: s(46), boxSizing: "border-box", borderRadius: "50%", border: `${s(2)} solid ${NAVY}`, boxShadow: `0 0 0 ${s(3)} ${GOLD}`, background: tile.face }} />
          <span style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(15) }}>
            {tile.name} · {tile.weekday}
          </span>
          <span style={{ height: s(20), padding: `0 ${s(8)}`, borderRadius: s(10), background: tile.scheduled ? "#4F7A36" : "#F0B429", color: tile.scheduled ? CREAM : NAVY, fontSize: s(10.5), fontWeight: 800, lineHeight: s(20) }}>{tile.scheduled ? "gift scheduled" : "reminder"}</span>
        </span>
      </span>
      <span style={{ fontSize: s(13), fontWeight: 800, paddingLeft: s(2) }}>birthday reminder</span>
    </button>
  );
}
