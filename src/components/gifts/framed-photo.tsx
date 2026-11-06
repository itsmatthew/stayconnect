import type { CSSProperties } from "react";
import { CAVEAT, KARLA, s } from "../home/units";

export type DateStamp = { /** "’26" */ year: string; /** "Nov 5, 2026" */ written: string };

type FramedPhotoProps = {
  src?: string;
  alt: string;
  frame: string;
  stamp?: DateStamp;
  /** 1 is the live card; smaller for the frame choices. */
  scale?: number;
};

type FrameLook = { pad: readonly [number, number, number, number]; background: string; border?: string; tint?: string };

/** Padding is top, right, bottom, left. */
const LOOKS: Readonly<Record<string, FrameLook>> = {
  classic: { pad: [10, 10, 10, 10], background: "#FFFDF7" },
  instant: { pad: [12, 12, 40, 12], background: "#FFFDF7" },
  album: { pad: [16, 16, 16, 16], background: "#EFE3C4" },
  film: { pad: [22, 6, 22, 6], background: "#15130F" },
  wood: { pad: [15, 15, 15, 15], background: "#8A5A2B", border: "#5E3A19" },
  november: { pad: [13, 13, 13, 13], background: "#F4E3C1", border: "#B85A2E", tint: "rgba(200,110,40,.14)" },
};

const SPROCKETS = Array.from({ length: 13 }, (_, i) => i);

function Sprockets({ u, edge }: { u: (n: number) => string; edge: "top" | "bottom" }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: u(8), right: u(8), [edge]: u(6), display: "flex", justifyContent: "space-between" }}>
      {SPROCKETS.map((i) => (
        <span key={i} style={{ width: u(10), height: u(10), borderRadius: u(2), background: "#F6ECCD" }} />
      ))}
    </div>
  );
}

function Corner({ u, x, y }: { u: (n: number) => string; x: "left" | "right"; y: "top" | "bottom" }) {
  const rotate = { "left-top": 0, "right-top": 90, "right-bottom": 180, "left-bottom": 270 }[`${x}-${y}`];
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" style={{ position: "absolute", [x]: u(9), [y]: u(9), width: u(22), height: u(22), transform: `rotate(${rotate}deg)` }}>
      <path d="M0 0H20L0 20Z" fill="#2B3350" />
    </svg>
  );
}

/** A photo in one of the gift frames (docs/specs/gifts.md, GIFT-6). Solid colors and SVG, so it ports as it is. */
export function FramedPhoto({ src, alt, frame, stamp, scale = 1 }: FramedPhotoProps) {
  const look = LOOKS[frame] ?? LOOKS.classic;
  const u = (n: number) => s(n * scale);
  const [top, right, bottom, left] = look.pad;
  const box: CSSProperties = {
    position: "relative",
    width: u(286),
    height: u(196),
    boxSizing: "border-box",
    padding: `${u(top)} ${u(right)} ${u(bottom)} ${u(left)}`,
    background: look.background,
    borderRadius: frame === "instant" || frame === "classic" ? u(3) : u(5),
    boxShadow: `0 ${u(6)} ${u(14)} rgba(74,44,20,.32)`,
    ...(look.border ? { border: `${u(2)} solid ${look.border}` } : {}),
  };
  return (
    <div data-frame={frame} style={box}>
      {frame === "film" && <Sprockets u={u} edge="top" />}
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#E7DBB9" }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- a blob: URL from this browser
          <img src={src} alt={alt} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          scale === 1 && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: KARLA, fontSize: s(13), fontWeight: 700, color: "#6B6A66" }}>Your photo goes here</span>
        )}
        {look.tint && <span aria-hidden="true" style={{ position: "absolute", inset: 0, background: look.tint }} />}
        {stamp && scale === 1 && <span style={{ position: "absolute", right: u(9), bottom: u(6), fontFamily: KARLA, fontWeight: 800, fontSize: u(14), color: "#F28A2E" }}>{stamp.year}</span>}
      </div>
      {frame === "film" && <Sprockets u={u} edge="bottom" />}
      {frame === "album" && (
        <>
          <Corner u={u} x="left" y="top" />
          <Corner u={u} x="right" y="top" />
          <Corner u={u} x="right" y="bottom" />
          <Corner u={u} x="left" y="bottom" />
        </>
      )}
      {frame === "instant" && stamp && scale === 1 && <span style={{ position: "absolute", left: u(16), bottom: u(9), fontFamily: CAVEAT, fontWeight: 700, fontSize: u(18), color: "#2B3350" }}>{stamp.written}</span>}
    </div>
  );
}
