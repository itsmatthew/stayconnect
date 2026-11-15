import { describe, expect, it } from "vitest";
import { ME, chatReducer, initialChatState, visibleMessages, type ChatMessage } from "@/app/intro/messages/conversations";
import { thenMemory } from "@/app/intro/profile/then-memory";

// Wednesday Oct 21 2026: ISO 2026-W43 (Oct 19–25).
const NOW = new Date(2026, 9, 21, 12).getTime();
let n = 0;
const memory = (takenAt: Date, extra: Partial<Extract<ChatMessage, { kind: "memory" }>> = {}): ChatMessage => ({
  id: `m${++n}`,
  kind: "memory",
  from: "leo",
  at: NOW - n * 60_000,
  photoId: `p${n}`,
  takenAt: takenAt.getTime(),
  note: "",
  ...extra,
});
const text = (): ChatMessage => ({ id: `t${++n}`, kind: "text", from: "leo", at: NOW, text: "hi" });

describe("then: this week in an earlier year (GP-6)", () => {
  it("finds a memory taken in the same ISO week, years ago", () => {
    const m = memory(new Date(2023, 9, 25)); // 2023-W43
    expect(thenMemory([text(), m], NOW)).toEqual({ message: m, yearsAgo: 3 });
  });

  it("one year ago reads as 1", () => {
    const m = memory(new Date(2025, 9, 20)); // 2025-W43
    expect(thenMemory([m], NOW)?.yearsAgo).toBe(1);
  });

  it("among several, the oldest wins", () => {
    const newer = memory(new Date(2023, 9, 25));
    const oldest = memory(new Date(2019, 9, 22)); // 2019-W43
    const middle = memory(new Date(2021, 9, 27)); // 2021-W43
    expect(thenMemory([newer, oldest, middle], NOW)).toEqual({ message: oldest, yearsAgo: 7 });
  });

  it("no match: another week, or this same week this year", () => {
    expect(thenMemory([memory(new Date(2023, 9, 30))], NOW)).toBeUndefined(); // 2023-W44
    expect(thenMemory([memory(new Date(2023, 9, 22))], NOW)).toBeUndefined(); // 2023-W42 (a Sunday)
    expect(thenMemory([memory(new Date(2026, 9, 19))], NOW)).toBeUndefined(); // this week, this year
    expect(thenMemory([], NOW)).toBeUndefined();
  });

  it("a memory dated by its file never counts", () => {
    const fileDated = memory(new Date(2019, 9, 22), { fileDated: true });
    const real = memory(new Date(2023, 9, 25));
    expect(thenMemory([fileDated], NOW)).toBeUndefined();
    expect(thenMemory([fileDated, real], NOW)?.message).toBe(real);
  });

  it("weeks are ISO weeks across the new year: week 53 matches week 53", () => {
    const jan1 = new Date(2027, 0, 1, 12).getTime(); // Friday: 2026-W53
    const w53 = memory(new Date(2020, 11, 30)); // 2020-W53
    const w01 = memory(new Date(2025, 11, 31)); // Wednesday: 2026-W01
    expect(thenMemory([w53, w01], jan1)).toEqual({ message: w53, yearsAgo: 6 });
  });

  it("a sealed memory is never used: it isn't among the visible messages", () => {
    const sealed = chatReducer(initialChatState([]), {
      type: "sendMemory",
      id: "s1",
      conversationId: "group:madrid-crew",
      photoId: "p",
      takenAt: new Date(2023, 9, 25).getTime(),
      note: "",
      at: NOW,
    });
    expect(thenMemory(visibleMessages(sealed, "group:madrid-crew"), NOW)).toBeUndefined();
    // Once a reply unseals it, it counts.
    const replied = chatReducer(sealed, { type: "receiveReply", id: "r", conversationId: "group:madrid-crew", from: "leo", text: "!", at: NOW + 1 });
    expect(thenMemory(visibleMessages(replied, "group:madrid-crew"), NOW)?.message.from).toBe(ME);
  });
});
