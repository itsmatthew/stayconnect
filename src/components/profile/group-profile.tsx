import { useId, type CSSProperties } from "react";
import { MemoryPicture } from "../home/memory-art";
import type { Memory } from "../home/types";
import { FRAUNCES, KARLA, NAVY, PAPER, s } from "../home/units";
import { PartyAvatar } from "../messages/avatar";
import { HeaderPicture, PickArea } from "../shared/header-photo";
import { MembersString } from "./members-string";
import { NextCard } from "./next-card";
import { PhotoGrid } from "./photo-grid";
import type { GroupProfileProps, HeaderSlotView, UpToRow } from "./types";

const roundButton: CSSProperties = {
  position: "absolute",
  top: s(-18),
  width: s(36),
  height: s(36),
  borderRadius: "50%",
  background: PAPER,
  border: `${s(2)} solid ${NAVY}`,
  boxSizing: "border-box",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: NAVY,
  cursor: "pointer",
};
const sectionTitle: CSSProperties = { margin: 0, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(15) };
const UP_TO_CHIPS = ["#C8432B", "#D99A12", "#4F8A3C"];

/**
 * A circle's profile (docs/specs/group-profile.md), from the designer's circle profile reference:
 * members on a string, the band with the logo, the ornaments, recent photos, then and next, and what everyone's up to.
 * No superlatives and no ranking of members, on purpose.
 */
export function GroupProfile(props: GroupProfileProps) {
  const { party, members, ornaments, photos, hasMore, then, goal, upTo, header, onPickHeader, onPickPrompt, onDismissPrompt, onBack, onChangeLogo, onViewOrnament, onSeeAll, onEditGoal, onToggleIn } = props;
  const photosId = useId();
  return (
    <div
      role="main"
      aria-label={`${party.name} profile`}
      className="absolute inset-0 overflow-y-auto [--s:calc(min(100vw,480px)/390)] md:[--s:1.1px]"
      style={{ background: "linear-gradient(#F6ECCD, #F1E2B8)", fontFamily: KARLA, color: NAVY } as CSSProperties}
    >
      <div style={{ width: s(390), margin: "0 auto", paddingBottom: s(36), display: "flex", flexDirection: "column", gap: s(22) }}>
        {/* The two header photos (GP-12), as in the thread, but each one a photo picker. */}
        <div style={{ display: "flex", gap: s(2), height: s(172), background: NAVY, marginBottom: s(-22) }}>
          <HeaderHalf
            slot={header.first}
            changeLabel="Change first photo together"
            empty={{ title: "Add your first photo together", helper: "The oldest photo you can find of this group — the one where it started." }}
            onPick={(f) => onPickHeader("first", f)}
          />
          {header.prompt ? (
            <Prompt text={header.prompt} onPick={onPickPrompt} onDismiss={onDismissPrompt} />
          ) : (
            <HeaderHalf slot={header.last} changeLabel="Change last time together" empty={{ title: "Add a photo from the last time you were all together." }} onPick={(f) => onPickHeader("last", f)} />
          )}
        </div>

        {/* The tree-colour band with the logo on its seam; back and change-logo sit on the band either side (GP-2). */}
        <div style={{ position: "relative" }}>
          <div aria-hidden="true" style={{ height: s(7), display: "flex", borderTop: `${s(2)} solid ${NAVY}`, borderBottom: `${s(2)} solid ${NAVY}` }}>
            <span style={{ flex: 1, background: "#C8432B" }} />
            <span style={{ flex: 1, background: "#F0B429" }} />
            <span style={{ flex: 1, background: "#4F8A3C" }} />
          </div>
          <button type="button" aria-label="Back to the chat" onClick={onBack} style={{ ...roundButton, left: s(10) }}>
            <svg width={s(16)} height={s(16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <div style={{ position: "absolute", left: "50%", top: s(-30), translate: "-50% 0", width: s(66), height: s(66), borderRadius: "50%", background: PAPER, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 ${s(4)} ${s(10)} rgba(27,31,52,.35)` }}>
            <PartyAvatar party={party} size={56} />
          </div>
          <button type="button" aria-label={`Change ${party.name} logo`} onClick={onChangeLogo} style={{ ...roundButton, right: s(10) }}>
            {/* A pencil: the logo is a picture any member can change. */}
            <svg width={s(17)} height={s(17)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20h4L19 9l-4-4L4 16z" />
              <path d="M13.5 6.5l4 4" />
            </svg>
          </button>
          <h1 style={{ margin: `${s(46)} 0 0`, textAlign: "center", fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(22), letterSpacing: s(-0.3) }}>{party.name}</h1>
        </div>

        <MembersString members={members} />

        <section aria-label="Defining memories" style={{ margin: `0 ${s(14)}`, display: "flex", justifyContent: "space-around" }}>
          {ornaments.map((m, i) => (
            <OrnamentButton key={m.id} memory={m} rim={party.palette.rim} label={`View ornament ${i + 1} of ${party.name}`} onClick={() => onViewOrnament(i)} />
          ))}
        </section>

        <section aria-labelledby={photosId} style={{ display: "flex", flexDirection: "column", gap: s(10) }}>
          <div style={{ margin: `0 ${s(14)}`, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <h2 id={photosId} style={sectionTitle}>
              Recent photos
            </h2>
            {hasMore && (
              <button type="button" onClick={onSeeAll} style={{ border: 0, padding: 0, background: "none", font: "inherit", fontWeight: 800, fontSize: s(13), color: "#A8331F", textDecoration: "underline", cursor: "pointer" }}>
                See all
              </button>
            )}
          </div>
          {photos.length ? (
            <PhotoGrid photos={photos} />
          ) : (
            <p style={{ margin: `0 ${s(14)}`, fontSize: s(13.5), fontWeight: 600, color: "#3F4664" }}>No photos yet — send one from Daily 5</p>
          )}
        </section>

        <NextCard then={then} goal={goal} onEditGoal={onEditGoal} onToggleIn={onToggleIn} />

        {upTo.length > 0 && <UpTo rows={upTo} />}
      </div>
    </div>
  );
}

const emptyText: CSSProperties = { fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(14), lineHeight: 1.2 };

/** A set half is its picture; an empty one is a dashed slot saying what belongs there. Either way, a tap picks a photo. */
function HeaderHalf({ slot, changeLabel, empty, onPick }: { slot: HeaderSlotView; changeLabel: string; empty: { title: string; helper?: string }; onPick: (file: File) => void }) {
  const box: CSSProperties = { flex: 1, minWidth: 0 };
  if (slot.set) {
    return (
      <PickArea label={changeLabel} onPick={onPick} style={box}>
        <HeaderPicture pane={slot.pane} />
      </PickArea>
    );
  }
  return (
    <PickArea label={empty.title} onPick={onPick} style={{ ...box, padding: s(8), background: "#F6ECCD" }}>
      <div
        data-empty=""
        style={{ flex: 1, borderRadius: s(12), border: `${s(2)} dashed #A8761A`, padding: s(12), display: "flex", flexDirection: "column", justifyContent: "center", gap: s(6), color: NAVY, textAlign: "center" }}
      >
        <span style={emptyText}>{empty.title}</span>
        {empty.helper && <span style={{ fontSize: s(11.5), fontWeight: 600, lineHeight: 1.25, color: "#3F4664" }}>{empty.helper}</span>}
      </div>
    </PickArea>
  );
}

/** After a goal's date (GP-12): "How was ‹label›? Add a photo from it", or "Not now". */
function Prompt({ text, onPick, onDismiss }: { text: string; onPick: (file: File) => void; onDismiss: () => void }) {
  return (
    <div style={{ flex: 1, minWidth: 0, padding: s(10), background: "#4F8A3C", color: "#FFF6DA", display: "flex", flexDirection: "column", justifyContent: "center", gap: s(10) }}>
      <PickArea label={text} onPick={onPick} style={{ borderRadius: s(12), border: `${s(2)} dashed #FFF6DA`, padding: s(10) }}>
        <span style={{ ...emptyText, color: "#FFF6DA" }}>{text}</span>
      </PickArea>
      <button type="button" onClick={onDismiss} style={{ alignSelf: "center", border: 0, padding: 0, background: "none", font: "inherit", fontWeight: 800, fontSize: s(13), color: "#FFF6DA", textDecoration: "underline", cursor: "pointer" }}>
        Not now
      </button>
    </div>
  );
}

function OrnamentButton({ memory, rim, label, onClick }: { memory: Memory; rim: string; label: string; onClick: () => void }) {
  const clip = `orn${useId().replace(/[^\w-]/g, "")}`;
  return (
    <button type="button" aria-label={label} onClick={onClick} style={{ width: s(108), padding: 0, border: 0, background: "none", color: NAVY, display: "flex", flexDirection: "column", alignItems: "center", gap: s(6), cursor: "pointer" }}>
      <svg viewBox="0 0 40 40" aria-hidden="true" style={{ display: "block", width: s(84), height: s(84) }}>
        <clipPath id={clip}>
          <circle cx="20" cy="20" r="18" />
        </clipPath>
        <g clipPath={`url(#${clip})`}>
          <MemoryPicture memory={memory} cx={20} cy={20} R={18} />
        </g>
        <circle cx="20" cy="20" r="18" fill="none" stroke={rim} strokeWidth="1.6" />
        <circle cx="20" cy="20" r="19.2" fill="none" stroke={NAVY} strokeWidth=".8" />
      </svg>
      {memory.caption && (
        <span style={{ fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 600, fontSize: s(12), lineHeight: 1.2, whiteSpace: "pre-line", textAlign: "center" }}>{memory.caption}</span>
      )}
    </button>
  );
}

/** What everyone's up to (GP-10). TODO(re-evaluate when members can share plans): visual only, from placeholder rows. */
function UpTo({ rows }: { rows: readonly UpToRow[] }) {
  return (
    <section style={{ margin: `0 ${s(14)}`, padding: `${s(14)} ${s(14)} ${s(16)}`, borderRadius: s(18), background: PAPER, border: `${s(2)} solid ${NAVY}`, display: "flex", flexDirection: "column", gap: s(11) }}>
      <h2 style={sectionTitle}>what everyone’s up to</h2>
      {rows.map((r, i) => (
        <div key={`${r.when}/${r.text}`} style={{ display: "flex", alignItems: "center", gap: s(10) }}>
          <span style={{ flex: "none", minWidth: s(64), height: s(24), padding: `0 ${s(6)}`, boxSizing: "border-box", borderRadius: s(12), background: UP_TO_CHIPS[i % UP_TO_CHIPS.length], color: "#FFF6DA", fontSize: s(11), fontWeight: 800, lineHeight: s(24), textAlign: "center", whiteSpace: "nowrap" }}>
            {r.when}
          </span>
          <span style={{ fontSize: s(13.5), fontWeight: 500, lineHeight: 1.25 }}>{r.text}</span>
        </div>
      ))}
    </section>
  );
}
