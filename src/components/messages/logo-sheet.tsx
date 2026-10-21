import { useState } from "react";
import type { Party } from "../home/types";
import { s } from "../home/units";
import { PhotoCropper, type CropArea } from "../shared/photo-cropper";
import { ChangedLine, PhotoPicker, Sheet, SheetActions } from "../shared/sheet";
import { PartyAvatar } from "./avatar";

type LogoSheetProps = {
  group: Extract<Party, { kind: "group" }>;
  /** "Leo changed the logo · Oct 21"; absent for a logo nobody changed (LOGO-5). */
  line?: string;
  canUndo: boolean;
  /** The picked photo, before saving. */
  preview?: string;
  onPickFile: (file: File) => void;
  /** `area`: the part of the picked photo the cropper kept, once it has measured it. */
  onSave: (area?: CropArea) => void;
  onUndo: () => void;
  onCancel: () => void;
};

/** Change a group's logo: a photo from the camera roll, cropped to a circle (docs/specs/group-logo.md, LOGO-4/5/7). */
export function LogoSheet({ group, line, canUndo, preview, onPickFile, onSave, onUndo, onCancel }: LogoSheetProps) {
  const [area, setArea] = useState<CropArea>();
  return (
    <Sheet title={`${group.name} logo`} onCancel={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (preview) onSave(area);
        }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: s(12) }}
      >
        {preview ? (
          <PhotoCropper key={preview} src={preview} alt="New photo" ring={group.palette.canopy} onAreaChange={setArea} />
        ) : (
          <div style={{ padding: s(8) }}>
            <PartyAvatar party={group} size={120} />
          </div>
        )}
        <ChangedLine line={line} canUndo={canUndo} onUndo={onUndo} />
        <PhotoPicker onPickFile={onPickFile} />
        <SheetActions canSave={!!preview} onCancel={onCancel} />
      </form>
    </Sheet>
  );
}
