import { useId, useState, type CSSProperties, type ReactNode } from "react";
import type { Party } from "../home/types";
import { FRAUNCES, KARLA, NAVY, s } from "../home/units";
import { PartyAvatar } from "../messages/avatar";
import { FrameMini } from "./framed-photo";
import { StampArt } from "./gift-stamp";
import { handLook, NOTE_GREY, PAPER_PANEL, RED, TILE, TILE_ON } from "./gift-looks";
import "./gifts.css";
import { PaperDefs, PaperFill } from "./wrap-pattern";

// The five steps' panels, from design-ref/project/GiftCompose.dc.html.

const heading: CSSProperties = { margin: 0, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(17) };
const aside: CSSProperties = { fontSize: s(12), fontWeight: 700, color: NOTE_GREY };
const plain: CSSProperties = { margin: 0, fontSize: s(13.5), color: NOTE_GREY };
const label: CSSProperties = { fontSize: s(14), fontWeight: 800 };
const NAVY_RING = `0 0 0 ${s(2)} ${PAPER_PANEL}, 0 0 0 ${s(4)} ${NAVY}`;
const FAINT_RING = `0 0 0 ${s(1)} rgba(43,51,80,.3)`;

function Top({ title, right, labelFor }: { title: string; right?: ReactNode; labelFor?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: s(8) }}>
      {labelFor ? (
        <label htmlFor={labelFor} style={heading}>
          {title}
        </label>
      ) : (
        <h2 style={heading}>{title}</h2>
      )}
      {right && <span style={aside}>{right}</span>}
    </div>
  );
}

/** A plain button with its visuals inside; at least 44px to tap unless the design says otherwise. */
const bare: CSSProperties = { padding: 0, border: 0, background: "none", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };

const sectionColor: Readonly<Record<string, string>> = { groups: "#2F6FA8", nest: "#8E2A1E", branches: "#A86A12", everyone: NOTE_GREY };

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div data-recipient-section={id} style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: s(12), fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: sectionColor[id] }}>{title}</span>
      {/* One row that scrolls sideways when it's full: a horizontal list on mobile. */}
      <div className="gf-row" style={{ display: "flex", gap: s(6), overflowX: "auto", padding: `${s(6)} ${s(2)} ${s(2)}` }}>
        {children}
      </div>
    </div>
  );
}

function PartyTile({ party, picked, onPick }: { party: Party; picked: boolean; onPick: (p: Party) => void }) {
  return (
    <button type="button" aria-label={party.name} aria-pressed={picked} onClick={() => onPick(party)} style={{ ...bare, flex: "none", width: s(62), minHeight: s(76), flexDirection: "column", justifyContent: "flex-start", gap: s(4) }}>
      <span data-picked={picked || undefined} style={{ width: s(48), height: s(48), boxSizing: "border-box", borderRadius: "50%", border: `${s(2)} solid ${NAVY}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: picked ? `0 0 0 ${s(2)} ${PAPER_PANEL}, 0 0 0 ${s(5)} ${RED}` : "none" }}>
        <PartyAvatar party={party} size={46} />
      </span>
      <span className="gf-two-lines" style={{ maxWidth: "100%", fontSize: s(12), fontWeight: 800, lineHeight: 1.15, textAlign: "center" }}>
        {party.name}
      </span>
    </button>
  );
}

function Everyone({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button type="button" aria-label="See everyone" aria-expanded={false} onClick={onClick} style={{ ...bare, flex: "none", width: s(62), minHeight: s(76), flexDirection: "column", justifyContent: "flex-start", gap: s(4) }}>
      <span style={{ width: s(48), height: s(48), boxSizing: "border-box", borderRadius: "50%", border: `${s(2)} dashed ${NAVY}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: s(13) }}>+{count}</span>
      <span style={{ fontSize: s(12), fontWeight: 800 }}>everyone</span>
    </button>
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

/** Who's it for? (GIFT-4): groups first, then the rings, each one row. Search sits behind the magnifier. */
export function ToStep({ sections, query, onQuery, picked, onPick }: ToStepProps) {
  const [showAll, setShowAll] = useState(false);
  const [searching, setSearching] = useState(false);
  const { groups, nest, branches, everyone } = sections;
  const nobody = !groups.length && !nest.length && !branches.length && !everyone.length;
  const filtering = !!query.trim();
  const tiles = (list: readonly Party[]) => list.map((p) => <PartyTile key={p.id} party={p} picked={p.id === picked} onPick={onPick} />);
  const everyoneShown = filtering || showAll;
  const more = everyone.length > 0 && !everyoneShown ? <Everyone count={everyone.length} onClick={() => setShowAll(true)} /> : null;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: s(-6) }}>
        <h2 style={heading}>Who&apos;s it for?</h2>
        <button type="button" aria-label="Search friends" aria-expanded={searching} onClick={() => setSearching(!searching)} style={{ ...bare, width: 44, minHeight: 44, marginRight: s(-10) }}>
          <svg width={s(19)} height={s(19)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
        </button>
      </div>
      {searching && (
        <input type="search" autoFocus aria-label="Search people" placeholder="search" value={query} onChange={(e) => onQuery(e.target.value)} style={{ minHeight: 44, boxSizing: "border-box", padding: `0 ${s(14)}`, borderRadius: s(22), border: `${s(2)} solid ${NAVY}`, background: "#FFFDF6", font: "inherit", fontSize: s(15), color: NAVY, outline: 0 }} />
      )}
      {nobody && <p style={plain}>{filtering ? "Nobody by that name." : "People show up here once they're in your circle."}</p>}
      {groups.length > 0 && (
        <Section id="groups" title="your groups">
          {tiles(groups)}
        </Section>
      )}
      {nest.length > 0 && (
        <Section id="nest" title="your nest">
          {tiles(nest)}
        </Section>
      )}
      {branches.length > 0 && (
        <Section id="branches" title="branches">
          {tiles(branches)}
          {more}
        </Section>
      )}
      {!branches.length && more && (
        <Section id="everyone" title="everyone">
          {more}
        </Section>
      )}
      {everyone.length > 0 && everyoneShown && (
        <Section id="everyone" title="everyone">
          {tiles(everyone)}
        </Section>
      )}
    </>
  );
}

function Tick() {
  return (
    <span aria-hidden="true" style={{ position: "absolute", right: s(6), top: s(6), width: s(22), height: s(22), boxSizing: "border-box", borderRadius: "50%", background: RED, border: `${s(2)} solid #FFF6DA`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={s(12)} height={s(12)} viewBox="0 0 24 24" fill="none" stroke="#FFF6DA" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
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
      <Top title="Pick a photo" right="from your camera roll" />
      {!loading && !photos.length && (
        <>
          <p style={plain}>Your photos live in Daily 5. Add some there, then come back.</p>
          <button type="button" onClick={onDaily5} style={{ ...bare, alignSelf: "flex-start", minHeight: 44, padding: `0 ${s(16)}`, borderRadius: s(22), border: `${s(2)} solid ${NAVY}`, background: "#FFFDF6", fontSize: s(14), fontWeight: 800 }}>
            Add photos in Daily 5
          </button>
        </>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: s(8) }}>
        {photos.map((p) => {
          const on = p.id === picked;
          return (
            <button key={p.id} type="button" aria-label={p.label} aria-pressed={on} onClick={() => onPick(p.id)} style={{ position: "relative", height: s(98), minHeight: 44, padding: 0, border: 0, borderRadius: s(10), background: TILE, boxShadow: on ? `0 0 0 ${s(3)} ${RED}` : "none", overflow: "hidden", cursor: "pointer" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL from this browser */}
              {p.src && <img src={p.src} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />}
              {on && <Tick />}
            </button>
          );
        })}
      </div>
      {hasMore && (
        <button type="button" onClick={onMore} style={{ ...bare, alignSelf: "center", minHeight: 44, padding: `0 ${s(14)}`, fontSize: s(13), fontWeight: 800, textDecoration: "underline" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: s(8) }}>
        {frames.map((f) => {
          const on = f.id === frame;
          return (
            <button key={f.id} type="button" aria-label={f.label} aria-pressed={on} onClick={() => onFrame(f.id)} style={{ ...bare, height: s(80), minHeight: 44, boxSizing: "border-box", padding: `${s(6)} 0 0`, borderRadius: s(12), border: `${s(2)} solid ${on ? NAVY : "transparent"}`, background: on ? TILE_ON : TILE, flexDirection: "column", justifyContent: "flex-start", gap: s(5) }}>
              <FrameMini frame={f.id} src={src} />
              <span style={{ fontSize: s(12), fontWeight: 800 }}>{f.label}</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${s(2)}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: s(1) }}>
          <span style={label}>Date stamp</span>
          <span style={{ fontSize: s(12), fontWeight: 500, color: NOTE_GREY }}>{stampAllowed ? "the orange date old cameras printed" : "this photo has no capture date"}</span>
        </div>
        <button type="button" role="switch" aria-label="Date stamp" aria-checked={dateStamp} disabled={!stampAllowed} onClick={() => onDateStamp(!dateStamp)} style={{ ...bare, flex: "none", width: s(52), minWidth: 44, minHeight: 44, cursor: stampAllowed ? "pointer" : "default", opacity: stampAllowed ? 1 : 0.5 }}>
          <span style={{ position: "relative", display: "block", width: s(48), height: s(28), boxSizing: "border-box", borderRadius: s(14), border: `${s(2)} solid ${NAVY}`, background: dateStamp ? "#E07A2E" : "#D9CBA4" }}>
            <span style={{ position: "absolute", left: s(dateStamp ? 22 : 2), top: s(2), width: s(20), height: s(20), boxSizing: "border-box", borderRadius: "50%", background: "#FFF6DA", border: `${s(2)} solid ${NAVY}`, transition: "left .2s ease" }} />
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
  placeholder: string;
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
  /** What the handwriting samples say: "Hey Maya". */
  sample: string;
};

/** Write on the back (GIFT-7). Inks and stamps share one row, as designed: 40 wide, at least 44 tall. */
export function NoteStep({ text, count, placeholder, onText, hands, hand, onHand, inks, ink, onInk, stamps, stamp, onStamp, sample }: NoteStepProps) {
  const fieldId = useId();
  const inkColor = inks.find((i) => i.id === ink)?.color;
  return (
    <>
      <Top title="Write on the back" right={count} labelFor={fieldId} />
      <textarea id={fieldId} value={text} placeholder={placeholder} onChange={(e) => onText(e.target.value)} style={{ display: "block", width: "100%", flex: "none", height: s(62), minHeight: 44, boxSizing: "border-box", padding: `${s(8)} ${s(12)}`, borderRadius: s(12), border: `${s(2)} solid ${NAVY}`, background: "#FFFDF6", color: NAVY, fontFamily: KARLA, fontSize: s(15), lineHeight: 1.35, outline: 0, resize: "none" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: s(6) }}>
        {hands.map((h) => {
          const on = h.id === hand;
          const look = handLook(h.id);
          return (
            <button key={h.id} type="button" aria-label={`${h.label} handwriting`} aria-pressed={on} onClick={() => onHand(h.id)} style={{ ...bare, height: s(44), minHeight: 44, boxSizing: "border-box", borderRadius: s(12), border: `${s(2)} solid ${on ? NAVY : "transparent"}`, background: on ? TILE_ON : TILE, color: inkColor, fontFamily: look.family, fontWeight: look.weight, fontSize: s(look.sample), whiteSpace: "nowrap", overflow: "hidden", paddingRight: s(3) }}>
              {sample}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div role="group" aria-label="Ink" style={{ display: "flex", alignItems: "center" }}>
          {inks.map((k) => {
            const on = k.id === ink;
            return (
              <button key={k.id} type="button" aria-label={`${k.label} ink`} aria-pressed={on} onClick={() => onInk(k.id)} style={{ ...bare, width: s(40), height: s(44), minHeight: 44 }}>
                <span style={{ display: "block", width: s(26), height: s(26), boxSizing: "border-box", borderRadius: "50%", background: k.color, border: `${s(3)} solid ${PAPER_PANEL}`, boxShadow: on ? NAVY_RING : FAINT_RING }} />
              </button>
            );
          })}
        </div>
        <div role="group" aria-label="Stamp" style={{ display: "flex", alignItems: "center", gap: s(4) }}>
          {stamps.map((t) => {
            const on = t.id === stamp;
            return (
              <button key={t.id} type="button" aria-label={`${t.label} stamp`} aria-pressed={on} onClick={() => onStamp(t.id)} style={{ ...bare, width: s(40), height: s(46), minHeight: 44 }}>
                <span style={{ display: "block", width: s(38), height: s(46), boxSizing: "border-box", padding: s(3), borderRadius: s(4), border: `${s(2)} solid ${on ? NAVY : "rgba(43,51,80,.2)"}`, background: "#FFFFFF" }}>
                  <svg viewBox="0 0 40 48" aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }}>
                    <StampArt id={t.id} />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function PaperSwatch({ pattern }: { pattern: string }) {
  const id = `swatch${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg viewBox="0 0 50 50" aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }}>
      <defs>
        <PaperDefs id={id} pattern={pattern} />
      </defs>
      <PaperFill id={id} pattern={pattern} shape={(fill) => <rect width="50" height="50" fill={fill} />} />
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
  /** Absent for "right away"; "" for "on a day" before one is picked. */
  day?: string;
  /** "Thu, Nov 12", for the chosen day's button. */
  dayLabel?: string;
  minDay: string;
  onOpens: (day: string | undefined) => void;
};

const segment = (on: boolean): CSSProperties => ({ height: s(38), padding: `0 ${s(12)}`, borderRadius: s(19), background: on ? NAVY : "transparent", color: on ? "#FBF4DD" : NAVY, display: "flex", alignItems: "center", fontWeight: 800, fontSize: s(13) });

/** Wrap it up (GIFT-8). */
export function WrapStep({ patterns, pattern, onPattern, ribbons, ribbon, onRibbon, day, dayLabel, minDay, onOpens }: WrapStepProps) {
  const dayId = useId();
  const on = day !== undefined;
  return (
    <>
      <Top title="Wrap it up" right={patterns.find((p) => p.id === pattern)?.label} />
      <div role="group" aria-label="Wrapping paper" style={{ display: "flex", justifyContent: "space-between" }}>
        {patterns.map((p) => {
          const picked = p.id === pattern;
          return (
            <button key={p.id} type="button" aria-label={`${p.label} paper`} aria-pressed={picked} onClick={() => onPattern(p.id)} style={{ width: s(50), height: s(50), minWidth: 44, minHeight: 44, boxSizing: "border-box", padding: 0, borderRadius: s(12), border: `${s(2)} solid ${NAVY}`, overflow: "hidden", background: "none", boxShadow: picked ? `0 0 0 ${s(3)} ${PAPER_PANEL}, 0 0 0 ${s(5)} ${RED}` : "none", cursor: "pointer" }}>
              <PaperSwatch pattern={p.id} />
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: s(2) }}>
        <span style={label}>Ribbon</span>
        <div role="group" aria-label="Ribbon" style={{ display: "flex", alignItems: "center" }}>
          {ribbons.map((r) => {
            const picked = r.id === ribbon;
            return (
              <button key={r.id} type="button" aria-label={`${r.label} ribbon`} aria-pressed={picked} onClick={() => onRibbon(r.id)} style={{ ...bare, width: 44, minHeight: 44 }}>
                <span style={{ display: "block", width: s(28), height: s(28), boxSizing: "border-box", borderRadius: "50%", background: r.color, border: `${s(3)} solid ${PAPER_PANEL}`, boxShadow: picked ? NAVY_RING : FAINT_RING }} />
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={label}>Opens</span>
        {/* The track is 44 tall, so the 38px pills inside it are 44 to tap. */}
        <div style={{ display: "flex", minHeight: 44, height: s(44), boxSizing: "border-box", borderRadius: s(22), background: TILE }}>
          <button type="button" aria-pressed={!on} onClick={() => onOpens(undefined)} style={{ ...bare, padding: `0 ${s(3)}` }}>
            <span style={segment(!on)}>right away</span>
          </button>
          <button type="button" aria-pressed={on} onClick={() => onOpens(day ?? "")} style={{ ...bare, padding: `0 ${s(3)}` }}>
            <span style={segment(on)}>on a day</span>
          </button>
        </div>
      </div>
      {on && (
        // The design's day button; the date input over it opens the system date picker (a native picker on mobile).
        <label style={{ position: "relative", alignSelf: "flex-end", minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer" }}>
          <span style={{ height: s(32), padding: `0 ${s(12)}`, display: "flex", alignItems: "center", gap: s(6), borderRadius: s(16), border: `${s(2)} solid ${NAVY}`, background: "#FFFDF6", fontWeight: 800, fontSize: s(13) }}>
            <svg width={s(14)} height={s(14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="5" width="16" height="15" rx="2" />
              <path d="M4 10h16M9 3v4M15 3v4" />
            </svg>
            {day ? dayLabel : "Pick a day"}
          </span>
          <input id={dayId} type="date" aria-label="Opens on" min={minDay} value={day ?? ""} onChange={(e) => onOpens(e.target.value)} style={{ position: "absolute", inset: 0, width: "100%", minHeight: 44, opacity: 0, cursor: "pointer" }} />
        </label>
      )}
    </>
  );
}
