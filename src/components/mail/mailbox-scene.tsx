import { useId } from "react";
import type { FriendLook } from "../home/types";
import { FRAUNCES, KARLA, NAVY, s } from "../home/units";
import { PartyAvatar } from "../messages/avatar";
import "./mail.css";

type MailboxSceneProps = {
  /** Up: it's in their mailbox. Down: it's waiting for them to join. */
  flag: "up" | "down";
  photo: { src?: string };
  face?: { id: string; name: string; look: FriendLook };
  title: string;
  line: string;
  /** Re-shares an invite link. */
  onShareAgain?: () => void;
  onDone: () => void;
};

/**
 * Dropped (docs/specs/mail.md, MAIL-4/5), from Daily5Send.dc.html: a dark sky, a mailbox rising up, its door swinging open,
 * the photo dropping in, the door shutting, and the flag snapping up as it glows. For an invite the flag stays down.
 * The scene is the design's 390×844, scaled to fit. Skies and glows are SVG radial gradients, which react-native-svg has.
 */
export function MailboxScene({ flag, photo, face, title, line, onShareAgain, onDone }: MailboxSceneProps) {
  const id = `mb${useId().replace(/[^\w-]/g, "")}`;
  const titleId = useId();
  const up = flag === "up";
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-50 overflow-hidden [--s:min(calc(100vw/390),calc(100dvh/844))]" style={{ background: "#141628", fontFamily: KARLA }}>
      <div style={{ position: "relative", width: s(390), height: s(844), margin: "0 auto" }}>
        <svg className="ml-fade" viewBox="0 0 390 844" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}>
          <defs>
            <radialGradient id={`${id}-sky`} cx=".5" cy=".62" r=".75">
              <stop offset="0" stopColor="#3A345C" stopOpacity=".9" />
              <stop offset=".72" stopColor="#141628" stopOpacity=".96" />
            </radialGradient>
            <radialGradient id={`${id}-glow`} cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="#FFE878" stopOpacity=".95" />
              <stop offset=".45" stopColor="#FFD23C" stopOpacity=".45" />
              <stop offset="1" stopColor="#FFC828" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="390" height="844" fill={`url(#${id}-sky)`} />
          {up && <ellipse className="ml-glow" cx="195" cy="605" rx="145" ry="125" fill={`url(#${id}-glow)`} />}
        </svg>
        <div className="ml-rise" style={{ position: "absolute", left: s(95), top: s(500), width: s(200), height: s(260) }}>
          <svg viewBox="0 0 200 260" aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}>
            <ellipse cx="100" cy="256" rx="70" ry="8" fill="rgba(0,0,0,.35)" />
            <rect x="88" y="150" width="24" height="106" rx="3" fill="#8C4A2B" stroke="#5A2E18" strokeWidth="3" />
            <path d="M96 158v90" stroke="#A9653D" strokeWidth="4" strokeLinecap="round" />
            <rect x="66" y="146" width="68" height="12" rx="3" fill="#6F3820" stroke="#4A2412" strokeWidth="2" />
            <path d="M30 150V80a70 70 0 0 1 140 0v70z" fill="#F4E9C8" stroke={NAVY} strokeWidth="4" strokeLinejoin="round" />
            <path d="M44 148V84a56 56 0 0 1 112 0v64z" fill="#1E2240" />
            <path d="M38 92A62 62 0 0 1 72 28" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".75" />
            <rect x="26" y="144" width="148" height="9" rx="3" fill="#E2D3A8" stroke={NAVY} strokeWidth="3" />
            <g className="ml-door">
              <path d="M44 148V84a56 56 0 0 1 112 0v64z" fill="#EFE2BF" stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />
              <path d="M58 134h84" stroke="#D9C9A0" strokeWidth="3" strokeLinecap="round" />
              <rect x="86" y="70" width="28" height="9" rx="4.5" fill="#B43A2A" stroke="#6E1D13" strokeWidth="1.5" />
            </g>
            <g data-mailbox-flag={flag} className={up ? "ml-flag" : undefined} transform={up ? undefined : "rotate(90 174 144)"}>
              <rect x="171" y="84" width="7" height="62" rx="2" fill="#B43A2A" stroke="#6E1D13" strokeWidth="1.5" />
              <path d="M178 84h26v19h-26z" fill="#C8402D" stroke="#6E1D13" strokeWidth="1.5" strokeLinejoin="round" />
            </g>
          </svg>
        </div>
        {/* The photo, dropping in. */}
        <div className="ml-drop" aria-hidden="true" style={{ position: "absolute", left: s(14), top: s(146), width: s(362), height: s(424), boxSizing: "border-box", padding: s(14), borderRadius: s(4), overflow: "hidden", background: "#FDFBF5", border: `${s(4)} solid #1B1B1F` }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL from this browser */}
          {photo.src && <img src={photo.src} alt="" style={{ display: "block", width: "100%", height: s(326), objectFit: "cover" }} />}
        </div>
        <div className="ml-pop" role="status" style={{ position: "absolute", left: s(30), top: s(150), width: s(330), display: "flex", flexDirection: "column", alignItems: "center", gap: s(10), textAlign: "center" }}>
          {face && (
            <span aria-hidden="true" style={{ width: s(60), height: s(60), boxSizing: "border-box", borderRadius: "50%", border: `${s(2)} solid #FFF3C4`, boxShadow: `0 0 0 ${s(2)} #FFD75E, 0 0 ${s(16)} ${s(6)} rgba(255,221,96,.7)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PartyAvatar party={{ kind: "friend", closest: false, ...face }} size={56} />
            </span>
          )}
          <h2 id={titleId} style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(28), letterSpacing: s(-0.4), color: "#FFF6DA" }}>
            {title}
          </h2>
          <p style={{ margin: 0, whiteSpace: "pre-line", fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 500, fontSize: s(15.5), lineHeight: 1.4, color: "#E8D9A8" }}>{line}</p>
          <div style={{ display: "flex", gap: s(10), marginTop: s(8) }}>
            {onShareAgain && (
              <button type="button" onClick={onShareAgain} style={{ minHeight: 44, height: s(44), padding: `0 ${s(18)}`, borderRadius: s(22), border: `${s(2)} solid #FFF6DA`, background: "none", color: "#FFF6DA", fontWeight: 800, fontSize: s(15), cursor: "pointer" }}>
                Send the link again
              </button>
            )}
            <button type="button" onClick={onDone} style={{ minHeight: 44, height: s(44), padding: `0 ${s(24)}`, borderRadius: s(22), border: `${s(2)} solid #FFF6DA`, background: "#FFF6DA", color: NAVY, fontWeight: 800, fontSize: s(15), cursor: "pointer" }}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
