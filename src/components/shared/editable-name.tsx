import { s } from "../home/units";

type EditableNameProps = {
  name: string;
  onEdit?: () => void;
  /** Two lines, then an ellipsis, keeping the pencil in view. */
  clamp?: boolean;
};

/** A group's name as a button, with a pencil right after it (docs/specs/group-rename.md, RENAME-2). Takes its font and color from the heading around it. */
export function EditableName({ name, onEdit, clamp = false }: EditableNameProps) {
  const pencil = (
    <svg data-pencil="" width="0.7em" height="0.7em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "inline", flex: "none", marginLeft: clamp ? 0 : "0.3em", verticalAlign: "-0.05em", opacity: 0.8 }}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
  return (
    <button
      type="button"
      aria-label={`Rename ${name}`}
      onClick={(e) => {
        // The tap is for the name, not for anything around it.
        e.stopPropagation();
        onEdit?.();
      }}
      style={{ display: "inline-flex", alignItems: "center", gap: s(6), maxWidth: "100%", minHeight: 44, padding: 0, border: 0, background: "none", color: "inherit", font: "inherit", letterSpacing: "inherit", textAlign: "inherit", cursor: "pointer" }}
    >
      <span className={clamp ? "hm-card-name" : undefined} style={{ minWidth: 0 }}>
        {name}
        {/* Inside the text it follows the last word; a clamped name would cut it off, so there it sits outside. */}
        {!clamp && pencil}
      </span>
      {clamp && pencil}
    </button>
  );
}
