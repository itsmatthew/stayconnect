import { describe, expect, it } from "vitest";
import { canSee, circleTags, feedSections, outlineColors, sharedCircles } from "@/app/intro/archive/gate";
import { at, BLUE, GOLD, GREEN, groups, mine, post, RED } from "./fixtures";

const NOW = at(2026, 10, 20);

describe("audience, circle lines and tags (ARC-6, ARC-7)", () => {
  it("shared circles: closest first, then in circle order", () => {
    expect(sharedCircles("leo", groups).map((g) => g.id)).toEqual(["reds", "golds", "greens", "blues"]);
    expect(sharedCircles("ana", groups).map((g) => g.id)).toEqual(["reds"]);
    expect(sharedCircles("zed", groups)).toEqual([]);
  });

  it("one outline per shared circle, in its canopy colour, at most 3", () => {
    expect(outlineColors("leo", groups)).toEqual([RED, GOLD, GREEN]);
    expect(outlineColors("sam", groups)).toEqual([RED, GOLD]);
    expect(outlineColors("kim", groups)).toEqual([BLUE]);
  });

  it("tags: at most 2 circle names, then +N", () => {
    expect(circleTags("leo", groups)).toEqual({ names: ["Reds", "Golds"], more: 2 });
    expect(circleTags("ana", groups)).toEqual({ names: ["Reds"], more: 0 });
  });
});

describe("the gate (ARC-5)", () => {
  const ctx = (posted: string[], viewerOf: string[] = []) => ({ posted: new Set(posted), groups, viewerOf });

  it("you see a post only once you've posted for that same period", () => {
    const p = post("ana", "2026-W43");
    expect(canSee(p, ctx([]))).toBe(false);
    expect(canSee(p, ctx(["2026-10"]))).toBe(false);
    expect(canSee(p, ctx(["2026-W42"]))).toBe(false);
    expect(canSee(p, ctx(["2026-W43"]))).toBe(true);
  });

  it("a viewer sees that circle's members without posting, and only them", () => {
    expect(canSee(post("kim", "2026-W43"), ctx([], ["blues"]))).toBe(true);
    expect(canSee(post("leo", "2026-W43"), ctx([], ["blues"]))).toBe(true);
    expect(canSee(post("ana", "2026-W43"), ctx([], ["blues"]))).toBe(false);
  });

  it("never shows posts from people outside your circles", () => {
    expect(canSee(post("zed", "2026-W43"), ctx(["2026-W43"]))).toBe(false);
  });
});

describe("feed sections (ARC-5, ARC-8, ARC-9)", () => {
  const posts = [
    post("ana", "2026-W43"),
    post("sam", "2026-W43"),
    post("zed", "2026-W43"),
    post("leo", "2026-W42"),
    mine("2026-W42"),
    post("ana", "2026-W41"),
    post("sam", "2026-W41"),
    post("leo", "2026-09"),
    mine("2026-09"),
    post("ana", "2026-W44"), // not started yet: never shown
  ];

  it("open periods first (week, month), then ended ones, most recently ended first", () => {
    const keys = feedSections({ posts, groups, viewerOf: [], now: NOW }).map((s) => s.period.key);
    expect(keys).toEqual(["2026-W43", "2026-10", "2026-W42", "2026-W41", "2026-09"]);
  });

  it("each period is gated separately, and missed periods stay closed", () => {
    const byKey = Object.fromEntries(feedSections({ posts, groups, viewerOf: [], now: NOW }).map((s) => [s.period.key, s]));
    expect(byKey["2026-W43"]).toMatchObject({ status: "open", visible: [] });
    expect(byKey["2026-W43"].hidden.map((p) => p.author)).toEqual(["ana", "sam"]);
    expect(byKey["2026-10"]).toMatchObject({ status: "open", visible: [], hidden: [] });
    expect(byKey["2026-W42"].status).toBe("unlocked");
    expect(byKey["2026-W42"].visible.map((p) => p.author)).toEqual(["leo"]);
    expect(byKey["2026-W41"]).toMatchObject({ status: "closed", visible: [] });
    expect(byKey["2026-W41"].hidden).toHaveLength(2);
    expect(byKey["2026-09"].status).toBe("unlocked");
  });

  it("your own posts are never in the feed", () => {
    for (const s of feedSections({ posts, groups, viewerOf: [], now: NOW })) {
      expect([...s.visible, ...s.hidden].some((p) => p.author === "me")).toBe(false);
    }
  });

  it("a viewer's circle shows through a locked period", () => {
    const s = feedSections({ posts: [post("kim", "2026-W43"), post("ana", "2026-W43")], groups, viewerOf: ["blues"], now: NOW })[0];
    expect(s.status).toBe("open");
    expect(s.visible.map((p) => p.author)).toEqual(["kim"]);
    expect(s.hidden.map((p) => p.author)).toEqual(["ana"]);
  });

  it("the year shows in December even with nobody posted", () => {
    const keys = feedSections({ posts: [], groups, viewerOf: [], now: at(2026, 12, 5) }).map((s) => s.period.key);
    expect(keys).toEqual(["2026-W49", "2026-12", "2026"]);
  });
});
