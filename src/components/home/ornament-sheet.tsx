import { useId, useState, type CSSProperties } from "react";
import { MemoryPicture } from "./memory-art";
import type { Memory } from "./types";
import { CREAM, FRAUNCES, NAVY, PAPER, s } from "./units";

export type OrnamentChoice = {
  memory: Memory;
  /** "Leo changed this · Oct 21"; absent for an ornament nobody changed (HOME-16). */
  line?: string;
  canUndo: boolean;
};

type OrnamentSheetProps = {
  groupName: string;
  rim: string;
  ornaments: readonly [OrnamentChoice, OrnamentChoice, OrnamentChoice];
  selected: number;
  /** The picked photo, before saving. */
  preview?: string;
  captionMax: number;
  onSelect: (index: number) => void;
  onPickFile: (file: File) => void;
  onSave: (caption: string) => void;
  onUndo: () => void;
  onCancel: () => void;
};

const oneLine = (caption: string) => caption.replace(/\s+/g, " ").trim();

const pill: CSSProperties = {
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

function Bauble({ memory, size, rim }: { memory: Memory; size: number; rim: string }) {
  const clip = `sheet${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" style={{ display: "block", width: s(size), height: s(size) }}>
      <clipPath id={clip}>
        <circle cx="20" cy="20" r="18" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <MemoryPicture memory={memory} cx={20} cy={20} R={18} />
      </g>
      <circle cx="20" cy="20" r="18" fill="none" stroke={rim} strokeWidth="2.4" />
    </svg>
  );
}

/** Change one of a group's ornaments: a photo from the camera roll and an optional caption (docs/specs/home.md, HOME-14–17). */
export function OrnamentSheet({ groupName, rim, ornaments, selected, preview, captionMax, onSelect, onPickFile, onSave, onUndo, onCancel }: OrnamentSheetProps) {
  const titleId = useId();
  const inputId = useId();
  const current = ornaments[selected];
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
            {groupName}
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

        <div role="group" aria-label="Ornaments" style={{ display: "flex", justifyContent: "center", gap: s(18) }}>
          {ornaments.map((o, i) => {
            const on = i === selected;
            return (
              <button
                key={o.memory.id}
                type="button"
                aria-label={`Ornament ${i + 1}`}
                aria-pressed={on}
                onClick={() => onSelect(i)}
                style={{ padding: s(4), border: 0, borderRadius: "50%", background: on ? "#FBE3D8" : "transparent", boxShadow: on ? `0 0 0 ${s(3)} #FF7A1A` : "none", cursor: "pointer" }}
              >
                <Bauble memory={o.memory} size={48} rim={rim} />
              </button>
            );
          })}
        </div>

        <OrnamentEdit
          // A new ornament, or a change from elsewhere (undo), starts a fresh edit.
          key={`${selected}|${current.memory.caption}|${current.memory.src ?? ""}`}
          current={current}
          rim={rim}
          preview={preview}
          inputId={inputId}
          captionMax={captionMax}
          onPickFile={onPickFile}
          onSave={onSave}
          onUndo={onUndo}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

type OrnamentEditProps = Pick<OrnamentSheetProps, "rim" | "preview" | "captionMax" | "onPickFile" | "onSave" | "onUndo" | "onCancel"> & {
  current: OrnamentChoice;
  inputId: string;
};

function OrnamentEdit({ current, rim, preview, inputId, captionMax, onPickFile, onSave, onUndo, onCancel }: OrnamentEditProps) {
  const initial = oneLine(current.memory.caption);
  const [caption, setCaption] = useState(initial);
  const changed = !!preview || oneLine(caption) !== initial;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (changed) onSave(caption);
      }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: s(12) }}
    >
      <div style={{ width: s(150), height: s(150), borderRadius: "50%", overflow: "hidden", border: `${s(3)} solid ${rim}`, boxSizing: "border-box", background: CREAM }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local object URL
          <img src={preview} alt="New photo" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <svg viewBox="0 0 40 40" role="img" aria-label="Current photo" style={{ display: "block", width: "100%", height: "100%" }}>
            <MemoryPicture memory={current.memory} cx={20} cy={20} R={20} />
          </svg>
        )}
      </div>

      {(current.line || current.canUndo) && (
        <div style={{ display: "flex", alignItems: "center", gap: s(10), fontSize: s(13), fontWeight: 700, color: "#3F4664" }}>
          {current.line && <span>{current.line}</span>}
          {current.canUndo && (
            <button type="button" onClick={onUndo} style={{ border: 0, padding: 0, background: "none", font: "inherit", fontWeight: 800, color: "#A8331F", textDecoration: "underline", cursor: "pointer" }}>
              undo
            </button>
          )}
        </div>
      )}

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

      <input
        type="text"
        aria-label="Caption"
        placeholder="add a caption (optional)"
        maxLength={captionMax}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={{ alignSelf: "stretch", height: s(44), boxSizing: "border-box", padding: `0 ${s(16)}`, borderRadius: s(22), border: `${s(2)} solid ${NAVY}`, background: CREAM, font: "inherit", fontFamily: FRAUNCES, fontStyle: "italic", fontSize: s(15), color: NAVY, outline: 0 }}
      />

      <div style={{ alignSelf: "stretch", display: "flex", gap: s(10) }}>
        <button type="button" onClick={onCancel} style={{ ...pill, flex: 1, background: CREAM, color: NAVY }}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={!changed}
          style={{ ...pill, flex: 1, background: changed ? "#C8432B" : "#E2D3A8", color: changed ? "#FFF6DA" : "#6B6A66", cursor: changed ? "pointer" : "default" }}
        >
          Save
        </button>
      </div>
    </form>
  );
}
