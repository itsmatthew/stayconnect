import { describe, expect, it } from "vitest";
import { checkCapture, pickerRange } from "@/app/intro/archive/capture-check";
import { periodFromKey } from "@/app/intro/archive/periods";

const at = (y: number, m: number, d: number, h = 12, min = 0, s = 0) => new Date(y, m - 1, d, h, min, s).getTime();
const week = periodFromKey("2026-W43");
const month = periodFromKey("2026-10");
const year = periodFromKey("2026");
const bonus = periodFromKey("2026-B");

describe("capture date (ARC-4)", () => {
  it("accepts a photo taken in the period, edges included", () => {
    expect(checkCapture(at(2026, 10, 19, 0, 0, 0), week)).toEqual({ ok: true });
    expect(checkCapture(at(2026, 10, 25, 23, 59, 59), week)).toEqual({ ok: true });
    expect(checkCapture(at(2026, 10, 1, 0), month)).toEqual({ ok: true });
    expect(checkCapture(at(2026, 1, 1, 0), year)).toEqual({ ok: true });
    expect(checkCapture(at(2027, 1, 3, 20), bonus)).toEqual({ ok: true });
  });

  it("rejects a photo from outside the period, saying when it's from and what's allowed", () => {
    expect(checkCapture(at(2026, 10, 26, 0), week)).toEqual({
      ok: false,
      message: "This photo is from Oct 26 — pick one from this week (Oct 19–25).",
    });
    expect(checkCapture(at(2026, 9, 12), week)).toEqual({
      ok: false,
      message: "This photo is from Sep 12 — pick one from this week (Oct 19–25).",
    });
    expect(checkCapture(at(2026, 9, 12), month)).toEqual({
      ok: false,
      message: "This photo is from Sep 12 — pick one from October (Oct 1–31).",
    });
    expect(checkCapture(at(2025, 12, 30), year)).toEqual({
      ok: false,
      message: "This photo is from Dec 30, 2025 — pick one from 2026.",
    });
    expect(checkCapture(at(2026, 12, 27), bonus)).toEqual({
      ok: false,
      message: "This photo is from Dec 27 — pick one from the bonus week (Dec 28 – Jan 3).",
    });
  });

  it("rejects a photo with no capture date", () => {
    expect(checkCapture(undefined, week)).toEqual({
      ok: false,
      message: "We can't tell when this photo was taken — pick one from this week (Oct 19–25).",
    });
    expect(checkCapture(undefined, year)).toEqual({
      ok: false,
      message: "We can't tell when this photo was taken — pick one from 2026.",
    });
  });

  it("the picker shows the allowed range", () => {
    expect(pickerRange(week)).toBe("Photos taken Oct 19–25");
    expect(pickerRange(month)).toBe("Photos taken Oct 1–31");
    expect(pickerRange(year)).toBe("Photos taken in 2026");
    expect(pickerRange(bonus)).toBe("Photos taken Dec 28 – Jan 3");
  });
});
