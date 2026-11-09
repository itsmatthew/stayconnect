import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Party } from "../home/types";
import { FRAUNCES, KARLA, NAVY, s } from "../home/units";
import { PartyAvatar } from "../messages/avatar";
import { GiftCard, type GiftCardLook } from "./gift-card";
import { PAPER_PANEL, RED } from "./gift-looks";
import "./gifts.css";
import { prefersLessMotion } from "./motion";

export type GiftChip = { id: string; label: string; state: "current" | "done" | "todo"; enabled: boolean };

type GiftMakerProps = {
  /** "A gift for Maya", or "A gift" before anyone is picked. */
  title: string;
  /** The person or group it's for, once picked. */
  recipient?: Party;
  chips: readonly GiftChip[];
  onChip: (id: string) => void;
  look: GiftCardLook;
  side: "photo" | "postcard" | "wrapped";
  onFlip: () => void;
  nextLabel: string;
  canNext: boolean;
  onNext: () => void;
  /** Absent on the first step. */
  onBack?: () => void;
  onClose: () => void;
  /** The current step's panel. */
  children: ReactNode;
};

const CHIP: Record<GiftChip["state"], CSSProperties> = {
  current: { background: NAVY, color: "#FBF4DD", borderColor: NAVY },
  done: { background: PAPER_PANEL, color: NAVY, borderColor: NAVY },
  todo: { background: "transparent", color: NAVY, borderColor: "rgba(43,51,80,.35)" },
};

/**
 * The gift maker (docs/specs/gifts.md, GIFT-2), as in the design: it slides up over the shelf, with the title, the
 * five step chips, the gift on its stage, the step's panel, and Back and Next. The panel scrolls inside itself, so Back
 * and Next stay on screen.
 */
export function GiftMaker({ title, recipient, chips, onChip, look, side, onFlip, nextLabel, canNext, onNext, onBack, onClose, children }: GiftMakerProps) {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const close = () => {
    if (prefersLessMotion()) return onClose();
    setLeaving(true);
    timer.current = setTimeout(onClose, 450);
  };
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className={`fixed inset-0 z-30 overflow-y-auto [--s:calc(min(100vw,480px)/390)] md:[--s:1.1px] ${leaving ? "gf-sheet-out" : "gf-sheet"}`} style={{ background: "linear-gradient(#F6ECCD, #F1E2B8)", fontFamily: KARLA, color: NAVY, boxShadow: "0 -12px 30px rgba(43,35,20,.28)" }}>
      <div style={{ width: s(390), height: "100dvh", minHeight: s(560), margin: "0 auto", display: "flex", flexDirection: "column" }}>
        <header style={{ flex: "none", boxSizing: "content-box", height: s(44), padding: `${s(46)} ${s(12)} 0`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button type="button" aria-label="Cancel and go back to your gifts" onClick={close} style={{ flex: "none", width: 44, minHeight: 44, padding: 0, border: 0, background: "none", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: s(10) }}>
            {recipient && (
              <span aria-hidden="true" style={{ flex: "none", width: s(32), height: s(32), boxSizing: "border-box", borderRadius: "50%", border: `${s(2)} solid #FFF3C4`, boxShadow: `0 0 0 ${s(1.5)} #FFD75E, 0 0 ${s(9)} ${s(3)} rgba(255,214,90,.9)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PartyAvatar party={recipient} size={28} />
              </span>
            )}
            <h1 className="gf-two-lines" style={{ minWidth: 0, margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(23), letterSpacing: s(-0.4), lineHeight: 1.15 }}>
              {title}
            </h1>
          </div>
          <span style={{ flex: "none", width: 44 }} />
        </header>

        <nav aria-label="Gift steps" style={{ flex: "none", margin: `${s(10)} ${s(16)} 0`, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: s(5) }}>
          {chips.map((c, i) => (
            <button key={c.id} type="button" disabled={!c.enabled} aria-current={c.state === "current" ? "step" : undefined} onClick={() => onChip(c.id)} style={{ minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", cursor: c.enabled ? "pointer" : "default" }}>
              <span style={{ ...CHIP[c.state], width: "100%", height: s(40), boxSizing: "border-box", borderRadius: s(20), borderWidth: s(2), borderStyle: "solid", display: "flex", alignItems: "center", justifyContent: "center", gap: s(5), fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(13) }}>
                <span style={{ fontFamily: KARLA, fontStyle: "normal", fontWeight: 800, fontSize: s(11), opacity: 0.8 }}>{c.state === "done" ? "✓" : i + 1}</span>
                <span>{c.label}</span>
              </span>
            </button>
          ))}
        </nav>

        <GiftCard look={look} side={side} onFlip={onFlip} />

        <section data-gift-panel="" style={{ flex: `0 1 ${s(288)}`, minHeight: s(150), margin: `${s(10)} ${s(14)} 0`, boxSizing: "border-box", padding: `${s(14)} ${s(14)} ${s(12)}`, borderRadius: s(18), background: PAPER_PANEL, border: `${s(2)} solid ${NAVY}`, overflowY: "auto", display: "flex", flexDirection: "column", gap: s(8) }}>
          {children}
        </section>

        <footer style={{ flex: "none", display: "flex", gap: s(10), padding: `${s(14)} ${s(14)} ${s(22)}` }}>
          {onBack && (
            <button type="button" onClick={onBack} style={{ width: s(104), height: s(50), minHeight: 44, borderRadius: s(25), border: `${s(2)} solid ${NAVY}`, background: PAPER_PANEL, color: NAVY, fontFamily: KARLA, fontWeight: 800, fontSize: s(15), cursor: "pointer" }}>
              Back
            </button>
          )}
          <button type="button" disabled={!canNext} onClick={onNext} style={{ flex: 1, height: s(50), minHeight: 44, borderRadius: s(25), border: `${s(2)} solid ${NAVY}`, background: canNext ? RED : "#E2D3A8", color: canNext ? "#FFF6DA" : "#6B6A66", boxShadow: canNext ? `0 ${s(3)} 0 ${NAVY}` : "none", fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(18), display: "flex", alignItems: "center", justifyContent: "center", gap: s(8), cursor: canNext ? "pointer" : "default" }}>
            {nextLabel}
            <svg width={s(16)} height={s(16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </footer>
      </div>
    </div>
  );
}
