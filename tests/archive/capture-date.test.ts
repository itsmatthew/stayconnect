import { beforeEach, describe, expect, it, vi } from "vitest";

const parse = vi.fn();
vi.mock("exifr", () => ({ default: { parse } }));

const { captureDate } = await import("@/app/intro/photo-file");

const file = () => new File(["x"], "IMG_0001.jpg", { type: "image/jpeg", lastModified: new Date(2026, 9, 20).getTime() });

describe("capture date (ARC-4)", () => {
  beforeEach(() => parse.mockReset());

  it("reads EXIF DateTimeOriginal, else CreateDate", async () => {
    parse.mockResolvedValue({ DateTimeOriginal: new Date(2026, 9, 19, 15), CreateDate: new Date(2026, 0, 1) });
    expect(await captureDate(file())).toBe(new Date(2026, 9, 19, 15).getTime());
    parse.mockResolvedValue({ CreateDate: new Date(2026, 9, 21, 9) });
    expect(await captureDate(file())).toBe(new Date(2026, 9, 21, 9).getTime());
  });

  it("never falls back to the file's modified date", async () => {
    parse.mockResolvedValue(undefined);
    expect(await captureDate(file())).toBeUndefined();
    parse.mockRejectedValue(new Error("not a jpeg"));
    expect(await captureDate(file())).toBeUndefined();
    parse.mockResolvedValue({ DateTimeOriginal: new Date(NaN) });
    expect(await captureDate(file())).toBeUndefined();
  });
});
