import type { ChangeEvent, CSSProperties } from "react";
import { FRAUNCES, NAVY, PAPER, s } from "../home/units";
import type { FolderActions, PoolId, PoolView } from "./types";

// `webkitdirectory` (pick a whole folder) isn't in React's types, but every desktop browser supports it.
const FOLDER = { webkitdirectory: "" } as Record<string, string>;

const pickerLabel: CSSProperties = {
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  height: s(40),
  padding: `0 ${s(16)}`,
  borderRadius: s(20),
  border: `${s(2)} solid ${NAVY}`,
  background: "#FFFBF0",
  fontWeight: 800,
  fontSize: s(13.5),
  cursor: "pointer",
};
const hiddenInput: CSSProperties = { position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" };

const linkButton: CSSProperties = { padding: 0, border: 0, background: "none", color: "#3F4664", font: "inherit", fontSize: s(12), fontWeight: 700, textDecoration: "underline", cursor: "pointer", minHeight: s(32) };

/**
 * "My photos" and "Family folder": where Daily 5 draws from (D5-2). With `folders` (desktop Chrome and Edge), a chosen
 * folder is remembered and can be checked again for new photos (D5-14); without it, the plain folder picker.
 */
export function PhotoPools({ pools, onAddFiles, folders, loading = false }: { pools: readonly PoolView[]; onAddFiles: (pool: PoolId, files: File[]) => void; folders?: FolderActions; /** Nothing can be added until the photos have loaded. */ loading?: boolean }) {
  const add = (pool: PoolId) => (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onAddFiles(pool, files);
    e.target.value = "";
  };
  return (
    <div data-tour="d5-pools" style={{ display: "flex", flexDirection: "column", gap: s(12) }}>
      {pools.map((p) => (
        <section
          key={p.id}
          role="group"
          aria-label={p.label}
          style={{ padding: `${s(14)} ${s(16)}`, borderRadius: s(16), border: `${s(2)} solid ${NAVY}`, background: PAPER }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(17) }}>{p.label}</span>
            <span style={{ fontSize: s(13.5), fontWeight: 700, color: "#3F4664" }}>
              {p.count === 1 ? "1 photo" : `${p.count} photos`}
            </span>
          </div>
          {p.hint && <div style={{ marginTop: s(2), fontSize: s(12), fontWeight: 500, color: "#3F4664" }}>{p.hint}</div>}
          {p.folder && <div style={{ marginTop: s(6), fontSize: s(12), fontWeight: 800 }}>From {p.folder}</div>}
          {p.folderError && (
            <div role="alert" style={{ marginTop: s(4), fontSize: s(12), fontWeight: 700, color: "#B43A2A" }}>
              {p.folderError}
            </div>
          )}
          {(p.progress || p.skipped > 0) && (
            <div aria-live="polite" style={{ marginTop: s(4), fontSize: s(12), fontWeight: 700, color: "#B43A2A" }}>
              {p.progress && `Importing ${p.progress.done} of ${p.progress.total}`}
              {p.progress && p.skipped > 0 && " · "}
              {p.skipped > 0 && `${p.skipped} skipped`}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: s(8), marginTop: s(10) }}>
            {folders && p.folder ? (
              <button type="button" disabled={loading} aria-label={`Check ${p.folder} for new photos`} onClick={() => folders.onCheck(p.id)} style={{ ...pickerLabel, fontFamily: "inherit", color: NAVY }}>
                Check for new photos
              </button>
            ) : folders ? (
              <button type="button" disabled={loading} onClick={() => folders.onChoose(p.id)} style={{ ...pickerLabel, fontFamily: "inherit", color: NAVY }}>
                Choose folder
              </button>
            ) : (
              <label style={pickerLabel}>
                Choose folder
                <input type="file" {...FOLDER} disabled={loading} onChange={add(p.id)} style={hiddenInput} />
              </label>
            )}
            <label style={pickerLabel}>
              Choose photos
              <input type="file" multiple accept="image/*" disabled={loading} onChange={add(p.id)} style={hiddenInput} />
            </label>
            {folders && p.folder && (
              <button type="button" aria-label={`Forget ${p.folder}`} onClick={() => folders.onForget(p.id)} style={linkButton}>
                Forget folder
              </button>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
