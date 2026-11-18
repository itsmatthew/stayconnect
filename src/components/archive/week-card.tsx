import { FRAUNCES, NAVY, s } from "../home/units";
import { faceGradient } from "../messages/avatar";
import { ArchivePhoto } from "./archive-photo";
import type { SlotView, WeekCardView } from "./types";

const RED = "#B43A2A";
const RULE = "#C8BC9F";

/**
 * This week's card (docs/specs/archive.md, ARC-10), from the designer's Archive feed: "this week", the range, how long is
 * left, the faces of friends who've posted and how many, then a row per photo you can add now. A posted row shows your
 * photo instead, with no way to post again (ARC-3).
 */
export function WeekCard({ week, slots, onPost }: { week: WeekCardView; slots: readonly SlotView[]; onPost: (key: string) => void }) {
  return (
    <section aria-label="This week" style={{ margin: `${s(14)} ${s(14)} 0`, borderRadius: s(14), background: "#FFFBF0", border: `${s(1.5)} solid ${RULE}`, boxShadow: `0 ${s(3)} ${s(10)} rgba(74,44,20,.12)`, overflow: "hidden" }}>
      <div style={{ padding: `${s(12)} ${s(14)} ${s(10)}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: s(10) }}>
          <div style={{ display: "flex", flexDirection: "column", gap: s(1) }}>
            <span style={{ fontSize: s(9), fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: RED }}>this week</span>
            <span style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(22), letterSpacing: s(-0.3) }}>{week.range}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: s(4) }}>
            <span style={{ height: s(22), padding: `0 ${s(9)}`, borderRadius: s(11), background: NAVY, color: "#FFF6DA", fontSize: s(11), fontWeight: 800, lineHeight: s(22) }}>{week.daysLeft}</span>
            <span style={{ fontSize: s(9.5), fontWeight: 600, color: "#6A604C" }}>closes Sunday night</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: s(8), marginTop: s(8) }}>
          {week.posters.length > 0 && (
            <span aria-hidden="true" style={{ display: "flex" }}>
              {week.posters.slice(0, 6).map((p, i) => (
                <span key={`${p.name}-${i}`} data-poster="" style={{ width: s(22), height: s(22), boxSizing: "border-box", marginLeft: i ? s(-6) : 0, borderRadius: "50%", border: `${s(1.5)} solid #FFFBF0`, background: faceGradient(p.look) }} />
              ))}
            </span>
          )}
          <span style={{ fontSize: s(11), fontWeight: 700 }}>{week.line}</span>
        </div>
      </div>
      {slots.map((slot) => (
        <section key={slot.key} aria-label={slot.label} style={{ borderTop: `${s(1.5)} dashed ${RULE}` }}>
          {slot.posted ? (
            <div style={{ display: "flex", alignItems: "center", gap: s(10), padding: `${s(9)} ${s(14)}` }}>
              <span style={{ flex: "none", width: s(34), height: s(34), borderRadius: s(6), overflow: "hidden", border: `${s(1.5)} solid ${NAVY}` }}>
                <ArchivePhoto photo={slot.posted} />
              </span>
              <span style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(14.5) }}>{slot.postedLine}</span>
            </div>
          ) : (
            <button type="button" onClick={() => onPost(slot.key)} style={{ width: "100%", minHeight: 44, display: "flex", alignItems: "center", gap: s(10), padding: `${s(9)} ${s(12)} ${s(9)} ${s(14)}`, border: 0, background: "none", color: NAVY, textAlign: "left", cursor: "pointer" }}>
              <span aria-hidden="true" style={{ flex: "none", width: s(32), height: s(32), borderRadius: "50%", background: RED, color: "#FFF6DA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={s(14)} height={s(14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" style={{ display: "block" }}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: s(1) }}>
                <span style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(15) }}>{slot.title}</span>
                <span style={{ fontSize: s(10.5), fontWeight: 600, color: "#6A604C" }}>{slot.sub}</span>
              </span>
              <svg aria-hidden="true" width={s(14)} height={s(14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flex: "none", opacity: 0.6 }}>
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </section>
      ))}
    </section>
  );
}
