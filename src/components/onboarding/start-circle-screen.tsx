import { useId, type CSSProperties, type ReactNode } from "react";
import { CAVEAT, FRAUNCES, KARLA, NAVY, s } from "../home/units";
import { LOGO_STYLES, type LogoStyle } from "./circle-logo";
import "./onboarding.css";

const NIGHT = "#1E2547";
const CREAM = "#FFF6DA";
const MUTED = "#6A604C";
const LABEL = "#7A6B48";

export type Swatch = { id: string; label: string; hex: string; on: boolean };

export type StartCircleView = {
  step: 1 | 2 | 3 | 4 | 5;
  name: string;
  /** The name as shown: "Your circle" until one is typed. */
  shown: string;
  /** The circle's color at the shade it'll get. */
  color: string;
  swatches: readonly Swatch[];
  /** One of your circles already has the color (ONB-8). */
  clash?: { circle: string; colorName: string; was: string };
  ready: boolean;
  logo: LogoStyle;
  /** Each style drawn as an SVG string (`circleLogoSvg`). */
  logos: Readonly<Record<LogoStyle, string>>;
  photos: { now?: string; then?: string };
  /** Your name, or undefined until you have one (TODO(server): your profile). */
  me?: string;
  message: string;
  /** "Your people are on their way." or, copied, the paste line (ONB-12). */
  liveLine: string;
};

type Props = StartCircleView & {
  onName: (name: string) => void;
  onColor: (id: string) => void;
  onLogo: (style: LogoStyle) => void;
  onPhoto: (slot: "now" | "then", file: File) => void;
  onNext: () => void;
  onBack: () => void;
  onShare: () => void;
  onDone: () => void;
};

/** A logo, drawn from its SVG string at `size`, ringed as designed. */
function Logo({ svg, size, label, ring }: { svg: string; size: number; label?: string; ring?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ position: "relative", display: "block", flex: "none", width: s(size), height: s(size), borderRadius: "50%", overflow: "hidden", boxShadow: ring }}
      // The string is built by circleLogoSvg, which escapes the name.
      dangerouslySetInnerHTML={{ __html: svg.replace("<svg ", `<svg style="display:block;width:100%;height:100%" `) }}
    />
  );
}

const footButton = (bg: string): CSSProperties => ({
  position: "absolute",
  left: s(24),
  right: s(24),
  bottom: s(40),
  height: s(58),
  minHeight: 44,
  borderRadius: s(29),
  border: `2px solid ${NAVY}`,
  color: CREAM,
  background: bg,
  boxShadow: `0 4px 0 ${NAVY}`,
  fontFamily: FRAUNCES,
  fontStyle: "italic",
  fontWeight: 700,
  fontSize: s(20),
  transition: "background .25s",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: s(10),
});

function Title({ id, title, line }: { id: string; title: string; line?: string }) {
  return (
    <div style={{ textAlign: "center", padding: `0 ${s(30)}` }}>
      <h1 id={id} style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(32), lineHeight: 1.05 }}>
        {title}
      </h1>
      {line && <p style={{ margin: `${s(8)} 0 0`, fontSize: s(15), lineHeight: 1.4, color: MUTED }}>{line}</p>}
    </div>
  );
}

const fieldLabel: CSSProperties = { display: "block", fontSize: s(11), fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: LABEL };

/**
 * Starting a circle (docs/specs/onboarding.md, ONB-7 to ONB-12), from WelcomeLetter.dc.html: four steps on a cream page,
 * then the live screen. Pure: everything comes in shaped, scaled from the design's 390×844.
 */
export function StartCircleScreen(p: Props) {
  const titleId = useId();
  const inFlow = p.step < 5;
  const logoSvg = p.logos[p.logo];
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-50 overflow-hidden [--s:min(calc(100vw/390),calc(100dvh/844))]" style={{ fontFamily: KARLA, color: NAVY, background: "radial-gradient(ellipse at 50% 22%, #FBF2D6, #F1E2B8 78%)" }}>
      <div className="wl-fade" style={{ position: "relative", width: s(390), height: "100%", margin: "0 auto" }}>
        {inFlow && (
          <div style={{ position: "absolute", left: 0, right: 0, top: s(46), height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${s(12)}` }}>
            <button type="button" aria-label={p.step === 1 ? "Back to the letter" : "Back"} onClick={p.onBack} style={{ width: 44, height: 44, padding: 0, border: 0, borderRadius: "50%", background: "none", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <div role="img" aria-label={`Step ${p.step} of 4`} style={{ display: "flex", gap: s(6) }}>
              {[1, 2, 3, 4].map((n) => (
                <span key={n} style={{ width: n === p.step ? s(22) : s(6), height: s(6), borderRadius: s(3), background: n <= p.step ? p.color : "#D3C293", transition: "all .3s" }} />
              ))}
            </div>
            <span style={{ width: 44 }} />
          </div>
        )}
        <div key={p.step} className="wl-fade" style={{ position: "absolute", left: 0, right: 0, top: s(p.step === 5 ? 120 : 104), bottom: 0 }}>
          {p.step === 1 && <NameStep {...p} titleId={titleId} />}
          {p.step === 2 && <LogoStep {...p} titleId={titleId} logoSvg={logoSvg} />}
          {p.step === 3 && <PhotoStep {...p} titleId={titleId} logoSvg={logoSvg} />}
          {p.step === 4 && <InviteStep {...p} titleId={titleId} logoSvg={logoSvg} />}
          {p.step === 5 && <LiveStep {...p} titleId={titleId} logoSvg={logoSvg} />}
        </div>
      </div>
    </div>
  );
}

type StepProps = Props & { titleId: string; logoSvg?: string };

function NameStep(p: StepProps) {
  return (
    <>
      <Title id={p.titleId} title="Start a circle" line="Your crew from home, the roommates, the team. Give it a name." />
      <label style={{ display: "block", margin: `${s(30)} ${s(24)} 0` }}>
        <span style={{ ...fieldLabel, margin: `0 0 ${s(7)} ${s(4)}` }}>Circle name</span>
        <input
          type="text"
          value={p.name}
          maxLength={22}
          placeholder="e.g. Red Robin"
          onChange={(e) => p.onName(e.target.value)}
          style={{ boxSizing: "border-box", width: "100%", height: s(56), padding: `0 ${s(18)}`, borderRadius: s(16), border: `2px solid ${NAVY}`, background: "#FFFBF0", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(22), color: NAVY, outline: "none", boxShadow: `0 3px 0 ${NAVY}` }}
        />
      </label>
      <div style={{ margin: `${s(30)} ${s(24)} 0` }}>
        <span style={{ ...fieldLabel, margin: `0 0 ${s(12)} ${s(4)}` }}>Pick its color</span>
        <div role="radiogroup" aria-label="Circle color" style={{ display: "grid", gridTemplateColumns: `repeat(5, ${s(48)})`, justifyContent: "space-between", rowGap: s(16), padding: `0 ${s(4)}` }}>
          {p.swatches.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={c.on}
              aria-label={c.label}
              onClick={() => p.onColor(c.id)}
              style={{ width: s(48), height: s(48), minWidth: 44, minHeight: 44, borderRadius: "50%", border: 0, padding: 0, background: c.hex, boxShadow: c.on ? `0 0 0 3px #FBF2D6, 0 0 0 5.5px ${NAVY}` : "inset 0 0 0 1.5px rgba(0,0,0,.12)", transform: c.on ? "scale(1.1)" : "none", transition: "transform .2s, box-shadow .2s, background .3s", cursor: "pointer" }}
            />
          ))}
        </div>
        <div aria-live="polite" style={{ minHeight: s(44), marginTop: s(18) }}>
          {p.clash && (
            <div className="wl-fade" style={{ display: "flex", alignItems: "center", gap: s(10), margin: `0 ${s(4)}`, padding: `${s(11)} ${s(14)}`, borderRadius: s(14), background: "#FFFBF0", border: "1.5px solid #DCCB9A" }}>
              <span aria-hidden="true" style={{ flex: "none", display: "flex" }}>
                <span style={{ width: s(18), height: s(18), borderRadius: "50%", background: p.clash.was, boxShadow: "0 0 0 2px #FFFBF0" }} />
                <span style={{ width: s(18), height: s(18), marginLeft: s(-6), borderRadius: "50%", background: p.color, boxShadow: "0 0 0 2px #FFFBF0" }} />
              </span>
              <span style={{ fontSize: s(13.5), lineHeight: 1.3, color: "#4A5068" }}>
                <b style={{ color: NAVY }}>{p.clash.circle}</b> already uses {p.clash.colorName}, so yours gets its own shade.
              </span>
            </div>
          )}
        </div>
      </div>
      <button type="button" onClick={p.onNext} aria-disabled={!p.ready} style={footButton(p.ready ? p.color : "#B9AE8C")}>
        Next
      </button>
    </>
  );
}

function LogoStep(p: StepProps) {
  return (
    <>
      <Title id={p.titleId} title="Pick a logo" line="Made from your name. You can upload your own later in the circle’s profile." />
      <div style={{ display: "flex", justifyContent: "center", marginTop: s(26) }}>
        <Logo svg={p.logoSvg!} size={150} label={`${p.shown} logo`} ring={`0 0 0 4px #FBF4DD, 0 0 0 7px ${NAVY}, 0 12px 26px rgba(27,31,52,.3)`} />
      </div>
      <p style={{ margin: `${s(16)} 0 0`, textAlign: "center", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(22) }}>{p.shown}</p>
      <div role="radiogroup" aria-label="Logo style" style={{ display: "flex", justifyContent: "center", gap: s(22), marginTop: s(30) }}>
        {LOGO_STYLES.map((l) => {
          const on = l.id === p.logo;
          return (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${l.label} logo`}
              onClick={() => p.onLogo(l.id)}
              style={{ border: 0, background: "none", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: s(9), color: NAVY, cursor: "pointer" }}
            >
              <span style={{ display: "block", borderRadius: "50%", transform: on ? "scale(1.06)" : "none", transition: "all .2s", boxShadow: on ? `0 0 0 3px #FBF2D6, 0 0 0 6px ${p.color}, 0 6px 14px rgba(27,31,52,.25)` : "0 0 0 2px #FBF2D6, 0 0 0 3.5px #CDBB8C" }}>
                <Logo svg={p.logos[l.id]} size={84} />
              </span>
              <span style={{ fontSize: s(12), fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", opacity: on ? 1 : 0.55 }}>{l.label}</span>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={p.onNext} style={footButton(p.color)}>
        Next
      </button>
    </>
  );
}

function PhotoHalf({ slot, src, label, title, icon, onPhoto }: { slot: "now" | "then"; src?: string; label: string; title: string; icon: ReactNode; onPhoto: Props["onPhoto"] }) {
  return (
    <span style={{ position: "relative", flex: 1, background: "#E6D6AB", overflow: "hidden" }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- a picked photo's object URL
        <img src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: slot === "then" ? "sepia(.35)" : undefined }} />
      ) : (
        <span style={{ position: "absolute", inset: s(10), border: "2px dashed #B9A473", borderRadius: s(6), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: s(6), color: "#7A6A44" }}>
          {icon}
          <span style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(18), color: NAVY }}>{title}</span>
          <span style={{ fontSize: s(12), fontWeight: 700 }}>tap to add</span>
        </span>
      )}
      <input
        type="file"
        accept="image/*"
        aria-label={label}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPhoto(slot, f);
          e.target.value = "";
        }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
      />
    </span>
  );
}

function PhotoStep(p: StepProps) {
  const picked = !!(p.photos.now || p.photos.then);
  return (
    <>
      <Title id={p.titleId} title="Now & then" line="One of you all now, one from back in the day. They sit at the top of your chat." />
      <div style={{ position: "relative", width: s(390), height: s(236), marginTop: s(28) }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: s(390), height: s(200), display: "flex", gap: 2, background: NAVY }}>
          <PhotoHalf
            slot="now"
            src={p.photos.now}
            label="Add a photo of your circle now"
            title="Now"
            onPhoto={p.onPhoto}
            icon={
              <svg width={s(30)} height={s(30)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            }
          />
          <PhotoHalf
            slot="then"
            src={p.photos.then}
            label="Add a photo of your circle back then"
            title="Then"
            onPhoto={p.onPhoto}
            icon={
              <svg width={s(30)} height={s(30)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 7v5l3 2" />
                <circle cx="12" cy="12" r="8" />
              </svg>
            }
          />
        </div>
        <div style={{ position: "absolute", left: 0, top: s(200), width: s(390), height: s(6), background: "#1B1F34" }} />
        <span style={{ position: "absolute", left: s(163), top: s(171), pointerEvents: "none" }}>
          <Logo svg={p.logoSvg!} size={64} label={`${p.shown} logo`} ring={`0 0 0 2.5px #FBF4DD, 0 0 0 5px ${NAVY}, 0 4px 12px rgba(27,31,52,.35)`} />
        </span>
      </div>
      <p style={{ margin: `${s(4)} 0 0`, textAlign: "center", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(22) }}>{p.shown}</p>
      <p style={{ margin: `${s(4)} 0 0`, textAlign: "center", fontSize: s(13.5), fontWeight: 700, color: LABEL }}>You can change these anytime</p>
      <button type="button" onClick={p.onNext} style={footButton(p.color)}>
        {picked ? "Next" : "Skip for now"}
      </button>
    </>
  );
}

/** Your face on the invite. TODO(server): your profile photo; a drawn face until then. */
const MY_FACE = "radial-gradient(circle at 50% 44%, #E8B58C 0 25%, transparent 27%), radial-gradient(circle at 50% 36%, #3A2418 0 34%, transparent 36%), radial-gradient(ellipse at 50% 108%, #2B3350 0 42%, transparent 44%), #F6E6CF";

function InviteStep(p: StepProps) {
  const spots = [
    { x: 89, y: 43, d: 34 },
    { x: 151, y: 39, d: 34 },
    { x: 121, y: 78, d: 32 },
  ];
  return (
    <>
      <h1 id={p.titleId} style={{ margin: 0, textAlign: "center", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(30), lineHeight: 1.05 }}>
        Your invite
      </h1>
      <figure aria-label={`The invite your friends will see: ${p.shown}`} className="wl-invite" style={{ position: "relative", width: s(300), margin: `${s(18)} auto 0`, boxSizing: "border-box", padding: s(13), borderRadius: s(24), background: "#FFFBF0", border: `2px solid ${NIGHT}`, boxShadow: `0 6px 0 ${NIGHT}, 0 ${s(22)} ${s(40)} rgba(27,31,52,.25)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: s(10), padding: `0 ${s(2)} ${s(11)}` }}>
          <Logo svg={p.logoSvg!} size={40} ring={`0 0 0 2px #FFFBF0, 0 0 0 3.5px ${NIGHT}`} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(20), lineHeight: 1.05, color: NIGHT }}>{p.shown}</div>
            <div style={{ fontSize: s(12), fontWeight: 800, color: LABEL, marginTop: s(2) }}>a circle on Now &amp; Then</div>
          </div>
          <span style={{ fontFamily: CAVEAT, fontWeight: 700, fontSize: s(18), color: MUTED, transform: "rotate(-4deg)" }}>{p.me ? `from ${p.me}` : "from me"}</span>
        </div>
        <div aria-hidden="true" style={{ position: "relative", height: s(150), borderRadius: s(14), overflow: "hidden", background: "linear-gradient(#BFD6EA, #F3E3BE 78%)" }}>
          <svg viewBox="0 0 274 178" style={{ position: "absolute", left: 0, top: s(-14), width: s(274), height: s(178) }}>
            <circle cx="222" cy="44" r="22" fill="#F7CB4D" opacity=".75" />
            <path d="M0 140Q70 118 140 132T274 124V178H0z" fill="#9CC28A" />
            <path d="M0 152Q80 138 160 150T274 146V178H0z" fill="#86B074" />
            <ellipse cx="137" cy="160" rx="34" ry="6" fill="#3F5A2A" opacity=".3" />
            <path d="M129 116C130 146 125 154 118 160H156C149 154 144 146 145 116Z" fill="#8C4A2B" />
            <circle cx="137" cy="80" r="64" fill="#FFE58A" opacity=".22" />
            <circle cx="137" cy="80" r="58" fill={p.color} />
            <g fill="#000" opacity=".15">
              <ellipse cx="160" cy="106" rx="26" ry="16" />
              <ellipse cx="112" cy="98" rx="17" ry="11" />
            </g>
            <ellipse cx="113" cy="52" rx="18" ry="10" transform="rotate(-18 113 52)" fill="#fff" opacity=".28" />
            <g fill="#FBF2D6" opacity=".85">
              <circle cx="150" cy="48" r="3" />
              <circle cx="96" cy="88" r="2.5" />
              <circle cx="176" cy="74" r="2.5" />
              <circle cx="132" cy="112" r="2.5" />
            </g>
          </svg>
          {spots.map((o) => (
            <span key={o.x} style={{ position: "absolute", left: s(o.x), top: s(o.y), width: s(o.d), height: s(o.d) }}>
              <span style={{ position: "absolute", left: "50%", top: s(-6), width: s(8), height: s(5), marginLeft: s(-4), borderRadius: s(1.5), background: "linear-gradient(#F7D46B, #C99628)" }} />
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px dashed rgba(255,246,218,.9)" }} />
            </span>
          ))}
        </div>
        <div aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: s(12), marginTop: s(12) }}>
          <span style={{ width: s(34), height: s(34), borderRadius: "50%", background: MY_FACE, boxShadow: "0 0 0 2px #FFFBF0, 0 0 0 3.5px #2A2030" }} />
          <span className="wl-glow" style={{ display: "flex", width: s(34), height: s(34), boxSizing: "border-box", borderRadius: "50%", border: `2.5px dashed ${p.color}`, background: "rgba(255,229,138,.35)", alignItems: "center", justifyContent: "center", fontFamily: CAVEAT, fontWeight: 700, fontSize: s(15), color: NIGHT }}>
            you
          </span>
        </div>
        <div style={{ textAlign: "center", padding: `${s(10)} ${s(6)} 0` }}>
          <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(25), lineHeight: 1.05, color: NIGHT }}>Your spot’s saved.</div>
          <div style={{ fontSize: s(13.5), lineHeight: 1.35, color: MUTED, marginTop: s(5) }}>{`${p.me ?? "I"} started ${p.shown} and saved you a spot.`}</div>
          <div aria-hidden="true" style={{ display: "inline-block", marginTop: s(12), padding: `${s(11)} ${s(26)}`, borderRadius: s(24), background: p.color, color: CREAM, border: `2px solid ${NIGHT}`, boxShadow: `0 3px 0 ${NIGHT}`, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(16) }}>
            Take your spot
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: s(12), fontSize: s(11), fontWeight: 800, color: LABEL }}>nowandthen.app</div>
      </figure>
      <div className="wl-fade-late" style={{ width: s(300), margin: `${s(18)} auto 0`, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: s(4) }}>
        <span style={{ fontSize: s(10.5), fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: LABEL }}>sent with it</span>
        <span style={{ maxWidth: s(250), padding: `${s(9)} ${s(14)}`, borderRadius: `${s(18)} ${s(18)} ${s(6)} ${s(18)}`, background: "#0A84FF", color: "#fff", fontFamily: "-apple-system, 'Helvetica Neue', var(--font-karla), sans-serif", fontSize: s(15), lineHeight: 1.3 }}>{p.message}</span>
      </div>
      <button type="button" onClick={p.onShare} style={footButton(p.color)}>
        <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 15V3M7 8l5-5 5 5" />
          <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
        Share invite
      </button>
    </>
  );
}

function LiveStep(p: StepProps) {
  const colors = ["#C8432B", "#EBA22E", "#4F8A3C", "#4BA3D9", "#E0457B", p.color];
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", width: s(170), height: s(170), margin: "0 auto" }}>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const r = 92 + (i % 3) * 14;
            return (
              <span
                key={i}
                aria-hidden="true"
                className="wl-burst"
                style={{ position: "absolute", left: s(81), top: s(81), width: s(8), height: s(8), borderRadius: i % 2 ? "50%" : 2, background: colors[i % colors.length], "--tx": s(Math.round(Math.cos(a) * r)), "--ty": s(Math.round(Math.sin(a) * r)) } as CSSProperties}
              />
            );
          })}
          <span className="wl-pop" style={{ position: "absolute", left: s(10), top: s(10) }}>
            <Logo svg={p.logoSvg!} size={150} label={`${p.shown} logo`} ring={`0 0 0 4px #FBF4DD, 0 0 0 7px ${NAVY}, 0 12px 26px rgba(27,31,52,.3)`} />
          </span>
        </div>
        <div className="wl-fade-late">
          <h1 id={p.titleId} style={{ margin: `${s(16)} 0 0`, padding: `0 ${s(24)}`, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(32), lineHeight: 1.05 }}>{`${p.shown} is live`}</h1>
          <p style={{ margin: `${s(8)} 0 0`, padding: `0 ${s(30)}`, fontSize: s(15), lineHeight: 1.4, color: MUTED }}>{p.liveLine}</p>
        </div>
      </div>
      <button type="button" onClick={p.onDone} style={footButton(p.color)}>
        Go to my circle
      </button>
    </>
  );
}
