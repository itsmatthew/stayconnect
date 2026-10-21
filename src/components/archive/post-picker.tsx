import { useId, useState } from "react";
import { FRAUNCES, NAVY, PAPER, s } from "../home/units";
import type { PickerView } from "./types";

type PostPickerProps = {
  picker: PickerView;
  onPick: (file: File) => void;
  /** With the caption as typed; the app trims and checks it. */
  onPost: (caption: string) => void;
  onCancel: () => void;
};

/**
 * Posting one slot (ARC-3, ARC-4): the Archive's own file picker (the camera roll on phones), unrelated to Daily 5.
 * The allowed dates sit at the top; a photo from outside them is refused with the reason.
 */
export function PostPicker({ picker, onPick, onPost, onCancel }: PostPickerProps) {
  const titleId = useId();
  const inputId = useId();
  const [caption, setCaption] = useState("");
  const button = { height: s(44), padding: `0 ${s(20)}`, borderRadius: s(22), border: `${s(2)} solid ${NAVY}`, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(16), cursor: "pointer" } as const;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 20, background: "rgba(43,51,80,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ width: "100%", maxWidth: s(430), boxSizing: "border-box", padding: `${s(18)} ${s(18)} ${s(26)}`, borderRadius: `${s(24)} ${s(24)} 0 0`, background: PAPER, borderTop: `${s(2)} solid ${NAVY}`, color: NAVY, display: "flex", flexDirection: "column", gap: s(14) }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: s(10) }}>
          <div>
            <h2 id={titleId} style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(21), letterSpacing: s(-0.3) }}>
              {picker.title}
            </h2>
            <div style={{ marginTop: s(4), fontWeight: 800, fontSize: s(13), color: "#A8331F" }}>{picker.range}</div>
          </div>
          <button type="button" onClick={onCancel} style={{ border: 0, background: "none", padding: s(6), color: NAVY, fontWeight: 700, fontSize: s(14), cursor: "pointer" }}>
            Cancel
          </button>
        </div>

        {picker.preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local object URL
          <img src={picker.preview} alt="The photo you picked" style={{ display: "block", width: "100%", height: s(260), objectFit: "cover", borderRadius: s(12), border: `${s(2)} solid ${NAVY}` }} />
        ) : (
          <label
            htmlFor={inputId}
            style={{ ...button, height: s(120), borderRadius: s(16), borderStyle: "dashed", background: "#FFF8EC", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            Choose a photo
          </label>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          disabled={picker.busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onPick(f);
          }}
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />

        {picker.error && (
          <p role="alert" style={{ margin: 0, padding: `${s(10)} ${s(12)}`, borderRadius: s(12), background: "#FBE3D8", color: "#8E2A1A", fontWeight: 700, fontSize: s(14), lineHeight: 1.35 }}>
            {picker.error}
          </p>
        )}

        {picker.preview && (
          <>
            <input
              type="text"
              aria-label="Caption"
              placeholder={picker.captionPlaceholder}
              maxLength={picker.captionMax}
              value={caption}
              enterKeyHint="done"
              onChange={(e) => setCaption(e.target.value)}
              style={{ height: s(42), boxSizing: "border-box", padding: `0 ${s(14)}`, borderRadius: s(21), border: `${s(2)} solid ${NAVY}`, background: "#FFF8EC", font: "inherit", fontFamily: FRAUNCES, fontStyle: "italic", fontSize: s(15), color: NAVY, outline: 0 }}
            />
            <p style={{ margin: 0, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 600, fontSize: s(14) }}>Once it&apos;s posted, it can&apos;t be replaced or edited.</p>
            <div style={{ display: "flex", gap: s(10) }}>
              <label htmlFor={inputId} style={{ ...button, flex: 1, background: "#FFF8EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                Pick another
              </label>
              <button type="button" disabled={picker.busy} onClick={() => onPost(caption)} style={{ ...button, flex: 1, background: "#B43A2A", color: "#FFF6DA", boxShadow: `0 ${s(3)} 0 ${NAVY}` }}>
                Post
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
