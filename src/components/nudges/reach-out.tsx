import { useId, type CSSProperties, type ReactNode } from "react";
import type { ArtKind, FriendLook } from "../home/types";
import { MemoryArt } from "../home/memory-art";
import { FRAUNCES, KARLA, NAVY, s } from "../home/units";
import { CARD, CloseX, DOTTED, Face, FAINT, MainButton, NudgeCard, RED, SCREEN, useEscape } from "./parts";

export type ReachKind = "memory" | "throwback" | "plans";
export type ReachRowView = { id: string; name: string; look: FriendLook; line: string; action: string; kind: ReachKind; done: boolean };

/** "Reach out today" (docs/specs/nudges.md, NUDGE-9), from UxReachOut.dc.html's first screen. */
export function ReachOutSheet({ rows, onAction, onClose }: { rows: readonly ReachRowView[]; onAction: (id: string) => void; onClose: () => void }) {
  return (
    <NudgeCard title="Reach out today" onClose={onClose} dim={0.35}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(22) }}>Reach out today</h2>
        <CloseX onClick={onClose} />
      </div>
      <p style={{ margin: `${s(2)} 0 ${s(8)}`, fontSize: s(13.5), color: "#6A604C" }}>
        {rows.length === 3 ? "Three people" : rows.length === 2 ? "Two people" : "Someone"} you haven’t caught up with in a while. They’ll be gladder than you think.
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: `0 0 ${s(2)}` }}>
        {rows.map((r, i) => (
          <li key={r.id} style={{ display: "flex", alignItems: "center", gap: s(12), padding: `${s(11)} 0`, borderTop: i ? `${s(1.5)} dotted ${DOTTED}` : 0 }}>
            <Face look={r.look} size={46} gap={CARD} glow={r.done} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(17) }}>{r.name}</span>
              <span style={{ display: "block", fontSize: s(12), fontWeight: 700, color: FAINT }}>{r.line}</span>
            </span>
            {r.done ? (
              <span style={{ flex: "none", fontSize: s(12), fontWeight: 800, color: "#4F7A36" }}>Sent</span>
            ) : (
              <button type="button" aria-label={`${r.action} with ${r.name}`} onClick={() => onAction(r.id)} style={{ flex: "none", minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", cursor: "pointer" }}>
                <span style={{ padding: `${s(7)} ${s(11)}`, borderRadius: s(14), background: i === 0 ? RED : "#F3E7C6", color: i === 0 ? "#FFF6DA" : NAVY, fontSize: s(12), fontWeight: 800 }}>{r.action}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </NudgeCard>
  );
}

export type ShareTile = { id: string; src?: string; art?: ArtKind; from: string };

type ShareProps = {
  kind: ReachKind;
  name: string;
  look: FriendLook;
  tiles: readonly ShareTile[];
  selected?: string;
  onSelect: (id: string) => void;
  /** The photo picked from your camera roll, once read. */
  picked?: { src: string };
  onPickFile: (f: File) => void;
  starters: readonly string[];
  note: string;
  onNote: (text: string) => void;
  canSend: boolean;
  onSend: () => void;
  onBack: () => void;
};

const KICKERS: Record<ReachKind, string> = { memory: "Share a memory", throwback: "Send a throwback", plans: "Make plans" };
/** The camera-roll tile's id. */
export const PICKED = "picked";

/** Share a memory / Send a throwback / Make plans (NUDGE-10, NUDGE-12), from UxReachOut.dc.html's second screen. */
export function ReachOutShare(p: ShareProps) {
  const titleId = useId();
  const noteId = useId();
  useEscape(p.onBack);
  const photos = p.kind !== "plans";
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-40 overflow-y-auto [--s:min(calc(100vw/390),1.1px)]" style={{ background: SCREEN, fontFamily: KARLA, color: NAVY } as CSSProperties}>
      <div style={{ width: s(390), maxWidth: "100%", margin: "0 auto", boxSizing: "border-box", padding: `${s(46)} ${s(20)} ${s(40)}`, display: "flex", flexDirection: "column" }}>
        <button type="button" aria-label="Back" onClick={p.onBack} style={{ alignSelf: "flex-start", width: 44, height: 44, marginLeft: s(-10), padding: 0, border: 0, background: "none", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: s(12) }}>
          <Face look={p.look} size={52} />
          <h1 id={titleId} style={{ margin: 0 }}>
            <span style={{ display: "block", fontSize: s(10.5), fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#B43A2A" }}>{KICKERS[p.kind]}</span>
            <span style={{ display: "block", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(22) }}>with {p.name}</span>
          </h1>
        </div>
        {photos && (
          <>
            <p style={{ margin: `${s(18)} 0 0`, fontSize: s(13.5), color: "#3F4664" }}>{p.tiles.length ? "Pick one. These are photos you two share." : "Pick one from your photos."}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${s(16)} ${s(12)}`, marginTop: s(12) }}>
              {p.tiles.map((t, i) => (
                <TileButton key={t.id} label={`Memory ${i + 1}, ${t.from}`} on={p.selected === t.id} onClick={() => p.onSelect(t.id)} caption={t.from}>
                  {t.src ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a blob: URL from this browser
                    <img src={t.src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    t.art && (
                      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                        <MemoryArt kind={t.art} cx={50} cy={50} R={50} />
                      </svg>
                    )
                  )}
                </TileButton>
              ))}
              {p.picked ? (
                <TileButton label="Your photo" on={p.selected === PICKED} onClick={() => p.onSelect(PICKED)} caption="From your photos">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL from this browser */}
                  <img src={p.picked.src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                </TileButton>
              ) : null}
              <label style={{ display: "block", cursor: "pointer", color: NAVY }}>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: s(6), height: s(100), borderRadius: s(12), border: `${s(2)} dashed ${NAVY}`, background: CARD }}>
                  <svg width={s(24)} height={s(24)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="9" cy="10" r="2" />
                    <path d="M21 16l-5-5-8 8" />
                  </svg>
                  <span style={{ fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 800, fontSize: s(15) }}>Choose from your photos</span>
                </span>
                <span style={{ display: "block", fontSize: s(12), fontWeight: 700, color: FAINT, marginTop: s(9) }}>None of these? Your camera roll</span>
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Choose from your photos"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) p.onPickFile(f);
                    e.target.value = "";
                  }}
                  style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }}
                />
              </label>
            </div>
          </>
        )}
        <div style={{ marginTop: s(24) }}>
          <div style={{ fontSize: s(10.5), fontWeight: 800, letterSpacing: ".14em", marginBottom: s(8) }}>NEED A START?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: s(7) }}>
            {p.starters.map((t) => (
              <button key={t} type="button" onClick={() => p.onNote(p.note.trim() ? `${p.note.trim()} ${t}` : t)} style={{ minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", cursor: "pointer" }}>
                <span style={{ padding: `${s(7)} ${s(12)}`, borderRadius: 999, background: CARD, border: `${s(2)} solid #DCCB9A`, fontSize: s(13.5), fontWeight: 600, color: NAVY }}>{t}</span>
              </button>
            ))}
          </div>
          <label htmlFor={noteId} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
            Your note
          </label>
          <textarea
            id={noteId}
            value={p.note}
            maxLength={200}
            placeholder="say something with it…"
            onChange={(e) => p.onNote(e.target.value)}
            style={{ display: "block", width: "100%", minHeight: s(84), marginTop: s(14), boxSizing: "border-box", padding: `${s(13)} ${s(15)}`, borderRadius: s(18), background: CARD, border: `${s(2)} solid ${NAVY}`, fontFamily: KARLA, fontSize: s(15), lineHeight: 1.35, color: NAVY, resize: "none" }}
          />
        </div>
        <MainButton onClick={p.onSend} disabled={!p.canSend} style={{ marginTop: s(26), width: s(330), alignSelf: "center" }}>
          Send to {p.name}
        </MainButton>
      </div>
    </div>
  );
}

function TileButton({ label, on, onClick, caption, children }: { label: string; on: boolean; onClick: () => void; caption: string; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} aria-pressed={on} onClick={onClick} style={{ padding: 0, border: 0, background: "none", textAlign: "left", color: NAVY, cursor: "pointer" }}>
      <span style={{ position: "relative", display: "block", height: s(104), borderRadius: s(12), overflow: "hidden", background: "#E9DDBA", boxShadow: on ? `0 0 0 ${s(3.5)} ${RED}` : "none", transition: "box-shadow .15s" }}>
        {children}
        {on && (
          <span aria-hidden="true" style={{ position: "absolute", right: s(6), top: s(6), width: s(22), height: s(22), boxSizing: "border-box", borderRadius: "50%", background: RED, border: `${s(2)} solid ${CARD}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={s(11)} height={s(11)} viewBox="0 0 24 24" fill="none" stroke="#FFF6DA" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-10" />
            </svg>
          </span>
        )}
      </span>
      <span style={{ display: "block", fontSize: s(12), fontWeight: 700, color: FAINT, marginTop: s(7) }}>{caption}</span>
    </button>
  );
}

/** "Sent to ‹name›" (NUDGE-11), from UxReachOut.dc.html's last screen. Pronoun-free: the app doesn't know anyone's. */
export function ReachOutSent({ name, look, faces, onDone }: { name: string; look: FriendLook; faces: readonly { id: string; look: FriendLook; done: boolean }[]; onDone: () => void }) {
  const doneCount = faces.filter((f) => f.done).length;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 41, "--s": "min(100vw / 390, 1.1px)", fontFamily: KARLA, color: NAVY } as CSSProperties}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgba(27,31,52,.45)" }} />
      <div role="dialog" aria-modal="true" aria-label={`Sent to ${name}`} className="hm-anim" style={{ position: "absolute", left: "50%", top: s(250), translate: "-50% 0", width: s(330), boxSizing: "border-box", padding: `${s(22)} ${s(20)} ${s(20)}`, borderRadius: s(24), background: CARD, border: `${s(2)} solid ${NAVY}`, textAlign: "center", boxShadow: "0 14px 30px rgba(20,22,40,.4)", animation: "hm-up .5s cubic-bezier(.3,1.5,.5,1) both" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Face look={look} size={64} gap={CARD} glow />
        </div>
        <h2 style={{ margin: `${s(12)} 0 0`, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(22) }}>Sent to {name}</h2>
        <p style={{ margin: `${s(4)} 0 0`, fontSize: s(13.5), lineHeight: 1.4, color: "#3F4664" }}>Their ornament glows on your tree until they write back.</p>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: s(6), marginTop: s(14), fontSize: s(12), fontWeight: 800, color: "#8A6212" }}>
          {faces.map((f) => (
            <Face key={f.id} look={f.look} size={22} gap={CARD} ring={f.done ? "#F7CB4D" : "transparent"} dim={!f.done} />
          ))}
          <span style={{ marginLeft: s(4) }}>
            {doneCount} of {faces.length} today
          </span>
        </div>
        <MainButton onClick={onDone} style={{ marginTop: s(16) }}>
          Done
        </MainButton>
      </div>
    </div>
  );
}
