import type { ChangeEvent, CSSProperties } from "react";
import { FRAUNCES, NAVY, PAPER, s } from "../home/units";
import type { PoolId, PoolView } from "./types";

// `webkitdirectory` (pick a whole folder) isn't in React's types, but every desktop browser supports it.
const FOLDER = { webkitdirectory: "" } as Record<string, string>;

const pickerLabel: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: s(40),
  padding: `0 ${s(16)}`,
  borderRadius: s(20),
  border: `${s(2)} solid ${NAVY}`,
  background: "#FFF8EC",
  fontWeight: 800,
  fontSize: s(13),
  cursor: "pointer",
};
const hiddenInput: CSSProperties = { position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" };

/** "My photos" and "Family computer": where Daily 5 draws from. */
export function PhotoPools({ pools, onAddFiles }: { pools: readonly PoolView[]; onAddFiles: (pool: PoolId, files: File[]) => void }) {
  const add = (pool: PoolId) => (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onAddFiles(pool, files);
    e.target.value = "";
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: s(12) }}>
      {pools.map((p) => (
        <section
          key={p.id}
          role="group"
          aria-label={p.label}
          style={{ padding: `${s(14)} ${s(16)}`, borderRadius: s(16), border: `${s(2)} solid ${NAVY}`, background: PAPER }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(17) }}>{p.label}</span>
            <span style={{ fontSize: s(13), fontWeight: 700, color: "#3F4664" }}>
              {p.count === 1 ? "1 photo" : `${p.count} photos`}
            </span>
          </div>
          {(p.progress || p.skipped > 0) && (
            <div aria-live="polite" style={{ marginTop: s(4), fontSize: s(12), fontWeight: 700, color: "#A8331F" }}>
              {p.progress && `Importing ${p.progress.done} of ${p.progress.total}`}
              {p.progress && p.skipped > 0 && " · "}
              {p.skipped > 0 && `${p.skipped} skipped`}
            </div>
          )}
          <div style={{ display: "flex", gap: s(8), marginTop: s(10) }}>
            <label style={pickerLabel}>
              Choose folder
              <input type="file" {...FOLDER} onChange={add(p.id)} style={hiddenInput} />
            </label>
            <label style={pickerLabel}>
              Choose photos
              <input type="file" multiple accept="image/*" onChange={add(p.id)} style={hiddenInput} />
            </label>
          </div>
        </section>
      ))}
    </div>
  );
}
