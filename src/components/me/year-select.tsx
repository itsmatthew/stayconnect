import { useState } from "react";
import { NAVY, s } from "../home/units";

/** The reference's amber "2026 ▾" pill, opening a list of years (ME-1). */
export function YearSelect({ year, years, onChange }: { year: number; years: readonly number[]; onChange: (y: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", flex: 1 }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Year, ${year}`}
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", cursor: "pointer" }}
      >
        <span style={{ width: "100%", height: s(32), boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", gap: s(5), borderRadius: s(16), border: `${s(2)} solid ${NAVY}`, background: "#E9A233", color: NAVY, opacity: 0.96, fontWeight: 800, fontSize: s(13) }}>
        {year}
        <svg width={s(11)} height={s(11)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Year"
          style={{ position: "absolute", zIndex: 5, left: 0, right: 0, top: `max(${s(36)}, 40px)`, margin: 0, padding: s(4), listStyle: "none", borderRadius: s(14), border: `${s(2)} solid ${NAVY}`, background: "#FFF8EC", boxShadow: `0 ${s(4)} ${s(10)} rgba(74,44,20,.25)` }}
        >
          {years.map((y) => (
            <li
              key={y}
              role="option"
              aria-selected={y === year}
              tabIndex={0}
              onClick={() => {
                onChange(y);
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange(y);
                  setOpen(false);
                }
              }}
              style={{ padding: `${s(6)} ${s(10)}`, borderRadius: s(10), textAlign: "center", fontWeight: y === year ? 800 : 700, fontSize: s(14), background: y === year ? "#FCE6B8" : "transparent", cursor: "pointer" }}
            >
              {y}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
