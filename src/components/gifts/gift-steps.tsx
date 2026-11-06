import { useId, useState, type CSSProperties, type ReactNode } from "react";
import type { Party } from "../home/types";
import { CREAM, FRAUNCES, NAVY, s } from "../home/units";
import { PartyAvatar } from "../messages/avatar";
import { FramedPhoto } from "./framed-photo";
import { GiftStamp } from "./gift-stamp";
import { HAND_FONTS, HAND_SCALE } from "./gift-looks";
import { WrapPattern } from "./wrap-pattern";

const heading: CSSProperties = { margin: 0, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 800, fontSize: s(16) };
const aside: CSSProperties = { fontSize: s(11), fontWeight: 700, color: "#3F4664" };
const sectionLabel: CSSProperties = { marginBottom: s(8), fontSize: s(10.5), fontWeight: 800, letterSpacing: s(1), color: "#8A6A1E", textTransform: "uppercase" };
const plain: CSSProperties = { margin: 0, fontSize: s(13.5), color: "#3F4664" };

function Top({ title, right, labelFor }: { title: string; right?: ReactNode; labelFor?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: s(8) }}>
      <h2 style={heading}>{labelFor ? <label htmlFor={labelFor}>{title}</label> : title}</h2>
      {right && <span style={aside}>{right}</span>}
    </div>
  );
}

/** A choice: visuals of any size, in a tap target of at least 44px. */
function Choice({ label, on, onClick, children, style }: { label: string; on: boolean; onClick: () => void; children: ReactNode; style?: CSSProperties }) {
  return (
    <button type="button" aria-label={label} aria-pressed={on} onClick={onClick} style={{ minWidth: 44, minHeight: 44, padding: 0, border: 0, background: "none", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", ...style }}>
      {children}
    </button>
  );
}

const ring = (on: boolean): CSSProperties => ({ boxShadow: on ? `0 0 0 ${s(2)} #FBF3DE, 0 0 0 ${s(4)} ${NAVY}` : "none" });

function Parties({ parties, onPick, picked }: { parties: readonly Party[]; onPick: (party: Party) => void; picked?: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: `${s(8)} ${s(6)}` }}>
      {parties.map((p) => (
        <button key={p.id} type="button" aria-label={p.name} aria-pressed={p.id === picked} onClick={() => onPick(p)} style={{ width: s(62), minWidth: 56, minHeight: 44, padding: 0, border: 0, background: "none", color: NAVY, display: "flex", flexDirection: "column", alignItems: "center", gap: s(9), cursor: "pointer" }}>
          {/* Wider than `ring`: the avatar already has a ring of its own, which would cover it. */}
          <span data-picked={p.id === picked || undefined} style={{ borderRadius: "50%", boxShadow: p.id === picked ? `0 0 0 ${s(8)} ${NAVY}` : "none" }}>
            <PartyAvatar party={p} size={42} />
          </span>
          <span className="gf-two-lines" style={{ fontFamily: FRAUNCES, fontWeight: 700, fontSize: s(11.5), lineHeight: 1.1, textAlign: "center" }}>
            {p.name}
          </span>
        </button>
      ))}
    </div>
  );
}

function Section({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div data-recipient-section={id}>
      <div style={sectionLabel}>{label}</div>
      {children}
    </div>
  );
}

type ToStepProps = {
  sections: { groups: readonly Party[]; nest: readonly Party[]; branches: readonly Party[]; everyone: readonly Party[] };
  query: string;
  onQuery: (q: string) => void;
  /** The chosen party's id. */
  picked?: string;
  onPick: (party: Party) => void;
};

/** Who's it for? (GIFT-4) */
export function ToStep({ sections, query, onQuery, picked, onPick }: ToStepProps) {
  const [showAll, setShowAll] = useState(false);
  const { groups, nest, branches, everyone } = sections;
  const nobody = !groups.length && !nest.length && !branches.length && !everyone.length;
  const searching = !!query.trim();
  return (
    <>
      <Top title="Who's it for?" />
      <input type="search" aria-label="Search people" placeholder="search" value={query} onChange={(e) => onQuery(e.target.value)} style={{ minHeight: 44, boxSizing: "border-box", padding: `0 ${s(14)}`, borderRadius: s(22), border: `${s(2)} solid ${NAVY}`, background: CREAM, font: "inherit", fontSize: s(14), color: NAVY, outline: 0 }} />
      {nobody && <p style={plain}>{searching ? "Nobody by that name." : "People show up here once they're in your circle."}</p>}
      {groups.length > 0 && (
        <Section id="groups" label="your groups">
          <Parties parties={groups} onPick={onPick} picked={picked} />
        </Section>
      )}
      {nest.length > 0 && (
        <Section id="nest" label="your nest">
          <Parties parties={nest} onPick={onPick} picked={picked} />
        </Section>
      )}
      {branches.length > 0 && (
        <Section id="branches" label="branches">
          <Parties parties={branches} onPick={onPick} picked={picked} />
        </Section>
      )}
      {everyone.length > 0 &&
        (searching || showAll ? (
          <Section id="everyone" label="everyone">
            <Parties parties={everyone} onPick={onPick} picked={picked} />
          </Section>
        ) : (
          <button type="button" aria-expanded={false} onClick={() => setShowAll(true)} style={{ alignSelf: "flex-start", minHeight: 44, padding: `0 ${s(14)}`, borderRadius: s(22), border: `${s(1.5)} dashed ${NAVY}`, background: "none", color: NAVY, font: "inherit", fontSize: s(13), fontWeight: 800, cursor: "pointer" }}>
            +{everyone.length} everyone
          </button>
        ))}
    </>
  );
}

type PhotoStepProps = {
  photos: readonly { id: string; label: string; src?: string }[];
  /** Still reading the pools: say nothing yet. */
  loading: boolean;
  picked?: string;
  onPick: (id: string) => void;
  hasMore: boolean;
  onMore: () => void;
  onDaily5: () => void;
};

/** Pick a photo (GIFT-5). */
export function PhotoStep({ photos, loading, picked, onPick, hasMore, onMore, onDaily5 }: PhotoStepProps) {
  return (
    <>
      <Top title="Pick a photo" right="from your photos" />
      {!loading && !photos.length && (
        <>
          <p style={plain}>Your photos live in Daily 5. Add some there, then come back.</p>
          <button type="button" onClick={onDaily5} style={{ alignSelf: "flex-start", minHeight: 44, padding: `0 ${s(16)}`, borderRadius: s(22), border: `${s(2)} solid ${NAVY}`, background: CREAM, color: NAVY, font: "inherit", fontSize: s(14), fontWeight: 800, cursor: "pointer" }}>
            Add photos in Daily 5
          </button>
        </>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: s(6) }}>
        {photos.map((p) => (
          <button key={p.id} type="button" aria-label={p.label} aria-pressed={p.id === picked} onClick={() => onPick(p.id)} style={{ position: "relative", minHeight: 44, height: s(84), padding: 0, border: p.id === picked ? `${s(3)} solid #B73420` : `${s(3)} solid transparent`, borderRadius: s(8), background: "#E7DBB9", overflow: "hidden", cursor: "pointer" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL from this browser */}
            {p.src && <img src={p.src} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />}
          </button>
        ))}
      </div>
      {hasMore && (
        <button type="button" onClick={onMore} style={{ alignSelf: "center", minHeight: 44, padding: `0 ${s(14)}`, border: 0, background: "none", color: NAVY, font: "inherit", fontSize: s(13), fontWeight: 800, textDecoration: "underline", cursor: "pointer" }}>
          Show more
        </button>
      )}
    </>
  );
}

type FrameStepProps = {
  frames: readonly { id: string; label: string; blurb: string }[];
  frame: string;
  onFrame: (id: string) => void;
  src?: string;
  dateStamp: boolean;
  stampAllowed: boolean;
  onDateStamp: (on: boolean) => void;
};

/** Choose a frame (GIFT-6). */
export function FrameStep({ frames, frame, onFrame, src, dateStamp, stampAllowed, onDateStamp }: FrameStepProps) {
  const current = frames.find((f) => f.id === frame);
  return (
    <>
      <Top title="Choose a frame" right={current?.blurb} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: s(6) }}>
        {frames.map((f) => (
          <Choice key={f.id} label={f.label} on={f.id === frame} onClick={() => onFrame(f.id)} style={{ flexDirection: "column", gap: s(3), padding: `${s(6)} 0`, borderRadius: s(10), background: "#F1E5C6", border: `${s(2)} solid ${f.id === frame ? NAVY : "transparent"}` }}>
            <FramedPhoto src={src} alt="" frame={f.id} scale={0.2} />
            <span style={{ fontFamily: FRAUNCES, fontWeight: 700, fontSize: s(11.5) }}>{f.label}</span>
          </Choice>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: s(10) }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: s(13) }}>Date stamp</div>
          <div style={aside}>{stampAllowed ? "the orange date old cameras printed" : "this photo has no capture date"}</div>
        </div>
        <button type="button" role="switch" aria-label="Date stamp" aria-checked={dateStamp} disabled={!stampAllowed} onClick={() => onDateStamp(!dateStamp)} style={{ flex: "none", minWidth: 44, minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", cursor: stampAllowed ? "pointer" : "default", opacity: stampAllowed ? 1 : 0.5 }}>
          <span style={{ width: s(44), height: s(24), boxSizing: "border-box", padding: s(2), borderRadius: s(12), border: `${s(2)} solid ${NAVY}`, background: dateStamp ? "#E8792E" : "#E2D3A8", display: "flex", justifyContent: dateStamp ? "flex-end" : "flex-start" }}>
            <span style={{ width: s(16), height: s(16), borderRadius: "50%", background: CREAM }} />
          </span>
        </button>
      </div>
    </>
  );
}

type Option = { id: string; label: string };
type ColorOption = Option & { color: string };

type NoteStepProps = {
  text: string;
  count: string;
  onText: (text: string) => void;
  hands: readonly Option[];
  hand: string;
  onHand: (id: string) => void;
  inks: readonly ColorOption[];
  ink: string;
  onInk: (id: string) => void;
  stamps: readonly Option[];
  stamp: string;
  onStamp: (id: string) => void;
  /** What the handwriting samples say. */
  sample: string;
};

/** Write on the back (GIFT-7). */
export function NoteStep({ text, count, onText, hands, hand, onHand, inks, ink, onInk, stamps, stamp, onStamp, sample }: NoteStepProps) {
  const fieldId = useId();
  const inkColor = inks.find((i) => i.id === ink)?.color;
  return (
    <>
      <Top title="Write on the back" right={count} labelFor={fieldId} />
      <textarea id={fieldId} rows={2} value={text} onChange={(e) => onText(e.target.value)} style={{ boxSizing: "border-box", minHeight: 44, padding: `${s(8)} ${s(12)}`, borderRadius: s(12), border: `${s(2)} solid ${NAVY}`, background: CREAM, font: "inherit", fontSize: s(14), color: NAVY, outline: 0, resize: "none" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: s(6) }}>
        {hands.map((h) => (
          <Choice key={h.id} label={h.label} on={h.id === hand} onClick={() => onHand(h.id)} style={{ borderRadius: s(10), background: "#F1E5C6", border: `${s(2)} solid ${h.id === hand ? NAVY : "transparent"}` }}>
            <span style={{ fontFamily: HAND_FONTS[h.id], fontSize: s(17 * (HAND_SCALE[h.id] ?? 1)), color: inkColor, whiteSpace: "nowrap", paddingRight: s(5) }}>{sample}</span>
          </Choice>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: s(14) }}>
        {inks.map((i) => (
          <Choice key={i.id} label={i.label} on={i.id === ink} onClick={() => onInk(i.id)}>
            <span style={{ width: s(24), height: s(24), borderRadius: "50%", background: i.color, ...ring(i.id === ink) }} />
          </Choice>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: s(14) }}>
        {stamps.map((st) => (
          <Choice key={st.id} label={st.label} on={st.id === stamp} onClick={() => onStamp(st.id)}>
            <span style={{ display: "block", padding: s(1), ...ring(st.id === stamp) }}>
              <GiftStamp id={st.id} width={s(26)} />
            </span>
          </Choice>
        ))}
      </div>
    </>
  );
}

function PatternSwatch({ pattern }: { pattern: string }) {
  const id = `swatch${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true" style={{ display: "block", width: s(44), height: s(44), borderRadius: s(7) }}>
      <defs>
        <WrapPattern id={id} pattern={pattern} />
      </defs>
      <rect width="60" height="60" fill={`url(#${id})`} />
    </svg>
  );
}

type WrapStepProps = {
  patterns: readonly Option[];
  pattern: string;
  onPattern: (id: string) => void;
  ribbons: readonly ColorOption[];
  ribbon: string;
  onRibbon: (id: string) => void;
  /** The chosen day, or undefined for "right away". */
  day?: string;
  minDay: string;
  onOpens: (day: string | undefined) => void;
};

const segment = (on: boolean): CSSProperties => ({ minHeight: 44, padding: `0 ${s(12)}`, border: 0, borderRadius: s(22), background: on ? NAVY : "transparent", color: on ? CREAM : NAVY, font: "inherit", fontSize: s(12.5), fontWeight: 800, cursor: "pointer" });

/** Wrap it up (GIFT-8). */
export function WrapStep({ patterns, pattern, onPattern, ribbons, ribbon, onRibbon, day, minDay, onOpens }: WrapStepProps) {
  const dayId = useId();
  const on = day !== undefined;
  return (
    <>
      <Top title="Wrap it up" right={patterns.find((p) => p.id === pattern)?.label} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {patterns.map((p) => (
          <Choice key={p.id} label={p.label} on={p.id === pattern} onClick={() => onPattern(p.id)}>
            <span style={{ display: "block", borderRadius: s(7), ...ring(p.id === pattern) }}>
              <PatternSwatch pattern={p.id} />
            </span>
          </Choice>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: s(13) }}>Ribbon</span>
        <div style={{ display: "flex", gap: s(6) }}>
          {ribbons.map((r) => (
            <Choice key={r.id} label={r.label} on={r.id === ribbon} onClick={() => onRibbon(r.id)}>
              <span style={{ width: s(24), height: s(24), borderRadius: "50%", background: r.color, border: `${s(1)} solid rgba(43,51,80,.3)`, ...ring(r.id === ribbon) }} />
            </Choice>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: s(13) }}>Opens</span>
        <div style={{ display: "flex", borderRadius: s(22), background: "#F1E5C6" }}>
          <button type="button" aria-pressed={!on} onClick={() => onOpens(undefined)} style={segment(!on)}>
            right away
          </button>
          <button type="button" aria-pressed={on} onClick={() => onOpens(day ?? minDay)} style={segment(on)}>
            on a day
          </button>
        </div>
      </div>
      {on && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: s(10) }}>
          <label htmlFor={dayId} style={{ fontWeight: 800, fontSize: s(13) }}>
            Opens on
          </label>
          <input id={dayId} type="date" min={minDay} value={day} onChange={(e) => onOpens(e.target.value)} style={{ minHeight: 44, boxSizing: "border-box", padding: `0 ${s(12)}`, borderRadius: s(14), border: `${s(2)} solid ${NAVY}`, background: CREAM, font: "inherit", fontSize: s(14), color: NAVY }} />
        </div>
      )}
    </>
  );
}
