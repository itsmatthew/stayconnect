import { useEffect, useId, type CSSProperties, type ReactNode } from "react";
import "../home/home.css";
import type { FriendLook } from "../home/types";
import { faceGradient } from "../messages/avatar";
import { FRAUNCES, KARLA, NAVY, s } from "../home/units";

// Shared pieces of the nudge screens (docs/specs/nudges.md), from UxNudges, UxReachOut and UxCheckIn.

export const CARD = "#FFFBF0";
export const SCREEN = "#FBF4DD";
export const MUTED = "#6A604C";
export const FAINT = "#7A6B48";
export const RED = "#C8432B";
export const DOTTED = "#D8C794";

/** "YOUR CHECK-IN PEOPLE" with its rule. */
export function Kicker({ children, color = NAVY }: { children: ReactNode; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: s(10), fontSize: s(10.5), fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color }}>
      <span>{children}</span>
      <span aria-hidden="true" style={{ flex: 1, borderTop: `${s(2)} solid ${NAVY}` }} />
    </div>
  );
}

/** A friend's face, ringed; `glow` is the lit gold of a sent nudge (NUDGE-11). */
export function Face({ look, size, ring = look.ring, gap = SCREEN, glow = false, dim = false, label }: { look: FriendLook; size: number; ring?: string; gap?: string; glow?: boolean; dim?: boolean; label?: string }) {
  const shadow = glow ? `0 0 0 ${s(3)} ${gap}, 0 0 0 ${s(5.5)} #F7CB4D, 0 0 ${s(18)} ${s(6)} rgba(255,221,96,.75)` : `0 0 0 ${s(2)} ${gap}, 0 0 0 ${s(4)} ${ring}`;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ flex: "none", display: "block", width: s(size), height: s(size), borderRadius: "50%", background: faceGradient(look), boxShadow: shadow, opacity: dim ? 0.45 : 1 }}
    />
  );
}

/** The design's main button: a red pill with a navy edge, 46 tall. */
export function MainButton({ children, onClick, disabled, label, style }: { children: ReactNode; onClick: () => void; disabled?: boolean; label?: string; style?: CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        width: "100%",
        height: s(46),
        minHeight: 44,
        padding: `0 ${s(10)}`,
        borderRadius: 999,
        border: `${s(2)} solid ${NAVY}`,
        background: RED,
        color: "#FFF6DA",
        boxShadow: `0 ${s(3)} 0 ${NAVY}`,
        fontFamily: FRAUNCES,
        fontStyle: "italic",
        fontWeight: 800,
        fontSize: s(17),
        whiteSpace: "nowrap",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** "If it's ever heavier than a rough week, you can call or text 988 anytime." (NUDGE-6) */
export function Line988({ style }: { style?: CSSProperties }) {
  return (
    <p style={{ margin: 0, fontSize: s(12), lineHeight: 1.4, color: MUTED, ...style }}>
      If it’s ever heavier than a rough week, you can call or text{" "}
      <a href="tel:988" style={{ color: "#B43A2A", fontWeight: 800 }}>
        988
      </a>{" "}
      anytime.
    </p>
  );
}

/** A yellow-and-navy switch, 52 by 30, 44 to tap. */
export function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (on: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} style={{ flex: "none", minWidth: 44, minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", cursor: "pointer" }}>
      <span style={{ position: "relative", display: "block", width: s(52), height: s(30), boxSizing: "border-box", borderRadius: 999, border: `${s(2)} solid ${NAVY}`, background: on ? "#F7CB4D" : "#E8D9B4", transition: "background .2s" }}>
        <span style={{ position: "absolute", top: s(3), left: s(on ? 25 : 3), width: s(20), height: s(20), boxSizing: "border-box", borderRadius: "50%", background: CARD, border: `${s(2)} solid ${NAVY}`, transition: "left .2s" }} />
      </span>
    </button>
  );
}

/** Escape calls `onEscape` while mounted. */
export function useEscape(onEscape: () => void) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onEscape();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onEscape]);
}

/**
 * The floating card the nudges arrive in (UxReachOut, UxCheckIn): over a dimmed screen, 12 in from the sides and 90 up
 * from the bottom, above the tab bar. On wide screens it keeps its phone width, centered.
 */
export function NudgeCard({ title, children, onClose, dim = 0.45 }: { title: string; children: ReactNode; onClose?: () => void; dim?: number }) {
  const id = useId();
  useEscape(onClose ?? noop);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 40, "--s": "min(100vw / 390, 1.1px)", fontFamily: KARLA, color: NAVY } as CSSProperties}>
      <div className="hm-anim" aria-hidden="true" style={{ position: "absolute", inset: 0, background: `rgba(27,31,52,${dim})`, animation: "hm-fade .3s ease both" }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="hm-anim"
        style={{
          position: "absolute",
          left: "50%",
          bottom: s(90),
          translate: "-50% 0",
          width: s(366),
          maxHeight: `calc(100dvh - ${s(110)})`,
          overflowY: "auto",
          boxSizing: "border-box",
          padding: `${s(18)} ${s(16)}`,
          borderRadius: s(24),
          background: CARD,
          border: `${s(2)} solid ${NAVY}`,
          boxShadow: "0 -8px 30px rgba(27,31,52,.35)",
          animation: "hm-up .55s cubic-bezier(.2,.9,.3,1) both",
        }}
      >
        <span id={id} hidden>
          {title}
        </span>
        {children}
      </div>
    </div>
  );
}

const noop = () => {};

/** A closing "x" in a card's corner, 44 to tap. */
export function CloseX({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} style={{ flex: "none", width: 44, height: 44, margin: `${s(-10)} ${s(-8)} 0 0`, padding: 0, border: 0, background: "none", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
      <svg width={s(16)} height={s(16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}
