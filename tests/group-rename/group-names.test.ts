import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GROUP_NAME_MAX, canRename, parseGroupNames, renameError, renameNote, validateGroupName, withGroupNames } from "@/app/intro/group-names/group-names";
import { ME, chatReducer, initialChatState, showsDelivered, visibleMessages, type ChatAction } from "@/app/intro/messages/conversations";
import { thenMemory } from "@/app/intro/profile/then-memory";

describe("valid names (RENAME-1)", () => {
  it("trims spaces", () => {
    expect(validateGroupName("  Lake House  ")).toEqual({ ok: true, name: "Lake House" });
  });

  it("rejects empty names and names of only spaces", () => {
    for (const raw of ["", "    ", "\t \n"]) expect(validateGroupName(raw)).toEqual({ ok: false, reason: "empty" });
  });

  it("allows 40 characters and rejects 41, after trimming", () => {
    expect(GROUP_NAME_MAX).toBe(40);
    expect(validateGroupName("a".repeat(40)).ok).toBe(true);
    expect(validateGroupName(`  ${"a".repeat(40)}  `).ok).toBe(true);
    expect(validateGroupName("a".repeat(41))).toEqual({ ok: false, reason: "too-long" });
  });

  it("counts an emoji as one character", () => {
    expect(validateGroupName("🏀".repeat(40)).ok).toBe(true);
    expect(validateGroupName("🏀".repeat(41)).ok).toBe(false);
  });

  it("only allows a rename that changes the name", () => {
    expect(canRename("Lake House", "Madrid Crew")).toBe(true);
    expect(canRename(" Madrid Crew ", "Madrid Crew")).toBe(false);
    expect(canRename("madrid crew", "Madrid Crew")).toBe(true);
    expect(canRename("", "Madrid Crew")).toBe(false);
    expect(canRename("a".repeat(41), "Madrid Crew")).toBe(false);
  });

  it("only complains about a name that's too long", () => {
    expect(renameError("a".repeat(41))).toBe("Keep it to 40 characters.");
    expect(renameError("")).toBeUndefined();
    expect(renameError("Lake House")).toBeUndefined();
  });
});

describe("note text (RENAME-5)", () => {
  const nameOf = (id: string) => ({ leo: "Leo" })[id];

  it("names the person, or says You", () => {
    expect(renameNote("leo", "Hoops", nameOf)).toBe("Leo renamed the group to Hoops.");
    expect(renameNote(ME, "Hoops", nameOf)).toBe("You renamed the group to Hoops.");
    expect(renameNote("gone", "Hoops", nameOf)).toBe("Someone renamed the group to Hoops.");
  });
});

describe("note in the chat (RENAME-5, RENAME-6)", () => {
  const C = "group:a";
  const rename: ChatAction = { type: "rename", id: "r1", conversationId: C, by: ME, name: "Hoops", at: 20 };
  const text: ChatAction = { type: "sendText", id: "t1", conversationId: C, text: "hi", at: 10 };

  it("sits in order with the messages", () => {
    let s = chatReducer(initialChatState([]), text);
    s = chatReducer(s, rename);
    s = chatReducer(s, { ...text, id: "t2", at: 30 });
    expect(visibleMessages(s, C).map((m) => m.kind)).toEqual(["text", "note", "text"]);
  });

  it("shows no Delivered under it", () => {
    const s = chatReducer(chatReducer(initialChatState([]), text), rename);
    expect(showsDelivered(s, C)).toBe(false);
  });

  it("isn't a memory", () => {
    const s = chatReducer(initialChatState([]), rename);
    expect(thenMemory(visibleMessages(s, C), 20)).toBeUndefined();
  });

  it("marks the chat as read for the person who renamed", () => {
    const s = chatReducer(initialChatState([]), rename);
    expect(s.conversations[C].lastOpenedAt).toBe(20);
  });
});

describe("withGroupNames (RENAME-7)", () => {
  const groups = [
    { id: "a", name: "Madrid Crew" },
    { id: "b", name: "Family" },
  ];

  it("puts saved names on their groups and leaves the rest alone", () => {
    const [a, b] = withGroupNames(groups, { a: "Lisbon Crew" });
    expect(a).toEqual({ id: "a", name: "Lisbon Crew" });
    expect(b).toBe(groups[1]);
  });

  it("ignores a saved name that isn't valid", () => {
    expect(withGroupNames(groups, { a: "   " })[0]).toBe(groups[0]);
  });
});

describe("stored data (RENAME-8)", () => {
  it("keeps only string entries", () => {
    expect(parseGroupNames({ a: "Hoops", b: 3 })).toEqual({ a: "Hoops" });
    for (const bad of [null, 3, "Hoops", ["Hoops"]]) expect(parseGroupNames(bad)).toEqual({});
  });
});

describe("portable (RENAME-9)", () => {
  const DIR = path.join(__dirname, "../../src/app/intro/group-names");
  const PLATFORM = ["local-group-names.ts", "use-group-names.ts"];
  const logic = readdirSync(DIR).filter((f) => f.endsWith(".ts") && !PLATFORM.includes(f));

  it("has the logic file, and the server TODO", () => {
    expect(logic).toContain("group-names.ts");
    expect(readFileSync(path.join(DIR, "group-names.ts"), "utf8")).toContain("TODO(server: group rename needs an API route)");
    expect(readFileSync(path.join(DIR, "local-group-names.ts"), "utf8")).toContain("TODO(server: group rename needs an API route)");
  });

  it.each(logic)("%s uses no React or browser APIs", (file) => {
    const source = readFileSync(path.join(DIR, file), "utf8");
    expect(source).not.toMatch(/from "(react|next|@\/)/);
    expect(source).not.toMatch(/\b(window|document|localStorage|sessionStorage|indexedDB|navigator)\b/);
  });
});
