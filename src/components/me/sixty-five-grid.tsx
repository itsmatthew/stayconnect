import type { CSSProperties } from "react";
import { ArchivePhoto } from "../archive/archive-photo";
import { FRAUNCES, NAVY, s } from "../home/units";
import type { MeTile } from "./types";

// The reference's grid: three 130×173 columns, edge to edge, no gaps. Months are 2×2, the year 3×2.
const SPAN: Record<MeTile["size"], [cols: number, rows: number]> = { year: [3, 2], month: [2, 2], week: [1, 1], bonus: [1, 1] };
const GOLD = "#F7CB4D";

/** Your 65 for one year, filled or waiting to be filled (ME-2, ME-3). */
export function SixtyFiveGrid({ year, tiles, onOpen }: { year: number; tiles: readonly MeTile[]; onOpen: (key: string) => void }) {
  return (
    <ul
      role="list"
      aria-label={`Your 65 for ${year}`}
      style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gridAutoRows: s(173), gridAutoFlow: "row dense" }}
    >
      {tiles.map((t) => (
        <Tile key={t.key} tile={t} onOpen={() => onOpen(t.key)} />
      ))}
    </ul>
  );
}

function Tile({ tile, onOpen }: { tile: MeTile; onOpen: () => void }) {
  const [cols, rows] = SPAN[tile.size];
  const framed = tile.size === "month" || tile.size === "year";
  const base: CSSProperties = { position: "relative", gridColumn: `span ${cols}`, gridRow: `span ${rows}`, overflow: "hidden" };
  const frame: CSSProperties = framed
    ? { outline: `${s(tile.size === "year" ? 4 : 3)} solid ${GOLD}`, outlineOffset: s(tile.size === "year" ? -4 : -3), zIndex: 1 }
    : tile.size === "bonus"
      ? { outline: `${s(3)} solid #9FB6E8`, outlineOffset: s(-3) }
      : {};

  if (tile.photo) {
    return (
      <li aria-label={tile.title} data-size={tile.size} style={{ ...base, ...frame, background: NAVY }}>
        {/* ME-4: a filled tile opens your photo and its caption. */}
        <button type="button" aria-label={`Open ${tile.title}`} onClick={onOpen} style={{ display: "block", width: "100%", height: "100%", padding: 0, border: 0, background: "none", cursor: "pointer" }}>
          <ArchivePhoto photo={tile.photo} />
        </button>
      </li>
    );
  }
  return (
    <li
      aria-label={`${tile.title}, waiting to be filled`}
      data-size={tile.size}
      style={{
        ...base,
        background: tile.size === "bonus" ? "#2B3350" : framed ? "#FBEFC6" : "#F7EFD6",
        boxShadow: `inset 0 0 0 ${s(0.5)} #E2D3A8`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: s(framed ? 12 : 8),
          borderRadius: s(10),
          border: `${s(framed ? 2.5 : 1.5)} dashed ${tile.size === "bonus" ? "#9FB6E8" : framed ? "#C99520" : "#CDB98A"}`,
        }}
      />
      <span
        aria-hidden="true"
        style={{
          fontFamily: FRAUNCES,
          fontStyle: "italic",
          fontWeight: framed ? 800 : 600,
          fontSize: s(tile.size === "year" ? 30 : tile.size === "month" ? 22 : 13),
          color: tile.size === "bonus" ? "#DCE6FA" : framed ? "#A8761A" : "#A89470",
          textAlign: "center",
          padding: `0 ${s(10)}`,
        }}
      >
        {tile.title}
      </span>
    </li>
  );
}
