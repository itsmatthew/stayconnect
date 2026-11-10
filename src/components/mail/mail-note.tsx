import { NAVY, s } from "../home/units";
import { Cross } from "./mail-viewer";
import "./mail.css";

/** A note after reading or after ⋯ (docs/specs/mailbox.md), from MailOpen.dc.html: "All caught up…", or what ⋯ did. Above the mailbox, so it shows while mail is still open. */
export function MailNote({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className="mb-down fixed left-1/2 z-[65] -translate-x-1/2 [--s:min(calc(100vw/390),calc(100dvh/844))]"
      style={{ bottom: s(130), width: s(362), boxSizing: "border-box", padding: `${s(8)} ${s(4)} ${s(8)} ${s(14)}`, borderRadius: s(16), background: NAVY, color: "#FFF6DA", display: "flex", alignItems: "center", gap: s(10), boxShadow: `0 ${s(8)} ${s(18)} rgba(20,22,40,.35)` }}
    >
      <svg width={s(18)} height={s(18)} viewBox="0 0 24 24" fill="none" stroke="#F7CB4D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 13.5V9a7 7 0 0 1 14 0v4.5z" />
        <path d="M3.5 13.5h17" />
        <path d="M12 13.5V21" />
      </svg>
      <span style={{ flex: 1, fontSize: s(14), fontWeight: 700, lineHeight: 1.3 }}>{text}</span>
      <button type="button" aria-label="Dismiss" onClick={onDismiss} style={{ flex: "none", width: 44, height: 44, border: 0, borderRadius: 22, background: "none", color: "#FFF6DA", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <Cross size={15} />
      </button>
    </div>
  );
}
