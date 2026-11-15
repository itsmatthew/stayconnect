import { describe, expect, it } from "vitest";
import { giftSpots, GROUND, LID_OVERHANG, moreChip, MAX_GIFTS, TRUNK_BASE } from "@/components/circle/gift-layout";

/** A box's footprint, lid overhang included. */
const left = (s: { x: number }) => s.x - LID_OVERHANG;
const right = (s: { x: number; w: number }) => s.x + s.w + LID_OVERHANG;
const clearOfTrunk = (x0: number, x1: number) => x1 <= TRUNK_BASE.x0 || x0 >= TRUNK_BASE.x1;

describe("gift pile layout (CIRCLE-12)", () => {
  it("holds up to 4 boxes", () => {
    expect(MAX_GIFTS).toBe(4);
    for (let n = 0; n <= 4; n++) expect(giftSpots(n)).toHaveLength(n);
    expect(giftSpots(9)).toHaveLength(4);
  });

  it("every box stands on the ground at the trunk's base", () => {
    for (const s of giftSpots(4)) expect(s.bottom).toBe(GROUND);
  });

  it("never overlaps the trunk", () => {
    for (const s of giftSpots(4)) expect(clearOfTrunk(left(s), right(s)), JSON.stringify(s)).toBe(true);
  });

  it("alternates left and right, the newest nearest the trunk, then further out", () => {
    const [a, b, c, d] = giftSpots(4);
    expect([a, b, c, d].map((s) => s.side)).toEqual(["left", "right", "left", "right"]);
    // The first two hug the trunk.
    expect(TRUNK_BASE.x0 - right(a)).toBeLessThanOrEqual(3);
    expect(left(b) - TRUNK_BASE.x1).toBeLessThanOrEqual(3);
    expect(right(c)).toBeLessThan(right(a));
    expect(left(d)).toBeGreaterThan(left(b));
  });

  it("neighbours on a side overlap slightly, like a real pile", () => {
    const [a, b, c, d] = giftSpots(4);
    const overlapLeft = right(c) - left(a);
    const overlapRight = right(b) - left(d);
    for (const o of [overlapLeft, overlapRight]) {
      expect(o).toBeGreaterThan(0);
      expect(o).toBeLessThanOrEqual(8);
    }
  });

  it("boxes are a bit smaller than the reference's, and shrink going out", () => {
    const spots = giftSpots(4);
    for (const s of spots) expect(s.w).toBeLessThanOrEqual(28);
    expect(spots[2].w).toBeLessThanOrEqual(spots[0].w);
    expect(spots[3].w).toBeLessThanOrEqual(spots[1].w);
  });

  it("the +N chip sits on the ground past the last box, clear of the trunk", () => {
    const chip = moreChip();
    const outer = giftSpots(4)[3];
    expect(chip.y + chip.h).toBe(GROUND);
    expect(chip.x).toBeGreaterThanOrEqual(right(outer) - 4);
    expect(clearOfTrunk(chip.x, chip.x + chip.w)).toBe(true);
  });
});
