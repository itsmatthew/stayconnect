import type { CSSProperties, ReactNode } from "react";
import { FRAUNCES, s } from "../home/units";
import "./onboarding.css";

const NIGHT = "#1E2547";

/** A navy callout, as in WelcomeLetter.dc.html: a bold title and one line under it (docs/specs/onboarding.md, ONB-2). It never takes taps. */
export function TapHint({ title, children, style }: { title: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      role="note"
      className="wl-drop"
      style={{ width: s(176), boxSizing: "border-box", padding: `${s(11)} ${s(15)}`, borderRadius: s(16), background: NIGHT, color: "#FBF4DD", boxShadow: `0 ${s(10)} ${s(24)} rgba(20,22,40,.35)`, pointerEvents: "none", textAlign: "left", ...style }}
    >
      <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(17), lineHeight: 1.1 }}>{title}</div>
      <div style={{ fontSize: s(12), lineHeight: 1.3, opacity: 0.82, marginTop: s(3) }}>{children}</div>
    </div>
  );
}

/** A pulsing gold ring and a tapping hand, over what to tap. Drawn, never tappable. */
export function TapRing({ size, style }: { size: number; style?: CSSProperties }) {
  return (
    <span aria-hidden="true" style={{ position: "absolute", width: s(size), height: s(size), pointerEvents: "none", ...style }}>
      <span className="wl-ripple" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `${s(3)} solid #FFE58A`, boxSizing: "border-box" }} />
      <span style={{ position: "absolute", left: s(size * 0.73), top: s(size * 0.55), transform: "rotate(64deg)", transformOrigin: `${s(17)} ${s(2)}` }}>
        <span className="wl-tap" style={{ display: "block" }}>
          <svg width={s(46)} height={s(52)} viewBox="0 0 46 52" style={{ display: "block" }}>
            <path
              d="M17 4.5c2.6 0 4.5 2 4.5 4.6v14.4l1.4-.4c2.5-.6 4.4.5 5 2.5l1.6-.3c2.4-.4 4.2.8 4.8 2.8l1.2-.2c2.6-.3 4.6 1.5 4.6 4.1v6.6c0 7.5-5.5 12.9-13 12.9h-4.3c-4.3 0-7.6-1.7-10-5.2L3.6 34.4c-1.4-2-1-4.6 1-6 1.9-1.3 4.4-.9 5.8.9l2.1 2.7V9.1c0-2.6 2-4.6 4.5-4.6z"
              fill="#FFF6DA"
              stroke={NIGHT}
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            <path d="M22.9 23.1v8M29.5 25.7v6.6M35.9 28.4v5.3" stroke={NIGHT} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </span>
      </span>
    </span>
  );
}
