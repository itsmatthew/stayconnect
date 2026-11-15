import { useId, useState } from "react";
import { PhotoCropper, type CropArea } from "../shared/photo-cropper";
import { ChangedLine, PhotoPicker, Sheet, SheetActions } from "../shared/sheet";
import { MemoryPicture } from "./memory-art";
import type { Memory } from "./types";
import { CREAM, FRAUNCES, NAVY, s } from "./units";

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
  /** `area`: the part of the picked photo the cropper kept, once it has measured it. */
  onSave: (caption: string, area?: CropArea) => void;
  onUndo: () => void;
  onCancel: () => void;
};

const oneLine = (caption: string) => caption.replace(/\s+/g, " ").trim();

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

/** Change one of a group's ornaments, its defining memories: a photo from the camera roll and an optional caption (docs/specs/home.md, HOME-14–17). */
export function OrnamentSheet({ groupName, rim, ornaments, selected, preview, captionMax, onSelect, onPickFile, onSave, onUndo, onCancel }: OrnamentSheetProps) {
  const current = ornaments[selected];
  return (
    <Sheet title={`${groupName}’s defining memories`} onCancel={onCancel}>
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
        captionMax={captionMax}
        onPickFile={onPickFile}
        onSave={onSave}
        onUndo={onUndo}
        onCancel={onCancel}
      />
    </Sheet>
  );
}

type OrnamentEditProps = Pick<OrnamentSheetProps, "rim" | "preview" | "captionMax" | "onPickFile" | "onSave" | "onUndo" | "onCancel"> & {
  current: OrnamentChoice;
};

function OrnamentEdit({ current, rim, preview, captionMax, onPickFile, onSave, onUndo, onCancel }: OrnamentEditProps) {
  const initial = oneLine(current.memory.caption);
  const [caption, setCaption] = useState(initial);
  const [area, setArea] = useState<CropArea>();
  const changed = !!preview || oneLine(caption) !== initial;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (changed) onSave(caption, area);
      }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: s(12) }}
    >
      {preview ? (
        <PhotoCropper src={preview} alt="New photo" ring={rim} onAreaChange={setArea} />
      ) : (
        <div style={{ width: s(150), height: s(150), borderRadius: "50%", overflow: "hidden", border: `${s(3)} solid ${rim}`, boxSizing: "border-box", background: CREAM }}>
          <svg viewBox="0 0 40 40" role="img" aria-label="Current photo" style={{ display: "block", width: "100%", height: "100%" }}>
            <MemoryPicture memory={current.memory} cx={20} cy={20} R={20} />
          </svg>
        </div>
      )}

      <ChangedLine line={current.line} canUndo={current.canUndo} onUndo={onUndo} />
      <PhotoPicker onPickFile={onPickFile} />
      <p style={{ margin: `${s(-4)} 0 0`, alignSelf: "stretch", textAlign: "center", fontSize: s(13), lineHeight: 1.35, color: "#3F4664" }}>
        Pick a photo that defines this group — the inside joke, the trip, the night everyone still talks about.
      </p>

      <input
        type="text"
        aria-label="Caption"
        placeholder="what makes this one ours"
        maxLength={captionMax}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={{ alignSelf: "stretch", height: s(44), boxSizing: "border-box", padding: `0 ${s(16)}`, borderRadius: s(22), border: `${s(2)} solid ${NAVY}`, background: CREAM, font: "inherit", fontFamily: FRAUNCES, fontStyle: "italic", fontSize: s(15), color: NAVY, outline: 0 }}
      />

      <SheetActions canSave={changed} onCancel={onCancel} />
    </form>
  );
}
