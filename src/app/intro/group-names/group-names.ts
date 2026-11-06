// Group name rules (docs/specs/group-rename.md). Plain TypeScript: the mobile app imports this unchanged.
import { ME } from "../messages/conversations";

export const GROUP_NAME_MAX = 40;

/** Group id → the name it was renamed to. */
export type GroupNames = Readonly<Record<string, string>>;

/** TODO(server: group rename needs an API route): only the fake in `local-group-names.ts` exists. `save` rejects when it fails (RENAME-4). */
export interface GroupNameStore {
  load(): Promise<GroupNames>;
  save(names: GroupNames): Promise<void>;
}

export type NameCheck = { ok: true; name: string } | { ok: false; reason: "empty" | "too-long" };

/** Trimmed, not empty, at most GROUP_NAME_MAX characters. Counts code points, as Postgres `length()` does, so an emoji is one (RENAME-1). */
export function validateGroupName(raw: string): NameCheck {
  const name = raw.trim();
  if (!name) return { ok: false, reason: "empty" };
  return [...name].length > GROUP_NAME_MAX ? { ok: false, reason: "too-long" } : { ok: true, name };
}

/** Valid, and actually a different name. */
export function canRename(raw: string, current: string): boolean {
  const check = validateGroupName(raw);
  return check.ok && check.name !== current;
}

/** What to tell someone typing `raw`. An empty field just keeps Save off. */
export function renameError(raw: string): string | undefined {
  const check = validateGroupName(raw);
  return !check.ok && check.reason === "too-long" ? `Keep it to ${GROUP_NAME_MAX} characters.` : undefined;
}

/** "Leo renamed the group to Hoops." (RENAME-5). */
export function renameNote(by: string, name: string, nameOf: (id: string) => string | undefined): string {
  const who = by === ME ? "You" : (nameOf(by) ?? "Someone");
  return `${who} renamed the group to ${name}.`;
}

/** Puts saved names on their groups. Others are returned as they are. */
export function withGroupNames<T extends { id: string; name: string }>(groups: readonly T[], names: GroupNames): T[] {
  return groups.map((g) => {
    const check = validateGroupName(names[g.id] ?? "");
    return check.ok ? { ...g, name: check.name } : g;
  });
}

/** Keeps what's valid from stored data of any shape. */
export function parseGroupNames(raw: unknown): GroupNames {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter(([, name]) => typeof name === "string"));
}
