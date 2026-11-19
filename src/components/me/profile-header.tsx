import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { FRAUNCES, KARLA, NAVY, s } from "../home/units";

export type ProfileQuestionView = { id: string; text: string; color: string; answer?: string; week?: number };

export type ProfileHeaderProps = {
  name: string;
  /** Photo URLs, you now and you as a kid (ME-5). */
  now?: string;
  then?: string;
  onPick: (which: "now" | "then", file: File) => void;
  bio: string;
  bioMax: number;
  onBio: (text: string) => void;
  questions: readonly ProfileQuestionView[];
  answerMax: number;
  onAnswer: (id: string, text: string) => void;
};

const CAP = "linear-gradient(#F7D46B, #C99628)";
const THREAD = "#B5650E";

/** A gold cap and a round photo, ringed in `ring`; dashed with "+ label" while empty. A file picker underneath. */
export function ProfileOrnament({ src, size, ring, label, pickLabel, onPickFile, alt }: { src?: string; size: number; ring: string; label: string; pickLabel: string; onPickFile: (f: File) => void; alt: string }) {
  const id = useId();
  return (
    <span style={{ position: "relative", flex: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span aria-hidden="true" style={{ width: s(14), height: s(9), borderRadius: s(2), background: CAP }} />
      <label htmlFor={id} style={{ position: "relative", display: "block", width: s(size), height: s(size), marginTop: s(-3), borderRadius: "50%", cursor: "pointer" }}>
        {src ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL */}
            <img src={src} alt={alt} style={{ display: "block", width: "100%", height: "100%", boxSizing: "border-box", borderRadius: "50%", border: `${s(3)} solid #F6ECCD`, boxShadow: `0 0 0 ${s(4)} ${ring}, 0 ${s(6)} ${s(8)} rgba(74,44,20,.3)`, objectFit: "cover" }} />
            <span aria-hidden="true" style={{ position: "absolute", left: "18%", top: "12%", width: "25%", height: "14%", borderRadius: "50%", background: "rgba(255,255,255,.55)", transform: "rotate(-32deg)" }} />
          </>
        ) : (
          <span aria-hidden="true" style={{ width: "100%", height: "100%", boxSizing: "border-box", borderRadius: "50%", border: `${s(3)} dashed ${ring}`, background: "#FBF2DC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#7A6B48", fontWeight: 800, lineHeight: 1.1 }}>
            <span style={{ fontSize: s(22) }}>+</span>
            <span style={{ fontSize: s(11) }}>{label}</span>
          </span>
        )}
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        aria-label={pickLabel}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onPickFile(f);
        }}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />
    </span>
  );
}

/**
 * Text you tap to edit in place (ME-6, ME-7): Enter or leaving the field saves, Escape keeps what was there.
 * `label` names the field; the button reads it with the text, or `placeholder` while empty.
 */
export function InlineText({ value, placeholder, label, max, onSave, style, children }: { value: string; placeholder: string; label: string; max: number; onSave: (text: string) => void; style?: CSSProperties; children?: ReactNode }) {
  const [draft, setDraft] = useState<string | null>(null);
  if (draft !== null) {
    const done = (save: boolean) => {
      if (save && draft !== value) onSave(draft);
      setDraft(null);
    };
    return (
      <input
        autoFocus
        aria-label={label}
        value={draft}
        maxLength={max}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => done(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") done(true);
          if (e.key === "Escape") done(false);
        }}
        style={{ ...style, minWidth: s(120), height: s(30), boxSizing: "border-box", padding: `0 ${s(8)}`, borderRadius: s(8), border: `${s(1.5)} solid ${NAVY}`, background: "#FFFBF0", color: NAVY, outline: 0 }}
      />
    );
  }
  return (
    <button
      type="button"
      aria-label={`${label}: ${value || placeholder}`}
      onClick={() => setDraft(value)}
      style={{ ...style, minHeight: 24, padding: 0, border: 0, background: "none", color: value ? NAVY : "#9A8A5C", textAlign: "left", cursor: "pointer" }}
    >
      {children}
      {value || placeholder}
    </button>
  );
}

/** Me's profile (docs/specs/me.md, ME-5 to ME-7): you now and then with your name between, a line about you, five questions. */
export function ProfileHeader({ name, now, then, onPick, bio, bioMax, onBio, questions, answerMax, onAnswer }: ProfileHeaderProps) {
  return (
    <>
      <div data-tour="me-photos" style={{ position: "relative", margin: `${s(20)} ${s(22)} 0`, display: "flex", alignItems: "center", gap: s(14) }}>
        {/* One thread through both caps, sagging between them. */}
        <svg viewBox="0 0 346 30" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", left: 0, top: s(-4), width: "100%", height: s(30) }}>
          <path d="M40 6Q173 30 306 6" fill="none" stroke={THREAD} strokeWidth="1.6" strokeDasharray="2 4" />
        </svg>
        <ProfileOrnament src={now} size={80} ring="#F0502E" label="now" alt={`${name} now`} pickLabel={now ? "Change your photo now" : "Add a photo of you now"} onPickFile={(f) => onPick("now", f)} />
        <div style={{ flex: 1, minWidth: 0, textAlign: "center", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(23), letterSpacing: s(-0.5), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
        <ProfileOrnament src={then} size={80} ring="#2F8FE0" label="then" alt={`${name} as a kid`} pickLabel={then ? "Change your photo as a kid" : "Add a photo of you as a kid"} onPickFile={(f) => onPick("then", f)} />
      </div>

      <div data-tour="me-bio" style={{ margin: `${s(14)} ${s(18)} 0`, display: "flex", flexDirection: "column", gap: s(8), fontFamily: KARLA }}>
        <InlineText value={bio} placeholder="Write a line about you" label="A line about you" max={bioMax} onSave={onBio} style={{ fontFamily: FRAUNCES, fontWeight: 600, fontSize: s(17), letterSpacing: s(-0.2) }} />
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: `${s(6)} ${s(14)}` }}>
          {questions.map((q) => (
            <span key={q.id} style={{ display: "inline-flex", alignItems: "baseline", gap: s(5), maxWidth: "100%" }}>
              {q.week !== undefined && (
                <span title="This week’s question" aria-label={`This week’s question, week ${q.week}`} style={{ alignSelf: "center", flex: "none", padding: `${s(2)} ${s(4)}`, borderRadius: s(5), background: "#27305A", fontSize: s(10.5), fontWeight: 800, color: "#F7CB4D", lineHeight: 1 }}>
                  {q.week}
                </span>
              )}
              <span aria-hidden="true" style={{ flex: "none", display: "inline-block", transform: "skewX(-7deg)", fontFamily: FRAUNCES, fontWeight: 700, fontSize: s(13.5), color: q.color }}>{q.text}</span>
              <InlineText value={q.answer ?? ""} placeholder="tap to answer" label={q.text} max={answerMax} onSave={(t) => onAnswer(q.id, t)} style={{ fontFamily: KARLA, fontSize: s(13.5), fontWeight: 700 }} />
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
