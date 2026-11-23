// Who comes up to reach out to, and the memories you two share (docs/specs/nudges.md, NUDGE-9, NUDGE-10).
// Plain TypeScript. Only time since you last talked decides who comes up: a nudge never means anything about anyone.

import type { ArtKind } from "@/components/home/types";
import { conversationId, visibleMessages, type ChatState } from "../messages/conversations";

const DAY = 86_400_000;
const WEEK = 7 * DAY;
/** Talked within this long: not suggested. */
const RECENT = 7 * DAY;
/** Past this many weeks, "in a while". */
const MAX_WEEKS = 8;
const YEAR = 365 * DAY;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export type ReachAction = "memory" | "throwback" | "plans";
export type ReachRow = { friendId: string; action: ReachAction; line: string };
const ACTIONS: readonly ReachAction[] = ["memory", "throwback", "plans"];

export const ACTION_LABELS: Readonly<Record<ReachAction, string>> = { memory: "Share a memory", throwback: "Send a throwback", plans: "Make plans" };

/** Every time in your 1:1 chat with them, either way, sealed memories you sent included; and which were memories. */
function times(chat: ChatState, friendId: string) {
  const id = conversationId("friend", friendId);
  const shown = visibleMessages(chat, id);
  const sealed = chat.sealed.filter((m) => m.conversationId === id).map((m) => m.sentAt);
  const max = (ts: number[]) => (ts.length ? Math.max(...ts) : undefined);
  return {
    talk: max([...shown.map((m) => m.at), ...sealed]),
    memory: max([...shown.filter((m) => m.kind === "memory").map((m) => m.at), ...sealed]),
  };
}

const season = (t: number) => ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "fall", "fall", "fall", "winter"][new Date(t).getMonth()];
const weeks = (n: number) => `${n} ${n === 1 ? "week" : "weeks"}`;

function line(action: ReachAction, t: ReturnType<typeof times>, now: number): string {
  if (action === "memory") {
    if (t.talk === undefined) return "You haven’t talked yet";
    const w = Math.floor((now - t.talk) / WEEK);
    return w > MAX_WEEKS ? "You haven’t talked in a while" : `You haven’t talked in ${weeks(w)}`;
  }
  if (action === "throwback") {
    if (t.memory === undefined) return "No memories shared yet";
    const d = new Date(t.memory);
    const sameYear = d.getFullYear() === new Date(now).getFullYear();
    return `No memories shared since ${MONTHS[d.getMonth()]}${sameYear ? "" : ` ${d.getFullYear()}`}`;
  }
  if (t.talk === undefined) return "Haven’t caught up yet";
  if (now - t.talk > YEAR) return "Haven’t caught up in a while";
  if (season(t.talk) === season(now) && now - t.talk < 120 * DAY) return `Haven’t caught up in ${weeks(Math.max(1, Math.floor((now - t.talk) / WEEK)))}`;
  return `Haven’t caught up since ${season(t.talk)}`;
}

/** Up to three friends, longest since you talked first (never first of all), leaving out anyone from the last week. */
export function reachOutPeople(friends: readonly { id: string }[], chat: ChatState, now: number): ReachRow[] {
  const known = friends.map((f, i) => ({ id: f.id, i, t: times(chat, f.id) })).filter((f) => f.t.talk === undefined || now - f.t.talk >= RECENT);
  known.sort((a, b) => (a.t.talk ?? -Infinity) - (b.t.talk ?? -Infinity) || a.i - b.i);
  return known.slice(0, 3).map((f, slot) => ({ friendId: f.id, action: ACTIONS[slot], line: line(ACTIONS[slot], f.t, now) }));
}

export type SharedMemory = { photoId: string; takenAt: number; art?: ArtKind; from: string };

/** Memories you two share: from your 1:1 chat and from group chats you're both in; three at most, newest first, or oldest for a throwback. */
export function sharedMemories(
  friendId: string,
  chat: ChatState,
  groups: readonly { id: string; name: string; members: readonly string[] }[],
  action: ReachAction,
): SharedMemory[] {
  const sources = [
    { id: conversationId("friend", friendId), from: "From your chat" },
    ...groups.filter((g) => g.members.includes(friendId)).map((g) => ({ id: conversationId("group", g.id), from: `From ${g.name}` })),
  ];
  const seen = new Set<string>();
  const all = sources.flatMap((s) =>
    visibleMessages(chat, s.id).flatMap((m) => {
      if (m.kind !== "memory" || seen.has(m.photoId)) return [];
      seen.add(m.photoId);
      return [{ photoId: m.photoId, takenAt: m.takenAt, ...(m.art ? { art: m.art } : {}), from: s.from }];
    }),
  );
  all.sort((a, b) => (action === "throwback" ? a.takenAt - b.takenAt : b.takenAt - a.takenAt));
  return all.slice(0, 3);
}
