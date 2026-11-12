import { useEffect, useRef, useState } from "react";
import { FramedPhoto } from "../gifts/framed-photo";
import type { GiftCardLook } from "../gifts/gift-card";
import "../gifts/gifts.css";
import { prefersLessMotion } from "../gifts/motion";
import { FRAUNCES, s } from "../home/units";

const CUBBY = { height: s(112), borderRadius: s(4), background: "linear-gradient(#C9AF74, #D9C28C 22%, #EBDDB4)" } as const;
const LEDGE = { height: s(25), borderTop: `${s(1)} solid rgba(255,214,160,.35)` } as const;

/** A gift on the shelf: its name ("Gift from Ana", "Your gift to Madrid Crew"), its heading big ("from Ana"), and how it looks. */
export type ShelfGift = { id: string; label: string; heading: string; look: GiftCardLook };

/** Two rows show at once, as designed; more scroll. */
const ROW = 137;
const SHOWN_ROWS = 2;

/**
 * Your gift cabinet on Me (docs/specs/gifts.md, GIFT-1, GIFT-21), as in design-ref/project/MeGifts.dc.html: two rows
 * of three cubbies, and a drawer underneath. Gifts stand in the cubbies, newest first, each in the frame its sender
 * chose; past six, more rows scroll. Tapping one shows it big. `landing` drops one into its cubby (GIFT-23).
 * Pulling the drawer starts a gift. Inset shadows don't port to React Native, so the cubbies' depth is a gradient.
 */
export function GiftShelf({ onSendGift, gifts = [], onOpenGift, landing }: { onSendGift?: () => void; gifts?: readonly ShelfGift[]; onOpenGift?: (id: string) => void; landing?: string }) {
  const rows = Math.max(SHOWN_ROWS, Math.ceil(gifts.length / 3));
  const [pulled, setPulled] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const pull = () => {
    if (pulled) return;
    if (prefersLessMotion()) return onSendGift?.();
    setPulled(true);
    timers.current.push(setTimeout(() => onSendGift?.(), 260));
    timers.current.push(setTimeout(() => setPulled(false), 900));
  };
  return (
    <section aria-label="Your shelf" style={{ position: "relative", width: s(370), height: s(336), margin: `0 auto`, boxSizing: "border-box", padding: `${s(9)} ${s(9)} 0`, borderRadius: `${s(10)} ${s(10)} ${s(4)} ${s(4)}`, background: "linear-gradient(90deg, #7E4224, #A35E35 18%, #94522D 50%, #A35E35 82%, #7E4224)", border: `${s(2)} solid #4F2713`, boxShadow: `0 ${s(8)} ${s(14)} -${s(4)} rgba(74,44,20,.5)` }}>
      <div data-shelf-rows="" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", columnGap: s(7), height: s(ROW * SHOWN_ROWS), overflowY: "auto", overscrollBehavior: "contain" }}>
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} style={{ display: "contents" }}>
            {[0, 1, 2].map((i) => {
              const g = gifts[row * 3 + i];
              const lands = !!g && g.id === landing;
              return (
                <div key={`c${i}`} data-cubby="" data-landing={lands ? "" : undefined} style={{ ...CUBBY, position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  {g && (
                    <button type="button" aria-label={g.label} className={lands ? "gf-land" : undefined} onClick={() => onOpenGift?.(g.id)} style={{ width: "100%", height: "100%", minHeight: 44, padding: `0 0 ${s(4)}`, border: 0, background: "none", display: "flex", alignItems: "flex-end", justifyContent: "center", cursor: "pointer" }}>
                      {/* The gift's own front, a third of its size, leaning back in the cubby. */}
                      <span style={{ display: "block", width: s(95), height: s(72), transform: `rotate(${(row * 3 + i) % 2 ? 2 : -2}deg)`, boxShadow: `0 ${s(3)} ${s(6)} rgba(74,44,20,.4)` }}>
                        <MiniFront look={g.look} />
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
            {[0, 1, 2].map((i) => (
              <div key={`l${i}`} aria-hidden="true" style={LEDGE} />
            ))}
          </div>
        ))}
      </div>
      <button type="button" onClick={pull} className={pulled ? "gf-pull" : undefined} style={{ position: "absolute", left: s(9), top: s(284), width: s(348), height: s(44), minHeight: 44, boxSizing: "border-box", padding: 0, borderRadius: s(4), border: `${s(2)} solid #4F2713`, background: "linear-gradient(#B36A3C, #94522D)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <span style={{ height: s(28), padding: `0 ${s(14)}`, display: "flex", alignItems: "center", gap: s(7), borderRadius: s(14), border: `${s(1.5)} solid #8F6412`, background: "linear-gradient(#F7D978, #D9AE45)", color: "#3A2410", boxShadow: `0 ${s(2)} 0 #5E3A12`, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(15) }}>
          <svg width={s(15)} height={s(15)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="1.5" />
            <rect x="2.5" y="7" width="19" height="4" rx="1" />
            <path d="M12 7v14" />
            <path d="M12 7c-4-6-8-2-5 0zm0 0c4-6 8-2 5 0z" />
          </svg>
          send a gift
        </span>
      </button>
    </section>
  );
}

/** The gift's front at a third of its size: the same frame and photo, scaled. */
function MiniFront({ look }: { look: GiftCardLook }) {
  return (
    <span aria-hidden="true" style={{ display: "block", width: s(95), height: s(72), overflow: "hidden", borderRadius: s(2) }}>
      <span style={{ display: "block", width: s(296), height: s(226), transform: "scale(.32)", transformOrigin: "0 0" }}>
        <FramedPhoto src={look.src} picture={look.picture} alt="" frame={look.frame} stamp={look.stamp} written={look.written} monthCaption={look.monthCaption} />
      </span>
    </span>
  );
}
