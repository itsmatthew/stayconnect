import { describe, expect, it } from "vitest";
import { ANSWER_MAX, BIO_MAX, FIXED_QUESTIONS, emptyProfile, profileQuestions, profileReducer, tidyLine, validProfile, weeklyQuestion } from "@/app/intro/me/profile";

const NOV_9 = new Date(2026, 10, 9, 10).getTime(); // Monday of ISO week 46
const NOV_16 = new Date(2026, 10, 16, 10).getTime(); // week 47

describe("a line about you (ME-6)", () => {
  it("tidies spaces and stops at 60", () => {
    expect(tidyLine("  Jesus   is\\nKing ", BIO_MAX)).toBe("Jesus is\\nKing");
    expect(tidyLine("  Jesus   is King ", BIO_MAX)).toBe("Jesus is King");
    expect(tidyLine("x".repeat(80), BIO_MAX)).toHaveLength(60);
    expect(profileReducer(emptyProfile(), { type: "bio", text: "  Jesus   is King " }).bio).toBe("Jesus is King");
    expect(profileReducer({ ...emptyProfile(), bio: "old" }, { type: "bio", text: "   " }).bio).toBe("");
  });
});

describe("five questions (ME-7)", () => {
  it("this week's first, with its week number, then the four that stay", () => {
    const qs = profileQuestions(emptyProfile(), NOV_9);
    expect(qs.map((q) => q.text)).toEqual([weeklyQuestion(NOV_9).text, "Smells like childhood?", "Wish I could feel again?", "My spot growing up?", "Hill I’d die on?"]);
    expect(qs[0]).toMatchObject({ week: 46, answer: undefined });
    expect(qs.slice(1).every((q) => q.week === undefined)).toBe(true);
    expect(FIXED_QUESTIONS.map((q) => q.color)).toEqual(["#B43A2A", "#B5650E", "#4F7A36", "#2F6FA8"]);
  });

  it("week 46 asks the design's Thanksgiving question, and the next week asks another", () => {
    expect(weeklyQuestion(NOV_9)).toMatchObject({ week: 46, text: "Favorite Thanksgiving dish?" });
    expect(weeklyQuestion(NOV_16).text).not.toBe("Favorite Thanksgiving dish?");
    expect(weeklyQuestion(NOV_16).week).toBe(47);
  });

  it("answers stay; this week's answer belongs to its week", () => {
    let p = profileReducer(emptyProfile(), { type: "answer", id: "smells", text: "rubber from turf" });
    const wk = weeklyQuestion(NOV_9);
    p = profileReducer(p, { type: "answer", id: wk.id, text: " stuffing " });
    expect(profileQuestions(p, NOV_9).map((q) => q.answer)).toEqual(["stuffing", "rubber from turf", undefined, undefined, undefined]);
    expect(profileQuestions(p, NOV_16).map((q) => q.answer)).toEqual([undefined, "rubber from turf", undefined, undefined, undefined]);
  });

  it("an answer stops at 40, and an empty one clears it", () => {
    let p = profileReducer(emptyProfile(), { type: "answer", id: "hill", text: "y".repeat(50) });
    expect(p.answers.hill).toHaveLength(ANSWER_MAX);
    p = profileReducer(p, { type: "answer", id: "hill", text: "  " });
    expect(p.answers.hill).toBeUndefined();
  });
});

describe("memories that made me (ME-8)", () => {
  it("are shown to everyone in your circles until you pick your nest", () => {
    expect(emptyProfile().audience).toEqual(["circles", "circles", "circles"]);
    expect(profileReducer(emptyProfile(), { type: "audience", index: 1, audience: "nest" }).audience).toEqual(["circles", "nest", "circles"]);
  });
});

describe("saved profiles", () => {
  it("load back, and anything damaged falls back to empty", () => {
    const p = profileReducer(profileReducer(emptyProfile(), { type: "bio", text: "hi" }), { type: "audience", index: 0, audience: "nest" });
    expect(validProfile(JSON.parse(JSON.stringify(p)))).toEqual(p);
    expect(validProfile(null)).toEqual(emptyProfile());
    expect(validProfile({ bio: 4, answers: [], audience: ["x"] })).toEqual(emptyProfile());
    expect(validProfile({ bio: "ok", answers: { smells: "a", bad: 3 }, audience: ["nest", "circles", "nope"] })).toEqual({ bio: "ok", answers: { smells: "a" }, audience: ["nest", "circles", "circles"] });
  });
});
