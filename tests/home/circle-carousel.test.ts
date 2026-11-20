import { describe, expect, it } from "vitest";
import { rotate, slotsAround, visibleAround } from "@/app/intro/circle-carousel";

describe("circle carousel (HOME-2)", () => {
  it("rotates forward and back, wrapping", () => {
    expect(rotate(2, +1, 5)).toBe(3);
    expect(rotate(4, +1, 5)).toBe(0);
    expect(rotate(0, -1, 5)).toBe(4);
  });

  it("shows ±1 neighbours on phones, wrapping", () => {
    expect(visibleAround(["a", "b", "c", "d", "e"], 0, 1)).toEqual(["e", "a", "b"]);
    expect(visibleAround(["a", "b", "c", "d", "e"], 2, 1)).toEqual(["b", "c", "d"]);
  });

  it("shows ±2 neighbours on wide screens, wrapping", () => {
    expect(visibleAround(["a", "b", "c", "d", "e"], 2, 2)).toEqual(["a", "b", "c", "d", "e"]);
    expect(visibleAround(["a", "b", "c", "d", "e"], 4, 2)).toEqual(["c", "d", "e", "a", "b"]);
  });
});

describe("each circle once, outline trees for the rest (HOME-2, HOME-24)", () => {
  it("fills the slots nearest the center first, right before left", () => {
    expect(slotsAround(["A"], 0, 2)).toEqual([null, null, "A", null, null]);
    expect(slotsAround(["A", "B"], 0, 2)).toEqual([null, null, "A", "B", null]);
    expect(slotsAround(["A", "B", "C"], 0, 2)).toEqual([null, "C", "A", "B", null]);
    expect(slotsAround(["A", "B", "C", "D"], 0, 2)).toEqual([null, "D", "A", "B", "C"]);
    expect(slotsAround(["A", "B", "C", "D", "E"], 0, 2)).toEqual(["D", "E", "A", "B", "C"]);
    expect(slotsAround(["A", "B"], 1, 1)).toEqual([null, "B", "A"]);
    expect(slotsAround(["A"], 0, 1)).toEqual([null, "A", null]);
  });

  it("with enough circles, it's the same as wrapping", () => {
    const six = ["A", "B", "C", "D", "E", "F"];
    expect(slotsAround(six, 4, 2)).toEqual(visibleAround(six, 4, 2));
  });
});
