// Pure chat state and the sealed-until-reply rules (docs/specs/messages.md, MSG-2–5).
// A memory the user sends is kept apart in `sealed` until someone in that chat replies;
// until then nothing the sender sees (thread, list order, glow, "Delivered") knows it exists.

import type { ArtKind } from "@/components/home/types";

/** The user's own sender id. */
export const ME = "me";

type Base = { id: string; from: string; at: number };
/** `fileDated`: `takenAt` is the file's modified date, not a capture date (docs/specs/daily5.md, D5-4). `art`: demo memories have no stored photo, so they draw this. */
type MemoryFields = { photoId: string; takenAt: number; note: string; fileDated?: true; art?: ArtKind };
export type ChatMessage = (Base & { kind: "text"; text: string }) | (Base & { kind: "memory" } & MemoryFields);

/** `id` is "group:<group id>" or "friend:<friend id>". */
export type Conversation = { id: string; messages: ChatMessage[]; lastOpenedAt: number };

export type SealedMemory = { id: string; conversationId: string; photoId: string; takenAt: number; note: string; sentAt: number; fileDated?: true };

export type ChatState = { conversations: Record<string, Conversation>; sealed: SealedMemory[] };

export type ChatAction =
  | { type: "sendMemory"; id: string; conversationId: string; photoId: string; takenAt: number; note: string; at: number; fileDated?: true }
  | { type: "sendText"; id: string; conversationId: string; text: string; at: number }
  | { type: "receiveReply"; id: string; conversationId: string; from: string; text: string; at: number }
  | { type: "open"; conversationId: string; at: number }
  | { type: "load"; state: ChatState };

export function initialChatState(seed: readonly Conversation[]): ChatState {
  return { conversations: Object.fromEntries(seed.map((c) => [c.id, c])), sealed: [] };
}

const empty = (id: string): Conversation => ({ id, messages: [], lastOpenedAt: 0 });

function append(state: ChatState, conversationId: string, messages: ChatMessage[], patch: Partial<Conversation> = {}): ChatState {
  const c = state.conversations[conversationId] ?? empty(conversationId);
  return {
    ...state,
    conversations: { ...state.conversations, [conversationId]: { ...c, ...patch, messages: [...c.messages, ...messages] } },
  };
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "sendMemory": {
      const { id, conversationId, photoId, takenAt, note, at, fileDated } = action;
      return { ...state, sealed: [...state.sealed, { id, conversationId, photoId, takenAt, note, sentAt: at, ...(fileDated ? { fileDated } : {}) }] };
    }
    case "sendText": {
      const text = action.text.trim();
      if (!text) return state;
      const msg: ChatMessage = { id: action.id, kind: "text", from: ME, at: action.at, text };
      return append(state, action.conversationId, [msg], { lastOpenedAt: action.at });
    }
    case "receiveReply": {
      const { conversationId } = action;
      const unsealed: ChatMessage[] = state.sealed
        .filter((m) => m.conversationId === conversationId)
        .map((m) => ({
          id: m.id,
          kind: "memory",
          from: ME,
          at: m.sentAt,
          photoId: m.photoId,
          takenAt: m.takenAt,
          note: m.note,
          ...(m.fileDated ? { fileDated: m.fileDated } : {}),
        }));
      const reply: ChatMessage = { id: action.id, kind: "text", from: action.from, at: action.at, text: action.text };
      const next = append(state, conversationId, [...unsealed, reply]);
      return { ...next, sealed: state.sealed.filter((m) => m.conversationId !== conversationId) };
    }
    case "open": {
      const c = state.conversations[action.conversationId];
      if (!c) return state;
      return { ...state, conversations: { ...state.conversations, [c.id]: { ...c, lastOpenedAt: action.at } } };
    }
    case "load":
      return action.state;
  }
}

/** What the sender sees in the thread. Sealed memories are never in here. */
export function visibleMessages(state: ChatState, conversationId: string): readonly ChatMessage[] {
  return state.conversations[conversationId]?.messages ?? [];
}

/** When the chat last moved: its newest visible message. */
export function lastActivity(state: ChatState, conversationId: string): number | undefined {
  const ms = visibleMessages(state, conversationId);
  return ms.length ? Math.max(...ms.map((m) => m.at)) : undefined;
}

const last = (state: ChatState, conversationId: string) => visibleMessages(state, conversationId).at(-1);

/** Something new: the last visible message is someone else's and arrived after the chat was last opened. */
export function hasNew(state: ChatState, conversationId: string): boolean {
  const m = last(state, conversationId);
  return !!m && m.from !== ME && m.at > (state.conversations[conversationId]?.lastOpenedAt ?? 0);
}

/** "Delivered" shows under my last message only when it's the last visible message. */
export function showsDelivered(state: ChatState, conversationId: string): boolean {
  return last(state, conversationId)?.from === ME;
}

/** Conversations with a visible message, minus the pinned ones, most recent activity first. */
export function listOrder(state: ChatState, exclude: ReadonlySet<string>): string[] {
  return Object.keys(state.conversations)
    .filter((id) => !exclude.has(id) && visibleMessages(state, id).length > 0)
    .sort((a, b) => lastActivity(state, b)! - lastActivity(state, a)!);
}

/** Conversations holding sealed memories, in the order they were first sealed. */
export function sealedCounts(state: ChatState): { conversationId: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const m of state.sealed) counts.set(m.conversationId, (counts.get(m.conversationId) ?? 0) + 1);
  return Array.from(counts, ([conversationId, count]) => ({ conversationId, count }));
}

export function conversationId(kind: "group" | "friend", id: string): string {
  return `${kind}:${id}`;
}
