import { describe, expect, it } from "vitest";
import { GROUP_COLORS, SHADE_COUNT, groupPalette, isColorId } from "@/app/intro/colors/palette";

const CREAMS = ["#FFF8EC", "#FFF6DA"];

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const linear = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** CIE76 distance in Lab: about 2 is barely visible, above 15 reads as a different color. */
const lab = (hex: string) => {
  const [r, g, b] = rgb(hex).map(linear);
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [x, y, z] = [(0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883].map(f);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
};
const distance = (a: string, b: string) => {
  const [p, q] = [lab(a), lab(b)];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
};

const everyShade = GROUP_COLORS.flatMap((c) => Array.from({ length: SHADE_COUNT }, (_, shade) => ({ id: c.id, shade, palette: groupPalette(c.id, shade) })));

describe("palette (COLOR-1)", () => {
  it("has 12 colors with unique ids and labels", () => {
    expect(GROUP_COLORS).toHaveLength(12);
    expect(new Set(GROUP_COLORS.map((c) => c.id)).size).toBe(12);
    expect(new Set(GROUP_COLORS.map((c) => c.label)).size).toBe(12);
  });

  it("keeps every color clearly apart from every other at its base shade", () => {
    for (const [i, a] of GROUP_COLORS.entries()) {
      for (const b of GROUP_COLORS.slice(i + 1)) {
        expect(distance(groupPalette(a.id, 0).canopy, groupPalette(b.id, 0).canopy), `${a.id} vs ${b.id}`).toBeGreaterThanOrEqual(18);
      }
    }
  });

  it("has three visibly different shades of each color", () => {
    expect(SHADE_COUNT).toBe(3);
    for (const { id } of GROUP_COLORS) {
      const [base, second, third] = [0, 1, 2].map((s) => groupPalette(id, s).canopy);
      expect(distance(base, second), id).toBeGreaterThanOrEqual(7);
      expect(distance(second, third), id).toBeGreaterThanOrEqual(7);
    }
  });

  it("gives every shade a full palette", () => {
    for (const { id, shade, palette } of everyShade) {
      for (const value of Object.values(palette)) expect(value, `${id}/${shade}`).toMatch(/^#[0-9A-F]{6}$/);
      expect(Object.keys(palette).sort()).toEqual(["canopy", "highlight", "rim", "shade"]);
    }
  });

  it("wraps a shade past the last one, and knows its own ids", () => {
    expect(groupPalette("red", SHADE_COUNT)).toEqual(groupPalette("red", 0));
    expect(isColorId("red")).toBe(true);
    expect(isColorId("rust")).toBe(false);
  });
});

describe("shades and cream (COLOR-2)", () => {
  it("keeps the original colors exact, even below 4.5:1", () => {
    expect(groupPalette("red", 0)).toEqual({ canopy: "#C8432B", shade: "#93281A", highlight: "#F3A088", rim: "#FFD2C4" });
    expect(groupPalette("green", 0)).toEqual({ canopy: "#5E8068", shade: "#3F5F4C", highlight: "#B8D2BE", rim: "#D6F0DC" });
    expect(groupPalette("amber", 0)).toEqual({ canopy: "#E3A22F", shade: "#B97814", highlight: "#FBE2A0", rim: "#FFF0BE" });
    expect(groupPalette("purple", 0)).toEqual({ canopy: "#9A4FB0", shade: "#6B2F80", highlight: "#D7AEE3", rim: "#F0DDF6" });
    expect(groupPalette("orange", 0)).toEqual({ canopy: "#E8792E", shade: "#A8501A", highlight: "#F7B98A", rim: "#FFE3CC" });
    expect(groupPalette("blue", 0)).toEqual({ canopy: "#3F86C4", shade: "#285E92", highlight: "#A9CFEF", rim: "#D8ECFB" });
  });

  it("never gives an extra shade worse contrast against cream than its own base", () => {
    const extras = everyShade.filter((s) => s.shade > 0);
    expect(extras).toHaveLength(24);
    for (const { id, shade, palette } of extras) {
      const base = groupPalette(id, 0);
      for (const cream of CREAMS) {
        expect(contrast(palette.canopy, cream), `${id}/${shade} canopy on ${cream}`).toBeGreaterThanOrEqual(contrast(base.canopy, cream));
        expect(contrast(palette.shade, cream), `${id}/${shade} shade on ${cream}`).toBeGreaterThanOrEqual(contrast(base.shade, cream));
      }
    }
  });
});
