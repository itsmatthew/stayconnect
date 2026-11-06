import type { CSSProperties } from "react";
import { FRAUNCES, NAVY, s } from "../home/units";
import { FramedPhoto, type DateStamp } from "./framed-photo";
import "./gifts.css";
import { Postcard, type PostcardNote } from "./postcard";
import { WrappedGift } from "./wrapped-gift";

export type GiftCardLook = {
  to: string;
  signature: string;
  src?: string;
  alt: string;
  frame: string;
  stamp?: DateStamp;
  note: PostcardNote;
  wrap: { pattern: string; /** The ribbon's color. */ ribbon: string; opens?: string };
};

type GiftCardProps = { look: GiftCardLook; side: "photo" | "postcard" | "wrapped"; onFlip: () => void };

const face: CSSProperties = { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backfaceVisibility: "hidden" };

/** The live gift above each step (docs/specs/gifts.md, GIFT-3). */
export function GiftCard({ look, side, onFlip }: GiftCardProps) {
  if (side === "wrapped") {
    return (
      <div style={{ height: s(226), display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-1deg)" }}>
        <WrappedGift to={look.to} {...look.wrap} />
      </div>
    );
  }
  const back = side === "postcard";
  return (
    <div>
      <div style={{ height: s(206), perspective: 1000 }}>
        <div data-flip="" className="gf-flip" style={{ position: "relative", height: "100%", transformStyle: "preserve-3d", transform: `rotateY(${back ? 180 : 0}deg)` }}>
          <div data-side="photo" aria-hidden={back || undefined} style={{ ...face, transform: "rotate(-1.2deg)" }}>
            <FramedPhoto src={look.src} alt={look.alt} frame={look.frame} stamp={look.stamp} />
          </div>
          <div data-side="postcard" aria-hidden={!back || undefined} style={{ ...face, transform: "rotateY(180deg) rotate(1deg)" }}>
            <Postcard to={look.to} signature={look.signature} note={look.note} />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button type="button" onClick={onFlip} style={{ minHeight: 44, padding: `0 ${s(14)}`, border: 0, background: "none", display: "flex", alignItems: "center", gap: s(6), color: NAVY, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(13), cursor: "pointer" }}>
          <svg width={s(13)} height={s(13)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5" />
          </svg>
          {back ? "see the photo" : "turn it over"}
        </button>
      </div>
    </div>
  );
}
