import { KARLA, s } from "../home/units";
import { PostageStamp } from "./gift-stamp";
import { handLook } from "./gift-looks";
import "./gifts.css";

export type PostcardNote = {
  text: string;
  /** Shown faintly while the note is empty: "Something only Maya would get…". */
  placeholder: string;
  hand: string;
  /** The ink's color. */
  ink: string;
  stamp: string;
  /** "NOV 6 2026" */
  postmark: string;
};

const PAPER = "#F7F0DF";
const LINE = "#C8BC9F";

/** The back of a gift, as in the design: the note on the left, stamp, postmark and address on the right (GIFT-7). */
export function Postcard({ to, signature, note }: { to: string; signature: string; note: PostcardNote }) {
  const hand = handLook(note.hand);
  const written = { fontFamily: hand.family, fontWeight: hand.weight, color: note.ink };
  const [mon, day, year] = note.postmark.split(" ");
  return (
    <div data-testid="gift-postcard" style={{ width: s(296), height: s(226), boxSizing: "border-box", padding: `${s(14)} ${s(12)} ${s(10)} ${s(14)}`, borderRadius: s(4), background: PAPER, display: "flex", gap: s(10), fontFamily: KARLA }}>
      <div style={{ width: s(166), display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflow: "hidden", ...written, fontSize: s(hand.size), lineHeight: hand.lh, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {note.text.trim() ? <span style={{ color: note.ink }}>{note.text}</span> : <span style={{ color: note.ink, opacity: 0.4 }}>{note.placeholder}</span>}
        </div>
        {signature && <div style={{ textAlign: "right", ...written, fontSize: s(hand.size), lineHeight: 1.2 }}>— {signature}</div>}
        <div style={{ marginTop: s(6), fontSize: s(8), fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6A604C" }}>Now &amp; Then · Post card</div>
      </div>
      <div style={{ width: s(1), background: "#D3C8AE" }} />
      <div style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ alignSelf: "flex-end" }}>
          <PostageStamp id={note.stamp} width={s(50)} paper={PAPER} />
        </div>
        <svg data-postmark="" viewBox="0 0 66 50" aria-hidden="true" style={{ position: "absolute", left: s(-6), top: s(26), width: s(66), height: s(50), display: "block", transform: "rotate(-12deg)" }}>
          <circle cx="24" cy="25" r="20" fill="none" stroke="rgba(43,51,80,.5)" strokeWidth="1.6" />
          <circle cx="24" cy="25" r="15" fill="none" stroke="rgba(43,51,80,.35)" strokeWidth="1" />
          <text x="24" y="23" textAnchor="middle" fontFamily="Karla, sans-serif" fontWeight="800" fontSize="7.5" fill="rgba(43,51,80,.6)">
            {mon} {day}
          </text>
          <text x="24" y="32" textAnchor="middle" fontFamily="Karla, sans-serif" fontWeight="800" fontSize="7.5" fill="rgba(43,51,80,.6)">
            {year}
          </text>
          <path data-cancel="" d="M44 18c4-3 8 3 12 0s8 3 10 0M44 25c4-3 8 3 12 0s8 3 10 0M44 32c4-3 8 3 12 0s8 3 10 0" fill="none" stroke="rgba(43,51,80,.4)" strokeWidth="1.3" />
        </svg>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: s(4) }}>
          <div data-address-line="" className="gf-two-lines" style={{ borderBottom: `${s(1)} solid ${LINE}`, paddingBottom: s(1), ...written, fontSize: s(to.length > 14 ? hand.caption * 0.72 : hand.caption), lineHeight: 1.2 }}>
            {to}
          </div>
          <div data-address-line="" style={{ borderBottom: `${s(1)} solid ${LINE}`, paddingBottom: s(2), fontSize: s(9), fontWeight: 700, color: "#6A604C" }}>
            under their tree
          </div>
          <div data-address-line="" style={{ borderBottom: `${s(1)} solid ${LINE}`, height: s(10) }} />
        </div>
      </div>
    </div>
  );
}
