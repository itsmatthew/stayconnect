import { useState } from "react";
import { PhotoCropper, type CropArea } from "../shared/photo-cropper";
import { PhotoPicker, Sheet, SheetActions, pill } from "../shared/sheet";
import { CREAM, FRAUNCES, NAVY, s } from "../home/units";

export type SelfMemory = { src?: string; caption: string; nest: boolean };

const CAP = "linear-gradient(#F7D46B, #C99628)";
const RINGS = ["#C8432B", "#E9A233", "#4F7A36"] as const;

const label = (m: SelfMemory, i: number) => (m.src ? `Memory ${i + 1}: ${m.caption || "no caption"}${m.nest ? ", only your nest sees it" : ""}` : "Add a memory that made you who you are");

/** Three memories that made you who you are, on a thread, each with its caption (docs/specs/me.md, ME-8). */
export function MemoriesRow({ memories, onOpen }: { memories: readonly [SelfMemory, SelfMemory, SelfMemory]; onOpen: (index: number) => void }) {
  return (
    <section aria-label="Memories that made me" data-tour="me-memories" style={{ position: "relative", margin: `${s(18)} ${s(14)} 0` }}>
      <div style={{ fontSize: s(10.5), fontWeight: 800, letterSpacing: "0.18em", color: "#C8432B", textAlign: "center" }}>MEMORIES THAT MADE ME</div>
      <svg viewBox="0 0 362 30" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", left: 0, top: s(16), width: "100%", height: s(30) }}>
        <path d="M60 6C110 24 150 24 181 6C212 24 252 24 302 6" fill="none" stroke="#B5650E" strokeWidth="1.4" strokeDasharray="2 4" />
      </svg>
      <div style={{ position: "relative", marginTop: s(10), display: "flex", justifyContent: "space-around" }}>
        {memories.map((m, i) => (
          <button key={i} type="button" aria-label={label(m, i)} onClick={() => onOpen(i)} style={{ width: s(100), padding: 0, border: 0, background: "none", color: NAVY, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
            <span aria-hidden="true" style={{ width: s(12), height: s(8), borderRadius: s(2), background: CAP }} />
            {m.src ? (
              // eslint-disable-next-line @next/next/no-img-element -- a local object URL
              <img src={m.src} alt="" style={{ display: "block", width: s(64), height: s(64), marginTop: s(-3), boxSizing: "border-box", borderRadius: "50%", border: `${s(3)} solid #F6ECCD`, boxShadow: `0 0 0 ${s(3)} ${RINGS[i]}, 0 ${s(5)} ${s(7)} rgba(74,44,20,.28)`, objectFit: "cover" }} />
            ) : (
              <span aria-hidden="true" style={{ width: s(64), height: s(64), marginTop: s(-3), boxSizing: "border-box", borderRadius: "50%", border: `${s(2.5)} dashed ${RINGS[i]}`, background: "#FBF2DC", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A6B48", fontSize: s(22), fontWeight: 800 }}>+</span>
            )}
            <span aria-hidden="true" style={{ marginTop: s(6), maxWidth: "100%", fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 600, fontSize: s(12), lineHeight: 1.2, overflowWrap: "anywhere" }}>{m.src ? m.caption : ""}</span>
            {m.src && m.nest && <span aria-hidden="true" style={{ marginTop: s(3), padding: `${s(1)} ${s(6)}`, borderRadius: s(6), background: "#27305A", color: "#F7CB4D", fontSize: s(10.5), fontWeight: 800 }}>nest</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

type MemorySheetProps = {
  memory: SelfMemory;
  /** The picked photo, before saving. */
  preview?: string;
  captionMax: number;
  onPickFile: (file: File) => void;
  onSave: (edit: { caption: string; nest: boolean; area?: CropArea }) => void;
  onCancel: () => void;
};

/** "A memory that made you who you are": its photo, a caption, and who sees it (ME-8). */
export function MemorySheet({ memory, preview, captionMax, onPickFile, onSave, onCancel }: MemorySheetProps) {
  const [caption, setCaption] = useState(memory.caption);
  const [nest, setNest] = useState(memory.nest);
  const [area, setArea] = useState<CropArea>();
  const tidy = (t: string) => t.replace(/\s+/g, " ").trim();
  // A memory needs its photo; once it has one, the caption or who sees it can change alone.
  const canSave = !!preview || (!!memory.src && (tidy(caption) !== tidy(memory.caption) || nest !== memory.nest));
  return (
    <Sheet title="A memory that made you who you are" onCancel={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) onSave({ caption: tidy(caption), nest, area });
        }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: s(12) }}
      >
        {preview ? (
          <PhotoCropper src={preview} alt="New photo" ring={NAVY} onAreaChange={setArea} />
        ) : memory.src ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local object URL
          <img src={memory.src} alt="Current photo" style={{ width: s(150), height: s(150), borderRadius: "50%", objectFit: "cover", border: `${s(3)} solid ${NAVY}`, boxSizing: "border-box" }} />
        ) : (
          <div role="img" aria-label="No photo yet" style={{ width: s(150), height: s(150), borderRadius: "50%", border: `${s(3)} dashed #B9A473`, background: "#FBF2DC", boxSizing: "border-box" }} />
        )}
        <PhotoPicker onPickFile={onPickFile} />
        <input
          type="text"
          aria-label="Caption"
          placeholder="what happened"
          maxLength={captionMax}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          style={{ alignSelf: "stretch", height: s(44), boxSizing: "border-box", padding: `0 ${s(16)}`, borderRadius: s(22), border: `${s(2)} solid ${NAVY}`, background: CREAM, font: "inherit", fontFamily: FRAUNCES, fontStyle: "italic", fontSize: s(15), color: NAVY, outline: 0 }}
        />
        <div role="radiogroup" aria-label="Who sees it" style={{ alignSelf: "stretch", display: "flex", gap: s(8) }}>
          {([
            [false, "Everyone in my circles"],
            [true, "Only my nest"],
          ] as const).map(([value, text]) => (
            <button key={text} type="button" role="radio" aria-checked={nest === value} onClick={() => setNest(value)} style={{ ...pill, flex: 1, fontSize: s(13.5), background: nest === value ? NAVY : CREAM, color: nest === value ? "#FFF6DA" : NAVY }}>
              {text}
            </button>
          ))}
        </div>
        <SheetActions canSave={canSave} onCancel={onCancel} />
      </form>
    </Sheet>
  );
}
