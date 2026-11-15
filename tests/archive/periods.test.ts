import { describe, expect, it } from "vitest";
import {
  closesLabel,
  hasBonusWeek,
  inLastWeekOfMonth,
  isOpen,
  monthPeriod,
  openSlots,
  periodFromKey,
  periodsOfYear,
  periodTitle,
  rangeLabel,
  weekPeriod,
  yearPeriod,
} from "@/app/intro/archive/periods";

const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).getTime();

describe("periods (ARC-2)", () => {
  it("weeks run Monday to Sunday with ISO numbers", () => {
    const w = weekPeriod(at(2026, 10, 20));
    expect(w).toMatchObject({ kind: "week", key: "2026-W43", year: 2026, index: 43 });
    expect(w.start).toBe(at(2026, 10, 19, 0));
    expect(w.end).toBe(at(2026, 10, 26, 0));
    expect(weekPeriod(at(2026, 10, 19, 0, 0)).key).toBe("2026-W43");
    expect(weekPeriod(at(2026, 10, 25, 23, 59)).key).toBe("2026-W43");
    expect(weekPeriod(at(2026, 10, 18, 23, 59)).key).toBe("2026-W42");
  });

  it("a week belongs to the year its Thursday falls in", () => {
    expect(weekPeriod(at(2025, 12, 29)).key).toBe("2026-W01");
    expect(weekPeriod(at(2026, 1, 4)).key).toBe("2026-W01");
    expect(weekPeriod(at(2025, 12, 28)).key).toBe("2025-W52");
  });

  it("week 53 is the bonus week, the week between years", () => {
    expect(hasBonusWeek(2026)).toBe(true);
    expect(hasBonusWeek(2025)).toBe(false);
    for (const t of [at(2026, 12, 28, 0), at(2026, 12, 31), at(2027, 1, 3, 23, 59)]) {
      expect(weekPeriod(t)).toMatchObject({ kind: "bonus", key: "2026-B", year: 2026 });
    }
    expect(weekPeriod(at(2027, 1, 4, 0)).key).toBe("2027-W01");
  });

  it("months are calendar months and the year is the calendar year", () => {
    const m = monthPeriod(at(2026, 10, 20));
    expect(m).toMatchObject({ kind: "month", key: "2026-10", year: 2026, index: 10 });
    expect([m.start, m.end]).toEqual([at(2026, 10, 1, 0), at(2026, 11, 1, 0)]);
    const y = yearPeriod(at(2026, 10, 20));
    expect(y).toMatchObject({ kind: "year", key: "2026", year: 2026 });
    expect([y.start, y.end]).toEqual([at(2026, 1, 1, 0), at(2027, 1, 1, 0)]);
  });

  it("keys round-trip", () => {
    for (const key of ["2026-W43", "2026-W01", "2026-B", "2026-10", "2026-01", "2026"]) {
      expect(periodFromKey(key).key).toBe(key);
    }
    expect(periodFromKey("2026-W43").start).toBe(at(2026, 10, 19, 0));
  });

  it("titles and ranges", () => {
    expect(periodTitle(periodFromKey("2026-W43"))).toBe("Week 43");
    expect(periodTitle(periodFromKey("2026-10"))).toBe("October");
    expect(periodTitle(periodFromKey("2026"))).toBe("2026");
    expect(periodTitle(periodFromKey("2026-B"))).toBe("Bonus week");
    expect(rangeLabel(periodFromKey("2026-W43"))).toBe("Oct 19–25");
    expect(rangeLabel(periodFromKey("2026-W40"))).toBe("Sep 28 – Oct 4");
    expect(rangeLabel(periodFromKey("2026-10"))).toBe("Oct 1–31");
    expect(rangeLabel(periodFromKey("2026"))).toBe("2026");
    expect(rangeLabel(periodFromKey("2026-B"))).toBe("Dec 28 – Jan 3");
  });
});

describe("posting windows (ARC-3, ARC-10)", () => {
  it("open slots: the week (or bonus week), the month, and the year only in December", () => {
    expect(openSlots(at(2026, 10, 20)).map((p) => p.key)).toEqual(["2026-W43", "2026-10"]);
    expect(openSlots(at(2026, 12, 5)).map((p) => p.key)).toEqual(["2026-W49", "2026-12", "2026"]);
    expect(openSlots(at(2026, 12, 29)).map((p) => p.key)).toEqual(["2026-B", "2026-12", "2026"]);
    expect(openSlots(at(2027, 1, 2)).map((p) => p.key)).toEqual(["2026-B", "2027-01"]);
  });

  it("a period is open only during its window; the year only in December", () => {
    const year = periodFromKey("2026");
    expect(isOpen(year, at(2026, 11, 30, 23, 59))).toBe(false);
    expect(isOpen(year, at(2026, 12, 1, 0))).toBe(true);
    expect(isOpen(year, at(2026, 12, 31, 23, 59))).toBe(true);
    expect(isOpen(year, at(2027, 1, 1, 0))).toBe(false);
    const week = periodFromKey("2026-W43");
    expect(isOpen(week, at(2026, 10, 25, 23, 59))).toBe(true);
    expect(isOpen(week, at(2026, 10, 26, 0))).toBe(false);
  });

  it("the last 7 days of the month", () => {
    expect(inLastWeekOfMonth(at(2026, 10, 24))).toBe(false);
    expect(inLastWeekOfMonth(at(2026, 10, 25, 0))).toBe(true);
    expect(inLastWeekOfMonth(at(2026, 10, 31))).toBe(true);
    expect(inLastWeekOfMonth(at(2026, 2, 21))).toBe(false);
    expect(inLastWeekOfMonth(at(2026, 2, 22))).toBe(true);
  });

  it("closes labels", () => {
    expect(closesLabel(periodFromKey("2026-W43"))).toBe("closes Sunday");
    expect(closesLabel(periodFromKey("2026-B"))).toBe("closes Sunday");
    expect(closesLabel(periodFromKey("2026-10"))).toBe("closes Oct 31");
    expect(closesLabel(periodFromKey("2026-02"))).toBe("closes Feb 28");
    expect(closesLabel(periodFromKey("2026"))).toBe("closes Dec 31");
  });
});

describe("a year's slots in grid order (ME-2)", () => {
  it("2026: the year, then each month followed by the weeks whose Thursday falls in it, then the bonus week", () => {
    const slots = periodsOfYear(2026);
    expect(slots).toHaveLength(66);
    expect(slots.filter((p) => p.kind === "week")).toHaveLength(52);
    expect(slots.filter((p) => p.kind === "month")).toHaveLength(12);
    expect(slots[0].key).toBe("2026");
    expect(slots.slice(1, 8).map((p) => p.key)).toEqual(["2026-01", "2026-W01", "2026-W02", "2026-W03", "2026-W04", "2026-W05", "2026-02"]);
    const oct = slots.findIndex((p) => p.key === "2026-10");
    expect(slots.slice(oct, oct + 7).map((p) => p.key)).toEqual(["2026-10", "2026-W40", "2026-W41", "2026-W42", "2026-W43", "2026-W44", "2026-11"]);
    expect(slots.at(-1)!.key).toBe("2026-B");
  });

  it("2025 has exactly 65", () => {
    const slots = periodsOfYear(2025);
    expect(slots).toHaveLength(65);
    expect(slots.some((p) => p.kind === "bonus")).toBe(false);
    expect(slots.at(-1)!.key).toBe("2025-W52");
  });
});
