// Who's been close lately, from the 1:1 chat (docs/specs/circle.md, CIRCLE-4/9).
// Suggestions only ever point inward and never move anyone by themselves.
import type { Ring } from "@/components/circle/types";
import { conversationId, ME, visibleMessages, type ChatState } from "../messages/conversations";
import { inward, type CircleState } from "./rings";

const DAY = 86_400_000;
/** Activity counts for the last 30 days; a dismissed suggestion stays away as long. */
export const WINDOW = 30 * DAY;

/** Exchanges needed, from both sides, to suggest moving into a ring. */
const NEEDED: Partial<Record<Ring, number>> = { nest: 6, branches: 3 };

export type Activity = { mine: number; theirs: number };

/** Messages and memories in the 1:1 chat in the window, sealed memories the user sent included. Group chats don't count. */
export function activity(chat: ChatState, friendId: string, now: number): Activity {
  const id = conversationId("friend", friendId);
  const recent = (at: number) => at >= now - WINDOW && at <= now;
  const shown = visibleMessages(chat, id).filter((m) => recent(m.at));
  const sealed = chat.sealed.filter((m) => m.conversationId === id && recent(m.sentAt)).length;
  const mine = shown.filter((m) => m.from === ME).length;
  return { mine: mine + sealed, theirs: shown.length - mine };
}

export const isLit = (a: Activity) => a.mine + a.theirs > 0;

export type Suggestion = { friendId: string; to: Ring };

/** At most one inward move: the most active person who qualifies and wasn't turned down in the last 30 days. */
export function suggestion({ placements, dismissed }: CircleState, chat: ChatState, now: number): Suggestion | undefined {
  let best: (Suggestion & { total: number }) | undefined;
  for (const [friendId, ring] of Object.entries(placements)) {
    const to = inward(ring);
    const needed = to && NEEDED[to];
    if (!to || !needed) continue;
    const at = dismissed[friendId];
    if (at !== undefined && now - at < WINDOW) continue;
    const a = activity(chat, friendId, now);
    const total = a.mine + a.theirs;
    if (a.mine < 1 || a.theirs < 1 || total < needed) continue;
    if (!best || total > best.total) best = { friendId, to, total };
  }
  return best && { friendId: best.friendId, to: best.to };
}
