import { describe, expect, it } from "vitest";
import { ME } from "@/app/intro/messages/conversations";
import {
  GOAL_LABEL_MAX,
  activeGoal,
  pastGoal,
  countdownTag,
  dayCount,
  daysUntil,
  goalsReducer,
  type GoalAction,
  type GoalState,
} from "@/app/intro/profile/goals";

const NOW = new Date(2026, 9, 21, 12).getTime();
const G = "madrid-crew";
const run = (...actions: GoalAction[]) => actions.reduce<GoalState>(goalsReducer, {});
const set = (label: string, date?: string, by = ME): GoalAction => ({ type: "set", groupId: G, label, date, by });

describe("setting, changing and clearing a goal (GP-7)", () => {
  it("one goal per group: a label, an optional date, and whoever set it is in", () => {
    expect(run(set("lake weekend", "2026-12-06"))[G]).toEqual({ label: "lake weekend", date: "2026-12-06", setBy: ME, in: [ME] });
    expect(run(set("dinner soon"))[G]).toEqual({ label: "dinner soon", setBy: ME, in: [ME] });
  });

  it("setting again replaces it: never more than one per group", () => {
    const s = run(set("lake weekend", "2026-12-06"), set("ski trip", "2027-01-20"));
    expect(Object.keys(s)).toEqual([G]);
    expect(s[G].label).toBe("ski trip");
  });

  it("the label is trimmed and capped at 32 characters; a blank one changes nothing", () => {
    expect(run(set("   lake weekend  "))[G].label).toBe("lake weekend");
    expect(run(set("x".repeat(50)))[G].label).toHaveLength(GOAL_LABEL_MAX);
    expect(GOAL_LABEL_MAX).toBe(32);
    expect(run(set("   "))).toEqual({});
    expect(run(set("lake weekend"), set("  "))[G].label).toBe("lake weekend");
  });

  it("any member can clear it", () => {
    expect(run(set("lake weekend", undefined, "leo"), { type: "clear", groupId: G })).toEqual({});
  });

  it("groups don't share goals", () => {
    const s = run(set("lake weekend"), { type: "set", groupId: "apt-4b", label: "movie night", by: "priya" });
    expect(s[G].label).toBe("lake weekend");
    expect(s["apt-4b"].label).toBe("movie night");
  });
});

describe("I'm in (GP-8)", () => {
  it("join adds someone once; leave takes them out", () => {
    const s = run(set("lake weekend", undefined, "leo"), { type: "join", groupId: G, who: ME }, { type: "join", groupId: G, who: ME });
    expect(s[G].in).toEqual(["leo", ME]);
    expect(goalsReducer(s, { type: "leave", groupId: G, who: ME })[G].in).toEqual(["leo"]);
  });

  it("joining a group with no goal does nothing", () => {
    expect(run({ type: "join", groupId: G, who: ME })).toEqual({});
  });

  it("changing only the label keeps everyone who's in", () => {
    const s = run(set("lake weekend", "2026-12-06", "leo"), { type: "join", groupId: G, who: ME }, set("lake weekend!!", "2026-12-06", "ana"));
    expect(s[G].label).toBe("lake weekend!!");
    expect(s[G].in).toEqual(["leo", ME]);
  });

  it("a new date, a moved date or a removed date starts a fresh count with only the setter in", () => {
    const joined = run(set("lake weekend", undefined, "leo"), { type: "join", groupId: G, who: ME });
    expect(goalsReducer(joined, set("lake weekend", "2026-12-06", "ana"))[G].in).toEqual(["ana"]);

    const dated = run(set("lake weekend", "2026-12-06", "leo"), { type: "join", groupId: G, who: ME });
    expect(goalsReducer(dated, set("lake weekend", "2026-12-13", "ana"))[G].in).toEqual(["ana"]);
    expect(goalsReducer(dated, set("lake weekend", undefined, "ana"))[G].in).toEqual(["ana"]);
  });

  it("setting a goal after clearing starts fresh", () => {
    const s = run(set("lake weekend", undefined, "leo"), { type: "join", groupId: G, who: ME }, { type: "clear", groupId: G }, set("lake weekend", undefined, "ana"));
    expect(s[G].in).toEqual(["ana"]);
  });
});

describe("countdown (GP-7/9, HOME-19)", () => {
  it("counts whole local calendar days", () => {
    expect(daysUntil("2026-12-06", NOW)).toBe(46);
    expect(daysUntil("2026-10-22", NOW)).toBe(1);
    expect(daysUntil("2026-10-21", NOW)).toBe(0);
    expect(daysUntil("2026-10-20", NOW)).toBe(-1);
    // Late at night still counts the same calendar day.
    expect(daysUntil("2026-10-22", new Date(2026, 9, 21, 23, 59).getTime())).toBe(1);
  });

  it("reads N days, 1 day, today", () => {
    expect(dayCount(46)).toBe("46 days");
    expect(dayCount(1)).toBe("1 day");
    expect(dayCount(0)).toBe("today");
  });

  it("Home's tag: “46 days · lake weekend”, none without a date", () => {
    const s = run(set("lake weekend", "2026-12-06"));
    expect(countdownTag(s[G], NOW)).toBe("46 days · lake weekend");
    expect(countdownTag(run(set("lake weekend", "2026-10-22"))[G], NOW)).toBe("1 day · lake weekend");
    expect(countdownTag(run(set("lake weekend", "2026-10-21"))[G], NOW)).toBe("today · lake weekend");
    expect(countdownTag(run(set("lake weekend"))[G], NOW)).toBeUndefined();
  });

  it("from the day after its date, the goal is gone (GP-9)", () => {
    const s = run(set("lake weekend", "2026-10-21"));
    expect(activeGoal(s, G, NOW)?.label).toBe("lake weekend");
    expect(activeGoal(s, G, new Date(2026, 9, 21, 23, 59).getTime())?.label).toBe("lake weekend");
    expect(activeGoal(s, G, new Date(2026, 9, 22, 0, 1).getTime())).toBeUndefined();
  });

  it("an undated goal never expires; a group with none has none", () => {
    expect(activeGoal(run(set("dinner soon")), G, new Date(2030, 0, 1).getTime())?.label).toBe("dinner soon");
    expect(activeGoal({}, G, NOW)).toBeUndefined();
  });

  it("a dated goal past its date waits to be asked about; clearing it ends that (GP-12)", () => {
    const s = run(set("lake weekend", "2026-10-20"));
    expect(pastGoal(s, G, NOW)?.label).toBe("lake weekend");
    expect(pastGoal(s, G, new Date(2026, 9, 20, 23).getTime())).toBeUndefined();
    expect(pastGoal(goalsReducer(s, { type: "clear", groupId: G }), G, NOW)).toBeUndefined();
  });

  it("undated or future goals are never past", () => {
    expect(pastGoal(run(set("dinner soon")), G, NOW)).toBeUndefined();
    expect(pastGoal(run(set("lake weekend", "2026-12-06")), G, NOW)).toBeUndefined();
    expect(pastGoal({}, G, NOW)).toBeUndefined();
  });

  it("load replaces the state (GP-11)", () => {
    const saved = run(set("lake weekend"));
    expect(goalsReducer({}, { type: "load", state: saved })).toEqual(saved);
  });
});
