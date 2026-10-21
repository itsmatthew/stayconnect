import { useId, type CSSProperties, type ReactNode } from "react";
import "../home/home.css";
import { CREAM, FRAUNCES, NAVY, PAPER, s } from "../home/units";

/** A bottom sheet over a dimmed backdrop: a handle, a title and a close button above `children`. Backdrop and close cancel. */
export function Sheet({ title, onCancel, children }: { title: string; onCancel: () => void; children: ReactNode }) {
  const titleId = useId();
  return (
    // 390 design px wide, scaled to the phone's width but never larger than on a big phone.
    <div style={{ position: "fixed", inset: 0, zIndex: 20, "--s": "min(100vw / 390, 1.1px)" } as CSSProperties}>
      <div className="hm-anim" aria-hidden="true" onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(27,31,52,.55)", animation: "hm-fade .3s ease both" }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="hm-anim"
        style={{
          position: "absolute",
          left: "50%",
          bottom: 0,
          translate: "-50% 0",
          width: s(390),
          maxHeight: "88vh",
          overflowY: "auto",
          boxSizing: "border-box",
          padding: `${s(10)} ${s(18)} ${s(26)}`,
          borderRadius: `${s(24)} ${s(24)} 0 0`,
          background: PAPER,
          borderTop: `${s(2)} solid ${NAVY}`,
          display: "flex",
          flexDirection: "column",
          gap: s(14),
          color: NAVY,
          animation: "hm-up .4s cubic-bezier(.2,.9,.3,1) both",
        }}
      >
        <div aria-hidden="true" style={{ alignSelf: "center", width: s(44), height: s(5), borderRadius: s(3), background: "#C9B98C" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: s(12) }}>
          <h2 id={titleId} style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(21), letterSpacing: s(-0.3) }}>
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            style={{ width: s(40), height: s(40), borderRadius: "50%", border: `${s(2)} solid ${NAVY}`, background: CREAM, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, cursor: "pointer" }}
          >
            <svg width={s(14)} height={s(14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** The sheets' rounded buttons and the photo picker label. */
export const pill: CSSProperties = {
  height: s(44),
  boxSizing: "border-box",
  padding: `0 ${s(18)}`,
  borderRadius: s(22),
  border: `${s(2)} solid ${NAVY}`,
  font: "inherit",
  fontSize: s(15),
  fontWeight: 800,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/** "‹Name› changed this · Oct 21" with an "undo" link; nothing when there's neither. */
export function ChangedLine({ line, canUndo, onUndo }: { line?: string; canUndo: boolean; onUndo: () => void }) {
  if (!line && !canUndo) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: s(10), fontSize: s(13), fontWeight: 700, color: "#3F4664" }}>
      {line && <span>{line}</span>}
      {canUndo && (
        <button type="button" onClick={onUndo} style={{ border: 0, padding: 0, background: "none", font: "inherit", fontWeight: 800, color: "#A8331F", textDecoration: "underline", cursor: "pointer" }}>
          undo
        </button>
      )}
    </div>
  );
}

/** "Choose a photo": a plain file picker, so the camera roll on phones. */
export function PhotoPicker({ onPickFile }: { onPickFile: (file: File) => void }) {
  const inputId = useId();
  return (
    <>
      <label htmlFor={inputId} style={{ ...pill, alignSelf: "stretch", borderStyle: "dashed", background: CREAM }}>
        Choose a photo
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onPickFile(f);
        }}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />
    </>
  );
}

/** Cancel and Save, Save enabled only when there's something to save. */
export function SheetActions({ canSave, onCancel }: { canSave: boolean; onCancel: () => void }) {
  return (
    <div style={{ alignSelf: "stretch", display: "flex", gap: s(10) }}>
      <button type="button" onClick={onCancel} style={{ ...pill, flex: 1, background: CREAM, color: NAVY }}>
        Cancel
      </button>
      <button
        type="submit"
        disabled={!canSave}
        style={{ ...pill, flex: 1, background: canSave ? "#C8432B" : "#E2D3A8", color: canSave ? "#FFF6DA" : "#6B6A66", cursor: canSave ? "pointer" : "default" }}
      >
        Save
      </button>
    </div>
  );
}
