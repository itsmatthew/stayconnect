import { FRAUNCES, NAVY, s } from "../home/units";

/** The one-time explainer (docs/specs/archive.md, ARC-11). */
export function Explainer({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="note"
      aria-label="How the 65 Archive works"
      style={{
        margin: `${s(14)} ${s(14)} 0`,
        padding: `${s(14)} ${s(16)}`,
        borderRadius: s(18),
        border: `${s(2)} solid ${NAVY}`,
        background: "#FFF8EC",
        boxShadow: `0 ${s(3)} 0 ${NAVY}`,
        display: "flex",
        alignItems: "center",
        gap: s(12),
      }}
    >
      <span aria-hidden="true" style={{ flex: "none", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(30), color: "#B43A2A", letterSpacing: s(-1) }}>
        65
      </span>
      <p style={{ flex: 1, margin: 0, fontFamily: FRAUNCES, fontWeight: 600, fontSize: s(14.5), lineHeight: 1.35 }}>
        65 photos a year: 52 weeks, 12 months, 1 year. Post yours to see your friends&apos;.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        style={{ flex: "none", height: s(34), padding: `0 ${s(12)}`, borderRadius: s(17), border: `${s(2)} solid ${NAVY}`, background: "#3E8A88", color: "#FFF6DA", fontWeight: 800, fontSize: s(13), cursor: "pointer" }}
      >
        Got it
      </button>
    </div>
  );
}
