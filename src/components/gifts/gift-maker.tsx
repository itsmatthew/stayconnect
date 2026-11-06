import type { CSSProperties, ReactNode } from "react";
import type { Party } from "../home/types";
import { CREAM, FRAUNCES, KARLA, NAVY, s } from "../home/units";
import { PartyAvatar } from "../messages/avatar";
import { GiftCard, type GiftCardLook } from "./gift-card";

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

const chipFill: Record<GiftChip["state"], CSSProperties> = {
  current: { background: NAVY, color: CREAM },
  done: { background: CREAM, color: NAVY },
  todo: { background: "transparent", color: NAVY },
};

const footerButton: CSSProperties = { minHeight: 44, height: s(52), boxSizing: "border-box", borderRadius: s(26), border: `${s(2)} solid ${NAVY}`, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(16), cursor: "pointer" };

function Tick() {
  return (
    <svg width={s(10)} height={s(10)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 13l5 5L20 6" />
    </svg>
  );
}

/** The five-step gift maker's frame (docs/specs/gifts.md, GIFT-2): title, step chips, live card, the step's panel, Back and Next. */
export function GiftMaker({ title, recipient, chips, onChip, look, side, onFlip, nextLabel, canNext, onNext, onBack, onClose, children }: GiftMakerProps) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-30 overflow-y-auto [--s:calc(min(100vw,480px)/390)] md:[--s:1.1px]" style={{ background: "linear-gradient(#F6ECCD, #F1E2B8)", fontFamily: KARLA, color: NAVY }}>
      <div style={{ width: s(390), minHeight: "100%", margin: "0 auto", boxSizing: "border-box", padding: `${s(8)} ${s(14)} ${s(14)}`, display: "flex", flexDirection: "column", gap: s(6) }}>
        <header style={{ display: "flex", alignItems: "center", gap: s(10) }}>
          <button type="button" aria-label="Close" onClick={onClose} style={{ minWidth: 44, minHeight: 44, padding: 0, border: 0, background: "none", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width={s(16)} height={s(16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {recipient && <PartyAvatar party={recipient} size={30} />}
          <h1 className="gf-two-lines" style={{ minWidth: 0, margin: 0, lineHeight: 1.15, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(21), letterSpacing: s(-0.3) }}>{title}</h1>
        </header>

        <nav aria-label="Gift steps" style={{ display: "flex", gap: s(4) }}>
          {chips.map((c, i) => (
            <button
              key={c.id}
              type="button"
              disabled={!c.enabled}
              aria-current={c.state === "current" ? "step" : undefined}
              onClick={() => onChip(c.id)}
              style={{ flex: 1, minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", cursor: c.enabled ? "pointer" : "default" }}
            >
              <span style={{ ...chipFill[c.state], width: "100%", height: s(28), borderRadius: s(14), border: `${s(1.5)} solid ${NAVY}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", gap: s(3), fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(11.5), opacity: c.enabled ? 1 : 0.55 }}>
                {c.state === "done" ? <Tick /> : <span>{i + 1}</span>}
                <span>{c.label}</span>
              </span>
            </button>
          ))}
        </nav>

        <GiftCard look={look} side={side} onFlip={onFlip} />

        <section style={{ flex: 1, minHeight: s(250), boxSizing: "border-box", padding: `${s(12)} ${s(14)}`, borderRadius: s(18), border: `${s(2)} solid ${NAVY}`, background: "#FBF3DE", display: "flex", flexDirection: "column", gap: s(10) }}>{children}</section>

        {/* Pinned, so Next stays in reach however long the step gets. */}
        <footer style={{ position: "sticky", bottom: 0, display: "flex", gap: s(10), margin: `0 ${s(-14)} ${s(-14)}`, padding: `${s(8)} ${s(14)} ${s(14)}`, background: "#F1E2B8" }}>
          {onBack && (
            <button type="button" onClick={onBack} style={{ ...footerButton, flex: "0 0 30%", background: CREAM, color: NAVY }}>
              Back
            </button>
          )}
          <button type="button" disabled={!canNext} onClick={onNext} style={{ ...footerButton, flex: 1, background: canNext ? "#B73420" : "#E2D3A8", color: canNext ? "#FFF6DA" : "#6B6A66", fontStyle: "italic", boxShadow: canNext ? `0 ${s(3)} 0 ${NAVY}` : "none", cursor: canNext ? "pointer" : "default" }}>
            {nextLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
