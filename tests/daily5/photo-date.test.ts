import { beforeEach, describe, expect, it, vi } from "vitest";

const parse = vi.fn();
vi.mock("exifr", () => ({ default: { parse } }));

const { photoDate } = await import("@/app/intro/daily5/photo-date");

const MODIFIED = new Date(2019, 4, 2, 8).getTime();
const file = () => new File(["x"], "IMG_0001.jpg", { type: "image/jpeg", lastModified: MODIFIED });

describe("photo date (D5-4)", () => {
  beforeEach(() => parse.mockReset());

  it("prefers EXIF DateTimeOriginal", async () => {
    parse.mockResolvedValue({ DateTimeOriginal: new Date(2014, 6, 2, 15), CreateDate: new Date(2015, 0, 1) });
    expect(await photoDate(file())).toBe(new Date(2014, 6, 2, 15).getTime());
  });

  it("falls back to EXIF CreateDate", async () => {
    parse.mockResolvedValue({ CreateDate: new Date(2015, 0, 1, 9) });
    expect(await photoDate(file())).toBe(new Date(2015, 0, 1, 9).getTime());
  });

  it("falls back to the file's last-modified date without EXIF", async () => {
    parse.mockResolvedValue(undefined);
    expect(await photoDate(file())).toBe(MODIFIED);
  });

  it("falls back to the file date when EXIF can't be read or is invalid", async () => {
    parse.mockRejectedValue(new Error("not a jpeg"));
    expect(await photoDate(file())).toBe(MODIFIED);
    parse.mockResolvedValue({ DateTimeOriginal: new Date(Number.NaN) });
    expect(await photoDate(file())).toBe(MODIFIED);
  });
});
