import { describe, expect, it } from "vitest";
import { footer, daysLeft } from "@/app/intro/archive/copy";
import { feedPosts, weekSummary } from "@/app/intro/archive/feed";
import { canSee, POST_TO_SEE } from "@/app/intro/archive/gate";
import { periodFromKey } from "@/app/intro/archive/periods";
import { at, groups, mine, post } from "./fixtures";

const NOW = at(2026, 10, 20); // Tuesday of week 43 (Oct 19–25).

describe("post to see is off for now (ARC-5)", () => {
  it("is switched off, with the rule kept behind the switch", () => {
    expect(POST_TO_SEE).toBe(false);
    const p = post("leo", "2026-W43");
    expect(canSee(p, { posted: new Set(), groups, viewerOf: [] })).toBe(true);
    expect(canSee(p, { posted: new Set(), groups, viewerOf: [], postToSee: true })).toBe(false);
    expect(canSee(p, { posted: new Set(["2026-W43"]), groups, viewerOf: [], postToSee: true })).toBe(true);
  });

  it("never someone outside your circles, either way", () => {
    expect(canSee(post("zed", "2026-W43"), { posted: new Set(["2026-W43"]), groups, viewerOf: [] })).toBe(false);
  });
});

describe("the feed: everyone's posts, newest first (ARC-8)", () => {
  it("one after another across weeks, months and years, never your own, never from outside your circles", () => {
    const a = post("ana", "2026-W42", { postedAt: at(2026, 10, 14) });
    const b = post("leo", "2026-W43", { postedAt: at(2026, 10, 19) });
    const c = post("kim", "2026-09", { postedAt: at(2026, 9, 30) });
    const d = post("sam", "2026-W43", { postedAt: at(2026, 10, 20, 9) });
    const list = [a, b, c, d, mine("2026-W43"), post("zed", "2026-W43"), post("leo", "2026-W44", { postedAt: at(2026, 10, 27) })];
    expect(feedPosts({ posts: list, groups, viewerOf: [], now: NOW }).map((p) => p.id)).toEqual([d.id, b.id, a.id, c.id]);
  });

  it("with post-to-see switched on, this week waits until you post", () => {
    const b = post("leo", "2026-W43", { postedAt: at(2026, 10, 19) });
    const old = post("ana", "2026-W42", { postedAt: at(2026, 10, 14) });
    expect(feedPosts({ posts: [b, old], groups, viewerOf: [], now: NOW, postToSee: true })).toEqual([]);
    expect(feedPosts({ posts: [b, old, mine("2026-W43")], groups, viewerOf: [], now: NOW, postToSee: true }).map((p) => p.id)).toEqual([b.id]);
  });
});

describe("this week's card (ARC-10)", () => {
  it("who has posted this week, out of everyone who shares a circle with you", () => {
    const posts = [post("ana", "2026-W43", { postedAt: at(2026, 10, 19, 9) }), post("leo", "2026-W43", { postedAt: at(2026, 10, 20, 8) }), post("ana", "2026-W42"), post("zed", "2026-W43"), mine("2026-W43")];
    expect(weekSummary({ posts, groups, now: NOW })).toEqual({ posted: ["ana", "leo"], friends: 5, line: "2 of 5 friends have posted" });
    expect(weekSummary({ posts: [], groups, now: NOW }).line).toBe("No one's posted yet this week");
    expect(weekSummary({ posts: [posts[0]], groups, now: NOW }).line).toBe("1 of 5 friends has posted");
  });

  it("counts down to Sunday night", () => {
    const week = periodFromKey("2026-W43");
    expect(daysLeft(week, at(2026, 10, 20))).toBe("5 days left");
    expect(daysLeft(week, at(2026, 10, 24))).toBe("1 day left");
    expect(daysLeft(week, at(2026, 10, 25))).toBe("last day");
  });
});

describe("under each photo (ARC-8)", () => {
  it("the day it was taken and the week, or the month, year or bonus week", () => {
    expect(footer(periodFromKey("2026-W45"), at(2026, 11, 3))).toEqual({ left: "Tue, Nov 3", right: "WEEK 45" });
    expect(footer(periodFromKey("2026-02"), at(2026, 2, 14))).toEqual({ left: "February", right: "PHOTO OF THE MONTH" });
    expect(footer(periodFromKey("2025"), at(2025, 7, 4))).toEqual({ left: "2025", right: "PHOTO OF THE YEAR" });
    expect(footer(periodFromKey("2026-B"), at(2026, 12, 30))).toEqual({ left: "Wed, Dec 30", right: "BONUS WEEK" });
  });
});
