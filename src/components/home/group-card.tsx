import { useId } from "react";
import { MemoryArt } from "./memory-art";
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

function MemoryThumb({ memory }: { memory: Memory }) {
  const clip = `thumb${useId().replace(/[^\w-]/g, "")}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: s(6) }}>
      <svg viewBox="0 0 38 38" aria-hidden="true" style={{ flex: "none", display: "block", width: s(38), height: s(38) }}>
        <clipPath id={clip}>
          <circle cx="19" cy="19" r="17" />
        </clipPath>
        <g clipPath={`url(#${clip})`}>
          <MemoryArt kind={memory.art} cx={19} cy={19} R={17} />
        </g>
        <circle cx="19" cy="19" r="17" fill="none" stroke="#2A2030" strokeWidth="2" />
      </svg>
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

/** The selected circle's card (362 design px wide), with its garland. */
export function GroupCard({ group }: { group: CircleGroup }) {
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
        <div style={{ display: "flex", height: s(46) }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `0 ${s(12)} 0 ${s(14)}`,
              background: group.palette.canopy,
              color: CREAM,
            }}
          >
            <h2 style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(19) }}>{group.name}</h2>
            {/* TODO(re-evaluate when photo swapping is built): point this at the real flow. */}
            <a href="#" style={{ fontSize: s(12), fontWeight: 800, textDecoration: "underline", color: "#FFF6DA" }}>
              swap photos
            </a>
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
            {group.memories.map((m) => (
              <MemoryThumb key={m.id} memory={m} />
            ))}
          </div>
          <div style={{ fontSize: s(10.5), lineHeight: s(12), fontWeight: 700, color: "#3F4664" }}>{group.lastMemory}</div>
        </div>
      </div>
    </section>
  );
}
