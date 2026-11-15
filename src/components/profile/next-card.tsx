import type { CSSProperties } from "react";
import { faceGradient } from "../messages/avatar";
import { FRAUNCES, NAVY, PAPER, s } from "../home/units";
import { YOU } from "./members-string";
import { PhotoFill } from "./photo-grid";
import type { NextGoal, ThenTile } from "./types";

const kicker: CSSProperties = { fontSize: s(10), fontWeight: 800, letterSpacing: s(1.1), textTransform: "uppercase" };
const pillButton: CSSProperties = {
  height: s(44),
  padding: `0 ${s(16)}`,
  borderRadius: s(22),
  border: `${s(2)} solid ${NAVY}`,
  fontFamily: FRAUNCES,
  fontStyle: "italic",
  fontWeight: 700,
  fontSize: s(14),
  color: NAVY,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

type NextCardProps = { then?: ThenTile; goal?: NextGoal; onEditGoal: () => void; onToggleIn: () => void };

/**
 * Now and next (docs/specs/group-profile.md, GP-6–8): "then" on the left when this week years ago has a memory,
 * the next time together on the right (or across the whole card), and who's in under it.
 */
export function NextCard({ then, goal, onEditGoal, onToggleIn }: NextCardProps) {
  const years = then && `this week, ${then.yearsAgo} ${then.yearsAgo === 1 ? "year" : "years"} ago`;
  return (
    <section aria-label="Next time together" style={{ margin: `0 ${s(14)}`, borderRadius: s(18), background: PAPER, border: `${s(2)} solid ${NAVY}`, overflow: "hidden" }}>
      <div data-split={then ? "" : undefined} style={{ display: "flex" }}>
        {then && (
          <div role="img" aria-label={`then: ${years}`} style={{ position: "relative", flex: 1, minWidth: 0, minHeight: s(112), borderRight: `${s(2)} solid ${NAVY}`, background: NAVY, overflow: "hidden" }}>
            <PhotoFill photo={then.photo} style={{ position: "absolute", inset: 0, filter: "sepia(.3) saturate(.9)" }} />
            <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: `${s(22)} ${s(12)} ${s(9)}`, background: "linear-gradient(rgba(27,31,52,0), rgba(27,31,52,.88))", color: "#FFF6DA", display: "flex", flexDirection: "column", gap: s(1) }}>
              <span style={{ ...kicker, color: "#F7CB4D" }}>then</span>
              <span style={{ fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(14), lineHeight: 1.15 }}>{years}</span>
            </span>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0, padding: `${s(14)} ${s(12)} ${s(15)} ${s(14)}`, background: "#4F8A3C", color: "#FFF6DA", display: "flex", flexDirection: "column", gap: s(8) }}>
          {goal ? <Goal goal={goal} /> : <NoGoal />}
          <button type="button" onClick={onEditGoal} style={{ ...pillButton, alignSelf: "flex-start", height: s(34), fontSize: s(13), background: "#FFF6DA" }}>
            {goal ? "Change goal" : "Set a goal"}
          </button>
        </div>
      </div>
      {goal && (
        <div style={{ display: "flex", alignItems: "center", gap: s(10), padding: `${s(12)} ${s(12)} ${s(12)} ${s(16)}`, borderTop: `${s(2)} solid ${NAVY}` }}>
          {/* Faces overlap a little, so a full group still leaves room for the count. */}
          <span aria-hidden="true" style={{ flex: "none", display: "flex", paddingLeft: s(4) }}>
            {goal.going.slice(0, 5).map((m, i) => {
              const look = m.look ?? YOU;
              return (
                <span
                  key={m.id}
                  style={{ flex: "none", width: s(28), height: s(28), marginLeft: i ? s(-6) : 0, borderRadius: "50%", background: faceGradient(look), boxShadow: `0 0 0 ${s(2)} #F6ECCD, 0 0 0 ${s(4)} ${look.ring}` }}
                />
              );
            })}
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: s(12.5), fontWeight: 700, whiteSpace: "nowrap" }}>
            {goal.going.length} of {goal.total} are in
          </span>
          <button type="button" onClick={onToggleIn} style={{ ...pillButton, flex: "none", padding: `0 ${s(13)}`, background: goal.mineIn ? PAPER : "#F0B429" }}>
            {goal.mineIn ? "You're in · undo" : "I'm in"}
          </button>
        </div>
      )}
    </section>
  );
}

function Goal({ goal }: { goal: NextGoal }) {
  // "46 days" → a big 46 and a small "days"; "today" stays whole.
  const [num, unit] = goal.count && /^\d/.test(goal.count) ? goal.count.split(" ") : [goal.count, undefined];
  return (
    <div>
      <div style={kicker}>next</div>
      {num ? (
        <>
          <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(34), lineHeight: 1, letterSpacing: s(-1), marginTop: s(2) }}>
            {num}
            {unit && (
              <>
                {" "}
                <span style={{ fontSize: s(14), fontStyle: "italic", fontWeight: 600, letterSpacing: 0 }}>{unit}</span>
              </>
            )}
          </div>
          <div style={{ fontSize: s(12.5), fontWeight: 500, lineHeight: 1.25, marginTop: s(3) }}>
            until {goal.label}, {goal.dateLabel}
          </div>
        </>
      ) : (
        <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(22), lineHeight: 1.1, marginTop: s(2) }}>{goal.label}</div>
      )}
    </div>
  );
}

function NoGoal() {
  return (
    <div>
      <div style={kicker}>next</div>
      <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(20), lineHeight: 1.1, marginTop: s(2) }}>Next time together</div>
      <div style={{ fontSize: s(12.5), fontWeight: 500, lineHeight: 1.25, marginTop: s(3) }}>When will you all be in one place?</div>
    </div>
  );
}
