// TODO(re-evaluate when Archive and Me exist): those two report taps but the app ignores them.
import type { ReactNode } from "react";
import { ArchiveIcon, CirclesIcon, DailyIcon, MeIcon, MessagesIcon } from "./icons";
import { CREAM, KARLA, s } from "./units";

export type NavLabel = "Circles" | "Daily 5" | "Archive" | "Messages" | "Me";
export type NavProps = { current: NavLabel; onNavigate?: (to: NavLabel) => void };

type Item = { label: NavLabel; icon: (size: string) => ReactNode; color: string };
const ITEMS: Item[] = [
  { label: "Circles", icon: (z) => <CirclesIcon size={z} />, color: "#C8432B" },
  { label: "Daily 5", icon: (z) => <DailyIcon size={z} />, color: "#4E7A5C" },
  { label: "Archive", icon: (z) => <ArchiveIcon size={z} />, color: "#3E8A88" },
  { label: "Messages", icon: (z) => <MessagesIcon size={z} />, color: "#5467C4" },
  { label: "Me", icon: (z) => <MeIcon size={z} />, color: "#9668A8" },
];

/** Phone: the reference's bottom tab bar (390×78 design px). */
export function BottomNav({ current: currentTab, onNavigate }: NavProps) {
  return (
    <nav
      aria-label="Main"
      style={{
        height: "100%",
        boxSizing: "border-box",
        padding: `${s(8)} ${s(10)} 0`,
        background: CREAM,
        borderTop: `${s(2)} solid #E8D9B4`,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "flex-start",
        fontFamily: KARLA,
      }}
    >
      {ITEMS.map((it) => {
        const current = it.label === currentTab;
        return (
          <button
            key={it.label}
            type="button"
            aria-current={current ? "page" : undefined}
            onClick={() => onNavigate?.(it.label)}
            style={{
              width: s(66),
              height: s(52),
              border: 0,
              background: "none",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: s(3),
              color: current ? "#A8331F" : "#2B3350",
              fontWeight: current ? 800 : 700,
              fontSize: s(11),
              cursor: "pointer",
            }}
          >
            {it.icon(s(24))}
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Wide: nav items as colored discs with labels, centered along the top, on the sky. */
export function TopNav({ current: currentTab, onNavigate }: NavProps) {
  return (
    <nav aria-label="Main" style={{ display: "flex", gap: s(30), fontFamily: KARLA }}>
      {ITEMS.map((it) => {
        const current = it.label === currentTab;
        return (
          <button
            key={it.label}
            type="button"
            aria-current={current ? "page" : undefined}
            onClick={() => onNavigate?.(it.label)}
            style={{
              border: 0,
              background: "none",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: s(4),
              color: current ? "#A8331F" : "#2B3350",
              fontWeight: 700,
              fontSize: s(16),
              // No header bar behind the labels, only sky: a cream glow keeps them readable.
              textShadow: "0 0 8px rgba(255,248,236,.9), 0 0 3px rgba(255,248,236,.9)",
              cursor: "pointer",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: s(44),
                height: s(44),
                borderRadius: "50%",
                background: it.color,
                color: CREAM,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {it.icon(s(24))}
            </span>
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
