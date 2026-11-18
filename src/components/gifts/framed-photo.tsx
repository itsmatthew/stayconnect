import type { CSSProperties, ReactNode } from "react";
import { FRAUNCES, KARLA, s } from "../home/units";
import { handLook, STAMP_FONT } from "./gift-looks";

export type DateStamp = { /** "11 05 '26" */ code: string; /** "Nov 5, 2026" */ written: string };

type FramedPhotoProps = {
  src?: string;
  alt: string;
  frame: string;
  /** The orange date stamp, when it's on. */
  stamp?: DateStamp;
  /** Instant's date, written in the note's hand and ink. */
  written?: { text: string; hand: string; ink: string };
  /** The month frame's caption: "November '26". */
  monthCaption?: string;
  /** Drawn in place of a photo file: the demo's art. TODO(server): received gifts will carry a stored photo. */
  picture?: ReactNode;
};

type Look = { bg: string; l: number; t: number; w: number; h: number; photo?: CSSProperties };

/** Each frame on the 296×226 card, from the design: background, and the photo's box. */
const LOOKS: Readonly<Record<string, Look>> = {
  classic: { bg: "#FFFFFF", l: 10, t: 10, w: 276, h: 206 },
  instant: { bg: "#FBFAF4", l: 12, t: 12, w: 272, h: 176, photo: { boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)" } },
  album: { bg: "#EFE0BC", l: 20, t: 20, w: 256, h: 186, photo: { boxShadow: "0 1px 3px rgba(74,44,20,.35)" } },
  film: { bg: "#16161A", l: 8, t: 24, w: 280, h: 178 },
  wood: { bg: "linear-gradient(135deg, #6B3A1E, #9A5A31 30%, #7A4424 55%, #A8693A 80%, #6B3A1E)", l: 18, t: 18, w: 260, h: 190 },
  month: { bg: "#F6E6C4", l: 22, t: 20, w: 252, h: 180, photo: { boxShadow: "0 1px 3px rgba(90,50,20,.3)" } },
};

export const frameLook = (frame: string) => LOOKS[frame] ?? LOOKS.classic;

const SPROCKETS = Array.from({ length: 13 }, (_, i) => i);

function Sprockets({ top }: { top: number }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: s(4), top: s(top), width: s(288), height: s(8) }}>
      {SPROCKETS.map((i) => (
        <span key={i} style={{ position: "absolute", left: s(7 + i * 22), top: 0, width: s(8), height: s(8), borderRadius: s(1), background: "#E9E2D0" }} />
      ))}
    </div>
  );
}

/** Photo corners, as SVG triangles. */
function Corners() {
  const at = [
    [12, 12, "M0 0H22L0 22Z"],
    [262, 12, "M0 0H22V22Z"],
    [12, 192, "M0 0V22H22Z"],
    [262, 192, "M22 0V22H0Z"],
  ] as const;
  return (
    <>
      {at.map(([x, y, d]) => (
        <svg key={`${x}-${y}`} aria-hidden="true" viewBox="0 0 22 22" style={{ position: "absolute", left: s(x), top: s(y), width: s(22), height: s(22), display: "block" }}>
          <path d={d} fill="#3A2A1E" />
        </svg>
      ))}
    </>
  );
}

/** Falling leaves at two corners: the November look. */
function Leaves() {
  return (
    <svg data-leaves="" viewBox="0 0 296 226" aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", display: "block" }}>
      <g transform="translate(6 30) rotate(-60)"><path d="M0 0C8-11 24-11 32 0 24 11 8 11 0 0z" fill="#C94A35" /><path d="M2 0h28" stroke="#8E2A1E" strokeWidth="1.2" /></g>
      <g transform="translate(14 8) rotate(-10)"><path d="M0 0C7-9 20-9 27 0 20 9 7 9 0 0z" fill="#E49B2E" /><path d="M2 0h23" stroke="#A86A12" strokeWidth="1.2" /></g>
      <g transform="translate(40 4) rotate(20)"><path d="M0 0C5-7 15-7 20 0 15 7 5 7 0 0z" fill="#B5650E" /></g>
      <g transform="translate(290 196) rotate(120)"><path d="M0 0C8-11 24-11 32 0 24 11 8 11 0 0z" fill="#B5650E" /><path d="M2 0h28" stroke="#7A420A" strokeWidth="1.2" /></g>
      <g transform="translate(282 218) rotate(170)"><path d="M0 0C7-9 20-9 27 0 20 9 7 9 0 0z" fill="#C94A35" /></g>
      <g transform="translate(256 222) rotate(200)"><path d="M0 0C5-7 15-7 20 0 15 7 5 7 0 0z" fill="#7FA25A" /></g>
    </svg>
  );
}

/** The front of a gift: the photo in one of the six frames, on the 296×226 card (docs/specs/gifts.md, GIFT-6). */
export function FramedPhoto({ src, alt, frame, stamp, written, monthCaption, picture }: FramedPhotoProps) {
  const look = frameLook(frame);
  const box: CSSProperties = { position: "absolute", left: s(look.l), top: s(look.t), width: s(look.w), height: s(look.h), borderRadius: s(2), overflow: "hidden", background: "#E7DBB9", ...look.photo };
  const hand = written && handLook(written.hand);
  return (
    <div data-frame={frame} style={{ position: "relative", width: s(296), height: s(226), borderRadius: s(4), background: look.bg, overflow: "hidden" }}>
      {frame === "wood" ? (
        // Two rings around the photo, dark then gold, as borders so they port.
        <div style={{ ...box, boxSizing: "border-box", border: `${s(2)} solid #4F2713`, boxShadow: `0 ${s(3)} ${s(6)} rgba(0,0,0,.35)` }}>
          <div style={{ width: "100%", height: "100%", boxSizing: "border-box", border: `${s(2)} solid #E2B954`, overflow: "hidden" }}>
            <Picture src={src} alt={alt} picture={picture} />
          </div>
        </div>
      ) : (
        <div style={box}>
          <Picture src={src} alt={alt} picture={picture} />
        </div>
      )}
      {frame === "film" && (
        <>
          <Sprockets top={8} />
          <Sprockets top={210} />
        </>
      )}
      {frame === "album" && <Corners />}
      {frame === "month" && (
        <>
          <Leaves />
          {monthCaption && <div style={{ position: "absolute", left: 0, top: s(204), width: "100%", textAlign: "center", fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(12), color: "#8E4A1A" }}>{monthCaption}</div>}
        </>
      )}
      {frame === "instant" && written && hand && (
        <div style={{ position: "absolute", left: s(16), top: s(190), width: s(264), height: s(32), display: "flex", alignItems: "center", fontFamily: hand.family, fontWeight: hand.weight, fontSize: s(hand.caption), color: written.ink, whiteSpace: "nowrap", overflow: "hidden" }}>{written.text}</div>
      )}
      {stamp && (
        <span style={{ position: "absolute", left: s(look.l + look.w - 82), top: s(look.t + look.h - 26), fontFamily: STAMP_FONT, fontSize: s(19), letterSpacing: s(1), color: "#FF9A3C", textShadow: "0 0 5px rgba(255,120,40,.85)", whiteSpace: "nowrap" }}>{stamp.code}</span>
      )}
    </div>
  );
}

function Picture({ src, alt, picture }: { src?: string; alt: string; picture?: ReactNode }) {
  if (!src && picture)
    return (
      <span role="img" aria-label={alt} style={{ position: "absolute", inset: 0, display: "block" }}>
        {picture}
      </span>
    );
  if (!src) return <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: KARLA, fontSize: s(13), fontWeight: 700, color: "#6B6A66" }}>Your photo goes here</span>;
  // eslint-disable-next-line @next/next/no-img-element -- a blob: URL from this browser
  return <img src={src} alt={alt} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />;
}

/** Padding around the photo in each frame's 58×44 choice tile. */
const MINI_PAD: Readonly<Record<string, string>> = { classic: "3px", instant: "3px 3px 10px", album: "5px", film: "7px 3px", wood: "5px", month: "5px 5px 8px" };

/** A frame's small picture in its choice tile. */
export function FrameMini({ frame, src, picture }: { frame: string; src?: string; picture?: ReactNode }) {
  const pad = (MINI_PAD[frame] ?? "3px").split(" ").map((v) => s(parseFloat(v))).join(" ");
  return (
    <span aria-hidden="true" style={{ display: "block", width: s(58), height: s(44), boxSizing: "border-box", padding: pad, borderRadius: s(3), background: frameLook(frame).bg, boxShadow: `0 ${s(2)} ${s(4)} rgba(74,44,20,.35)`, transform: "rotate(-2deg)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL from this browser */}
      {src ? <img src={src} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", borderRadius: s(1) }} /> : (picture ?? <span style={{ display: "block", width: "100%", height: "100%", background: "#D9CBA4" }} />)}
    </span>
  );
}
