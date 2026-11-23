import { describe, expect, it } from "vitest";
import { conversationId, initialChatState, ME, type ChatMessage, type ChatState } from "@/app/intro/messages/conversations";
import {
  defaultSettings,
  orderPeople,
  pickNote,
  settingsReducer,
  validSettings,
  FREQ_NOTES,
  type NudgeSettings,
} from "@/app/intro/nudges/settings";
import { checkInDue, dueReachOut, quietNow, reachOutTimes, weekKey, type NudgeLog } from "@/app/intro/nudges/schedule";
import { reachOutPeople, sharedMemories } from "@/app/intro/nudges/reach-out";
import { MOODS, ROUGH_TEXT, checkInReducer } from "@/app/intro/nudges/check-in";

const DAY = 86_400_000;
const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const emptyLog: NudgeLog = { reachOut: [], checkIns: {} };

describe("settings (NUDGE-2 to NUDGE-5)", () => {
  it("starts with nobody picked, the Sunday check-in on, 1 a week and quiet hours on", () => {
    expect(defaultSettings).toEqual({ people: [], sunday: true, perWeek: 1, quiet: true });
  });

  it("toggles people, and you can unpick everyone", () => {
    let s = settingsReducer(defaultSettings, { type: "person", id: "a" });
    s = settingsReducer(s, { type: "person", id: "b" });
    expect(s.people).toEqual(["a", "b"]);
    s = settingsReducer(s, { type: "person", id: "a" });
    s = settingsReducer(s, { type: "person", id: "b" });
    expect(s.people).toEqual([]);
  });

  it("sets the switches and how often", () => {
    let s = settingsReducer(defaultSettings, { type: "sunday", on: false });
    s = settingsReducer(s, { type: "perWeek", n: 2 });
    s = settingsReducer(s, { type: "quiet", on: false });
    expect(s).toEqual({ people: [], sunday: false, perWeek: 2, quiet: false });
  });

  it("says how many are picked", () => {
    expect(pickNote(0)).toBe("Nobody picked yet. Two to four works best.");
    expect(pickNote(1)).toBe("1 person picked. Two to four works best.");
    expect(pickNote(3)).toBe("3 people picked. Two to four works best.");
  });

  it("explains each choice of how often", () => {
    expect(FREQ_NOTES[0]).toBe("No nudges to reach out. Your Sunday check-in still comes.");
    expect(FREQ_NOTES[1]).toBe("One person a week who you haven’t caught up with, at a random time. A nudge never means anything about anyone.");
    expect(FREQ_NOTES[2]).toBe("Two a week, at random times. A nudge never means anything about anyone.");
  });

  it("orders faces nest, branches, bloom, then everyone else", () => {
    const friends = [{ id: "e" }, { id: "b1" }, { id: "n" }, { id: "bl" }];
    expect(orderPeople(friends, { bl: "bloom", n: "nest", b1: "branches" }).map((f) => f.id)).toEqual(["n", "b1", "bl", "e"]);
  });

  it("checks what's saved", () => {
    expect(validSettings(defaultSettings)).toBe(true);
    expect(validSettings({ ...defaultSettings, perWeek: 3 })).toBe(false);
    expect(validSettings({ ...defaultSettings, people: [1] })).toBe(false);
    expect(validSettings(null)).toBe(false);
  });
});

describe("when nudges come (NUDGE-5, NUDGE-8, NUDGE-13)", () => {
  const settings = (patch: Partial<NudgeSettings> = {}): NudgeSettings => ({ ...defaultSettings, ...patch });
  const monday = at(2026, 11, 23, 0, 0); // ISO week 48

  it("names the ISO week", () => {
    expect(weekKey(monday)).toBe("2026-W48");
    expect(weekKey(at(2026, 11, 29, 23))).toBe("2026-W48");
    expect(weekKey(at(2026, 11, 30, 1))).toBe("2026-W49");
  });

  it("picks 1 or 2 times in the week, on different days, the same every time, and 2 keeps the first", () => {
    const one = reachOutTimes(monday + 3 * DAY, 1, true);
    const two = reachOutTimes(monday, 2, true);
    expect(one).toHaveLength(1);
    expect(two).toHaveLength(2);
    expect(two[0]).toBe(one[0]);
    expect(new Date(two[0]).toDateString()).not.toBe(new Date(two[1]).toDateString());
    for (const t of two) {
      expect(weekKey(t)).toBe("2026-W48");
      expect(new Date(t).getHours()).toBeGreaterThanOrEqual(9);
      expect(new Date(t).getHours()).toBeLessThan(23);
    }
    expect(reachOutTimes(monday, 0, true)).toEqual([]);
    expect(reachOutTimes(at(2026, 12, 1), 1, true)[0]).not.toBe(one[0]);
  });

  it("knows quiet hours: 11 pm to 9 am, only while on", () => {
    expect(quietNow(at(2026, 11, 24, 23, 0), true)).toBe(true);
    expect(quietNow(at(2026, 11, 24, 8, 59), true)).toBe(true);
    expect(quietNow(at(2026, 11, 24, 9, 0), true)).toBe(false);
    expect(quietNow(at(2026, 11, 24, 23, 30), false)).toBe(false);
  });

  it("a reach-out nudge is due once its time has passed, once, and not in quiet hours", () => {
    const [t] = reachOutTimes(monday, 1, true);
    expect(dueReachOut(t - 60_000, settings(), emptyLog)).toBeUndefined();
    const slot = dueReachOut(t + 60_000, settings(), emptyLog);
    expect(slot).toBe("2026-W48#0");
    expect(dueReachOut(t + 60_000, settings(), { ...emptyLog, reachOut: ["2026-W48#0"] })).toBeUndefined();
    expect(dueReachOut(t + 60_000, settings({ perWeek: 0 }), emptyLog)).toBeUndefined();
    const nextMorning = new Date(t + DAY);
    nextMorning.setHours(7, 0, 0, 0);
    if (weekKey(nextMorning.getTime()) === "2026-W48") expect(dueReachOut(nextMorning.getTime(), settings(), emptyLog)).toBeUndefined();
  });

  it("missed nudges don't pile up: only the latest due one shows", () => {
    const [a, b] = reachOutTimes(monday, 2, true).sort((x, y) => x - y);
    const later = Math.max(a, b) + 60_000;
    const slot = dueReachOut(later, settings({ perWeek: 2 }), emptyLog);
    const times = reachOutTimes(monday, 2, true);
    expect(slot).toBe(`2026-W48#${times.indexOf(Math.max(a, b))}`);
  });

  it("the Sunday check-in is due Sunday from 6 pm, once a week, while on, and not in quiet hours", () => {
    const sunday = at(2026, 11, 29, 18, 0);
    expect(checkInDue(sunday - 60_000, settings(), emptyLog)).toBe(false);
    expect(checkInDue(sunday, settings(), emptyLog)).toBe(true);
    expect(checkInDue(at(2026, 11, 29, 23, 10), settings(), emptyLog)).toBe(false);
    expect(checkInDue(at(2026, 11, 29, 23, 10), settings({ quiet: false }), emptyLog)).toBe(true);
    expect(checkInDue(sunday, settings({ sunday: false }), emptyLog)).toBe(false);
    expect(checkInDue(sunday, settings(), { ...emptyLog, checkIns: { "2026-W48": "skipped" } })).toBe(false);
    expect(checkInDue(at(2026, 11, 28, 19), settings(), emptyLog)).toBe(false);
  });
});

describe("who comes up (NUDGE-9)", () => {
  const NOW = at(2026, 11, 24, 12);
  const friends = [{ id: "connor" }, { id: "ella" }, { id: "jacky" }, { id: "maya" }, { id: "dev" }];
  const msg = (from: string, t: number, kind: "text" | "memory" = "text", i = 0): ChatMessage =>
    kind === "text" ? { id: `${from}-${t}-${i}`, kind, from, at: t, text: "hi" } : { id: `${from}-${t}-${i}`, kind, from, at: t, photoId: `p-${t}`, takenAt: t - 400 * DAY, note: "" };
  const chatWith = (rows: Record<string, ChatMessage[]>): ChatState =>
    initialChatState(Object.entries(rows).map(([id, messages]) => ({ id: conversationId("friend", id), messages, lastOpenedAt: 0 })));

  it("longest since you talked first, never-talked first of all, and nobody from the last 7 days", () => {
    const chat = chatWith({
      connor: [msg(ME, NOW - 21 * DAY)],
      ella: [msg("ella", NOW - 30 * DAY), msg(ME, NOW - 100 * DAY, "memory")],
      jacky: [msg(ME, NOW - 3 * DAY)],
      maya: [msg("maya", NOW - 150 * DAY)],
    });
    expect(reachOutPeople(friends, chat, NOW).map((r) => r.friendId)).toEqual(["dev", "maya", "ella"]);
  });

  it("gives each row its action and line", () => {
    const chat = chatWith({
      connor: [msg(ME, NOW - 21 * DAY)],
      ella: [msg("ella", NOW - 30 * DAY), msg(ME, at(2026, 8, 12), "memory")],
      jacky: [msg("jacky", NOW - 35 * DAY)],
    });
    const rows = reachOutPeople(friends.slice(0, 3), chat, NOW);
    expect(rows).toEqual([
      { friendId: "jacky", action: "memory", line: "You haven’t talked in 5 weeks" },
      { friendId: "ella", action: "throwback", line: "No memories shared since August" },
      { friendId: "connor", action: "plans", line: "Haven’t caught up in 3 weeks" },
    ]);
  });

  it("words the lines for never, a long while, other years and other seasons", () => {
    const chat = chatWith({ ella: [msg("ella", at(2025, 3, 1), "memory")], jacky: [msg("jacky", at(2026, 7, 20))] });
    const rows = reachOutPeople([{ id: "dev" }, { id: "ella" }, { id: "jacky" }], chat, NOW);
    expect(rows.map((r) => r.line)).toEqual(["You haven’t talked yet", "No memories shared since March 2025", "Haven’t caught up since summer"]);
    const far = reachOutPeople([{ id: "ella" }], chatWith({ ella: [msg("ella", NOW - 90 * DAY)] }), NOW);
    expect(far[0].line).toBe("You haven’t talked in a while");
    const one = reachOutPeople([{ id: "x" }, { id: "y" }, { id: "z" }], chatWith({ z: [msg("z", NOW - 400 * DAY)] }), NOW);
    expect(one.map((r) => r.line)).toEqual(["You haven’t talked yet", "No memories shared yet", "Haven’t caught up in a while"]);
  });

  it("sealed memories you sent count as talking", () => {
    const chat = { ...chatWith({}), sealed: [{ id: "s", conversationId: conversationId("friend", "connor"), photoId: "p", takenAt: 0, note: "", sentAt: NOW - 2 * DAY }] };
    expect(reachOutPeople([{ id: "connor" }], chat, NOW)).toEqual([]);
  });

  it("finds memories you two share: your chat, then circles you're both in; newest first, or oldest for a throwback", () => {
    const chat = chatWith({ connor: [msg("connor", NOW - 10 * DAY, "memory", 1)] });
    chat.conversations["group:robin"] = { id: "group:robin", lastOpenedAt: 0, messages: [msg("maya", NOW - 5 * DAY, "memory", 2), msg("connor", NOW - 50 * DAY, "memory", 3)] };
    chat.conversations["group:other"] = { id: "group:other", lastOpenedAt: 0, messages: [msg("maya", NOW - DAY, "memory", 4)] };
    const groups = [
      { id: "robin", name: "Red Robin", members: ["connor", "maya"] },
      { id: "other", name: "Other", members: ["maya"] },
    ];
    const newest = sharedMemories("connor", chat, groups, "memory");
    expect(newest.map((m) => m.from)).toEqual(["From Red Robin", "From your chat", "From Red Robin"]);
    expect(newest[0].takenAt).toBeGreaterThan(newest[2].takenAt);
    const oldest = sharedMemories("connor", chat, groups, "throwback");
    expect(oldest[0].takenAt).toBeLessThanOrEqual(oldest[1].takenAt);
    expect(sharedMemories("nobody", chat, groups, "memory")).toEqual([]);
  });
});

describe("the check-in (NUDGE-13 to NUDGE-16)", () => {
  it("has five answers", () => {
    expect(MOODS.map((m) => m.label)).toEqual(["Rough", "Meh", "Okay", "Good", "Great"]);
  });

  it("a rough week asks what you'd like; the rest say thanks", () => {
    expect(checkInReducer({ step: "ask" }, { type: "answer", mood: "rough" })).toEqual({ step: "rough", mood: "rough" });
    expect(checkInReducer({ step: "ask" }, { type: "answer", mood: "good" })).toEqual({ step: "thanks", mood: "good" });
  });

  it("from a rough week: tell your people, or not right now", () => {
    const rough = { step: "rough", mood: "rough" } as const;
    expect(checkInReducer(rough, { type: "tell" })).toEqual({ step: "tell", mood: "rough" });
    expect(checkInReducer({ step: "tell", mood: "rough" }, { type: "shared" })).toEqual({ step: "shared", mood: "rough" });
    expect(checkInReducer(rough, { type: "notNow" })).toEqual({ step: "notNow", mood: "rough" });
  });

  it("has the text to send", () => {
    expect(ROUGH_TEXT).toBe("Having a rough week. Would mean a lot if you checked in on me.");
  });
});
