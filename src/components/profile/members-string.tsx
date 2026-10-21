import type { CSSProperties } from "react";
import { faceGradient } from "../messages/avatar";
import type { FriendLook } from "../home/types";
import { FRAUNCES, NAVY, s } from "../home/units";
import type { ProfileMember } from "./types";

/** The user's own face, the reference's "you" look. */
export const YOU: FriendLook = { skin: "#F1C7A0", hair: "#D9A441", shirt: "#2B3350", bg: "#CFE0F4", ring: "#C8432B" };

const WIDTH = 390;
/** The string sags in the middle, like the reference's polyline. */
const stringY = (x: number) => 34 + 10 * Math.sin((Math.PI * Math.min(Math.max(x, 0), WIDTH)) / WIDTH);

/**
 * Everyone hanging from one string (docs/specs/group-profile.md, GP-3): up to four close to it,
 * the rest on longer drops in the gaps, as in the reference. Names only: no ranking, aura or badges.
 */
export function MembersString({ members }: { members: readonly ProfileMember[] }) {
  const near = members.length <= 4 ? members.length : Math.ceil(members.length / 2);
  const size = members.length > 8 ? 48 : 62;
  const step = WIDTH / near;
  const spots = members.map((_, i) => {
    const low = i >= near;
    // Close ones are spread evenly; the low ones hang in the gaps between them.
    const x = low ? step * (i - near + 1) : step * (i + 0.5);
    return { x, drop: low ? 96 : 10 };
  });
  const points = Array.from({ length: 34 }, (_, k) => `${-6 + k * 12},${stringY(-6 + k * 12).toFixed(1)}`).join(" ");
  const height = Math.max(...spots.map((p) => p.drop)) + size + 64;

  return (
    <div style={{ position: "relative", width: s(WIDTH), height: s(height) }}>
      <svg viewBox={`0 0 ${WIDTH} 60`} aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, width: s(WIDTH), height: s(60), display: "block" }}>
        <polyline points={points} fill="none" stroke="#8C4A2B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <ul aria-label="Members" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {members.map((m, i) => {
          const { x, drop } = spots[i];
          const look = m.look ?? YOU;
          const box: CSSProperties = { position: "absolute", left: s(x - 45), top: s(stringY(x) - 1), width: s(90) };
          const body = (
            <>
              <span aria-hidden="true" style={{ width: s(1.5), height: s(drop), background: "#A8761A" }} />
              <Clip />
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  width: s(size),
                  height: s(size),
                  borderRadius: "50%",
                  background: faceGradient(look),
                  boxShadow: `0 0 0 ${s(2.5)} #F6ECCD, 0 0 0 ${s(5.5)} ${look.ring}, 0 ${s(6)} ${s(8)} rgba(74,44,20,.3)`,
                }}
              />
              <span style={{ marginTop: s(9), fontFamily: FRAUNCES, fontWeight: 700, fontSize: s(13), lineHeight: s(15) }}>{m.name}</span>
            </>
          );
          const column: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: 0, border: 0, background: "none", color: NAVY, font: "inherit" };
          return (
            <li key={m.id} style={box}>
              {m.onOpen ? (
                <button type="button" onClick={m.onOpen} style={{ ...column, cursor: "pointer" }}>
                  {body}
                </button>
              ) : (
                <div style={column}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The little gold clip each avatar hangs from. */
function Clip() {
  return (
    <svg viewBox="0 0 30 26" aria-hidden="true" style={{ display: "block", width: s(20), height: s(17), marginBottom: s(-4), position: "relative", zIndex: 1 }}>
      <circle cx="15" cy="7" r="5" fill="none" stroke="#A8761A" strokeWidth="2.4" />
      <rect x="6" y="11" width="18" height="12" rx="3" fill="#F7CB4D" stroke="#A8761A" strokeWidth="2" />
      <path d="M10 12.5v9M15 12.5v9M20 12.5v9" stroke="#C99520" strokeWidth="1.4" />
    </svg>
  );
}
