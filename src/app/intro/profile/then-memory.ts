// The profile's "then" tile (docs/specs/group-profile.md, GP-6): a memory from this same ISO week in an earlier year.
import { isoWeek } from "../archive/periods";
import type { ChatMessage } from "../messages/conversations";

export type MemoryMessage = Extract<ChatMessage, { kind: "memory" }>;

/**
 * Pass only visible messages, so sealed memories can never be picked.
 * Memories dated by their file don't count. TODO(re-evaluate when the database exists): memories sent before
 * `fileDated` was recorded carry no flag and are treated as capture-dated.
 */
export function thenMemory(messages: readonly ChatMessage[], now: number): { message: MemoryMessage; yearsAgo: number } | undefined {
  const today = isoWeek(now);
  const matches = messages.filter((m): m is MemoryMessage => {
    if (m.kind !== "memory" || m.fileDated) return false;
    const w = isoWeek(m.takenAt);
    return w.week === today.week && w.year < today.year;
  });
  if (!matches.length) return undefined;
  const oldest = matches.reduce((a, b) => (b.takenAt < a.takenAt ? b : a));
  return { message: oldest, yearsAgo: today.year - isoWeek(oldest.takenAt).year };
}
