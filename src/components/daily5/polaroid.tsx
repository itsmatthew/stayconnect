import { CAVEAT, NAVY, s } from "../home/units";
import type { ReactNode } from "react";
import { MailboxIcon } from "../mail/mailbox-icon";
import { SendIcon } from "./send-icon";
import type { Daily5Card } from "./types";

/** Tilts cycle as in the reference. The frame is always neutral: colour means a group everywhere else in the app (D5-9). */
const TILTS = [-1.2, 1, -0.8, 1.3, -1] as const;

/** The polaroid's cream paper, shared with the send flight. */
export const POLAROID_PAPER = "#FDFBF5";

/** The warm, slightly faded film look the reference gives every photo. */
export const FILM = "sepia(.22) saturate(.82) contrast(.92) brightness(1.06)";

/** One of the card's round buttons with its label underneath, from Daily5Send.dc.html. 46 to look at, at least 44 to tap. */
function CardAction({ label, word, bg, color = NAVY, onClick, children }: { label: string; word: string; bg: string; color?: string; onClick: () => void; children: ReactNode }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: s(3) }}>
      <button type="button" aria-label={label} onClick={onClick} style={{ width: s(46), height: s(46), minWidth: 44, minHeight: 44, boxSizing: "border-box", borderRadius: "50%", border: `${s(2)} solid ${NAVY}`, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 ${s(3)} 0 ${NAVY}`, background: bg, color, cursor: "pointer" }}>
        {children}
      </button>
      <span aria-hidden="true" style={{ fontSize: s(10.5), fontWeight: 800, letterSpacing: "0.02em", color: "#3F4664" }}>{word}</span>
    </span>
  );
}

export function Polaroid({ card, index, onSend, onMailbox, onGift }: { card: Daily5Card; index: number; onSend: () => void; /** Drop it in someone's mailbox (MAIL-1). */ onMailbox?: () => void; /** Send it as a gift (GIFT-17). */ onGift?: () => void }) {
  const tilt = TILTS[index % TILTS.length];
  return (
    <article
      style={{
        boxSizing: "border-box",
        padding: `${s(14)} ${s(14)} 0`,
        borderRadius: s(5),
        background: POLAROID_PAPER,
        border: `${s(2)} solid ${NAVY}`,
        boxShadow: `0 ${s(10)} ${s(22)} rgba(74,44,20,.32)`,
        transform: `rotate(${tilt}deg)`,
      }}
    >
      <div style={{ position: "relative", background: "#1A1714", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob: URL from IndexedDB */}
        <img src={card.src} alt={card.alt} style={{ display: "block", width: "100%", height: s(334), objectFit: "cover", filter: FILM }} />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: `inset 0 0 ${s(38)} rgba(20,12,30,.5)`,
            background: "linear-gradient(200deg, rgba(255,236,200,.22), rgba(255,236,200,0) 45%, rgba(40,30,70,.16))",
          }}
        />
      </div>
      <div style={{ height: s(76), display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${s(2)} ${s(4)} ${s(6)}` }}>
        <span style={{ fontFamily: CAVEAT, fontWeight: 700, fontSize: s(27), color: NAVY, transform: "rotate(-2deg)" }}>{card.dateLabel}</span>
        <span style={{ display: "flex", alignItems: "flex-start", gap: s(10), paddingTop: s(4) }}>
          {onMailbox && (
            <CardAction label="Drop this photo in someone's mailbox" word="mailbox" bg="#CFE4F2" onClick={onMailbox}>
              <MailboxIcon size={s(30)} />
            </CardAction>
          )}
          {onGift && (
            <CardAction label="Send this photo as a gift" word="gift" bg="#F0B429" onClick={onGift}>
              <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="11" width="16" height="10" rx="1.5" />
                <rect x="2.5" y="7" width="19" height="4" rx="1" />
                <path d="M12 7v14" />
                <path d="M12 7c-4-6-8-2-5 0zm0 0c4-6 8-2 5 0z" />
              </svg>
            </CardAction>
          )}
          <CardAction label="Send this photo to someone" word="send" bg="#C8432B" color="#FFF6DA" onClick={onSend}>
            <SendIcon size={s(20)} />
          </CardAction>
        </span>
      </div>
    </article>
  );
}
