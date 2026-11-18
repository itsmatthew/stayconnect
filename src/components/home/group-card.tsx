import { useId } from "react";
import { EditableName } from "../shared/editable-name";
import { MemoryPicture } from "./memory-art";
import type { CircleGroup, Memory } from "./types";
import { CREAM, FRAUNCES, INK, s } from "./units";

const BULBS = ["#C8432B", "#F7CB4D", "#6F9B4E", "#5F9CC6", "#E8792E", "#9668A8"];

/** String of lights draped over the card's top edge (362×24 design px). */
function Garland() {
  return (
    <svg
      viewBox="0 0 362 24"
      aria-hidden="true"
      style={{ position: "absolute", left: 0, top: s(-6), width: s(362), height: s(24), display: "block", zIndex: 2 }}
    >
      <path d="M4 6Q20 14 51 9T88 8T125 10T162 7T199 10T236 7T273 10T310 7T358 6" fill="none" stroke={INK} strokeWidth="1.5" />
      {Array.from({ length: 10 }, (_, i) => {
        const x = 14 + i * 37;
        const y = i % 2 ? 19 : 14;
        return (
          <g key={i}>
            <rect x={x - 2} y={y - 8} width="4" height="4" fill={INK} />
            <ellipse cx={x} cy={y} rx="4" ry="5.5" fill={BULBS[i % BULBS.length]} />
          </g>
        );
      })}
    </svg>
  );
}

function MemoryThumb({ memory, color, addLabel, onAdd }: { memory: Memory; color: string; /** An empty slot's button (HOME-22). */ addLabel: string; onAdd?: () => void }) {
  const clip = `thumb${useId().replace(/[^\w-]/g, "")}`;
  const picture = (
    <svg viewBox="0 0 38 38" aria-hidden="true" style={{ flex: "none", display: "block", width: s(38), height: s(38) }}>
      <clipPath id={clip}>
        <circle cx="19" cy="19" r="17" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <MemoryPicture memory={memory} color={color} cx={19} cy={19} R={17} />
      </g>
      <circle cx="19" cy="19" r="17" fill="none" stroke="#2A2030" strokeWidth="2" />
    </svg>
  );
  if (!memory.src) {
    return (
      // 44px to tap, in the 38 design px the slot takes up, so the card keeps its height.
      <button
        type="button"
        aria-label={addLabel}
        onClick={onAdd}
        style={{ minWidth: 44, minHeight: 44, margin: `calc((${s(38)} - 44px) / 2)`, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        {picture}
      </button>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: s(6) }}>
      {picture}
      <span
        style={{
          fontFamily: FRAUNCES,
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: s(12),
          lineHeight: 1.15,
          whiteSpace: "pre-line",
        }}
      >
        {memory.caption}
      </span>
    </div>
  );
}

/** The selected circle's card (362 design px wide), with its garland. Its button opens the ornament sheet, on the first blank or the first ornament, and its name the rename sheet (HOME-4). */
export function GroupCard({ group, onSwapPhotos, onRename }: { group: CircleGroup; onSwapPhotos?: (index: number) => void; onRename?: () => void }) {
  const firstBlank = group.memories.findIndex((m) => !m.src);
  return (
    <section aria-label="Selected circle" aria-live="polite" style={{ position: "relative", width: s(362) }}>
      <Garland />
      <div
        style={{
          borderRadius: s(18),
          overflow: "hidden",
          border: `${s(2)} solid ${INK}`,
          background: CREAM,
          color: "#2B3350",
        }}
      >
        <div style={{ display: "flex", height: s(46), minHeight: 44 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: s(8),
              minWidth: 0,
              padding: `0 ${s(12)} 0 ${s(14)}`,
              background: group.palette.canopy,
              color: CREAM,
            }}
          >
            <h2 style={{ minWidth: 0, margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(19), lineHeight: 1.1 }}>
              <EditableName name={group.name} onEdit={onRename} clamp />
            </h2>
            <button
              type="button"
              onClick={() => onSwapPhotos?.(Math.max(firstBlank, 0))}
              style={{ flex: "none", minWidth: 44, minHeight: 44, border: 0, padding: 0, background: "none", font: "inherit", fontSize: s(12), fontWeight: 800, textDecoration: "underline", color: "#FFF6DA", cursor: "pointer" }}
            >
              {firstBlank === -1 ? "swap photos" : "add photos"}
            </button>
          </div>
          <div
            style={{
              width: s(78),
              background: INK,
              color: "#F7CB4D",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            <span style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(20) }}>{group.friendCount}</span>
            <span style={{ fontSize: s(9), fontWeight: 800, letterSpacing: s(1.2) }}>FRIENDS</span>
          </div>
        </div>
        <div style={{ padding: `${s(9)} ${s(12)} ${s(8)}`, display: "flex", flexDirection: "column", gap: s(5) }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {group.memories.map((m, i) => (
              <MemoryThumb key={m.id} memory={m} color={group.palette.canopy} addLabel={`Add photo ${i + 1} to ${group.name}`} onAdd={() => onSwapPhotos?.(i)} />
            ))}
          </div>
          <div style={{ fontSize: s(10.5), lineHeight: s(12), fontWeight: 700, color: "#3F4664" }}>{group.lastMemory}</div>
        </div>
      </div>
    </section>
  );
}
