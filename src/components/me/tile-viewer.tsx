import { useId } from "react";
import { ArchivePhoto } from "../archive/archive-photo";
import { FRAUNCES, NAVY, PAPER, s } from "../home/units";
import type { MeTile } from "./types";

/** One of your posts, opened from the grid (docs/specs/me.md, ME-4): the photo and its caption, read-only. */
export function TileViewer({ tile, onClose }: { tile: MeTile & { photo: NonNullable<MeTile["photo"]> }; onClose: () => void }) {
  const titleId = useId();
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 20, background: "rgba(43,51,80,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: s(16) }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: s(400), boxSizing: "border-box", padding: s(14), borderRadius: s(22), border: `${s(2)} solid ${NAVY}`, background: PAPER, color: NAVY, display: "flex", flexDirection: "column", gap: s(10) }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 id={titleId} style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(20) }}>
            {tile.title}
          </h2>
          <button type="button" onClick={onClose} style={{ border: 0, background: "none", padding: s(6), color: NAVY, fontWeight: 700, fontSize: s(14), cursor: "pointer" }}>
            Close
          </button>
        </div>
        <ArchivePhoto photo={tile.photo} style={{ height: s(420), borderRadius: s(12), border: `${s(2)} solid ${NAVY}`, boxSizing: "border-box" }} />
        {tile.caption && (
          <p data-caption="" style={{ margin: 0, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 600, fontSize: s(16), lineHeight: 1.3 }}>
            {tile.caption}
          </p>
        )}
      </div>
    </div>
  );
}
