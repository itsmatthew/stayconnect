import { describe, expect, it } from "vitest";
import { rotate, visibleAround } from "@/app/intro/circle-carousel";

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
