import type { CSSProperties, ReactNode } from "react";
import { MemoryArt } from "../home/memory-art";
import type { ArtKind } from "../home/types";
import { FRAUNCES, NAVY, s } from "../home/units";

/** One half of a header (docs/specs/group-profile.md, GP-12): a photo, else art. `dateLine`: "since Jun 2014" / "Aug 2026". */
export type HeaderPane = { label: string; src?: string; art?: ArtKind; dateLine?: string; /** The friend thread's faded "then" art. */ faded?: boolean };

/** A header half as a picture: the photo or art filling it, its date line in the top-right corner (the logo, band and buttons cover the bottom). */
export function HeaderPicture({ pane, style }: { pane: HeaderPane; style?: CSSProperties }) {
  return (
    <div role="img" aria-label={pane.label} style={{ position: "relative", flex: 1, minWidth: 0, height: "100%", overflow: "hidden", background: NAVY, ...style }}>
      {pane.src ? (
        // eslint-disable-next-line @next/next/no-img-element -- a blob: URL from this browser
        <img src={pane.src} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        pane.art && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", filter: pane.faded ? "sepia(.35) saturate(.9) contrast(1.03)" : undefined }}>
            <MemoryArt kind={pane.art} cx={50} cy={50} R={50} />
          </svg>
        )
      )}
      {pane.dateLine && (
        <span
          style={{
            position: "absolute",
            right: s(8),
            top: s(8),
            padding: `${s(3)} ${s(9)}`,
            borderRadius: s(12),
            background: "rgba(27,31,52,.72)",
            color: "#FFF6DA",
            fontFamily: FRAUNCES,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: s(12.5),
          }}
        >
          {pane.dateLine}
        </span>
      )}
    </div>
  );
}

/** A tap target that opens a plain photo picker (the camera roll on phones); the picked file goes straight to `onPick`. */
export function PickArea({ label, onPick, style, children }: { label: string; onPick: (file: File) => void; style?: CSSProperties; children: ReactNode }) {
  return (
    <label style={{ position: "relative", display: "flex", cursor: "pointer", ...style }}>
      {children}
      <input
        type="file"
        accept="image/*"
        aria-label={label}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onPick(f);
        }}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />
    </label>
  );
}
