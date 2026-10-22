import { useId, useState } from "react";
import type { Party } from "../home/types";
import { FRAUNCES, NAVY, PAPER, s } from "../home/units";
import { PartyAvatar } from "../messages/avatar";
import { SendIcon } from "./send-icon";
import type { RecipientSections } from "./types";

type SendSheetProps = {
  photo: { src: string; alt: string };
  recipients: RecipientSections;
  onCancel: () => void;
  onSend: (recipientId: string, note: string) => void;
};

const SECTIONS = [
  ["closest circles", "closest"],
  ["other groups", "others"],
  ["people", "people"],
] as const;

/** Step 1–2 of the reference: choose who (one circle, group or person), say what you remember (D5-11), send. */
export function SendSheet({ photo, recipients, onCancel, onSend }: SendSheetProps) {
  const titleId = useId();
  const noteId = useId();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const q = query.trim().toLowerCase();
  const match = (p: Party) => p.name.toLowerCase().includes(q);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 20 }}>
      <div className="sd-anim" aria-hidden="true" onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(27,31,52,.55)", animation: "sd-fade .3s ease both" }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="sd-anim"
        style={{
          position: "absolute",
          left: "50%",
          bottom: 0,
          translate: "-50% 0",
          width: s(390),
          maxHeight: "88vh",
          overflowY: "auto",
          boxSizing: "border-box",
          padding: `${s(10)} ${s(18)} ${s(30)}`,
          borderRadius: `${s(24)} ${s(24)} 0 0`,
          background: PAPER,
          borderTop: `${s(2)} solid ${NAVY}`,
          display: "flex",
          flexDirection: "column",
          gap: s(12),
          color: NAVY,
          animation: "sd-up .4s cubic-bezier(.2,.9,.3,1) both",
        }}
      >
        <div aria-hidden="true" style={{ alignSelf: "center", width: s(44), height: s(5), borderRadius: s(3), background: "#C9B98C" }} />
        <div style={{ display: "flex", alignItems: "center", gap: s(12) }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob: URL */}
          <img
            src={photo.src}
            alt={photo.alt}
            style={{
              display: "block",
              width: s(52),
              height: s(62),
              boxSizing: "border-box",
              border: `${s(3)} solid #FFFFFF`,
              borderRadius: s(3),
              objectFit: "cover",
              transform: "rotate(-4deg)",
              boxShadow: `0 ${s(4)} ${s(6)} rgba(74,44,20,.35)`,
            }}
          />
          <h2 id={titleId} style={{ flex: 1, margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(20), letterSpacing: s(-0.3) }}>
            Send this to…
          </h2>
          <button
            type="button"
            aria-label="Cancel"
            onClick={onCancel}
            style={{ width: s(44), height: s(44), borderRadius: "50%", border: `${s(2)} solid ${NAVY}`, background: "#FFF8EC", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, cursor: "pointer" }}
          >
            <svg width={s(16)} height={s(16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <input
          type="search"
          aria-label="Search friends and circles"
          placeholder="search friends and circles"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ height: s(40), boxSizing: "border-box", padding: `0 ${s(14)}`, borderRadius: s(20), border: `${s(2)} solid ${NAVY}`, background: "#FFF8EC", font: "inherit", fontFamily: FRAUNCES, fontStyle: "italic", fontSize: s(14), color: NAVY, outline: 0 }}
        />

        {SECTIONS.every(([, key]) => !recipients[key].length) && (
          // docs/specs/demo.md, DEMO-2: nobody to send to yet.
          <p style={{ margin: `${s(8)} 0`, textAlign: "center", fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 600, fontSize: s(15) }}>No circles yet</p>
        )}

        {SECTIONS.map(([label, key]) => {
          const parties = recipients[key].filter(match);
          if (!parties.length) return null;
          return (
            <div key={key} role="group" aria-label={label} style={{ display: "flex", flexDirection: "column", gap: s(8) }}>
              <div aria-hidden="true" style={{ fontSize: s(10.5), fontWeight: 800, letterSpacing: s(1.3), textTransform: "uppercase", color: "#A8331F" }}>
                {label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", rowGap: s(6) }}>
                {parties.map((p) => {
                  const on = picked === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-label={`Send to ${p.name}`}
                      aria-pressed={on}
                      onClick={() => setPicked(p.id)}
                      style={{ padding: `${s(6)} 0 ${s(4)}`, border: 0, borderRadius: s(14), background: on ? "#FBE3D8" : "transparent", color: NAVY, display: "flex", flexDirection: "column", alignItems: "center", gap: s(9), cursor: "pointer" }}
                    >
                      <span style={{ position: "relative", display: "block", borderRadius: "50%", boxShadow: on ? `0 0 0 ${s(8)} #FF7A1A` : "none" }}>
                        <PartyAvatar party={p} size={54} />
                        {on && (
                          <span aria-hidden="true" style={{ position: "absolute", right: s(-6), bottom: s(-4), width: s(22), height: s(22), borderRadius: "50%", background: "#4F8A3C", border: `${s(2)} solid #FFF8EC`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width={s(11)} height={s(11)} viewBox="0 0 24 24" fill="none" stroke="#FFF6DA" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M5 12l5 5 9-10" />
                            </svg>
                          </span>
                        )}
                      </span>
                      <span style={{ fontFamily: FRAUNCES, fontWeight: 700, fontSize: s(12.5), textAlign: "center" }}>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (picked) onSend(picked, note.trim());
          }}
          style={{ display: "flex", flexDirection: "column", gap: s(8), marginTop: s(4) }}
        >
          <label htmlFor={noteId} style={{ padding: `0 ${s(4)}`, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(15), lineHeight: 1.3, color: NAVY }}>
            What’s something specific you remember from this moment or era?
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: s(8) }}>
            <input
              id={noteId}
              type="text"
              placeholder="the night we…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ flex: 1, minWidth: 0, height: s(46), boxSizing: "border-box", padding: `0 ${s(16)}`, borderRadius: s(23), border: `${s(2)} solid ${NAVY}`, background: "#FFF8EC", font: "inherit", fontSize: s(15.5), fontWeight: 700, color: NAVY, outline: 0 }}
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!picked}
              style={{ flex: "none", width: s(48), height: s(48), borderRadius: "50%", border: `${s(2)} solid ${NAVY}`, background: picked ? "#C8432B" : "#E2D3A8", color: picked ? "#FFF6DA" : "#6B6A66", padding: `0 ${s(2)} 0 0`, display: "flex", alignItems: "center", justifyContent: "center", cursor: picked ? "pointer" : "default" }}
            >
              <SendIcon size={s(20)} />
            </button>
          </div>
        </form>
        <div style={{ textAlign: "center", fontSize: s(12), fontWeight: 700, color: "#3F4664", minHeight: s(15) }}>
          {picked ? "tap the arrow to send" : "pick a circle or a person"}
        </div>
      </div>
    </div>
  );
}
