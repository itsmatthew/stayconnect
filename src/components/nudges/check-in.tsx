import type { CSSProperties, ReactNode } from "react";
import type { FriendLook } from "../home/types";
import { FRAUNCES, NAVY, s } from "../home/units";
import { CARD, Face, Line988, MainButton, MUTED, NudgeCard } from "./parts";

export type MoodId = "rough" | "meh" | "okay" | "good" | "great";
export type CheckInStep = "ask" | "thanks" | "rough" | "tell" | "shared" | "notNow";

type Props = {
  step: CheckInStep;
  moods: readonly { id: MoodId; label: string }[];
  /** Your check-in people, for "Send it to ‹names›" (NUDGE-15). */
  people: readonly { id: string; name: string; look: FriendLook }[];
  onAnswer: (mood: MoodId) => void;
  onTell: () => void;
  /** Opens the share sheet with the ready text (NUDGE-15). */
  onShare: () => void;
  onNotNow: () => void;
  onPickPeople: () => void;
  onClose: () => void;
};

const MOOD_ICONS: Record<MoodId, ReactNode> = {
  rough: (
    <>
      <path d="M7 15a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1.5A3.5 3.5 0 0 1 17 15z" fill="#8C93A8" />
      <path d="M11 15l-2 4h3l-1.5 3.5" stroke="#F7CB4D" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  meh: <path d="M6 17a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1.5A3.5 3.5 0 0 1 16 17z" fill="#B3B9C9" />,
  okay: (
    <>
      <circle cx="9" cy="9" r="4" fill="#F7CB4D" />
      <path d="M8 18a3.5 3.5 0 0 1 .4-7 4.5 4.5 0 0 1 8.6 1.4A3 3 0 0 1 17 18z" fill="#D6DBE6" />
    </>
  ),
  good: (
    <>
      <circle cx="12" cy="12" r="5" fill="#F7CB4D" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" stroke="#F7CB4D" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  great: (
    <>
      <circle cx="12" cy="12" r="6" fill="#F7B92D" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="#F7B92D" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
};

/** The Sunday check-in (docs/specs/nudges.md, NUDGE-13 to NUDGE-16), from UxCheckIn.dc.html, your side. */
export function CheckInCard(p: Props) {
  // Closing before answering skips the week; after answering, closing is just closing.
  return (
    <NudgeCard title={p.step === "ask" ? "Sunday check-in" : "Your check-in"} onClose={p.onClose} dim={p.step === "ask" ? 0.35 : 0.45}>
      {p.step === "ask" && <Ask {...p} />}
      {p.step === "thanks" && (
        <>
          <Title>Thanks for checking in.</Title>
          <Body>See you next Sunday.</Body>
          <MainButton onClick={p.onClose} style={{ marginTop: s(14) }}>
            Close
          </MainButton>
        </>
      )}
      {p.step === "rough" && (
        <>
          <Title>Thanks for being honest.</Title>
          <Body>Your people are here for you.</Body>
          <Choice strong onClick={p.onTell} title="Let my people know I’m having a rough week" note="No shame in it. They’ll know to reach out." />
          <Choice onClick={p.onNotNow} title="Not right now" note="That’s okay too." />
          <Line988 style={{ marginTop: s(12) }} />
        </>
      )}
      {p.step === "tell" && <Tell {...p} />}
      {p.step === "shared" && (
        <>
          <Title>Sent.</Title>
          <Body>Hope you have a better week. Remember, you are loved.</Body>
          <Line988 style={{ marginTop: s(12) }} />
          <MainButton onClick={p.onClose} style={{ marginTop: s(14) }}>
            Close
          </MainButton>
        </>
      )}
      {p.step === "notNow" && (
        <>
          <Title>That’s okay.</Title>
          <Body>
            Nobody will know you answered. If you change your mind, you can check in anytime from <b>Me</b>.
          </Body>
          <Line988 style={{ marginTop: s(12) }} />
          <MainButton onClick={p.onClose} style={{ marginTop: s(14) }}>
            Close
          </MainButton>
        </>
      )}
    </NudgeCard>
  );
}

function Ask({ moods, onAnswer, onClose }: Props) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ fontSize: s(10.5), fontWeight: 800, letterSpacing: ".14em", color: "#B43A2A" }}>SUNDAY CHECK-IN</div>
        <button type="button" aria-label="Not this week" onClick={onClose} style={{ width: 44, height: 44, margin: `${s(-12)} ${s(-8)} ${s(-20)} 0`, padding: 0, border: 0, background: "none", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width={s(16)} height={s(16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <h2 style={{ margin: `${s(3)} 0 0`, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(22), lineHeight: s(26) }}>How have you really been this week?</h2>
      <Body>Not the “I’m fine” answer. There’s no wrong one.</Body>
      <div role="group" aria-label="How was your week" style={{ display: "flex", justifyContent: "space-between", marginTop: s(16) }}>
        {moods.map((m) => (
          <button key={m.id} type="button" aria-label={`${m.label} week`} onClick={() => onAnswer(m.id)} style={{ width: s(58), padding: 0, border: 0, background: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: s(6), color: NAVY, cursor: "pointer" }}>
            <span style={{ width: s(56), height: s(56), minHeight: 44, boxSizing: "border-box", borderRadius: s(18), background: "#F3EEDD", border: `${s(2)} solid #DCCB9A`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={s(34)} height={s(34)} viewBox="0 0 24 24" aria-hidden="true">
                {MOOD_ICONS[m.id]}
              </svg>
            </span>
            <span style={{ fontSize: s(12), fontWeight: 800 }}>{m.label}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: s(6), marginTop: s(14), fontSize: s(12), fontWeight: 700, color: MUTED }}>
        <svg width={s(12)} height={s(12)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        Only you see your answer. Always.
      </div>
    </>
  );
}

/** NUDGE-15: you send the text yourself; the app never claims it reached anyone. */
function Tell({ people, onShare, onPickPeople, onNotNow }: Props) {
  if (!people.length) {
    return (
      <>
        <Title>Who should know?</Title>
        <Body>Pick a few people you’re close to in real life. Only they hear, and only when you choose.</Body>
        <MainButton onClick={onPickPeople} style={{ marginTop: s(14) }}>
          Pick your check-in people first
        </MainButton>
        <Choice onClick={onNotNow} title="Not right now" note="That’s okay too." />
        <Line988 style={{ marginTop: s(12) }} />
      </>
    );
  }
  const names = people.map((f) => f.name);
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  return (
    <>
      <Title>Send it to your people</Title>
      <Body>We’ll open your messages with it written. You choose who gets it.</Body>
      <div style={{ display: "flex", marginTop: s(12) }}>
        {people.map((f, i) => (
          <span key={f.id} style={{ marginLeft: i ? s(-6) : 0 }}>
            <Face look={f.look} size={38} gap={CARD} ring={NAVY} />
          </span>
        ))}
      </div>
      <div style={{ fontSize: s(12), color: "#7A6B48", marginTop: s(6) }}>Send it to {list}</div>
      <blockquote style={{ margin: `${s(12)} 0 0`, padding: `${s(10)} ${s(14)}`, borderRadius: s(14), background: "#FBF2DC", border: `${s(2)} solid #DCCB9A`, fontSize: s(13.5), lineHeight: 1.4 }}>Having a rough week. Would mean a lot if you checked in on me.</blockquote>
      <MainButton onClick={onShare} style={{ marginTop: s(14) }}>
        Send it
      </MainButton>
      <Choice onClick={onNotNow} title="Not right now" note="That’s okay too." />
      <Line988 style={{ marginTop: s(12) }} />
    </>
  );
}

function Title({ children }: { children: ReactNode }) {
  return <h2 style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(22), lineHeight: s(26) }}>{children}</h2>;
}
function Body({ children }: { children: ReactNode }) {
  return <p style={{ margin: `${s(5)} 0 0`, fontSize: s(13.5), lineHeight: 1.45, color: "#3F4664" }}>{children}</p>;
}
function Choice({ title, note, onClick, strong = false }: { title: string; note: string; onClick: () => void; strong?: boolean }) {
  const style: CSSProperties = { display: "block", width: "100%", marginTop: s(8), padding: `${s(10)} ${s(14)}`, borderRadius: s(18), border: `${s(2)} solid ${strong ? NAVY : "#DCCB9A"}`, background: strong ? "#FBF2DC" : CARD, textAlign: "left", color: NAVY, cursor: "pointer" };
  return (
    <button type="button" onClick={onClick} style={style}>
      <span style={{ display: "block", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(15) }}>{title}</span>
      <span style={{ display: "block", fontSize: s(12), lineHeight: 1.35, color: MUTED, marginTop: s(2) }}>{note}</span>
    </button>
  );
}
