import { describe, expect, it } from "vitest";
import { BANDS, LABELS, layoutRing, ringAt, SIZES, type Spot } from "@/components/circle/ring-layout";
import type { Ring } from "@/components/circle/types";

const RINGS: Ring[] = ["nest", "branches", "bloom"];
const COUNTS = Array.from({ length: 121 }, (_, i) => i);

describe("ring layout (CIRCLE-3)", () => {
  it("shows everyone while they fit, then a +N chip for the rest", () => {
    for (const ring of RINGS) {
      for (const count of COUNTS) {
        const { spots, shown } = layoutRing(ring, count);
        expect(spots.length).toBeLessThanOrEqual(count);
        if (spots.length === count) expect(shown).toBe(count);
        else expect(shown).toBe(spots.length - 1);
      }
    }
    // Bloom's guide tops out at 75: that many still fit without a chip.
    expect(layoutRing("bloom", 75).shown).toBe(75);
    expect(layoutRing("branches", 25).shown).toBe(25);
    expect(layoutRing("nest", 10).shown).toBe(10);
  });

  it("never overlaps another avatar", () => {
    const overlaps: string[] = [];
    for (const ring of RINGS) {
      for (const count of COUNTS) {
        const { spots } = layoutRing(ring, count);
        for (let i = 0; i < spots.length; i++) {
          for (let j = i + 1; j < spots.length; j++) {
            const a = spots[i];
            const b = spots[j];
            if (Math.hypot(a.dx - b.dx, a.dy - b.dy) < (a.size + b.size) / 2) overlaps.push(`${ring} ×${count}: ${i}/${j}`);
          }
        }
      }
    }
    expect(overlaps).toEqual([]);
  });

  it("stays inside its ring's band", () => {
    const outside: string[] = [];
    for (const ring of RINGS) {
      const { inner, outer } = BANDS[ring];
      for (const count of COUNTS) {
        for (const p of layoutRing(ring, count).spots) {
          const d = Math.hypot(p.dx, p.dy);
          if (d + p.size / 2 > outer || (inner > 0 && d - p.size / 2 < inner)) outside.push(`${ring} ×${count}`);
        }
      }
    }
    expect(outside).toEqual([]);
  });

  it("keeps clear of every ring label", () => {
    const hits = (p: Spot, l: (typeof LABELS)[Ring]) =>
      Math.abs(p.dx) < l.halfWidth + p.size / 2 && p.dy + p.size / 2 > l.top && p.dy - p.size / 2 < l.bottom;
    const covered: string[] = [];
    for (const ring of RINGS) {
      for (const count of COUNTS) {
        for (const p of layoutRing(ring, count).spots) {
          for (const r of RINGS) if (hits(p, LABELS[r])) covered.push(`${ring} ×${count} vs ${r} label`);
        }
      }
    }
    expect(covered).toEqual([]);
  });

  it("is balanced: the same either side of the trunk", () => {
    const key = (p: Spot) => `${p.dx.toFixed(2)},${p.dy.toFixed(2)},${p.size}`;
    for (const ring of RINGS) {
      for (const count of COUNTS) {
        const { spots } = layoutRing(ring, count);
        const mirrored = spots.map((p) => key({ ...p, dx: p.dx === 0 ? 0 : -p.dx })).sort();
        expect(mirrored, `${ring} ×${count}`).toEqual(spots.map((p) => key({ ...p, dx: p.dx === 0 ? 0 : p.dx })).sort());
      }
    }
  });

  it("keeps the design's sizes at typical counts, and only shrinks as rings fill", () => {
    expect(layoutRing("nest", 5).spots.every((p) => p.size === SIZES.nest.max)).toBe(true);
    expect(layoutRing("branches", 15).spots.every((p) => p.size === SIZES.branches.max)).toBe(true);
    expect(layoutRing("bloom", 50).spots.every((p) => p.size === SIZES.bloom.max)).toBe(true);
    for (const ring of RINGS) {
      let last = Infinity;
      for (const count of COUNTS.slice(1)) {
        const size = Math.min(...layoutRing(ring, count).spots.map((p) => p.size));
        expect(size).toBeLessThanOrEqual(last);
        expect(size).toBeGreaterThanOrEqual(SIZES[ring].min);
        last = size;
      }
    }
  });

  it("a single nest avatar sits at the center", () => {
    expect(layoutRing("nest", 1).spots).toEqual([{ dx: 0, dy: 0, size: SIZES.nest.max }]);
  });

  it("an empty ring has no spots", () => {
    for (const ring of RINGS) expect(layoutRing(ring, 0)).toEqual({ spots: [], shown: 0 });
  });
});

describe("dropping on a ring (CIRCLE-7)", () => {
  it("finds the ring under a point, or none outside the canopy", () => {
    expect(ringAt(0, 0)).toBe("nest");
    expect(ringAt(0, BANDS.nest.outer - 1)).toBe("nest");
    expect(ringAt(BANDS.branches.inner + 1, 0)).toBe("branches");
    expect(ringAt(0, -(BANDS.bloom.inner + 1))).toBe("bloom");
    expect(ringAt(BANDS.bloom.outer + 1, 0)).toBeUndefined();
  });
});
