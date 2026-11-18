import { useId } from "react";
import { FRAUNCES, KARLA, NAVY, s } from "../home/units";
import { FramedPhoto } from "./framed-photo";
import type { GiftCardLook } from "./gift-card";
import "./gifts.css";
import { Postcard } from "./postcard";
import { WrappedGift } from "./wrapped-gift";

export type UnwrapPhase = "tied" | "open" | "kept";

type GiftUnwrapProps = {
  fromName: string;
  /** "wrapped Nov 5 · just for you". */
  line: string;
  /** The gift as its sender made it: their frame, photo, note and wrapping. */
  look: GiftCardLook;
  phase: UnwrapPhase;
  /** The card shows its postcard side. */
  flipped: boolean;
  onPull: () => void;
  onFlip: () => void;
  onKeep: () => void;
};

const CREAM = "#FFF6DA";
const CONFETTI = ["#F7CB4D", "#FFF6DA", "#C8402D", "#63A6A1", "#E49B2E", "#9668A8"];

/**
 * Receiving a gift (docs/specs/gifts.md, GIFT-20), from GiftReceive.dc.html: on a night sky, "‹name› sent you a gift",
 * and the gift drops in, wrapped in the paper and ribbon its sender chose. Pulling the ribbon slides it off and tears
 * the paper apart in a burst of confetti; the card lifts, turns over to the note, and "Put on my shelf" keeps it.
 * There is no way to close it unopened (GIFT-20).
 * Rays, glows and confetti are SVG and transforms, so it ports.
 */
export function GiftUnwrap({ fromName, line, look, phase, flipped, onPull, onFlip, onKeep }: GiftUnwrapProps) {
  const titleId = useId();
  const id = `gu${useId().replace(/[^\w-]/g, "")}`;
  const open = phase !== "tied";
  const action = !open ? `Pull the ribbon on ${fromName}’s gift` : flipped ? "Turn the card back to the photo" : `Turn the card over to read ${fromName}’s note`;
  const hint = !open ? "Pull the ribbon" : flipped ? "Tap to see the photo" : "Tap to turn it over";
  const face = { position: "absolute", inset: 0, borderRadius: s(4), overflow: "hidden", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", boxShadow: open ? `0 ${s(26)} ${s(60)} rgba(0,0,0,.6), 0 0 ${s(34)} ${s(8)} rgba(255,221,96,.4)` : `0 ${s(10)} ${s(24)} rgba(0,0,0,.45)`, transition: "box-shadow .8s ease .7s" } as const;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} data-phase={phase} className="fixed inset-0 z-50 overflow-hidden [--s:min(calc(100vw/390),calc(100dvh/844))]" style={{ background: "#141628", fontFamily: KARLA, color: NAVY }}>
      <div style={{ position: "relative", width: s(390), height: s(844), margin: "0 auto" }}>
        {/* The sky, the slow rays behind an opened gift, and a warm glow. */}
        <svg viewBox="0 0 390 844" preserveAspectRatio="none" aria-hidden="true" className="gf-fade" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}>
          <defs>
            <radialGradient id={`${id}-sky`} cx=".5" cy=".44" r=".72">
              <stop offset="0" stopColor="#3A345C" stopOpacity=".9" />
              <stop offset="1" stopColor="#141628" stopOpacity=".96" />
            </radialGradient>
          </defs>
          <rect width="390" height="844" fill={`url(#${id}-sky)`} />
        </svg>
        <svg viewBox="0 0 500 500" aria-hidden="true" style={{ position: "absolute", left: s(-55), top: s(113), width: s(500), height: s(500), opacity: open ? 1 : 0, transition: "opacity 1s ease .8s" }}>
          <defs>
            <radialGradient id={`${id}-ray`} gradientUnits="userSpaceOnUse" cx="250" cy="250" r="250">
              <stop offset=".2" stopColor="#FFE68C" stopOpacity=".16" />
              <stop offset=".68" stopColor="#FFE68C" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g className="gf-rays" style={{ transformOrigin: "250px 250px" }}>
            {Array.from({ length: 20 }, (_, i) => (
              <path key={i} d="M250 250 L 250 0 A 250 250 0 0 1 289 3 Z" transform={`rotate(${i * 18} 250 250)`} fill={`url(#${id}-ray)`} />
            ))}
          </g>
        </svg>
        <svg viewBox="0 0 360 360" aria-hidden="true" className="gf-glow" style={{ position: "absolute", left: s(15), top: s(183), width: s(360), height: s(360), transformOrigin: "50% 50%" }}>
          <defs>
            <radialGradient id={`${id}-glow`} cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="#FFE282" stopOpacity=".55" />
              <stop offset=".66" stopColor="#FFD65A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="180" cy="180" r="180" fill={`url(#${id}-glow)`} />
        </svg>

        {/* Who it's from. */}
        <div className="gf-down" style={{ position: "absolute", left: 0, top: s(76), width: s(390), display: "flex", flexDirection: "column", alignItems: "center", gap: s(8) }}>
          <span aria-hidden="true" style={{ width: s(52), height: s(52), boxSizing: "border-box", borderRadius: "50%", border: `${s(2)} solid #FFF3C4`, boxShadow: `0 0 0 ${s(2)} #FFD75E, 0 0 ${s(16)} ${s(6)} rgba(255,221,96,.75)`, background: "#2B3350", color: CREAM, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(22) }}>
            {fromName.slice(0, 1)}
          </span>
          <h1 id={titleId} style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(29), letterSpacing: s(-0.5), color: CREAM, textAlign: "center" }}>
            {fromName} sent you a gift
          </h1>
          <p style={{ margin: 0, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 500, fontSize: s(15), color: "#E8D9A8" }}>{line}</p>
        </div>

        {/* The gift: drops in, wiggles while tied, then lifts toward you once it's open. Flies to the shelf when kept. */}
        <div className="gf-fly" style={{ position: "absolute", left: s(47), top: s(250), width: s(296), height: s(226), transformOrigin: "50% 50%", transform: phase === "kept" ? `translate(${s(-118)}, ${s(139)}) scale(.295) rotate(-3deg)` : "none", opacity: phase === "kept" ? 0 : 1 }}>
          <div className="gf-drop" style={{ position: "relative", width: "100%", height: "100%" }}>
            <div className={open ? undefined : "gf-wig"} style={{ position: "relative", width: "100%", height: "100%" }}>
              <div className="gf-lift" style={{ position: "absolute", inset: 0, transform: open ? "translateY(-14px) scale(1.1)" : "none" }}>
                <div style={{ position: "relative", width: "100%", height: "100%", perspective: 1200 }}>
                  <div className="gf-flip" style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transform: `rotateY(${flipped ? 180 : 0}deg)` }}>
                    <div aria-hidden={flipped || undefined} style={face}>
                      <FramedPhoto src={look.src} picture={look.picture} alt={look.alt} frame={look.frame} stamp={look.stamp} written={look.written} monthCaption={look.monthCaption} />
                    </div>
                    <div aria-hidden={!flipped || undefined} style={{ ...face, transform: "rotateY(180deg)" }}>
                      <Postcard to={look.to} signature={look.signature} note={look.note} />
                    </div>
                  </div>
                </div>
              </div>
              <div data-unwrap-paper="" data-pattern={look.wrap.pattern} aria-hidden={open || undefined} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <WrappedGift to={look.to} pattern={look.wrap.pattern} ribbon={look.wrap.ribbon} tag={`from ${fromName}`} still torn={open} />
              </div>
              <button type="button" aria-label={action} onClick={open ? onFlip : onPull} disabled={phase === "kept"} style={{ position: "absolute", left: s(-20), top: s(-20), width: s(336), height: s(266), padding: 0, border: 0, borderRadius: s(12), background: "transparent", cursor: "pointer" }} />
            </div>
          </div>
        </div>

        {/* The burst when it opens: a flash, then confetti in every direction. */}
        {open && (
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <svg viewBox="0 0 240 240" className="gf-flash" style={{ position: "absolute", left: s(75), top: s(243), width: s(240), height: s(240), transformOrigin: "50% 50%" }}>
              <defs>
                <radialGradient id={`${id}-flash`} cx=".5" cy=".5" r=".5">
                  <stop offset="0" stopColor="#FFFFFF" stopOpacity=".95" />
                  <stop offset=".65" stopColor="#FFF0B4" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="120" cy="120" r="120" fill={`url(#${id}-flash)`} />
            </svg>
            {Array.from({ length: 40 }, (_, k) => {
              const w = 7 + (k % 3) * 2;
              return (
                <div key={k} style={{ position: "absolute", left: s(195), top: s(363), width: 0, height: 0, transform: `rotate(${k * 9 + ((k * 37) % 11) - 5}deg)` }}>
                  <span
                    className="gf-confetti"
                    style={{ position: "absolute", left: s(-w / 2), top: 0, width: s(w), height: s(k % 4 === 0 ? w : w + 7), borderRadius: k % 4 === 0 ? "50%" : s(2), background: CONFETTI[k % CONFETTI.length], ["--burst" as string]: s(-(190 + (k % 3) * 80)), ["--spin" as string]: `${(k % 2 ? -1 : 1) * (300 + (k % 3) * 90)}deg`, animationDelay: `${0.78 + (k % 7) * 0.03}s` }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* What to do next. */}
        <div style={{ position: "absolute", left: 0, top: s(540), width: s(390), display: "flex", flexDirection: "column", alignItems: "center", gap: s(6), pointerEvents: "none" }}>
          {!open && (
            <svg className="gf-nudge" width={s(22)} height={s(22)} viewBox="0 0 24 24" fill="none" stroke="#FFE58A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          )}
          <p aria-live="polite" style={{ margin: 0, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(18), color: "#FFE9A8", textAlign: "center" }}>
            {phase === "kept" ? "" : hint}
          </p>
        </div>
        {open && (
          <div className="gf-late" style={{ position: "absolute", left: s(24), top: s(736), width: s(342) }}>
            <button
              type="button"
              onClick={onKeep}
              disabled={phase === "kept"}
              style={{ width: "100%", height: s(52), minHeight: 44, borderRadius: s(26), border: `2px solid ${CREAM}`, background: CREAM, color: NAVY, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(18), boxShadow: `0 ${s(3)} 0 #B9A56F`, display: "flex", alignItems: "center", justifyContent: "center", gap: s(8), cursor: "pointer" }}
            >
              <svg width={s(18)} height={s(18)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 21h18" />
                <rect x="5" y="11" width="6" height="10" />
                <rect x="13" y="7" width="6" height="14" />
              </svg>
              Put on my shelf
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
