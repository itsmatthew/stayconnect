import { useId, useState, type CSSProperties } from "react";
import { CREAM, FRAUNCES, NAVY, s } from "../home/units";
import { Sheet, SheetActions, pill } from "../shared/sheet";

type GoalSheetProps = {
  /** The current goal, to change; absent to set a new one. `date` is "YYYY-MM-DD". */
  current?: { label: string; date?: string };
  labelMax: number;
  onSave: (label: string, date?: string) => void;
  onClear: () => void;
  onCancel: () => void;
};

const field: CSSProperties = {
  height: s(44),
  boxSizing: "border-box",
  padding: `0 ${s(14)}`,
  borderRadius: s(14),
  border: `${s(2)} solid ${NAVY}`,
  background: CREAM,
  font: "inherit",
  fontSize: s(15),
  color: NAVY,
  outline: 0,
};
const caption: CSSProperties = { fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(15) };

/** Set, change or clear the next time together (docs/specs/group-profile.md, GP-7). */
export function GoalSheet({ current, labelMax, onSave, onClear, onCancel }: GoalSheetProps) {
  const [label, setLabel] = useState(current?.label ?? "");
  const [date, setDate] = useState(current?.date ?? "");
  const labelId = useId();
  const dateId = useId();
  return (
    <Sheet title="Next time together" onCancel={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (label.trim()) onSave(label, date || undefined);
        }}
        style={{ display: "flex", flexDirection: "column", gap: s(12) }}
      >
        <label htmlFor={labelId} style={caption}>
          What&apos;s the plan?
        </label>
        <input id={labelId} type="text" value={label} maxLength={labelMax} placeholder="lake weekend" onChange={(e) => setLabel(e.target.value)} style={{ ...field, fontFamily: FRAUNCES, fontStyle: "italic" }} />
        <div style={{ display: "flex", alignItems: "baseline", gap: s(6) }}>
          <label htmlFor={dateId} style={caption}>
            When
          </label>
          <span style={{ fontWeight: 600, fontSize: s(12), color: "#3F4664" }}>(optional)</span>
        </div>
        <input id={dateId} type="date" value={date} onChange={(e) => setDate(e.target.value)} style={field} />
        <SheetActions canSave={!!label.trim()} onCancel={onCancel} />
        {current && (
          <button type="button" onClick={onClear} style={{ ...pill, background: "none", borderColor: "transparent", color: "#A8331F", textDecoration: "underline" }}>
            Clear goal
          </button>
        )}
      </form>
    </Sheet>
  );
}
