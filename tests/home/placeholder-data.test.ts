import { describe, expect, it } from "vitest";
import { friends, placeholderGroups, placeholderReplies, seedConversations } from "@/app/intro/placeholder-data";
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

  it("has a few friends, some of them closest, plus seed conversations and replies in the same file", () => {
    expect(friends.length).toBeGreaterThanOrEqual(4);
    expect(new Set(friends.map((f) => f.id)).size).toBe(friends.length);
    expect(friends.some((f) => f.closest)).toBe(true);
    expect(friends.some((f) => !f.closest)).toBe(true);
    expect(seedConversations(Date.now()).length).toBeGreaterThan(0);
    expect(placeholderReplies.length).toBeGreaterThan(0);
  });
});
