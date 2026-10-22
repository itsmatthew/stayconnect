import { CAVEAT, NAVY, s } from "../home/units";
import { SendIcon } from "./send-icon";
import type { Daily5Card } from "./types";

/** Tilts cycle as in the reference. The frame is always neutral: colour means a group everywhere else in the app (D5-9). */
const TILTS = [-1.2, 1, -0.8, 1.3, -1] as const;

/** The polaroid's cream paper, shared with the send flight. */
export const POLAROID_PAPER = "#FDFBF5";

/** The warm, slightly faded film look the reference gives every photo. */
export const FILM = "sepia(.22) saturate(.82) contrast(.92) brightness(1.06)";

export function Polaroid({ card, index, onSend }: { card: Daily5Card; index: number; onSend: () => void }) {
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
        <button
          type="button"
          aria-label="Send this photo to someone"
          onClick={onSend}
          style={{
            width: s(46),
            height: s(46),
            borderRadius: "50%",
            border: `${s(2)} solid ${NAVY}`,
            background: "#FFF8EC",
            color: NAVY,
            padding: `0 ${s(2)} 0 0`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 ${s(3)} 0 ${NAVY}`,
            cursor: "pointer",
          }}
        >
          <SendIcon size={s(20)} />
        </button>
      </div>
    </article>
  );
}
