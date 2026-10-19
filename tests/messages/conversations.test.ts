import { describe, expect, it } from "vitest";
import {
  chatReducer,
  hasNew,
  initialChatState,
  lastActivity,
  listOrder,
  ME,
  sealedCounts,
  showsDelivered,
  visibleMessages,
  type ChatState,
  type Conversation,
} from "@/app/intro/messages/conversations";

const H = 3_600_000;
const NOW = new Date(2026, 9, 14, 12).getTime();
const text = (id: string, from: string, at: number, t = id) => ({ id, from, at, kind: "text" as const, text: t });

// Madrid: last message mine (delivered). Uni: last from Leo, read. Work: oldest.
const seed: Conversation[] = [
  { id: "group:madrid-crew", lastOpenedAt: NOW - 1 * H, messages: [text("m1", "leo", NOW - 3 * H), text("m2", ME, NOW - 2 * H)] },
  { id: "group:uni-mates", lastOpenedAt: NOW - 4 * H, messages: [text("u1", "priya", NOW - 5 * H)] },
  { id: "group:work-mates", lastOpenedAt: NOW - 9 * H, messages: [text("w1", "sam", NOW - 10 * H)] },
];
const PINNED = new Set(["group:madrid-crew"]);

const send = (s: ChatState, conversationId: string, id = "mem1", at = NOW) =>
  chatReducer(s, { type: "sendMemory", id, conversationId, photoId: `photo-${id}`, takenAt: NOW - 400 * 24 * H, note: "remember?", at });
const reply = (s: ChatState, conversationId: string, from: string, at = NOW + H, id = "r1") =>
  chatReducer(s, { type: "receiveReply", id, conversationId, from, text: "omg this day", at });

describe("sealed on send (MSG-4)", () => {
  const start = initialChatState(seed);

  it("keeps the memory out of the sender's thread", () => {
    const s = send(start, "group:uni-mates");
    expect(visibleMessages(s, "group:uni-mates")).toEqual(visibleMessages(start, "group:uni-mates"));
    expect(sealedCounts(s)).toEqual([{ conversationId: "group:uni-mates", count: 1 }]);
  });

  it("doesn't change last activity or list order", () => {
    const s = send(start, "group:work-mates");
    expect(lastActivity(s, "group:work-mates")).toBe(lastActivity(start, "group:work-mates"));
    expect(listOrder(s, PINNED)).toEqual(["group:uni-mates", "group:work-mates"]);
  });

  it("doesn't make a chat look new, and shows no Delivered line", () => {
    const s = send(start, "group:uni-mates");
    expect(hasNew(s, "group:uni-mates")).toBe(false);
    expect(showsDelivered(s, "group:uni-mates")).toBe(false);
    expect(showsDelivered(send(start, "group:madrid-crew"), "group:madrid-crew")).toBe(true); // still the old text's line
  });

  it("doesn't list a conversation that has no visible messages", () => {
    const s = send(start, "friend:jordan");
    expect(listOrder(s, PINNED)).not.toContain("friend:jordan");
    expect(visibleMessages(s, "friend:jordan")).toEqual([]);
  });
});

describe("unsealed by a reply (MSG-5)", () => {
  const start = initialChatState(seed);

  it("reveals every sealed memory of that chat, followed directly by the reply", () => {
    let s = send(start, "group:work-mates", "mem1", NOW);
    s = send(s, "group:work-mates", "mem2", NOW + 1000);
    s = reply(s, "group:work-mates", "sam");
    const ids = visibleMessages(s, "group:work-mates").map((m) => m.id);
    expect(ids).toEqual(["w1", "mem1", "mem2", "r1"]);
    const mem = visibleMessages(s, "group:work-mates")[1];
    expect(mem).toMatchObject({ kind: "memory", from: ME, photoId: "photo-mem1", note: "remember?" });
    expect(sealedCounts(s)).toEqual([]);
  });

  it("moves the chat to the top, marks it new, and shows no Delivered line", () => {
    let s = send(start, "group:work-mates");
    s = reply(s, "group:work-mates", "sam");
    expect(listOrder(s, PINNED)[0]).toBe("group:work-mates");
    expect(lastActivity(s, "group:work-mates")).toBe(NOW + H);
    expect(hasNew(s, "group:work-mates")).toBe(true);
    expect(showsDelivered(s, "group:work-mates")).toBe(false);
  });

  it("works for a friend with no earlier conversation", () => {
    let s = send(start, "friend:jordan");
    s = reply(s, "friend:jordan", "jordan");
    expect(listOrder(s, PINNED)[0]).toBe("friend:jordan");
    expect(visibleMessages(s, "friend:jordan").map((m) => m.kind)).toEqual(["memory", "text"]);
  });

  it("a reply in another conversation unseals nothing", () => {
    let s = send(start, "group:work-mates");
    s = reply(s, "group:uni-mates", "priya");
    expect(sealedCounts(s)).toEqual([{ conversationId: "group:work-mates", count: 1 }]);
    expect(visibleMessages(s, "group:work-mates").map((m) => m.id)).toEqual(["w1"]);
  });
});

describe("reading and writing (MSG-2/3)", () => {
  const start = initialChatState(seed);

  it("a chat is new when its last message is someone else's and arrived after it was last opened", () => {
    const s = reply(start, "group:uni-mates", "priya", NOW);
    expect(hasNew(s, "group:uni-mates")).toBe(true);
    const opened = chatReducer(s, { type: "open", conversationId: "group:uni-mates", at: NOW + 1 });
    expect(hasNew(opened, "group:uni-mates")).toBe(false);
  });

  it("sending text shows it, bumps the chat and shows Delivered", () => {
    const s = chatReducer(start, { type: "sendText", id: "t1", conversationId: "group:work-mates", text: "hi", at: NOW });
    expect(visibleMessages(s, "group:work-mates").at(-1)).toMatchObject({ id: "t1", from: ME, text: "hi" });
    expect(listOrder(s, PINNED)[0]).toBe("group:work-mates");
    expect(showsDelivered(s, "group:work-mates")).toBe(true);
    expect(hasNew(s, "group:work-mates")).toBe(false);
  });

  it("ignores empty text", () => {
    const s = chatReducer(start, { type: "sendText", id: "t1", conversationId: "group:work-mates", text: "   ", at: NOW });
    expect(s).toBe(start);
  });
});
