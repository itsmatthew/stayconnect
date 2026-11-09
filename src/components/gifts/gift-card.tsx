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
  written?: { text: string; hand: string; ink: string };
  monthCaption?: string;
  note: PostcardNote;
  wrap: { pattern: string; /** The ribbon's color. */ ribbon: string; opens?: string };
};

type GiftCardProps = { look: GiftCardLook; side: "photo" | "postcard" | "wrapped"; onFlip: () => void };

const face: CSSProperties = { position: "absolute", inset: 0, borderRadius: s(4), boxShadow: `0 ${s(14)} ${s(28)} rgba(74,44,20,.35), 0 ${s(2)} ${s(4)} rgba(74,44,20,.25)`, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };

/**
 * The live gift above each step, on its stage (docs/specs/gifts.md, GIFT-3), as in the design: one 296×226 card that
 * bobs in a warm glow, with the photo on the front, the postcard on the back, and the wrapping laid over it on Wrap.
 */
export function GiftCard({ look, side, onFlip }: GiftCardProps) {
  const back = side === "postcard";
  return (
    <div style={{ position: "relative", width: s(390), height: s(320), flex: "none", alignSelf: "center" }}>
      <div aria-hidden="true" style={{ position: "absolute", left: s(35), top: 0, width: s(320), height: s(320), borderRadius: "50%", background: "radial-gradient(circle, rgba(255,232,150,.7), rgba(255,214,90,0) 68%)" }} />
      <div aria-hidden="true" style={{ position: "absolute", left: s(70), top: s(264), width: s(250), height: s(16), borderRadius: "50%", background: "radial-gradient(closest-side, rgba(74,44,20,.32), rgba(74,44,20,0))" }} />
      <div className="gf-float" style={{ position: "absolute", left: s(47), top: s(42), width: s(296), height: s(226), transformOrigin: "50% 100%" }}>
        <div style={{ position: "relative", width: "100%", height: "100%", perspective: 1200 }}>
          <div data-flip="" className="gf-flip" style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transform: `rotateY(${back ? 180 : 0}deg)` }}>
            <div data-side="photo" aria-hidden={back || undefined} style={face}>
              <FramedPhoto src={look.src} alt={look.alt} frame={look.frame} stamp={look.stamp} written={look.written} monthCaption={look.monthCaption} />
            </div>
            <div data-side="postcard" aria-hidden={!back || undefined} style={{ ...face, transform: "rotateY(180deg)" }}>
              <Postcard to={look.to} signature={look.signature} note={look.note} />
            </div>
          </div>
        </div>
        {side === "wrapped" && <WrappedGift to={look.to} {...look.wrap} />}
      </div>
      {side !== "wrapped" && (
        <button type="button" onClick={onFlip} style={{ position: "absolute", left: s(120), top: s(280), width: s(150), height: s(40), minHeight: 44, border: 0, background: "none", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: s(6), color: NAVY, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(14), cursor: "pointer" }}>
          <svg width={s(15)} height={s(15)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          {back ? "see the photo" : "turn it over"}
        </button>
      )}
    </div>
  );
}
