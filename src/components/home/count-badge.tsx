import { s } from "./units";

/** Friend count on a navy disc (24 design px, 30 for the selected tree). */
export function CountBadge({ count, size, fontSize }: { count: number; size: number; fontSize: number }) {
  return (
    <div
      data-badge=""
      aria-hidden="true"
      style={{
        width: s(size),
        height: s(size),
        boxSizing: "border-box",
        borderRadius: "50%",
        background: "#27305A",
        border: `${s(2)} solid #FFF6DA`,
        color: "#FFF6DA",
        fontWeight: 800,
        fontSize: s(fontSize),
        lineHeight: s(size - 4),
        textAlign: "center",
      }}
    >
      {count}
    </div>
  );
}
