import { useState, type CSSProperties, type ReactNode } from "react";
import { faceGradient } from "../messages/avatar";
import { FRAUNCES, KARLA, NAVY, PAPER, s } from "../home/units";
import { RING_NAMES } from "./circle-tree";
import { RINGS, type CirclePerson, type CircleSuggestion, type Ring } from "./types";

const BLURBS: Readonly<Record<Ring, string>> = {
  nest: "your home people, the ones you love most",
  branches: "the friends you keep close",
  bloom: "the wider circle you're glad to know",
};
const NOTES: Readonly<Record<Ring, string>> = {
  nest: "Your nest is getting big — most people keep it under 10",
  branches: "Your branches are getting full — most people keep them under 25",
  bloom: "Your bloom is getting big — most people keep it under 75",
};
const RED = "#B43A2A";
const CREAM_TEXT = "#FFF6DA";

type RingCardProps = {
  people: readonly CirclePerson[];
  /** Rings past their soft guide's upper end (CIRCLE-2). */
  crowded: readonly Ring[];
  suggestion?: CircleSuggestion;
  onAcceptSuggestion: () => void;
  onDismissSuggestion: () => void;
  onOpenChat: (id: string) => void;
  onMove: (id: string, ring: Ring) => void;
};

/** The Nest / Branches / Bloom card under the tree (CIRCLE-5/8/9). 362 design px wide. */
export function RingCard({ people, crowded, suggestion, onAcceptSuggestion, onDismissSuggestion, onOpenChat, onMove }: RingCardProps) {
  const [ring, setRing] = useState<Ring>("nest");
  const [menuFor, setMenuFor] = useState<CirclePerson | null>(null);
  const [adding, setAdding] = useState(false);
  const theirs = people.filter((p) => p.ring === ring);
  const nobody = !people.some((p) => p.ring);

  return (
    <section
      aria-label="Your rings"
      style={{
        position: "relative",
        boxSizing: "border-box",
        width: s(362),
        padding: `${s(10)} ${s(12)}`,
        borderRadius: s(18),
        background: PAPER,
        border: `${s(2)} solid ${NAVY}`,
        display: "flex",
        flexDirection: "column",
        gap: s(7),
        fontFamily: KARLA,
        color: NAVY,
      }}
    >
      {suggestion && (
        <section aria-label="Suggestion" style={{ display: "flex", alignItems: "center", gap: s(6), padding: `${s(4)} ${s(6)} ${s(4)} ${s(8)}`, borderRadius: s(12), background: "#FBE7B5", border: `${s(1.5)} dashed ${NAVY}` }}>
          <span style={{ flex: 1, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 600, fontSize: s(12), lineHeight: 1.2 }}>
            You and {suggestion.name} have been close lately — move to {RING_NAMES[suggestion.to]}?
          </span>
          <button type="button" onClick={onAcceptSuggestion} style={pill(true)}>
            Move
          </button>
          <button type="button" onClick={onDismissSuggestion} style={pill(false)}>
            Not now
          </button>
        </section>
      )}

      <div role="tablist" aria-label="Rings" style={{ display: "flex", borderRadius: s(12), background: "#EADDB8", padding: s(3) }}>
        {RINGS.map((r) => {
          const on = r === ring;
          return (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setRing(r);
                setMenuFor(null);
                setAdding(false);
              }}
              style={{
                flex: 1,
                height: s(44),
                border: 0,
                borderRadius: s(10),
                background: on ? RED : "none",
                color: on ? CREAM_TEXT : NAVY,
                fontFamily: FRAUNCES,
                fontWeight: on ? 800 : 600,
                fontSize: s(15),
                cursor: "pointer",
              }}
            >
              {RING_NAMES[r]} <span style={{ fontFamily: KARLA, fontSize: s(12), fontWeight: 700 }}>{people.filter((p) => p.ring === r).length}</span>
            </button>
          );
        })}
      </div>

      <div style={{ fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 500, fontSize: s(14), paddingLeft: s(2) }}>{BLURBS[ring]}</div>
      {crowded.includes(ring) && <div style={{ fontSize: s(11.5), fontWeight: 700, color: "#8E2A1E", paddingLeft: s(2) }}>{NOTES[ring]}</div>}
      {nobody && <div style={{ fontSize: s(12), fontWeight: 600, paddingLeft: s(2) }}>Your circle fills as you connect with people</div>}

      <div style={{ display: "flex", alignItems: "flex-start", gap: s(8) }}>
        <ul aria-label="People in this ring" style={{ display: "flex", gap: s(8), margin: 0, padding: `${s(2)} ${s(2)} ${s(4)}`, listStyle: "none", overflowX: "auto", flex: "0 1 auto", minWidth: 0 }}>
          {theirs.map((p) => (
            <li key={p.id}>
              <button type="button" aria-haspopup="menu" onClick={() => setMenuFor(p)} style={personButton}>
                <Face person={p} />
                <span style={{ fontSize: s(11), fontWeight: 700 }}>{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" aria-label={`Add to ${RING_NAMES[ring]}`} onClick={() => setAdding(true)} style={{ ...personButton, flex: "none", paddingTop: s(2) }}>
          <span aria-hidden="true" style={{ width: s(44), height: s(44), boxSizing: "border-box", borderRadius: "50%", border: `${s(2)} dashed ${NAVY}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={s(16)} height={s(16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span style={{ fontSize: s(11), fontWeight: 700 }}>add</span>
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: s(5), fontSize: s(10.5), fontWeight: 500, color: "#3F4664", paddingLeft: s(2) }}>
        <svg width={s(11)} height={s(11)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <span>Only you see your circle. No one is told which ring they&apos;re in.</span>
      </div>

      {menuFor && (
        <Overlay onClose={() => setMenuFor(null)}>
          <div role="menu" aria-label={menuFor.name} style={{ display: "flex", flexDirection: "column", gap: s(6) }}>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuFor(null);
                onOpenChat(menuFor.id);
              }}
              style={menuItem(true)}
            >
              Message {menuFor.name}
            </button>
            {RINGS.filter((r) => r !== menuFor.ring).map((r) => (
              <button
                key={r}
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuFor(null);
                  onMove(menuFor.id, r);
                }}
                style={menuItem(false)}
              >
                Move to {RING_NAMES[r]}
              </button>
            ))}
          </div>
        </Overlay>
      )}

      {adding && (
        <Overlay onClose={() => setAdding(false)}>
          <div role="dialog" aria-label={`Add to ${RING_NAMES[ring]}`} style={{ display: "flex", flexDirection: "column", gap: s(8) }}>
            <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(16) }}>Add to {RING_NAMES[ring]}</div>
            <AddChoices
              people={people.filter((p) => p.ring !== ring)}
              onPick={(id) => {
                setAdding(false);
                onMove(id, ring);
              }}
            />
          </div>
        </Overlay>
      )}
    </section>
  );
}

function AddChoices({ people, onPick }: { people: readonly CirclePerson[]; onPick: (id: string) => void }) {
  if (!people.length) {
    return <p style={{ margin: 0, fontSize: s(12.5), fontWeight: 600 }}>No one to add yet. Your circle fills as you connect with people.</p>;
  }
  return (
    <div style={{ display: "flex", gap: s(8), overflowX: "auto", padding: `${s(2)} ${s(2)} ${s(4)}` }}>
      {people.map((p) => (
        <button key={p.id} type="button" aria-label={p.ring ? `${p.name}, in ${RING_NAMES[p.ring]}` : p.name} onClick={() => onPick(p.id)} style={personButton}>
          <Face person={p} />
          <span style={{ fontSize: s(11), fontWeight: 700 }}>{p.name}</span>
          {p.ring && <span style={{ fontSize: s(9.5), fontWeight: 600, opacity: 0.75 }}>in {RING_NAMES[p.ring]}</span>}
        </button>
      ))}
    </div>
  );
}

/** Covers the card, with a Close button; Escape closes it too. */
function Overlay({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      style={{ position: "absolute", inset: 0, zIndex: 3, boxSizing: "border-box", padding: `${s(12)} ${s(14)}`, borderRadius: s(16), background: PAPER, display: "flex", flexDirection: "column", gap: s(8), overflowY: "auto" }}
    >
      {children}
      <button type="button" onClick={onClose} style={{ ...menuItem(false), alignSelf: "flex-start" }}>
        Close
      </button>
    </div>
  );
}

function Face({ person }: { person: CirclePerson }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: s(44),
        height: s(44),
        boxSizing: "border-box",
        borderRadius: "50%",
        background: faceGradient(person.look),
        ...(person.lit
          ? { border: `${s(2)} solid #FFF3C4`, boxShadow: `0 0 0 ${s(1.5)} #FFD75E, 0 0 ${s(9)} ${s(3)} rgba(255,214,90,.9)` }
          : { border: `${s(2)} solid rgba(60,50,40,.55)`, filter: "grayscale(1) brightness(.85)" }),
      }}
    />
  );
}

const personButton: CSSProperties = {
  width: s(52),
  border: 0,
  background: "none",
  padding: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: s(3),
  color: NAVY,
  fontFamily: KARLA,
  cursor: "pointer",
};

const pill = (primary: boolean): CSSProperties => ({
  flex: "none",
  height: s(26),
  padding: `0 ${s(9)}`,
  borderRadius: s(15),
  border: `${s(2)} solid ${NAVY}`,
  background: primary ? RED : "none",
  color: primary ? CREAM_TEXT : NAVY,
  fontFamily: FRAUNCES,
  fontStyle: "italic",
  fontWeight: 700,
  fontSize: s(12.5),
  cursor: "pointer",
});

const menuItem = (primary: boolean): CSSProperties => ({ ...pill(primary), height: s(34), padding: `0 ${s(14)}`, textAlign: "left", fontSize: s(14) });
