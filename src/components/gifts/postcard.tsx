import { KARLA, s } from "../home/units";
import { GiftStamp } from "./gift-stamp";
import { HAND_FONTS, HAND_SCALE } from "./gift-looks";

export type PostcardNote = { text: string; hand: string; /** The ink's color. */ ink: string; stamp: string; /** "NOV 6 2026" */ postmark: string };

/** The back of a gift: a note on the left, stamp and address on the right (docs/specs/gifts.md, GIFT-7). */
export function Postcard({ to, signature, note }: { to: string; signature: string; note: PostcardNote }) {
  const hand = HAND_FONTS[note.hand] ?? HAND_FONTS.caveat;
  const size = (n: number) => s(n * (HAND_SCALE[note.hand] ?? 1));
  const written = { fontFamily: hand, color: note.ink };
  return (
    <div data-testid="gift-postcard" style={{ position: "relative", width: s(300), height: s(200), boxSizing: "border-box", background: "#F6EDD6", borderRadius: s(3), boxShadow: `0 ${s(6)} ${s(14)} rgba(74,44,20,.32)`, fontFamily: KARLA, color: "#6B6A66" }}>
      <p style={{ position: "absolute", left: s(16), top: s(14), width: s(158), margin: 0, fontSize: size(18), lineHeight: 1.25, overflowWrap: "anywhere", ...written }}>{note.text}</p>
      {signature && <span style={{ position: "absolute", right: s(128), bottom: s(30), fontSize: size(18), ...written }}>– {signature}</span>}
      <span aria-hidden="true" style={{ position: "absolute", left: s(186), top: s(14), bottom: s(14), width: s(1), background: "#CDBF9C" }} />
      <div style={{ position: "absolute", right: s(13), top: s(13) }}>
        <GiftStamp id={note.stamp} width={s(38)} />
      </div>
      <svg viewBox="0 0 44 44" aria-hidden="true" style={{ position: "absolute", right: s(44), top: s(30), width: s(40), height: s(40) }}>
        <circle cx="22" cy="22" r="20" fill="none" stroke="#9A9486" strokeWidth="1.4" />
        <circle cx="22" cy="22" r="15" fill="none" stroke="#9A9486" strokeWidth=".8" />
        <text x="22" y="20" textAnchor="middle" fontSize="7" fontWeight="800" fill="#7E796C">
          {note.postmark.split(" ").slice(0, 2).join(" ")}
        </text>
        <text x="22" y="29" textAnchor="middle" fontSize="7" fontWeight="800" fill="#7E796C">
          {note.postmark.split(" ")[2]}
        </text>
      </svg>
      <div style={{ position: "absolute", left: s(198), right: s(13), bottom: s(26) }}>
        <div style={{ minHeight: s(22), fontSize: size(18), borderBottom: `${s(1)} solid #CDBF9C`, ...written }}>{to}</div>
        <div style={{ paddingTop: s(4), fontSize: s(9), fontWeight: 700, borderBottom: `${s(1)} solid #CDBF9C`, paddingBottom: s(3) }}>under their tree</div>
      </div>
      <span style={{ position: "absolute", left: s(16), bottom: s(9), fontSize: s(8), fontWeight: 800, letterSpacing: s(1.1) }}>NOW &amp; THEN · POST CARD</span>
    </div>
  );
}
