import { describe, expect, it } from "vitest";
import { INITIAL_CENTER_ID, placeholderGroups } from "@/app/intro/placeholder-groups";

describe("placeholder groups (HOME-1)", () => {
  it("has the five groups in mockup order", () => {
    expect(placeholderGroups.map((g) => g.name)).toEqual([
      "Uni Mates",
      "Apt 4B",
      "Madrid Crew",
      "Hoops Since ’14",
      "Work Mates",
    ]);
  });

  it("starts on Madrid Crew", () => {
    expect(placeholderGroups.find((g) => g.id === INITIAL_CENTER_ID)?.name).toBe("Madrid Crew");
  });

  it("gives every group unique ids, a friend count, three captioned memories and a last-memory line", () => {
    expect(new Set(placeholderGroups.map((g) => g.id)).size).toBe(5);
    for (const g of placeholderGroups) {
      expect(g.friendCount).toBeGreaterThanOrEqual(1);
      expect(g.memories).toHaveLength(3);
      for (const m of g.memories) {
        expect(m.art).toBeTruthy();
        expect(m.caption.trim()).not.toBe("");
      }
      expect(g.lastMemory).toMatch(/^last memory /);
    }
  });

  it("keeps the reference's Madrid Crew card", () => {
    const madrid = placeholderGroups.find((g) => g.name === "Madrid Crew")!;
    expect(madrid.friendCount).toBe(6);
    expect(madrid.memories.map((m) => m.caption.replace(/\s+/g, " "))).toEqual([
      "rooftop, last night",
      "the 4am churro run",
      "wrong line, twice",
    ]);
    expect(madrid.lastMemory).toBe("last memory 2 days ago");
  });
});
