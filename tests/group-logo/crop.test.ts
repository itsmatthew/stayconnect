import { describe, expect, it } from "vitest";
import { squareCrop } from "@/app/intro/photo-file";

// The canvas drawing itself needs a real browser; these pin which square of the photo is kept (LOGO-7).
describe("the kept square (LOGO-7)", () => {
  it("keeps the area the cropper chose", () => {
    expect(squareCrop({ width: 1200, height: 800 }, { x: 100, y: 50, width: 600, height: 600 }, 512)).toEqual({ sx: 100, sy: 50, size: 600, out: 512 });
  });

  it("without an area (not measured yet) keeps the centered square", () => {
    expect(squareCrop({ width: 1200, height: 800 }, undefined, 512)).toEqual({ sx: 200, sy: 0, size: 800, out: 512 });
    expect(squareCrop({ width: 600, height: 900 }, undefined, 1024)).toEqual({ sx: 0, sy: 150, size: 600, out: 600 });
  });

  it("never upscales: a small square stays its size", () => {
    expect(squareCrop({ width: 300, height: 300 }, { x: 0, y: 0, width: 300, height: 300 }, 512).out).toBe(300);
  });

  it("clamps an area that spills past the photo, keeping it square", () => {
    const r = squareCrop({ width: 1000, height: 800 }, { x: 600, y: -10, width: 500, height: 500 }, 512);
    expect(r).toEqual({ sx: 500, sy: 0, size: 500, out: 500 });
  });

  it("rounds to whole pixels", () => {
    const r = squareCrop({ width: 1000, height: 1000 }, { x: 10.4, y: 20.6, width: 400.5, height: 400.5 }, 512);
    expect(Object.values(r).every(Number.isInteger)).toBe(true);
  });
});
