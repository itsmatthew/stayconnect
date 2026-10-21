import { describe, expect, it } from "vitest";
import { initialCircleState, type CircleState } from "@/app/intro/circle/rings";
import { activity, isLit, suggestion, WINDOW } from "@/app/intro/circle/suggestions";
import { ME, type ChatMessage, type ChatState, type SealedMemory } from "@/app/intro/messages/conversations";

const DAY = 86_400_000;
const NOW = 100 * DAY;

let n = 0;
const text = (from: string, ago: number): ChatMessage => ({ id: `m${++n}`, kind: "text", from, at: NOW - ago, text: "hi" });
const memory = (from: string, ago: number): ChatMessage => ({ id: `m${++n}`, kind: "memory", from, at: NOW - ago, photoId: "p", takenAt: 0, note: "" });
const sealed = (friendId: string, ago: number): SealedMemory => ({ id: `s${++n}`, conversationId: `friend:${friendId}`, photoId: "p", takenAt: 0, note: "", sentAt: NOW - ago });

function chat(byConversation: Record<string, ChatMessage[]>, sealedMemories: SealedMemory[] = []): ChatState {
  return {
    conversations: Object.fromEntries(Object.entries(byConversation).map(([id, messages]) => [id, { id, messages, lastOpenedAt: 0 }])),
    sealed: sealedMemories,
  };
}
/** `k` exchanges with a friend: alternating theirs and mine, a day apart. */
const exchanges = (friendId: string, k: number, startAgo = DAY) =>
  Array.from({ length: k }, (_, i) => text(i % 2 ? ME : friendId, startAgo + i * DAY));

const state = (placements: CircleState["placements"], dismissed: CircleState["dismissed"] = {}): CircleState => ({
  ...initialCircleState(placements),
  dismissed,
});

describe("activity (CIRCLE-4, CIRCLE-9)", () => {
  it("counts the 1:1 chat's messages and memories from both sides in the last 30 days", () => {
    const c = chat({ "friend:leo": [text("leo", DAY), text(ME, 2 * DAY), memory("leo", 3 * DAY), memory(ME, 4 * DAY)] });
    expect(WINDOW).toBe(30 * DAY);
    expect(activity(c, "leo", NOW)).toEqual({ mine: 2, theirs: 2 });
  });

  it("the window is the last 30 days: day 30 counts, older doesn't", () => {
    const c = chat({ "friend:leo": [text("leo", 30 * DAY), text("leo", 30 * DAY + 1)] });
    expect(activity(c, "leo", NOW)).toEqual({ mine: 0, theirs: 1 });
  });

  it("counts memories the user sent that are still sealed", () => {
    expect(activity(chat({}, [sealed("leo", DAY), sealed("leo", 40 * DAY), sealed("sam", DAY)]), "leo", NOW)).toEqual({ mine: 1, theirs: 0 });
  });

  it("group chats don't count", () => {
    expect(activity(chat({ "group:madrid-crew": [text("leo", DAY), text(ME, DAY)] }), "leo", NOW)).toEqual({ mine: 0, theirs: 0 });
  });

  it("lit when anything was exchanged in the window, dim otherwise (CIRCLE-4)", () => {
    expect(isLit({ mine: 0, theirs: 1 })).toBe(true);
    expect(isLit({ mine: 1, theirs: 0 })).toBe(true);
    expect(isLit({ mine: 0, theirs: 0 })).toBe(false);
  });
});

describe("suggested moves (CIRCLE-9)", () => {
  it("branches → nest after 6 exchanges with both sides", () => {
    const placements = { leo: "branches" } as const;
    expect(suggestion(state(placements), chat({ "friend:leo": exchanges("leo", 5) }), NOW)).toBeUndefined();
    expect(suggestion(state(placements), chat({ "friend:leo": exchanges("leo", 6) }), NOW)).toEqual({ friendId: "leo", to: "nest" });
  });

  it("bloom → branches after 3 exchanges with both sides", () => {
    const placements = { jordan: "bloom" } as const;
    expect(suggestion(state(placements), chat({ "friend:jordan": exchanges("jordan", 2) }), NOW)).toBeUndefined();
    expect(suggestion(state(placements), chat({ "friend:jordan": exchanges("jordan", 3) }), NOW)).toEqual({ friendId: "jordan", to: "branches" });
  });

  it("one-sided activity isn't closeness", () => {
    const c = chat({ "friend:leo": Array.from({ length: 10 }, (_, i) => text("leo", (i + 1) * DAY)) });
    expect(suggestion(state({ leo: "branches" }), c, NOW)).toBeUndefined();
  });

  it("only inward: nest members and people outside the rings are never suggested", () => {
    const c = chat({ "friend:ana": exchanges("ana", 12), "friend:sam": exchanges("sam", 12) });
    expect(suggestion(state({ ana: "nest" }), c, NOW)).toBeUndefined();
  });

  it("one at a time, most active first", () => {
    const c = chat({ "friend:leo": exchanges("leo", 6), "friend:jordan": exchanges("jordan", 9) });
    expect(suggestion(state({ leo: "branches", jordan: "bloom" }), c, NOW)).toEqual({ friendId: "jordan", to: "branches" });
  });

  it("a dismissed suggestion stays away for 30 days, then may come back", () => {
    const c = chat({ "friend:leo": exchanges("leo", 6) });
    expect(suggestion(state({ leo: "branches" }, { leo: NOW - 29 * DAY }), c, NOW)).toBeUndefined();
    expect(suggestion(state({ leo: "branches" }, { leo: NOW - 30 * DAY }), c, NOW)).toEqual({ friendId: "leo", to: "nest" });
  });

  it("a dismissed person doesn't hide the next one", () => {
    const c = chat({ "friend:leo": exchanges("leo", 9), "friend:jordan": exchanges("jordan", 3) });
    expect(suggestion(state({ leo: "branches", jordan: "bloom" }, { leo: NOW - DAY }), c, NOW)).toEqual({ friendId: "jordan", to: "branches" });
  });
});
