import { s } from "../home/units";
import type { SealedSummary } from "./types";

/** Dev only (docs/specs/messages.md, MSG-6): sealed memories waiting on a reply, and a way to fake one. */
export function DevSealedPanel({ sealed, onSimulateReply }: { sealed: readonly SealedSummary[]; onSimulateReply: (conversationId: string) => void }) {
  return (
    <section
      aria-label="Sealed memories (dev)"
      style={{ margin: `${s(12)} ${s(14)} 0`, padding: `${s(8)} ${s(12)}`, borderRadius: s(10), border: `${s(1.5)} dashed #8A7A55`, background: "rgba(255,255,255,.45)", fontSize: s(12), fontFamily: "ui-monospace, monospace" }}
    >
      <div style={{ fontWeight: 700, marginBottom: s(4) }}>dev · sealed until reply</div>
      {sealed.map((x) => (
        <div key={x.conversationId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: s(8), padding: `${s(3)} 0` }}>
          <span>
            {x.name} · {x.count} sealed
          </span>
          <button type="button" aria-label={`Simulate reply in ${x.name}`} onClick={() => onSimulateReply(x.conversationId)} style={{ font: "inherit", padding: `${s(3)} ${s(10)}`, borderRadius: s(12), border: "1px solid #2B3350", background: "#FFF8EC", cursor: "pointer" }}>
            simulate reply
          </button>
        </div>
      ))}
    </section>
  );
}
