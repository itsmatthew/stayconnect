import { describe, expect, it } from "vitest";
import { circleReducer, initialCircleState, members, overGuide, SOFT_GUIDES } from "@/app/intro/circle/rings";

const DAY = 86_400_000;

describe("placing people (CIRCLE-8, CIRCLE-10)", () => {
  it("new users start with empty rings", () => {
    const s = initialCircleState({});
    expect(members(s.placements, "nest")).toEqual([]);
    expect(members(s.placements, "branches")).toEqual([]);
    expect(members(s.placements, "bloom")).toEqual([]);
    expect(s.dismissed).toEqual({});
  });

  it("place adds someone to a ring, or moves them there, ending that ring's list", () => {
    let s = initialCircleState({ leo: "branches", ana: "nest" });
    s = circleReducer(s, { type: "place", friendId: "sam", ring: "nest" });
    expect(members(s.placements, "nest")).toEqual(["ana", "sam"]);
    s = circleReducer(s, { type: "place", friendId: "leo", ring: "nest" });
    expect(members(s.placements, "nest")).toEqual(["ana", "sam", "leo"]);
    expect(members(s.placements, "branches")).toEqual([]);
  });

  it("never blocks an add, however full the ring (CIRCLE-2)", () => {
    let s = initialCircleState({});
    for (let i = 0; i < 100; i++) s = circleReducer(s, { type: "place", friendId: `f${i}`, ring: "nest" });
    expect(members(s.placements, "nest")).toHaveLength(100);
  });

  it("dismiss remembers when a suggestion was turned down", () => {
    const s = circleReducer(initialCircleState({}), { type: "dismiss", friendId: "leo", at: 5 * DAY });
    expect(s.dismissed).toEqual({ leo: 5 * DAY });
  });

  it("load replaces the state", () => {
    const saved = { placements: { leo: "bloom" as const }, dismissed: { leo: 1 } };
    expect(circleReducer(initialCircleState({ ana: "nest" }), { type: "load", state: saved })).toEqual(saved);
  });
});

describe("soft guides (CIRCLE-2)", () => {
  it("nest ~5 (0–10), branches ~15 (5–25), bloom ~50 (25–75)", () => {
    expect(SOFT_GUIDES).toEqual({
      nest: { typical: 5, low: 0, high: 10 },
      branches: { typical: 15, low: 5, high: 25 },
      bloom: { typical: 50, low: 25, high: 75 },
    });
  });

  it("only past the upper end earns the gentle note; below the lower end is fine", () => {
    expect(overGuide("nest", 10)).toBe(false);
    expect(overGuide("nest", 11)).toBe(true);
    expect(overGuide("branches", 25)).toBe(false);
    expect(overGuide("branches", 26)).toBe(true);
    expect(overGuide("bloom", 75)).toBe(false);
    expect(overGuide("bloom", 76)).toBe(true);
    expect(overGuide("branches", 0)).toBe(false);
    expect(overGuide("bloom", 3)).toBe(false);
  });
});
