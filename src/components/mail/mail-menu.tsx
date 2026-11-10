import { FRAUNCES, KARLA, NAVY, s } from "../home/units";
import "./mail.css";

/**
 * "⋯" on a photo in your mailbox (docs/specs/mailbox.md, MAILBOX-7): remove it, block who sent it, or report it. A small
 * sheet; nobody is ever told. TODO(design): the reference has no menu, so this follows the app's other sheets.
 */
export function MailMenu({ fromName, onRemove, onBlock, onReport, onCancel }: { fromName: string; onRemove: () => void; onBlock: () => void; onReport: () => void; onCancel: () => void }) {
  const item = (label: string, onClick: () => void, danger = false) => (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{ width: "100%", minHeight: 44, padding: `${s(12)} ${s(16)}`, border: 0, borderRadius: s(14), background: "#FFF8EC", color: danger ? "#B43A2A" : NAVY, fontFamily: KARLA, fontWeight: 800, fontSize: s(15), textAlign: "left", cursor: "pointer" }}
    >
      {label}
    </button>
  );
  return (
    <div className="fixed inset-0 z-[70] [--s:min(calc(100vw/390),calc(100dvh/844))]" style={{ fontFamily: KARLA }}>
      <button type="button" aria-label="Cancel" tabIndex={-1} onClick={onCancel} className="mb-fade" style={{ position: "absolute", inset: 0, padding: 0, border: 0, background: "rgba(8,9,16,.55)" }} />
      <div className="mb-sheet" style={{ position: "absolute", left: "50%", bottom: 0, translate: "-50% 0", width: s(390), boxSizing: "border-box", padding: `${s(16)} ${s(14)} ${s(22)}`, borderRadius: `${s(22)} ${s(22)} 0 0`, background: "#F7EFD6", borderTop: `${s(2)} solid ${NAVY}`, display: "flex", flexDirection: "column", gap: s(8) }}>
        <div role="menu" aria-label="This photo" style={{ display: "flex", flexDirection: "column", gap: s(8) }}>
          {item("Remove from my mailbox", onRemove)}
          {item(`Block ${fromName}`, onBlock, true)}
          {item("Report", onReport, true)}
        </div>
        <p style={{ margin: `${s(2)} ${s(6)}`, fontSize: s(12), fontWeight: 500, color: "#5C5442" }}>{fromName} is never told.</p>
        <button type="button" onClick={onCancel} style={{ minHeight: 44, border: `${s(2)} solid ${NAVY}`, borderRadius: s(22), background: "none", color: NAVY, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(16), cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
