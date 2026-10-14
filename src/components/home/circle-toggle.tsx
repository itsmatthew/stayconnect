import { CREAM, FRAUNCES, INK, s } from "./units";

export type CirclesView = "circles" | "circle";

type CircleToggleProps = { value: CirclesView; onChange: (v: CirclesView) => void };

/** "your circles" / "your circle" segmented toggle (280×44 design px). */
export function CircleToggle({ value, onChange }: CircleToggleProps) {
  const option = (v: CirclesView, label: string) => {
    const on = value === v;
    return (
      <button
        type="button"
        aria-pressed={on}
        onClick={() => onChange(v)}
        style={{
          flex: 1,
          border: 0,
          borderRadius: s(20),
          background: on ? INK : "none",
          color: on ? CREAM : INK,
          fontFamily: FRAUNCES,
          fontStyle: "italic",
          fontWeight: on ? 700 : 500,
          fontSize: s(16),
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  };
  return (
    <div
      role="group"
      aria-label="Circles view"
      style={{
        width: s(280),
        height: s(44),
        boxSizing: "border-box",
        padding: s(3),
        borderRadius: s(24),
        background: "rgba(255,248,236,.92)",
        border: `${s(2)} solid ${INK}`,
        display: "flex",
      }}
    >
      {option("circles", "your circles")}
      {option("circle", "your circle")}
    </div>
  );
}
