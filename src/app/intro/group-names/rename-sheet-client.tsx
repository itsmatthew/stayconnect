"use client";

import { RenameSheet } from "@/components/profile/rename-sheet";
import { canRename, renameError } from "./group-names";

/** The rename sheet for one group, used by Home and the profile (docs/specs/group-rename.md, RENAME-2/3). `onRename` rejects if the name wasn't saved. */
export function RenameSheetClient({ group, onRename, onClose }: { group: { id: string; name: string }; onRename: (groupId: string, raw: string) => Promise<void>; onClose: () => void }) {
  return <RenameSheet current={group.name} canSave={(raw) => canRename(raw, group.name)} errorFor={renameError} onSave={(raw) => onRename(group.id, raw).then(onClose)} onCancel={onClose} />;
}
