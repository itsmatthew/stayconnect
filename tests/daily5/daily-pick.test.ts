import { describe, expect, it, vi } from "vitest";
import { isEligible, localDateKey, needsNewPick, pickDaily, type PhotoMeta } from "@/app/intro/daily5/daily-pick";

const today = new Date(2026, 9, 14, 10); // Wed Oct 14 2026, 10am local
const day = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const OLD = day(2020, 6, 1);

function pool(prefix: "m" | "f", n: number, takenAt = OLD): PhotoMeta[] {
  return Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, pool: prefix === "m" ? "mine" : "family", takenAt }));
}
const allFaces = async () => true;
const facesIn = (ids: Iterable<string>) => {
  const set = new Set(ids);
  return async (p: PhotoMeta) => set.has(p.id);
};
const ids = (ps: readonly PhotoMeta[]) => ps.map((p) => p.id);
const countPool = (ps: readonly PhotoMeta[], pool: string) => ps.filter((p) => p.pool === pool).length;

describe("eligibility (D5-5)", () => {
  it("is on or before the same calendar day one year ago", () => {
    expect(isEligible(day(2025, 10, 14, 23), today)).toBe(true);
    expect(isEligible(day(2025, 10, 13), today)).toBe(true);
    expect(isEligible(day(2025, 10, 15, 0), today)).toBe(false);
    expect(isEligible(day(2026, 1, 1), today)).toBe(false);
  });

  it("uses Feb 28 last year when today is Feb 29", () => {
    const leap = new Date(2028, 1, 29, 9);
    expect(isEligible(day(2027, 2, 28, 22), leap)).toBe(true);
    expect(isEligible(day(2027, 3, 1, 1), leap)).toBe(false);
  });

  it("formats the local date key", () => {
    expect(localDateKey(today)).toBe("2026-10-14");
    expect(localDateKey(new Date(2027, 0, 5, 23, 59))).toBe("2027-01-05");
  });
});

describe("the daily pick", () => {
  it("picks 3 from My photos and 2 from Family computer (D5-6)", async () => {
    const picked = await pickDaily({ photos: [...pool("m", 10), ...pool("f", 10)], today, hasFace: allFaces });
    expect(picked).toHaveLength(5);
    expect(countPool(picked, "mine")).toBe(3);
    expect(countPool(picked, "family")).toBe(2);
    expect(new Set(ids(picked)).size).toBe(5);
  });

  it("makes up a short pool from the other one (D5-6)", async () => {
    const a = await pickDaily({ photos: [...pool("m", 10), ...pool("f", 1)], today, hasFace: allFaces });
    expect([countPool(a, "mine"), countPool(a, "family")]).toEqual([4, 1]);
    const b = await pickDaily({ photos: pool("m", 10), today, hasFace: allFaces });
    expect([countPool(b, "mine"), countPool(b, "family")]).toEqual([5, 0]);
    const c = await pickDaily({ photos: [...pool("m", 1), ...pool("f", 10)], today, hasFace: allFaces });
    expect([countPool(c, "mine"), countPool(c, "family")]).toEqual([1, 4]);
  });

  it("only picks eligible photos, and shows all of them when fewer than 5 are eligible (D5-5/6)", async () => {
    const recent = pool("m", 20, day(2026, 3, 1)).map((p) => ({ ...p, id: `new-${p.id}` }));
    const picked = await pickDaily({ photos: [...recent, ...pool("m", 2), ...pool("f", 1)], today, hasFace: allFaces });
    expect(ids(picked).sort()).toEqual(["f0", "m0", "m1"]);
  });

  it("has at most one photo without a face (D5-7)", async () => {
    const photos = [...pool("m", 20), ...pool("f", 20)];
    const hasFace = facesIn(["m3", "m7", "m11", "m15", "m19", "f2", "f9", "f16"]);
    for (const date of [today, new Date(2026, 9, 15), new Date(2026, 9, 16), new Date(2027, 2, 3)]) {
      const picked = await pickDaily({ photos, today: date, hasFace });
      expect(picked).toHaveLength(5);
      const faces = (await Promise.all(picked.map(hasFace))).filter(Boolean).length;
      expect(faces).toBeGreaterThanOrEqual(4);
      expect([countPool(picked, "mine"), countPool(picked, "family")]).toEqual([3, 2]);
    }
  });

  it("fills with faceless photos rather than showing fewer than 5 (D5-7)", async () => {
    const photos = [...pool("m", 10), ...pool("f", 10)];
    const picked = await pickDaily({ photos, today, hasFace: facesIn(["m4", "f6"]) });
    expect(picked).toHaveLength(5);
    expect(ids(picked)).toEqual(expect.arrayContaining(["m4", "f6"]));
  });

  it("checks each photo at most once and at most maxChecks photos (D5-7)", async () => {
    const hasFace = vi.fn<(p: PhotoMeta) => Promise<boolean>>(async () => false);
    const photos = [...pool("m", 100), ...pool("f", 100)];
    const picked = await pickDaily({ photos, today, hasFace, maxChecks: 10 });
    expect(picked).toHaveLength(5);
    expect(hasFace.mock.calls.length).toBeLessThanOrEqual(10);
    const checked = hasFace.mock.calls.map(([p]) => p.id);
    expect(new Set(checked).size).toBe(checked.length);
  });

  it("checks at most 80 photos by default (D5-7)", async () => {
    const hasFace = vi.fn(async () => false);
    await pickDaily({ photos: [...pool("m", 300), ...pool("f", 300)], today, hasFace });
    expect(hasFace.mock.calls.length).toBeLessThanOrEqual(80);
  });

  it("is seeded by the local date: same day, same five; next day, a new set (D5-8)", async () => {
    const photos = [...pool("m", 40), ...pool("f", 40)];
    const morning = await pickDaily({ photos, today: new Date(2026, 9, 14, 7), hasFace: allFaces });
    const evening = await pickDaily({ photos: [...photos].reverse(), today: new Date(2026, 9, 14, 22), hasFace: allFaces });
    const tomorrow = await pickDaily({ photos, today: new Date(2026, 9, 15, 7), hasFace: allFaces });
    expect(ids(evening)).toEqual(ids(morning));
    expect(ids(tomorrow).sort()).not.toEqual(ids(morning).sort());
  });

  it("keeps a saved set all day unless it holds fewer than 5 (D5-8)", () => {
    expect(needsNewPick(undefined)).toBe(true);
    expect(needsNewPick(["a", "b", "c", "d"])).toBe(true);
    expect(needsNewPick(["a", "b", "c", "d", "e"])).toBe(false);
  });
});
