import { useId, useState } from "react";
import { CREAM, FRAUNCES, NAVY, s } from "../home/units";
import { Sheet, SheetActions } from "../shared/sheet";

type RenameSheetProps = {
  current: string;
  canSave: (raw: string) => boolean;
  /** What to say about the name as typed, if anything. */
  errorFor: (raw: string) => string | undefined;
  /** Rejects if the name couldn't be saved. */
  onSave: (raw: string) => Promise<void>;
  onCancel: () => void;
};

/** Rename a group (docs/specs/group-rename.md, RENAME-3/4). The rules come from `canSave` and `errorFor`. */
export function RenameSheet({ current, canSave, errorFor, onSave, onCancel }: RenameSheetProps) {
  const [name, setName] = useState(current);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const fieldId = useId();
  const ready = canSave(name) && !saving;
  const message = errorFor(name) ?? (failed ? "Couldn't save. Try again." : undefined);
  return (
    <Sheet title="Rename group" onCancel={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!ready) return;
          setSaving(true);
          setFailed(false);
          onSave(name).catch(() => {
            setSaving(false);
            setFailed(true);
          });
        }}
        style={{ display: "flex", flexDirection: "column", gap: s(12) }}
      >
        <label htmlFor={fieldId} style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(15) }}>
          Group name
        </label>
        <input
          id={fieldId}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFailed(false);
          }}
          style={{ height: s(44), minHeight: 44, boxSizing: "border-box", padding: `0 ${s(14)}`, borderRadius: s(14), border: `${s(2)} solid ${NAVY}`, background: CREAM, font: "inherit", fontSize: s(15), color: NAVY, outline: 0 }}
        />
        {message && (
          <p role="alert" style={{ margin: 0, fontSize: s(13), fontWeight: 700, color: "#93281A" }}>
            {message}
          </p>
        )}
        <SheetActions canSave={ready} onCancel={onCancel} />
      </form>
    </Sheet>
  );
}
