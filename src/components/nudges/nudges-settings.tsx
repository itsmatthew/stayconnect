import { useState, type CSSProperties } from "react";
import type { FriendLook } from "../home/types";
import { FRAUNCES, KARLA, NAVY, s } from "../home/units";
import { faceGradient } from "../messages/avatar";
import { CARD, Kicker, Line988, MUTED, RED, SCREEN, Switch, useEscape } from "./parts";

export type PickPerson = { id: string; name: string; look: FriendLook; picked: boolean };
export type PerWeekChoice = 0 | 1 | 2;

type Props = {
  people: readonly PickPerson[];
  pickNote: string;
  onTogglePerson: (id: string) => void;
  sunday: boolean;
  onSunday: (on: boolean) => void;
  onCheckInNow: () => void;
  perWeek: PerWeekChoice;
  onPerWeek: (n: PerWeekChoice) => void;
  freqNote: string;
  quiet: boolean;
  onQuiet: (on: boolean) => void;
  onBack: () => void;
};

const FREQ_LABELS: readonly [PerWeekChoice, string][] = [
  [0, "off"],
  [1, "1 a week"],
  [2, "2 a week"],
];

/** Me → Nudges & check-ins (docs/specs/nudges.md, NUDGE-1 to NUDGE-6), from UxNudges.dc.html. */
export function NudgesSettings(p: Props) {
  const [byNumber, setByNumber] = useState(false);
  useEscape(p.onBack);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nudges-title"
      className="fixed inset-0 z-40 overflow-y-auto [--s:min(calc(100vw/390),1.1px)]"
      style={{ background: SCREEN, fontFamily: KARLA, color: NAVY } as CSSProperties}
    >
      <div style={{ width: s(390), maxWidth: "100%", margin: "0 auto", boxSizing: "border-box", padding: `${s(58)} ${s(20)} ${s(40)}`, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: s(12), marginLeft: s(-6) }}>
          <button type="button" aria-label="Back to Me" onClick={p.onBack} style={{ flex: "none", width: s(40), height: s(40), minWidth: 44, minHeight: 44, borderRadius: "50%", border: `${s(2)} solid ${NAVY}`, background: CARD, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, cursor: "pointer" }}>
            <svg width={s(18)} height={s(18)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <h1 id="nudges-title" style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(28), lineHeight: s(40) }}>
            Nudges &amp; check-ins
          </h1>
        </div>

        <section aria-labelledby="nudges-people" style={{ marginTop: s(24) }}>
          <Kicker>
            <span id="nudges-people">Your check-in people</span>
          </Kicker>
          <p style={{ margin: `${s(8)} 0 0`, fontSize: s(13.5), lineHeight: 1.4, color: "#3F4664" }}>The people who hear when you choose to share a rough week. Pick the ones you’re closest to in real life, not just in the app.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: `${s(12)} ${s(10)}`, marginTop: s(14) }}>
            {p.people.map((f) => (
              <button key={f.id} type="button" aria-label={f.name} aria-pressed={f.picked} onClick={() => p.onTogglePerson(f.id)} style={personButton}>
                <span style={{ position: "relative", width: s(52), height: s(52), borderRadius: "50%", background: faceGradient(f.look), boxShadow: `0 0 0 ${s(2.5)} ${SCREEN}, 0 0 0 ${f.picked ? `${s(5)} ${RED}` : `${s(4.5)} #DCCB9A`}`, transition: "box-shadow .2s" }}>
                  {f.picked && (
                    <span aria-hidden="true" style={{ position: "absolute", right: s(-4), bottom: s(-4), width: s(20), height: s(20), boxSizing: "border-box", borderRadius: "50%", background: RED, border: `${s(2)} solid ${SCREEN}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width={s(10)} height={s(10)} viewBox="0 0 24 24" fill="none" stroke="#FFF6DA" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5 9-10" />
                      </svg>
                    </span>
                  )}
                </span>
                <span style={{ fontSize: s(12), fontWeight: 800, maxWidth: s(62), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
              </button>
            ))}
            <button type="button" aria-label="Add someone not on the app" onClick={() => setByNumber(true)} style={personButton}>
              <span aria-hidden="true" style={{ width: s(48), height: s(48), margin: s(2), boxSizing: "border-box", borderRadius: "50%", border: `${s(2)} dashed ${NAVY}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: s(24), lineHeight: 1 }}>
                +
              </span>
              <span style={{ fontSize: s(12), fontWeight: 800, whiteSpace: "nowrap" }}>by number</span>
            </button>
          </div>
          <p aria-live="polite" style={{ margin: `${s(12)} 0 0`, fontSize: s(12), fontWeight: 700, color: "#7A6B48" }}>
            {byNumber ? "Adding someone by their number comes later." : p.pickNote}
          </p>
        </section>

        <section aria-labelledby="nudges-sunday" style={{ marginTop: s(28) }}>
          <Kicker>
            <span id="nudges-sunday">Sunday check-in</span>
          </Kicker>
          <div style={{ display: "flex", alignItems: "center", gap: s(14), marginTop: s(10) }}>
            <span style={{ flex: 1 }}>
              <span style={rowTitle}>Ask how my week went</span>
              <span style={rowNote}>Sunday evenings. Only you see your answer.</span>
            </span>
            <Switch on={p.sunday} label="Sunday check-in" onChange={p.onSunday} />
          </div>
          <button type="button" onClick={p.onCheckInNow} style={{ marginTop: s(4), minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", alignSelf: "flex-start", cursor: "pointer" }}>
            <span style={{ height: s(32), padding: `0 ${s(14)}`, boxSizing: "border-box", borderRadius: 999, border: `${s(2)} solid ${NAVY}`, display: "flex", alignItems: "center", fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 800, fontSize: s(13.5), color: NAVY }}>Check in now</span>
          </button>
        </section>

        <section aria-labelledby="nudges-freq" style={{ marginTop: s(20) }}>
          <Kicker>
            <span id="nudges-freq">Reach-out nudges</span>
          </Kicker>
          <div role="radiogroup" aria-labelledby="nudges-freq" style={{ display: "flex", marginTop: s(10), padding: s(3), borderRadius: 999, border: `${s(2)} solid #1E2547`, background: CARD }}>
            {FREQ_LABELS.map(([n, label]) => {
              const on = p.perWeek === n;
              return (
                <button key={n} type="button" role="radio" aria-checked={on} onClick={() => p.onPerWeek(n)} style={{ flex: 1, height: s(36), minHeight: 44, border: 0, borderRadius: 999, background: on ? "#1E2547" : "transparent", color: on ? "#FFF6DA" : NAVY, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 600, fontSize: s(16), transition: "background .2s", cursor: "pointer" }}>
                  {label}
                </button>
              );
            })}
          </div>
          <p style={{ margin: `${s(10)} 0 0`, fontSize: s(13.5), lineHeight: 1.4, color: MUTED }}>{p.freqNote}</p>
        </section>

        <section aria-labelledby="nudges-quiet" style={{ marginTop: s(24) }}>
          <Kicker>
            <span id="nudges-quiet">Quiet hours</span>
          </Kicker>
          <div style={{ display: "flex", alignItems: "center", gap: s(14), marginTop: s(10) }}>
            <span style={{ flex: 1 }}>
              <span style={rowTitle}>11 pm to 9 am</span>
              <span style={rowNote}>No nudges while you sleep.</span>
            </span>
            <Switch on={p.quiet} label="Quiet hours" onChange={p.onQuiet} />
          </div>
        </section>

        <Line988 style={{ marginTop: s(26) }} />
      </div>
    </div>
  );
}

const personButton: CSSProperties = { flex: "none", width: s(62), minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: s(6), color: NAVY, cursor: "pointer" };
const rowTitle: CSSProperties = { display: "block", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(18) };
const rowNote: CSSProperties = { display: "block", fontSize: s(13.5), lineHeight: 1.4, color: MUTED, marginTop: s(2) };
