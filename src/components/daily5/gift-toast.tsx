import { s } from "../home/units";

/** After a gift sent from Daily 5: a navy note at the top, from Daily5Send.dc.html (docs/specs/gifts.md, GIFT-17). */
export function GiftToast({ text, onDismiss }: { text: string; onDismiss?: () => void }) {
  return (
    <div role="status" className="fixed z-30 [--s:calc(min(100vw,480px)/390)] md:[--s:1.1px]" style={{ left: "50%", top: s(100), translate: "-50% 0", width: s(362), boxSizing: "border-box", padding: `${s(8)} ${s(8)} ${s(8)} ${s(14)}`, borderRadius: s(16), background: "#2B3350", color: "#FFF6DA", display: "flex", alignItems: "center", gap: s(10), boxShadow: `0 ${s(8)} ${s(18)} rgba(20,22,40,.35)` }}>
      <svg width={s(18)} height={s(18)} viewBox="0 0 24 24" fill="none" stroke="#F7CB4D" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="11" width="16" height="10" rx="1.5" />
        <rect x="2.5" y="7" width="19" height="4" rx="1" />
        <path d="M12 7v14" />
        <path d="M12 7c-4-6-8-2-5 0zm0 0c4-6 8-2 5 0z" />
      </svg>
      <span style={{ flex: 1, fontSize: s(14), fontWeight: 700, lineHeight: 1.3 }}>{text}</span>
      {/* 36 to look at, as designed, in a 44 tap area. */}
      <button type="button" aria-label="Dismiss" onClick={onDismiss} style={{ flex: "none", width: 44, height: 44, border: 0, background: "none", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF6DA", cursor: "pointer" }}>
        <span style={{ width: s(36), height: s(36), borderRadius: s(18), background: "rgba(255,246,218,.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={s(14)} height={s(14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </span>
      </button>
    </div>
  );
}
