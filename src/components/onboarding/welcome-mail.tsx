import { useId, type ReactNode } from "react";
import { CAVEAT, FRAUNCES, KARLA, NAVY, s } from "../home/units";
import "./onboarding.css";

const NIGHT = "#1E2547";
const CREAM = "#FBF4DD";

/** The letter's day, already written out: "NOV 8" and "2026" on the postmark, "Sun, Nov 8" on the letterhead. */
export type WelcomeDay = { postmark: string; year: string; letterhead: string };

type Common = { day: WelcomeDay; recipientName?: string; onClose: () => void };

/** The dark mailbox over your tree, dimmed (WelcomeLetter.dc.html). The design also blurs the tree: no CSS filters on mobile, so it's dimmed further instead. */
function Backdrop({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50 overflow-hidden [--s:min(calc(100vw/390),calc(100dvh/844))]" style={{ fontFamily: KARLA, color: NAVY }}>
      <div aria-hidden="true" className="wl-fade" style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(27,31,52,.9), rgba(27,31,52,.97) 75%)" }} />
      <div style={{ position: "relative", width: s(390), height: "100%", margin: "0 auto" }}>{children}</div>
    </div>
  );
}

function CloseButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="wl-fade-late"
      style={{ position: "absolute", right: s(14), top: s(48), zIndex: 3, width: 44, height: 44, padding: 0, borderRadius: "50%", border: `2px solid ${CREAM}`, background: "rgba(27,31,52,.6)", color: CREAM, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

/** The Now & Then mark: a small tree. TODO(design): the exported logo, once the real illustrations are exported. */
function Mark() {
  return (
    <svg aria-hidden="true" width={s(31)} height={s(35)} viewBox="0 0 31 35" style={{ flex: "none", display: "block" }}>
      <path d="M15.5 2l9 12h-5l7 10h-6l5 6H5.5l5-6h-6l7-10h-5z" fill="#4F8A3C" stroke={NIGHT} strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="13.5" y="30" width="4" height="4.5" fill="#7A5230" />
      <circle cx="12" cy="18" r="1.6" fill="#C8432B" />
      <circle cx="19" cy="22" r="1.6" fill="#EBA22E" />
    </svg>
  );
}

/**
 * The welcome letter, sealed (docs/specs/onboarding.md, ONB-4), from WelcomeLetter.dc.html: "Your mailbox · 1 new" and
 * one cream envelope with a return address, a tree stamp, a postmark and your name. `opening`: the tap has landed, the
 * envelope drops away before the letter slides up.
 */
export function WelcomeEnvelope({ day, recipientName, opening, onOpen, onClose }: Common & { opening: boolean; onOpen: () => void }) {
  const arc = `wl${useId().replace(/[^\w-]/g, "")}`;
  return (
    <Backdrop label="Your mailbox">
      <CloseButton label="Close your mailbox" onClick={onClose} />
      <div className="wl-fade" style={{ position: "absolute", left: 0, right: 0, top: s(56), textAlign: "center", color: CREAM }}>
        <h1 style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(30) }}>Your mailbox</h1>
        <p style={{ margin: `${s(2)} 0 0`, fontFamily: FRAUNCES, fontStyle: "italic", fontSize: s(15), opacity: 0.8 }}>1 new</p>
      </div>
      <button
        type="button"
        aria-label="Open the welcome letter"
        onClick={onOpen}
        className="wl-envelope"
        data-opening={opening}
        style={{ position: "absolute", left: s(22), top: s(250), width: s(346), height: s(208), padding: 0, border: 0, background: "none", cursor: "pointer", color: NIGHT }}
      >
        <span style={{ position: "absolute", inset: 0, transition: "transform .5s cubic-bezier(.5,0,.3,1), opacity .4s .1s", transform: opening ? `translateY(${s(70)}) scale(.92)` : "none", opacity: opening ? 0 : 1 }}>
          <span style={{ position: "absolute", inset: 0, borderRadius: s(3), background: "linear-gradient(170deg, #FFFDF7, #F6EFDF)", boxShadow: `0 ${s(22)} ${s(38)} rgba(0,0,0,.45), 0 ${s(3)} ${s(6)} rgba(0,0,0,.22), inset 0 0 0 1px rgba(110,90,50,.12)` }} />
          {/* The return address, with the mark. */}
          <span style={{ position: "absolute", left: s(18), top: s(16), display: "flex", alignItems: "center", gap: s(9), textAlign: "left", lineHeight: 1.25 }}>
            <Mark />
            <span>
              <span style={{ display: "block", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(13.5) }}>Now &amp; Then</span>
              <span style={{ display: "block", fontSize: s(10.5), fontWeight: 700, color: "#7D7462" }}>Harrison &amp; Jackson</span>
            </span>
          </span>
          {/* The stamp: perforations are dots around a cream edge. */}
          <svg aria-hidden="true" viewBox="0 0 52 62" style={{ position: "absolute", right: s(16), top: s(14), width: s(52), height: s(62) }}>
            <rect width="52" height="62" fill="#FFFDF5" />
            {Array.from({ length: 9 }, (_, i) => <circle key={`t${i}`} cx={3 + i * 5.75} cy="0" r="2.4" fill="#F6EFDF" />)}
            {Array.from({ length: 9 }, (_, i) => <circle key={`b${i}`} cx={3 + i * 5.75} cy="62" r="2.4" fill="#F6EFDF" />)}
            {Array.from({ length: 11 }, (_, i) => <circle key={`l${i}`} cx="0" cy={3 + i * 5.6} r="2.4" fill="#F6EFDF" />)}
            {Array.from({ length: 11 }, (_, i) => <circle key={`r${i}`} cx="52" cy={3 + i * 5.6} r="2.4" fill="#F6EFDF" />)}
            <defs>
              <linearGradient id={`${arc}-sky`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#DCEBF2" />
                <stop offset=".7" stopColor="#F6E9C9" />
              </linearGradient>
            </defs>
            <g transform="translate(4.5 4.5)">
              <rect width="43" height="53" fill={`url(#${arc}-sky)`} stroke={NIGHT} strokeWidth="1" />
              <path d="M0 44q11-6 22-2t21-1V53H0z" fill="#9CC28A" />
              <path d="M21.5 10l6.5 9h-4l5 7.5h-4l4.5 6.5H13.5l4.5-6.5h-4l5-7.5h-4z" fill="#3F7A31" />
              <circle cx="18.5" cy="23" r="1.4" fill="#C8432B" />
              <circle cx="24.5" cy="28.5" r="1.4" fill="#EBA22E" />
              <circle cx="22" cy="17" r="1.1" fill="#EBA22E" />
              <rect x="20.3" y="33" width="2.4" height="5" fill="#7A5230" />
              <text x="21.5" y="8.5" textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="800" fontSize="5.6" fill={NIGHT}>
                N&amp;T
              </text>
              <text x="21.5" y="49.5" textAnchor="middle" fontFamily="Karla, sans-serif" fontWeight="800" fontSize="4.4" fill="#FFFDF5" letterSpacing=".6">
                FOREVER
              </text>
            </g>
          </svg>
          {/* The postmark: a round date stamp left of the stamp, wavy bars running across it. */}
          <svg aria-hidden="true" viewBox="0 0 150 70" style={{ position: "absolute", right: s(12), top: s(10), width: s(150), height: s(70), opacity: 0.62, transform: "rotate(-4deg)" }}>
            <g fill="none" stroke="#25252D">
              <circle cx="34" cy="35" r="24" strokeWidth="1.5" />
              <path id={arc} d="M15 35a19 19 0 0138 0" stroke="none" />
              <text fontFamily="Karla, sans-serif" fontWeight="800" fontSize="6.4" fill="#25252D" stroke="none" letterSpacing=".8">
                <textPath href={`#${arc}`} startOffset="50%" textAnchor="middle">
                  GAINESVILLE FL
                </textPath>
              </text>
              <text x="34" y="40" textAnchor="middle" fontFamily="Karla, sans-serif" fontWeight="800" fontSize="7.2" fill="#25252D" stroke="none">
                {day.postmark}
              </text>
              <text x="34" y="48.5" textAnchor="middle" fontFamily="Karla, sans-serif" fontWeight="800" fontSize="6.4" fill="#25252D" stroke="none">
                {day.year}
              </text>
              <path d="M64 22q7-5 14 0t14 0 14 0 14 0 14 0M64 31q7-5 14 0t14 0 14 0 14 0 14 0M64 40q7-5 14 0t14 0 14 0 14 0 14 0M64 49q7-5 14 0t14 0 14 0 14 0 14 0" strokeWidth="1.7" strokeLinecap="round" />
            </g>
          </svg>
          <span style={{ position: "absolute", left: s(132), top: s(112), fontFamily: CAVEAT, fontWeight: 700, fontSize: s(44), lineHeight: 1, transform: "rotate(-2deg)" }}>{recipientName || "you"}</span>
        </span>
      </button>
      <p style={{ position: "absolute", left: 0, right: 0, top: s(498), margin: 0, opacity: opening ? 0 : 1, transition: "opacity .2s", textAlign: "center" }}>
        <span className="wl-hint" style={{ fontFamily: FRAUNCES, fontStyle: "italic", fontSize: s(16), color: "#FFE58A" }}>
          tap to open
        </span>
      </p>
    </Backdrop>
  );
}

const FEATURES: readonly { name: string; color: string; ink: string; icon: ReactNode; lines: readonly ReactNode[] }[] = [
  {
    name: "65 Archive",
    color: "#4F8A3C",
    ink: "#FFF6DA",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <rect x="7" y="3.5" width="13" height="13" rx="1.5" />
        <path d="M4 7.5v12h12" />
      </svg>
    ),
    lines: ["Your favorite photo of each week, month and year", "Post by 11:59 pm every Sunday"],
  },
  {
    name: "Daily 5",
    color: "#EBA22E",
    ink: NAVY,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
        <text x="12" y="16.5" textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="800" fontSize="11" fill="currentColor" stroke="none">
          5
        </text>
      </svg>
    ),
    lines: ["Five random photos from your camera roll", "Send one in a chat, as mail, or as a gift"],
  },
  {
    name: "Your circles",
    color: "#C8432B",
    ink: "#FFF6DA",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="8.5" cy="10" r="5" />
        <circle cx="15.5" cy="10" r="5" />
        <circle cx="12" cy="16" r="5" />
      </svg>
    ),
    lines: ["Your friend groups, each with its own color and logo", "Start one and invite your friends"],
  },
  {
    name: "Your circle",
    color: "#4F8A3C",
    ink: "#FFF6DA",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l5 7h-3l4 6h-3l3 4H6l3-4H6l4-6H7z" />
        <rect x="10.8" y="19" width="2.4" height="3" />
      </svg>
    ),
    lines: ["Your people, arranged by how close you are", "The more you connect, the closer in they grow"],
  },
  {
    name: "Gifts",
    color: "#C8432B",
    ink: "#FFF6DA",
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="11" width="16" height="10" rx="1.5" />
        <rect x="2.5" y="7" width="19" height="4" rx="1" />
        <path d="M12 7v14" />
        <path d="M12 7c-4-6-8-2-5 0zm0 0c4-6 8-2 5 0z" />
      </svg>
    ),
    lines: [
      <>
        For any special occasion, or just to say <em>I’m thinking of you</em>
      </>,
      "Customize it and schedule it for the exact day and time",
    ],
  },
];

const body = { fontSize: s(15), lineHeight: 1.5, color: NAVY } as const;

/**
 * The welcome letter, open (ONB-5), from WelcomeLetter.dc.html: a lined page that scrolls under a fade, the five
 * features, the privacy promise and the sign-off. `onStartCircle` adds "Start my first circle" under it (ONB-7).
 */
export function WelcomeLetter({ day, recipientName, onClose, onStartCircle }: Common & { onStartCircle?: () => void }) {
  const titleId = useId();
  return (
    <Backdrop label="Welcome letter">
      <CloseButton label="Close the letter" onClick={onClose} />
      <div
        className="wl-scroll wl-letter"
        style={{ position: "absolute", inset: 0, overflowY: "auto", padding: `${s(104)} 0 ${s(40)}`, boxSizing: "border-box", maskImage: `linear-gradient(transparent ${s(70)}, #000 ${s(104)})`, WebkitMaskImage: `linear-gradient(transparent ${s(70)}, #000 ${s(104)})` }}
      >
        <article
          aria-labelledby={titleId}
          style={{ position: "relative", margin: `0 ${s(18)}`, padding: `${s(30)} ${s(24)}`, background: "#FFFBF0", borderRadius: s(4), boxShadow: `0 ${s(18)} ${s(40)} rgba(0,0,0,.45)`, backgroundImage: `repeating-linear-gradient(transparent 0 ${s(31)}, rgba(43,51,80,.06) ${s(31)} ${s(32)})` }}
        >
          <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: s(12), borderBottom: `${s(3)} double ${NAVY}` }}>
            <h1 id={titleId} style={{ margin: 0 }}>
              <span style={{ display: "block", fontSize: s(10.5), fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#C8432B" }}>welcome to</span>
              <span style={{ display: "block", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(34), lineHeight: 1, marginTop: s(3) }}>Now &amp; Then</span>
            </h1>
            <p style={{ margin: 0, fontFamily: FRAUNCES, fontStyle: "italic", fontSize: s(13.5), color: "#6A604C", textAlign: "right", lineHeight: 1.3 }}>
              <span style={{ display: "block" }}>{day.letterhead}</span>
              <span style={{ display: "block" }}>{day.year}</span>
            </p>
          </header>
          <p style={{ margin: `${s(20)} 0 0`, fontFamily: CAVEAT, fontWeight: 700, fontSize: s(28), lineHeight: 1 }}>{`Hey ${recipientName || "there"},`}</p>
          <p style={{ ...body, margin: `${s(10)} 0 0` }}>Most social media is built for an audience. Now &amp; Then is built for your inner circle. No followers, no likes, nothing to perform.</p>
          <p style={{ ...body, margin: `${s(10)} 0 0` }}>Just small, real ways to stay close to your people, down the hall or across the country. Here’s how it works:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: s(16), marginTop: s(22) }}>
            {FEATURES.map((f) => (
              <section key={f.name} style={{ display: "flex", gap: s(13) }}>
                <span aria-hidden="true" style={{ flex: "none", width: s(40), height: s(40), borderRadius: "50%", background: f.color, color: f.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {f.icon}
                </span>
                <div>
                  <h2 style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(17) }}>{f.name}</h2>
                  <ul style={{ listStyle: "none", margin: `${s(3)} 0 0`, padding: 0, display: "flex", flexDirection: "column", gap: s(2) }}>
                    {f.lines.map((line, i) => (
                      <li key={i} style={{ position: "relative", paddingLeft: s(14), fontSize: s(15), lineHeight: 1.4, color: "#4A5068" }}>
                        <span aria-hidden="true" style={{ position: "absolute", left: 0, top: s(8), width: s(5), height: s(5), borderRadius: "50%", background: f.color }} />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}
          </div>
          <div style={{ display: "flex", gap: s(12), alignItems: "center", marginTop: s(22), padding: `${s(13)} ${s(14)}`, borderRadius: s(12), background: NIGHT, color: CREAM }}>
            <svg width={s(26)} height={s(26)} viewBox="0 0 24 24" fill="none" stroke="#FFE58A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 018 0v3" />
            </svg>
            <span style={{ fontSize: s(13.5), lineHeight: 1.35 }}>
              <b style={{ fontFamily: FRAUNCES, fontSize: s(15), color: "#FFE58A" }}>100% private.</b> No ads, ever. We will never sell your data.
            </span>
          </div>
          <p style={{ ...body, margin: `${s(20)} 0 0`, lineHeight: 1.45 }}>Invite your people and spread the word.</p>
          <p style={{ margin: `${s(12)} 0 0`, fontFamily: CAVEAT, fontWeight: 700, fontSize: s(25), lineHeight: 1.05 }}>
            Glad you’re here,
            <br />
            Harrison &amp; Jackson
          </p>
        </article>
        {onStartCircle && (
          <button
            type="button"
            onClick={onStartCircle}
            style={{ display: "block", width: `calc(100% - ${s(36)})`, height: s(46), minHeight: 44, margin: `${s(22)} ${s(18)} 0`, borderRadius: 999, border: `2px solid ${NAVY}`, background: "#C8432B", color: "#FFF6DA", boxShadow: `0 3px 0 ${NAVY}`, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 800, fontSize: s(17), cursor: "pointer" }}
          >
            Start my first circle
          </button>
        )}
      </div>
    </Backdrop>
  );
}

/** The read letter, kept with your mail (ONB-6): a small cream envelope tile, two across like the photos. */
export function WelcomeTile({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" aria-label="Welcome letter from Harrison & Jackson" onClick={onOpen} style={{ padding: 0, border: 0, background: "none", textAlign: "left", color: NAVY, display: "flex", flexDirection: "column", gap: s(6), cursor: "pointer" }}>
      <span style={{ position: "relative", display: "flex", alignItems: "flex-end", height: s(150), boxSizing: "border-box", padding: s(10), borderRadius: s(3), background: "linear-gradient(170deg, #FFFDF7, #F6EFDF)", border: `${s(2)} solid ${NAVY}`, boxShadow: `0 ${s(6)} ${s(12)} rgba(74,44,20,.3)`, transform: "rotate(-1.2deg)" }}>
        <span style={{ position: "absolute", left: s(10), top: s(10), display: "flex", alignItems: "center", gap: s(6) }}>
          <Mark />
          <span style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(12) }}>Now &amp; Then</span>
        </span>
        <span style={{ fontFamily: CAVEAT, fontWeight: 700, fontSize: s(22), lineHeight: 1 }}>welcome letter</span>
      </span>
      <span style={{ fontSize: s(13), fontWeight: 800, paddingLeft: s(2) }}>
        Welcome letter <span style={{ fontWeight: 700, color: "#6A604C" }}>· from Harrison &amp; Jackson</span>
      </span>
    </button>
  );
}
