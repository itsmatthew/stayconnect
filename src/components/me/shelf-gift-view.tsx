import { useState } from "react";
import { GiftCard, type GiftCardLook } from "../gifts/gift-card";
import { FRAUNCES, KARLA, NAVY, s } from "../home/units";

/**
 * A gift from your shelf, big (docs/specs/gifts.md, GIFT-21): the card as its sender made it, on a warm stage, turning
 * over to the note. Nothing about looking at it is ever shared.
 */
export function ShelfGiftView({ fromName, look, onClose }: { fromName: string; look: GiftCardLook; onClose: () => void }) {
  const [side, setSide] = useState<"photo" | "postcard">("photo");
  return (
    <div role="dialog" aria-modal="true" aria-label={`Gift from ${fromName}`} className="fixed inset-0 z-50 overflow-y-auto [--s:min(calc(100vw/390),calc(100dvh/844))]" style={{ fontFamily: KARLA, color: NAVY }}>
      <button type="button" aria-label="Close the gift" tabIndex={-1} onClick={onClose} className="gf-fade" style={{ position: "fixed", inset: 0, padding: 0, border: 0, background: "rgba(43,35,20,.55)" }} />
      <div className="gf-up" style={{ position: "relative", width: s(390), margin: `${s(120)} auto 0`, boxSizing: "border-box", padding: `${s(16)} 0 ${s(24)}`, borderRadius: s(26), background: "linear-gradient(#F6ECCD, #F1E2B8)", border: `${s(2)} solid ${NAVY}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${s(14)} 0 ${s(20)}` }}>
          <h2 style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(22) }}>from {fromName}</h2>
          <button type="button" aria-label="Close" onClick={onClose} style={{ width: 44, height: 44, padding: 0, borderRadius: "50%", border: `2px solid ${NAVY}`, background: "#FFF8EC", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <GiftCard look={look} side={side} onFlip={() => setSide(side === "photo" ? "postcard" : "photo")} />
      </div>
    </div>
  );
}
