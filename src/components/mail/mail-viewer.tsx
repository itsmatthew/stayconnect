import { useId, type CSSProperties } from "react";
import { CAVEAT, FRAUNCES, KARLA, NAVY, s } from "../home/units";
import { MailPicture } from "./mail-picture";
import type { EnvelopeView, MailItemView } from "./mail-types";
import "./mail.css";

type MailViewerProps = {
  /** "4 new". */
  subtitle: string;
  envelopes: readonly EnvelopeView[];
  index: number;
  /** The envelope at `index` is open, showing `photoIndex`. */
  opened: boolean;
  photoIndex: number;
  /** Who the mail is addressed to, written on the envelope. */
  recipientName?: string;
  onPrev: () => void;
  onNext: () => void;
  onOpen: () => void;
  onNextPhoto: () => void;
  onDone: () => void;
  onZoom: (item: MailItemView) => void;
  onMenu: (item: MailItemView) => void;
  onClose: () => void;
};

const CREAM = "#FFF6DA";
const roundButton = { width: 44, height: 44, padding: 0, borderRadius: "50%", border: `2px solid ${CREAM}`, color: CREAM, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" } as const;

/**
 * New mail (docs/specs/mailbox.md, MAILBOX-2 to MAILBOX-4), from MailOpen.dc.html: a dark sky, "Your mailbox", one big
 * envelope at a time with arrows between people. Opened, the photo slides up as a polaroid; Done keeps it. A stack
 * opens one photo at a time. Scaled from the design's 390×844.
 */
export function MailViewer(p: MailViewerProps) {
  const titleId = useId();
  const env = p.envelopes[p.index];
  const item = env?.items[p.photoIndex];
  const last = env && p.photoIndex >= env.items.length - 1;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-50 overflow-hidden [--s:min(calc(100vw/390),calc(100dvh/844))]" style={{ background: "#141628", fontFamily: KARLA, color: NAVY }}>
      <div style={{ position: "relative", width: s(390), height: s(844), margin: "0 auto" }}>
        <Sky />
        <div className="mb-down" style={{ position: "absolute", left: 0, top: s(58), width: s(390), display: "flex", flexDirection: "column", alignItems: "center", gap: s(4) }}>
          <h1 id={titleId} style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(28), letterSpacing: s(-0.5), color: CREAM }}>
            Your mailbox
          </h1>
          <p style={{ margin: 0, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 500, fontSize: s(15), color: "#E8D9A8" }}>{p.subtitle}</p>
        </div>
        <button type="button" aria-label="Close your mailbox" onClick={p.onClose} style={{ ...roundButton, position: "absolute", right: s(14), top: s(52), background: "rgba(43,51,80,.6)" }}>
          <Cross />
        </button>

        {env && (
          <div key={`${env.key}-${p.opened}-${p.photoIndex}`} style={{ position: "absolute", left: 0, top: s(140), width: s(390), height: s(580) }}>
            {!p.opened ? (
              <>
                <div className="mb-up" style={{ position: "absolute", left: s(25), top: s(96), width: s(340), height: s(222) }}>
                  <div className="mb-bob">
                    {env.items.length > 1 && <StackEdges />}
                    <Envelope env={env} recipientName={p.recipientName} />
                  </div>
                  <button
                    type="button"
                    aria-label={`Open the envelope from ${env.fromName}${env.items.length > 1 ? `, ${env.items.length} photos` : ""}`}
                    onClick={p.onOpen}
                    style={{ position: "absolute", left: s(-8), top: s(-8), width: s(356), height: s(238), padding: 0, border: 0, borderRadius: s(12), background: "transparent", cursor: "pointer" }}
                  />
                </div>
                <p className="mb-late" style={{ position: "absolute", left: 0, top: s(356), width: s(390), margin: 0, textAlign: "center", fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(18), color: "#FFE9A8" }}>
                  Tap to open
                </p>
              </>
            ) : (
              item && (
                <>
                  <Polaroid item={item} onZoom={() => p.onZoom(item)} onMenu={() => p.onMenu(item)} />
                  <div className="mb-late" style={{ position: "absolute", left: s(70), top: s(436), width: s(250), display: "flex", flexDirection: "column", alignItems: "center", gap: s(8) }}>
                    {env.items.length > 1 && (
                      <span style={{ fontSize: s(12.5), fontWeight: 800, color: "#E8D9A8" }}>
                        photo {p.photoIndex + 1} of {env.items.length}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={last ? p.onDone : p.onNextPhoto}
                      style={{ width: s(250), height: s(52), minHeight: 44, borderRadius: s(26), border: `2px solid ${CREAM}`, background: CREAM, color: NAVY, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(18), boxShadow: `0 ${s(3)} 0 #B9A56F`, cursor: "pointer" }}
                    >
                      {last ? "Done" : "Next photo"}
                    </button>
                  </div>
                </>
              )
            )}
          </div>
        )}

        <div className="mb-late" style={{ position: "absolute", left: 0, top: s(730), width: s(390), display: "flex", alignItems: "center", justifyContent: "center", gap: s(16) }}>
          <button type="button" aria-label="Previous piece of mail" disabled={p.index === 0} onClick={p.onPrev} style={{ ...roundButton, background: "none", opacity: p.index === 0 ? 0.3 : 1 }}>
            <Chevron d="M15 5l-7 7 7 7" />
          </button>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: s(6) }}>
            <div aria-hidden="true" style={{ display: "flex", gap: s(7) }}>
              {p.envelopes.map((e, i) => (
                <span key={e.key} style={{ width: s(9), height: s(9), borderRadius: "50%", background: i === p.index ? CREAM : "rgba(255,246,218,.3)" }} />
              ))}
            </div>
            <span style={{ fontSize: s(12.5), fontWeight: 800, color: "#E8D9A8" }}>
              {p.index + 1} of {p.envelopes.length}
            </span>
          </div>
          <button type="button" aria-label="Next piece of mail" disabled={p.index >= p.envelopes.length - 1} onClick={p.onNext} style={{ ...roundButton, background: "none", opacity: p.index >= p.envelopes.length - 1 ? 0.3 : 1 }}>
            <Chevron d="M9 5l7 7-7 7" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** The design's night sky, as an SVG radial gradient. */
function Sky() {
  const id = `mvs${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg className="mb-fade" viewBox="0 0 390 844" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}>
      <defs>
        <radialGradient id={id} cx=".5" cy=".46" r=".72">
          <stop offset="0" stopColor="#3A345C" stopOpacity=".92" />
          <stop offset="1" stopColor="#141628" stopOpacity=".97" />
        </radialGradient>
      </defs>
      <rect width="390" height="844" fill={`url(#${id})`} />
    </svg>
  );
}

/** Airmail stripes: red, paper, navy, paper, at 135°. An SVG pattern, not a repeating gradient. */
function Airmail({ id }: { id: string }) {
  return (
    <pattern id={id} width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="12" height="44" fill="#B43A2A" />
      <rect x="12" width="10" height="44" fill="#FBF6EA" />
      <rect x="22" width="12" height="44" fill={NAVY} />
      <rect x="34" width="10" height="44" fill="#FBF6EA" />
    </pattern>
  );
}

/** Two envelopes peeking out behind: there's more than one photo inside (MAILBOX-3). */
function StackEdges() {
  return (
    <>
      {[
        { r: 4, x: 8, y: -10 },
        { r: -3, x: -6, y: -5 },
      ].map(({ r, x, y }) => (
        <span key={r} aria-hidden="true" style={{ position: "absolute", left: s(x), top: s(y), width: s(340), height: s(222), borderRadius: s(7), background: "#E9DDBE", border: `${s(1.5)} solid rgba(43,51,80,.35)`, transform: `rotate(${r}deg)`, boxShadow: `0 ${s(10)} ${s(24)} rgba(0,0,0,.35)` }} />
      ))}
    </>
  );
}

/** The envelope, as designed: airmail border, "from ‹name›", a Daily 5 stamp, a postmark, and who it's for. */
function Envelope({ env, recipientName }: { env: EnvelopeView; recipientName?: string }) {
  const id = `mve${useId().replace(/[^\w-]/g, "")}`;
  const first = env.items[0];
  const count = env.items.length;
  return (
    <svg viewBox="0 0 340 222" aria-hidden="true" style={{ position: "relative", display: "block", width: s(340), height: s(222), overflow: "visible", borderRadius: s(7), boxShadow: `0 ${s(18)} ${s(38)} rgba(0,0,0,.55)` }}>
      <defs>
        <Airmail id={`${id}-air`} />
      </defs>
      <rect width="340" height="222" rx="7" fill={`url(#${id}-air)`} />
      <rect x="8" y="8" width="324" height="206" rx="4" fill="#FBF6EA" />
      <text x="24" y="38" style={{ fontFamily: CAVEAT }} fontWeight="700" fontSize="23" fill={NAVY}>
        from {env.fromName}
      </text>
      {count > 1 && (
        <g transform="translate(24 50)">
          <rect width="64" height="20" rx="10" fill="#F7CB4D" stroke={NAVY} strokeWidth="1.5" />
          <text x="32" y="14" textAnchor="middle" style={{ fontFamily: KARLA }} fontWeight="800" fontSize="11" fill={NAVY}>
            {count} photos
          </text>
        </g>
      )}
      {/* The stamp, with a perforated edge drawn as dots. */}
      <g transform="translate(272 20)">
        <rect width="46" height="56" fill="#FFFFFF" />
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} fill="#FBF6EA">
            <circle cx={i * 7 + 2} cy="0" r="2" />
            <circle cx={i * 7 + 2} cy="56" r="2" />
            <circle cx="0" cy={i * 8 + 4} r="2" />
            <circle cx="46" cy={i * 8 + 4} r="2" />
          </g>
        ))}
        <g transform="translate(5 5) scale(.9 .958)">
          <rect width="40" height="48" fill="#F4E9C8" />
          <rect x="7" y="9" width="26" height="30" rx="2" fill="#FFFFFF" stroke={NAVY} strokeWidth="2" />
          <rect x="11" y="13" width="18" height="14" fill="#6AA2D0" />
          <circle cx="24" cy="17" r="3" fill="#F2BE4A" />
          <path d="M11 27l6-6 5 4 7-5v7z" fill="#89A64A" />
          <text x="20" y="36.5" textAnchor="middle" style={{ fontFamily: KARLA }} fontWeight="800" fontSize="6.5" fill={NAVY}>
            DAILY 5
          </text>
        </g>
      </g>
      {/* The postmark: when it was dropped. */}
      <g transform="translate(238 48) rotate(-12)">
        <circle cx="24" cy="25" r="20" fill="none" stroke="rgba(43,51,80,.5)" strokeWidth="1.6" />
        <circle cx="24" cy="25" r="15" fill="none" stroke="rgba(43,51,80,.35)" strokeWidth="1" />
        <text x="24" y="23" textAnchor="middle" style={{ fontFamily: KARLA }} fontWeight="800" fontSize="7.5" fill="rgba(43,51,80,.6)">
          {first.postmark[0]}
        </text>
        <text x="24" y="32" textAnchor="middle" style={{ fontFamily: KARLA }} fontWeight="800" fontSize="7.5" fill="rgba(43,51,80,.6)">
          {first.postmark[1]}
        </text>
        <path d="M44 18c4-3 8 3 12 0s8 3 10 0M44 25c4-3 8 3 12 0s8 3 10 0M44 32c4-3 8 3 12 0s8 3 10 0" fill="none" stroke="rgba(43,51,80,.4)" strokeWidth="1.3" />
      </g>
      {recipientName && (
        <>
          <text x="78" y="134" style={{ fontFamily: CAVEAT }} fontWeight="700" fontSize="26" fill={NAVY}>
            {recipientName}
          </text>
          <line x1="78" y1="142" x2="258" y2="142" stroke="#C8BC9F" strokeWidth="1" />
        </>
      )}
      <text x="24" y="202" style={{ fontFamily: KARLA }} fontWeight="800" fontSize="8.5" letterSpacing="1.4" fill="#6A604C">
        NOW &amp; THEN · MAIL
      </text>
    </svg>
  );
}

/** The opened photo: a polaroid sliding up, tap to see it big, ⋯ for remove, block or report. */
function Polaroid({ item, onZoom, onMenu }: { item: MailItemView; onZoom: () => void; onMenu: () => void }) {
  return (
    <div className="mb-slide" style={{ position: "absolute", left: s(35), top: s(30), width: s(320) }}>
      <button type="button" aria-label={`Make ${item.fromName}'s photo bigger`} onClick={onZoom} style={{ display: "block", width: s(320), padding: 0, border: 0, background: "none", textAlign: "left", color: NAVY, cursor: "zoom-in" }}>
        <article style={{ boxSizing: "border-box", padding: `${s(12)} ${s(12)} 0`, borderRadius: s(5), background: "#FDFBF5", border: `${s(4)} solid #1B1B1F`, boxShadow: `0 ${s(20)} ${s(44)} rgba(0,0,0,.55)` }}>
          <div style={{ position: "relative", background: "#1A1714", overflow: "hidden" }}>
            <MailPicture art={item.art} label={`Photo from ${item.fromName}, taken ${item.photoDate}`} height={s(250)} />
          </div>
          <div style={{ height: s(62), display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${s(2)} ${s(2)} ${s(4)}` }}>
            <span style={{ fontFamily: CAVEAT, fontWeight: 700, fontSize: s(26), transform: "rotate(-2deg)" }}>{item.photoDate}</span>
            <span style={{ display: "flex", alignItems: "center", gap: s(5), height: s(26), padding: `0 ${s(9)}`, borderRadius: s(13), border: `${s(1.5)} solid ${NAVY}`, background: "#F7EFD6", fontSize: s(12), fontWeight: 800, whiteSpace: "nowrap" }}>
              <svg width={s(13)} height={s(13)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <rect x="7" y="6" width="10" height="9" />
              </svg>
              {item.fromName}&apos;s Daily 5
            </span>
          </div>
        </article>
        <span aria-hidden="true" style={{ position: "absolute", right: s(16), top: s(16), width: s(34), height: s(34), borderRadius: "50%", background: "rgba(20,22,40,.65)", border: `${s(1.5)} solid rgba(255,246,218,.7)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={s(16)} height={s(16)} viewBox="0 0 24 24" fill="none" stroke={CREAM} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
          </svg>
        </span>
      </button>
      <MoreButton onClick={onMenu} style={{ position: "absolute", left: s(10), top: s(10) }} />
    </div>
  );
}

/** "⋯": remove, block or report (MAILBOX-7). Looks 34px, 44 to tap. */
export function MoreButton({ onClick, style }: { onClick: () => void; style?: CSSProperties }) {
  return (
    <button type="button" aria-label="More options for this photo" onClick={onClick} style={{ width: 44, height: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", ...style }}>
      <span aria-hidden="true" style={{ width: s(34), height: s(34), borderRadius: "50%", background: "rgba(20,22,40,.65)", border: `${s(1.5)} solid rgba(255,246,218,.7)`, display: "flex", alignItems: "center", justifyContent: "center", gap: s(3) }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: s(4), height: s(4), borderRadius: "50%", background: CREAM }} />
        ))}
      </span>
    </button>
  );
}

export function Cross({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function Chevron({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
