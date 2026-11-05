import { KARLA, NAVY, s } from "../home/units";
import { Sheet, pill } from "../shared/sheet";

type ColorSheetProps = {
  groupName: string;
  swatches: readonly { id: string; label: string; color: string }[];
  selected: string;
  /** This viewer has recolored the group: offer the way back. */
  overridden: boolean;
  onPick: (colorId: string) => void;
  onReset: () => void;
  onCancel: () => void;
};

/** Recolor a group on this screen only (docs/specs/group-colors.md, COLOR-10). */
export function ColorSheet({ groupName, swatches, selected, overridden, onPick, onReset, onCancel }: ColorSheetProps) {
  return (
    <Sheet title={`${groupName} color`} onCancel={onCancel}>
      <p style={{ margin: 0, fontFamily: KARLA, fontSize: s(14) }}>Only you see this.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: s(12), justifyItems: "center" }}>
        {swatches.map(({ id, label, color }) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={id === selected}
            onClick={() => onPick(id)}
            style={{
              width: s(56),
              height: s(56),
              minWidth: 44,
              minHeight: 44,
              padding: 0,
              borderRadius: "50%",
              background: color,
              border: `${s(3)} solid ${id === selected ? NAVY : "transparent"}`,
              outline: id === selected ? `${s(2)} solid #FFF8EC` : "none",
              outlineOffset: s(-5),
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      {overridden && (
        <button type="button" onClick={onReset} style={{ ...pill, minHeight: 44 }}>
          Use group color
        </button>
      )}
    </Sheet>
  );
}
