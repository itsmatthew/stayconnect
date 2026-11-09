import { useId, type ReactNode } from "react";
import type { Party } from "../home/types";
import { FRAUNCES, KARLA, NAVY, s } from "../home/units";
import { PartyAvatar } from "../messages/avatar";
import { NOTE_GREY, PAPER_PANEL, RED } from "./gift-looks";
import "./gifts.css";
import { MiniWrapped } from "./mini-wrapped";

type CheckoutSheetProps = {
  recipient?: Party;
  /** "Leo", or "Hoops Since ’14 · 4 people". */
  forLine: string;
  group: boolean;
  /** "right away" or "Thu, Nov 12". */
  opens: string;
  /** "Instant frame · a note on the back". */
  inside: string;
  wrap: { pattern: string; ribbon: string };
  /** The send button: "Send to Leo · $0.99", "Sending…", "Try again · $0.99". */
  buttonLabel: string;
  /** The send button can't be pressed: paying, or the price is still loading. */
  busy: boolean;
  /** A payment is under way: nothing can be cancelled. */
  paying: boolean;
  /** What went wrong, if anything. */
  message?: string;
  onSend: () => void;
  onCancel: () => void;
  /** Dev only: make the fake's next payment fail. */
  onDevFail?: () => void;
};

const label = { fontSize: s(11), fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A8331F" } as const;

function Row({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: s(12), minHeight: s(36), borderBottom: `${s(1)} solid #E2D3A8` }}>
      <span style={label}>{name}</span>
      <span style={{ display: "flex", alignItems: "center", gap: s(8), fontSize: s(14.5), fontWeight: 800, textAlign: "right" }}>{children}</span>
    </div>
  );
}

/**
 * Checkout (docs/specs/gifts.md, GIFT-14): a bottom sheet over the maker, in the Daily 5 send sheet's style, with the
 * wrapped gift, who it's for, when it opens, what's inside, and one button carrying the price.
 */
export function CheckoutSheet({ recipient, forLine, group, opens, inside, wrap, buttonLabel, busy, paying, message, onSend, onCancel, onDevFail }: CheckoutSheetProps) {
  const titleId = useId();
  return (
    <div className="fixed inset-0 z-40 [--s:calc(min(100vw,480px)/390)] md:[--s:1.1px]" style={{ fontFamily: KARLA, color: NAVY }}>
      <div className="gf-fade" aria-hidden="true" onClick={paying ? undefined : onCancel} style={{ position: "absolute", inset: 0, background: "rgba(27,31,52,.55)" }} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="gf-up" style={{ position: "absolute", left: "50%", bottom: 0, translate: "-50% 0", width: s(390), boxSizing: "border-box", padding: `${s(10)} ${s(18)} ${s(30)}`, borderRadius: `${s(24)} ${s(24)} 0 0`, background: PAPER_PANEL, borderTop: `${s(2)} solid ${NAVY}`, display: "flex", flexDirection: "column", gap: s(12) }}>
        <div aria-hidden="true" style={{ alignSelf: "center", width: s(44), height: s(5), borderRadius: s(3), background: "#C9B98C" }} />
        <div style={{ display: "flex", alignItems: "center", gap: s(12) }}>
          <MiniWrapped {...wrap} />
          <h2 id={titleId} style={{ flex: 1, margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(20), letterSpacing: s(-0.3) }}>
            Ready to send
          </h2>
          <button type="button" aria-label="Cancel" disabled={paying} onClick={onCancel} style={{ flex: "none", width: 44, height: 44, minHeight: 44, borderRadius: "50%", border: `${s(2)} solid ${NAVY}`, background: "#FFF8EC", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, cursor: paying ? "default" : "pointer" }}>
            <svg width={s(16)} height={s(16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div>
          <Row name="For">
            {recipient && (
              <span style={{ width: s(28), height: s(28), borderRadius: "50%", border: `${s(2)} solid ${NAVY}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PartyAvatar party={recipient} size={26} />
              </span>
            )}
            {forLine}
          </Row>
          {group && <div style={{ padding: `${s(4)} 0`, textAlign: "right", fontSize: s(12), fontWeight: 700, color: NOTE_GREY }}>one price for the whole group, a copy for each of them</div>}
          <Row name="Opens">{opens}</Row>
          <Row name="Inside">{inside}</Row>
        </div>
        {message && (
          <p role="alert" style={{ margin: 0, fontSize: s(13.5), fontWeight: 800, color: "#A8331F", textAlign: "center" }}>
            {message}
          </p>
        )}
        <button type="button" disabled={busy} onClick={onSend} style={{ height: s(52), minHeight: 44, borderRadius: s(26), border: `${s(2)} solid ${NAVY}`, background: busy ? "#E2D3A8" : RED, color: busy ? "#6B6A66" : "#FFF6DA", boxShadow: busy ? "none" : `0 ${s(3)} 0 ${NAVY}`, display: "flex", alignItems: "center", justifyContent: "center", gap: s(9), fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(17), cursor: busy ? "default" : "pointer" }}>
          {paying ? (
            <svg className="gf-spin" width={s(18)} height={s(18)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
              <path d="M12 3a9 9 0 1 1-9 9" />
            </svg>
          ) : (
            <svg width={s(18)} height={s(18)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="1.5" />
              <rect x="2.5" y="7" width="19" height="4" rx="1" />
              <path d="M12 7v14" />
              <path d="M12 7c-4-6-8-2-5 0zm0 0c4-6 8-2 5 0z" />
            </svg>
          )}
          {buttonLabel}
        </button>
        {onDevFail && (
          <button type="button" onClick={onDevFail} style={{ alignSelf: "center", minHeight: 44, border: 0, background: "none", color: NOTE_GREY, fontSize: s(11.5), fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>
            dev: make the next payment fail
          </button>
        )}
      </div>
    </div>
  );
}
