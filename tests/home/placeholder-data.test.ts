import { describe, expect, it } from "vitest";
import { friends, placeholderGroups, placeholderPosts, placeholderReplies, seedConversations } from "@/app/intro/placeholder-data";
import { openSlots, periodFromKey } from "@/app/intro/archive/periods";
import { ME } from "@/app/intro/messages/conversations";
import { openingCenter } from "@/app/intro/circle-carousel";

describe("placeholder data (HOME-1)", () => {
  it("has the four closest circles first, then the three other groups", () => {
    expect(placeholderGroups.map((g) => g.name)).toEqual([
      "Madrid Crew",
      "Hoops Since ’14",
      "Apt 4B",
      "Family",
      "Uni Mates",
      "Work Mates",
      "Fall 24",
    ]);
    expect(placeholderGroups.map((g) => g.closest)).toEqual([true, true, true, true, false, false, false]);
  });

  it("has 3–5 closest circles", () => {
    const n = placeholderGroups.filter((g) => g.closest).length;
    expect(n).toBeGreaterThanOrEqual(3);
    expect(n).toBeLessThanOrEqual(5);
  });

  it("opens on the middle closest circle (HOME-2)", () => {
    expect(placeholderGroups[openingCenter(placeholderGroups)].name).toBe("Hoops Since ’14");
  });

  it("gives every group unique ids, members, a friend count, three captioned memories and a last-memory line", () => {
    expect(new Set(placeholderGroups.map((g) => g.id)).size).toBe(placeholderGroups.length);
    const friendIds = new Set(friends.map((f) => f.id));
    for (const g of placeholderGroups) {
      expect(g.friendCount).toBeGreaterThanOrEqual(1);
      expect(g.members.length).toBeGreaterThanOrEqual(1);
      for (const m of g.members) expect(friendIds.has(m)).toBe(true);
      expect(g.memories).toHaveLength(3);
      for (const m of g.memories) {
        expect(m.art).toBeTruthy();
        expect(m.caption.trim()).not.toBe("");
      }
      expect(g.lastMemory).toMatch(/^last memory /);
    }
  });

  it("seeds both header photos for every group but Fall 24, as dated art, first before last (GP-12)", () => {
    const fall = placeholderGroups.find((g) => g.id === "fall-24")!;
    // Left empty so the empty state shows in development.
    expect(fall.firstPhoto).toBeUndefined();
    expect(fall.lastPhoto).toBeUndefined();
    for (const g of placeholderGroups.filter((g) => g !== fall)) {
      expect(g.firstPhoto?.art).toBeTruthy();
      expect(g.lastPhoto?.art).toBeTruthy();
      expect(g.firstPhoto!.takenAt!).toBeLessThan(g.lastPhoto!.takenAt!);
      expect(g.firstPhoto?.src).toBeUndefined();
    }
  });

  it("has a few friends, some of them closest, plus seed conversations and replies in the same file", () => {
    expect(friends.length).toBeGreaterThanOrEqual(4);
    expect(new Set(friends.map((f) => f.id)).size).toBe(friends.length);
    expect(friends.some((f) => f.closest)).toBe(true);
    expect(friends.some((f) => !f.closest)).toBe(true);
    expect(seedConversations(Date.now()).length).toBeGreaterThan(0);
    expect(placeholderReplies.length).toBeGreaterThan(0);
  });

  it("Family has a viewer, who is a friend (ARC-5)", () => {
    const family = placeholderGroups.find((g) => g.id === "family")!;
    expect(family.viewers?.length).toBeGreaterThan(0);
    for (const v of family.viewers!) expect(friends.some((f) => f.id === v)).toBe(true);
  });
});

describe("placeholder Archive posts (ARC-2, ARC-3)", () => {
  const NOW = new Date(2026, 9, 20, 12).getTime();
  const posts = placeholderPosts(NOW);
  const friendIds = new Set(friends.map((f) => f.id));

  it("come from friends and from you, at most one per person per period, never in the future", () => {
    expect(posts.length).toBeGreaterThan(100);
    const seen = new Set<string>();
    for (const p of posts) {
      expect(p.author === ME || friendIds.has(p.author)).toBe(true);
      const key = `${p.author}/${p.period}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      expect(p.postedAt).toBeLessThanOrEqual(NOW);
      const period = periodFromKey(p.period);
      expect(p.postedAt).toBeGreaterThanOrEqual(period.start);
      expect(p.postedAt).toBeLessThan(period.end);
    }
  });

  it("you've missed a few past weeks, and this week and month are still yours to post", () => {
    const mine = new Set(posts.filter((p) => p.author === ME).map((p) => p.period));
    const missed = Array.from({ length: 42 }, (_, i) => `2026-W${String(i + 1).padStart(2, "0")}`).filter((k) => !mine.has(k));
    expect(missed.length).toBeGreaterThanOrEqual(2);
    expect(missed.length).toBeLessThan(10);
    for (const open of openSlots(NOW)) expect(mine.has(open.key)).toBe(false);
    expect(mine.has("2025")).toBe(true);
  });

  it("some carry a caption of at most 80 characters (ARC-13)", () => {
    const captions = posts.flatMap((p) => (p.caption ? [p.caption] : []));
    expect(captions.length).toBeGreaterThan(10);
    for (const c of captions) expect(c.length).toBeLessThanOrEqual(80);
  });

  it("friends have already posted this week", () => {
    expect(posts.filter((p) => p.period === "2026-W43" && p.author !== ME).length).toBeGreaterThanOrEqual(2);
  });
});

