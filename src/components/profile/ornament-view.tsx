import { useId } from "react";
import { MemoryPicture } from "../home/memory-art";
import type { Memory } from "../home/types";
import { FRAUNCES, NAVY, s } from "../home/units";
import { Sheet, pill } from "../shared/sheet";

type OrnamentViewProps = { groupName: string; index: number; memory: Memory; rim: string; onEdit: () => void; onClose: () => void };

/** One ornament full size with its caption; "Edit" opens the ornament sheet (docs/specs/group-profile.md, GP-4). */
export function OrnamentView({ groupName, index, memory, rim, onEdit, onClose }: OrnamentViewProps) {
  const clip = `view${useId().replace(/[^\w-]/g, "")}`;
  return (
    <Sheet title={`Ornament ${index + 1} of ${groupName}`} onCancel={onClose}>
      <svg viewBox="0 0 100 100" aria-hidden="true" style={{ alignSelf: "center", display: "block", width: s(280), height: s(280) }}>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="46" />
        </clipPath>
        <g clipPath={`url(#${clip})`}>
          <MemoryPicture memory={memory} cx={50} cy={50} R={46} />
        </g>
        <circle cx="50" cy="50" r="46" fill="none" stroke={rim} strokeWidth="3" />
        <circle cx="50" cy="50" r="48" fill="none" stroke={NAVY} strokeWidth="1.5" />
      </svg>
      {memory.caption && (
        <p style={{ margin: 0, textAlign: "center", whiteSpace: "pre-line", fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(18), lineHeight: 1.25 }}>{memory.caption}</p>
      )}
      <button type="button" onClick={onEdit} style={{ ...pill, alignSelf: "stretch", background: "#F0B429", color: NAVY }}>
        Edit
      </button>
    </Sheet>
  );
}
