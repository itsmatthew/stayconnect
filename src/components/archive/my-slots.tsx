import type { CSSProperties } from "react";
import { FRAUNCES, NAVY, s } from "../home/units";
import { ArchivePhoto } from "./archive-photo";
import type { SlotView } from "./types";

// Weekly is the largest; the monthly slot is small until the month's last week, when it grows (ARC-10).
const HEIGHT: Record<SlotView["size"], number> = { large: 236, grown: 190, medium: 150, small: 104 };
const COLOR: Record<SlotView["kind"], string> = { week: "#3E8A88", month: "#E3A22F", year: "#B43A2A", bonus: "#2B3350" };

/** Your own slots for the periods open now: tap to post, or your photo with "unlocked ✓" once posted. */
export function MySlots({ slots, onPost }: { slots: readonly SlotView[]; onPost: (key: string) => void }) {
  // A small monthly slot shares its row with the yearly one in December; everything else is full width.
  const half = (x: SlotView) => x.size === "small" || (x.kind === "year" && slots.some((o) => o.size === "small"));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: s(12), padding: `${s(14)} ${s(14)} 0` }}>
      {slots.map((slot) => (
        <Slot key={slot.key} slot={slot} half={half(slot)} onPost={() => onPost(slot.key)} />
      ))}
    </div>
  );
}

function Slot({ slot, half, onPost }: { slot: SlotView; half: boolean; onPost: () => void }) {
  const color = COLOR[slot.kind];
  const frame: CSSProperties = {
    position: "relative",
    flex: half ? `1 1 calc(50% - ${s(6)})` : "1 1 100%",
    height: s(HEIGHT[slot.size]),
    boxSizing: "border-box",
    borderRadius: s(18),
    border: `${s(2)} solid ${NAVY}`,
    overflow: "hidden",
    boxShadow: slot.kind === "month" && slot.size === "grown" ? undefined : `0 ${s(3)} 0 ${NAVY}`,
  };
  const words = (
    <span style={{ fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(slot.size === "small" ? 13.5 : 17), lineHeight: 1.25 }}>
      {slot.directions}
    </span>
  );

  return (
    <section
      aria-label={slot.label}
      data-size={slot.size}
      className={slot.kind === "month" && slot.size === "grown" ? "ar-anim" : undefined}
      style={{ ...frame, ...(slot.kind === "month" && slot.size === "grown" ? { animation: "ar-glow 3.2s ease-in-out infinite" } : {}) }}
    >
      {slot.posted ? (
        <>
          <ArchivePhoto photo={slot.posted} />
          <span
            style={{
              position: "absolute",
              left: s(10),
              bottom: s(10),
              padding: `${s(4)} ${s(10)}`,
              borderRadius: s(12),
              background: "#FFF8EC",
              border: `${s(2)} solid ${NAVY}`,
              color: "#2F7A3A",
              fontWeight: 800,
              fontSize: s(13),
            }}
          >
            unlocked ✓
          </span>
        </>
      ) : (
        <button
          type="button"
          onClick={onPost}
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            padding: `${s(12)} ${s(16)}`,
            background: `repeating-linear-gradient(135deg, ${color} 0 ${s(14)}, color-mix(in srgb, ${color} 88%, white) ${s(14)} ${s(28)})`,
            color: slot.kind === "month" ? NAVY : "#FFF6DA",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: s(8),
            textAlign: "center",
            cursor: "pointer",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: s(slot.size === "small" ? 30 : 46),
              height: s(slot.size === "small" ? 30 : 46),
              borderRadius: "50%",
              border: `${s(2.5)} dashed currentColor`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: s(slot.size === "small" ? 20 : 28),
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            +
          </span>
          {words}
        </button>
      )}
    </section>
  );
}
