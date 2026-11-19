import type { CSSProperties } from "react";
import { FRAUNCES, KARLA, s } from "../home/units";
import { TapRing } from "./tap-hint";
import "./onboarding.css";

const NIGHT = "#1E2547";
const GOLD = "#F7CB4D";
/** The screen around the spotlight (WelcomeLetter.dc.html), drawn as its shadow: 200vmax, as Chrome drops a 9999px spread. */
const DIM = "rgba(27,31,52,.5)";
/** Room around what's spotlit, in screen px. */
const PAD = 6;
/** The design's 16px gutter, and the room the tip card needs under a spot. */
const GUTTER = 16;
const TIP_ROOM = 170;

export type TourRect = { x: number; y: number; w: number; h: number };

/** Phones scale like the tabs; wide screens use the tabs' wide size. */
const FRAME = "fixed inset-0 [--s:calc(min(100vw,480px)/390)] md:[--s:1.1px]";

/**
 * One stop of the tour (docs/specs/onboarding.md, ONB-16, ONB-17): the dimmed app, a gold-ringed spotlight on `rect`
 * (screen px, or none: just dimmed), and the navy tip card. Only the spotlit spot takes taps, and only when `tap` is given;
 * with nothing spotlit, the card's own button does the tap.
 */
export function TourStop({ rect, viewport, title, body, count, tap, onGotIt, onTap }: {
  rect: TourRect | null;
  viewport: { w: number; h: number };
  title: string;
  body: string;
  count: string;
  tap?: { label: string; hint: string };
  onGotIt: () => void;
  onTap: () => void;
}) {
  const hole = rect && { x: rect.x - PAD, y: rect.y - PAD, w: rect.w + 2 * PAD, h: rect.h + 2 * PAD };
  const below = !hole || viewport.h - (hole.y + hole.h) >= TIP_ROOM || hole.y < TIP_ROOM;
  const tipPlace: CSSProperties = !hole
    ? { top: "50%", transform: "translateY(-50%)" }
    : below
      ? { top: Math.min(hole.y + hole.h + GUTTER, viewport.h - TIP_ROOM + GUTTER) }
      : { bottom: viewport.h - hole.y + GUTTER };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="tour-title" className={`${FRAME} z-[60]`} style={{ fontFamily: KARLA }}>
      {/* Swallows every tap but the spot's. */}
      <div className="absolute inset-0" style={hole ? undefined : { background: DIM }} />
      {hole && (
        <div
          aria-hidden="true"
          className="wl-fade"
          style={{ position: "absolute", left: hole.x, top: hole.y, width: hole.w, height: hole.h, borderRadius: Math.min(18, hole.h / 2), boxShadow: `0 0 0 3px #FFE58A, 0 0 0 200vmax ${DIM}`, pointerEvents: "none" }}
        />
      )}
      {hole && tap && (
        <>
          <button
            type="button"
            aria-label={tap.label}
            onClick={onTap}
            style={{ position: "absolute", left: hole.x, top: hole.y, width: hole.w, height: hole.h, border: 0, padding: 0, background: "none", borderRadius: Math.min(18, hole.h / 2), cursor: "pointer" }}
          />
          <span style={{ position: "absolute", left: hole.x + hole.w / 2, top: hole.y + hole.h / 2, pointerEvents: "none" }}>
            <TapRing size={56} style={{ left: s(-28), top: s(-28) }} />
          </span>
        </>
      )}
      <div
        key={title}
        className="wl-fade"
        style={{
          position: "absolute",
          left: "50%",
          marginLeft: `calc(min(${s(330)}, 100vw - ${2 * GUTTER}px) / -2)`,
          width: `min(${s(330)}, calc(100vw - ${2 * GUTTER}px))`,
          boxSizing: "border-box",
          padding: `${s(14)} ${s(16)} ${s(12)}`,
          borderRadius: s(18),
          background: NIGHT,
          color: "#FBF4DD",
          boxShadow: `0 ${s(10)} ${s(24)} rgba(20,22,40,.35)`,
          ...tipPlace,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: s(10) }}>
          <span id="tour-title" style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(18), lineHeight: 1.1 }}>{title}</span>
          <span style={{ flex: "none", fontSize: s(11), fontWeight: 800, color: "rgba(251,244,221,.55)" }}>{count}</span>
        </div>
        <div style={{ fontSize: s(13.5), lineHeight: 1.4, opacity: 0.88, marginTop: s(4) }}>{body}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: s(10), minHeight: s(30) }}>
          {tap && hole ? (
            <span style={{ fontSize: s(12), fontWeight: 800, color: GOLD }}>{tap.hint}</span>
          ) : (
            // With nothing spotlit, the card itself takes the tap, so the tour never gets stuck.
            <button
              type="button"
              autoFocus
              aria-label={tap?.label}
              onClick={tap ? onTap : onGotIt}
              style={{ minHeight: 36, padding: `${s(7)} ${s(18)}`, borderRadius: s(16), border: 0, background: GOLD, color: NIGHT, fontFamily: KARLA, fontWeight: 800, fontSize: s(13.5), cursor: "pointer" }}
            >
              {tap ? tap.hint : "Got it"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** The tour's end (ONB-18): a navy card over the dimmed tree, and "Let’s go". */
export function TourDone({ title, body, onEnd }: { title: string; body: string; onEnd: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className={`${FRAME} z-[60] flex items-center justify-center wl-fade`} style={{ background: "rgba(27,31,52,.35)", fontFamily: KARLA, padding: `0 ${GUTTER}px` }}>
      <div className="wl-drop-soon" style={{ width: s(330), maxWidth: "100%", boxSizing: "border-box", padding: `${s(20)} ${s(20)} ${s(18)}`, borderRadius: s(20), background: NIGHT, color: "#FBF4DD", textAlign: "center", boxShadow: `0 ${s(14)} ${s(30)} rgba(20,22,40,.4)` }}>
        <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(24) }}>{title}</div>
        <div style={{ fontSize: s(13.5), lineHeight: 1.4, opacity: 0.85, marginTop: s(6) }}>{body}</div>
        <button
          type="button"
          autoFocus
          onClick={onEnd}
          style={{ marginTop: s(16), minHeight: 44, padding: `${s(11)} ${s(26)}`, borderRadius: 999, border: `${s(2)} solid #2B3350`, background: "#C8432B", color: "#FFF6DA", fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 800, fontSize: s(17), boxShadow: `0 ${s(3)} 0 #2B3350`, cursor: "pointer" }}
        >
          Let’s go
        </button>
      </div>
    </div>
  );
}
