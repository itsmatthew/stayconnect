import { useId } from "react";
import { CAVEAT, FRAUNCES, KARLA, NAVY, s } from "../home/units";
import { MailPicture } from "./mail-picture";
import { BirthdayTile } from "./birthday-card";
import type { BirthdayTileView, MailItemView } from "./mail-types";
import { Cross } from "./mail-viewer";
import "./mail.css";

/**
 * Nothing new: what you've kept (docs/specs/mailbox.md, MAILBOX-5), from MailOpen.dc.html. A sheet over your tree, kept
 * photos as small polaroids, two across, under "this week" and each month, with seen birthday reminders. Tap one to see it big.
 */
export function KeptSheet({ groups, onZoom, onReminder, onClose }: { groups: readonly { label: string; items: readonly MailItemView[]; reminders?: readonly BirthdayTileView[] }[]; onZoom: (item: MailItemView) => void; onReminder?: (key: string) => void; onClose: () => void }) {
  const titleId = useId();
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-50 overflow-hidden [--s:min(calc(100vw/390),calc(100dvh/844))]" style={{ fontFamily: KARLA, color: NAVY }}>
      <button type="button" aria-label="Close your mailbox" tabIndex={-1} onClick={onClose} className="mb-fade" style={{ position: "absolute", inset: 0, padding: 0, border: 0, background: "rgba(27,31,52,.5)" }} />
      <div
        className="mb-sheet"
        style={{ position: "absolute", left: "50%", bottom: 0, translate: "-50% 0", width: s(390), height: s(748), boxSizing: "border-box", borderRadius: `${s(26)} ${s(26)} 0 0`, background: "linear-gradient(#F7EFD6, #F1E2B8)", borderTop: `${s(2)} solid ${NAVY}`, display: "flex", flexDirection: "column" }}
      >
        <div aria-hidden="true" style={{ alignSelf: "center", width: s(44), height: s(5), marginTop: s(10), borderRadius: s(3), background: "#C9B98C" }} />
        <div style={{ display: "flex", alignItems: "center", gap: s(12), padding: `${s(10)} ${s(14)} ${s(8)} ${s(20)}` }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: s(2) }}>
            <h2 id={titleId} style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(26), letterSpacing: s(-0.4) }}>
              Your mailbox
            </h2>
            <span style={{ fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 500, fontSize: s(14.5), color: "#5C5442" }}>nothing new · here&apos;s what you&apos;ve kept</span>
          </div>
          <button type="button" aria-label="Close your mailbox" onClick={onClose} style={{ flex: "none", width: 44, height: 44, borderRadius: "50%", border: `2px solid ${NAVY}`, background: "#FFF8EC", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, cursor: "pointer" }}>
            <Cross size={16} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: `${s(6)} ${s(16)} ${s(24)}` }}>
          {!groups.length && (
            <p style={{ margin: `${s(24)} ${s(8)}`, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 500, fontSize: s(16), lineHeight: 1.4, color: "#5C5442", textAlign: "center" }}>
              Photos people drop for you will be kept here.
            </p>
          )}
          {groups.map((g, gi) => (
            <section key={g.label}>
              <h3 style={{ display: "block", margin: `${s(gi ? 22 : 6)} ${s(4)} ${s(10)}`, fontSize: s(11), fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#8E2A1E" }}>{g.label}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: s(14) }}>
                {g.items.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Photo from ${item.fromName}, ${item.sentDay}`}
                    onClick={() => onZoom(item)}
                    style={{ cursor: "zoom-in", padding: 0, border: 0, background: "none", textAlign: "left", color: NAVY, display: "flex", flexDirection: "column", gap: s(6) }}
                  >
                    <span style={{ display: "block", width: "100%", boxSizing: "border-box", padding: `${s(6)} ${s(6)} 0`, borderRadius: s(4), background: "#FDFBF5", border: `${s(3)} solid #1B1B1F`, boxShadow: `0 ${s(6)} ${s(12)} rgba(74,44,20,.3)`, transform: `rotate(${[-1.5, 1, -1, 1.2][i % 4]}deg)` }}>
                      <MailPicture art={item.art} height={s(118)} />
                      <span style={{ display: "block", height: s(26), fontFamily: CAVEAT, fontWeight: 700, fontSize: s(16), lineHeight: s(26) }}>{item.photoDate}</span>
                    </span>
                    <span style={{ fontSize: s(13), fontWeight: 800, paddingLeft: s(2) }}>
                      from {item.fromName} <span style={{ fontWeight: 700, color: "#6A604C" }}>· Daily 5</span>
                    </span>
                  </button>
                ))}
                {/* Seen birthday reminders, after the photos (MAILBOX-13). */}
                {g.reminders?.map((r) => <BirthdayTile key={r.key} tile={r} onOpen={() => onReminder?.(r.key)} />)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
