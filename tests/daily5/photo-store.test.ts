import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openPhotoStore, type PhotoStore } from "@/app/intro/daily5/photo-store";
import { fileKey, importPhotos } from "@/app/intro/daily5/import-photos";

let n = 0;
let store: PhotoStore;
async function fresh() {
  store = await openPhotoStore(`test-photos-${++n}`);
  return store;
}
afterEach(() => store?.close());

const T = new Date(2018, 2, 3).getTime();
const img = (name: string, lastModified = T) => new File([name], name, { type: "image/jpeg", lastModified });
const decode = async (f: File) => {
  if (f.name.endsWith(".heic")) throw new Error("can't decode");
  return new Blob(["jpeg:" + f.name], { type: "image/jpeg" });
};
const readDate = async (f: File) => f.lastModified;

describe("photo store (D5-2/3)", () => {
  it("stores photos per pool with their date, and counts them", async () => {
    const s = await fresh();
    const id = await s.add({ pool: "mine", fileKey: "a.jpg:1:1", takenAt: T, image: new Blob(["a"]) });
    await s.add({ pool: "family", fileKey: "b.jpg:1:1", takenAt: T, image: new Blob(["b"]) });
    expect(await s.counts()).toEqual({ mine: 1, family: 1 });
    expect(await s.list()).toEqual(
      expect.arrayContaining([expect.objectContaining({ id, pool: "mine", takenAt: T })]),
    );
    expect(await s.has("mine", "a.jpg:1:1")).toBe(true);
    expect(await s.has("family", "a.jpg:1:1")).toBe(false);
    expect(await s.image(id)).toBeTruthy();
  });

  it("caches face results per photo (D5-7)", async () => {
    const s = await fresh();
    const id = await s.add({ pool: "mine", fileKey: "a", takenAt: T, image: new Blob(["a"]) });
    expect((await s.list())[0].hasFace).toBeUndefined();
    await s.setHasFace(id, true);
    expect((await s.list())[0].hasFace).toBe(true);
  });

  it("saves the day's set by local date (D5-8)", async () => {
    const s = await fresh();
    expect(await s.getDay("2026-10-14")).toBeUndefined();
    await s.setDay("2026-10-14", ["a", "b"]);
    expect(await s.getDay("2026-10-14")).toEqual(["a", "b"]);
    expect(await s.getDay("2026-10-15")).toBeUndefined();
  });
});

describe("importing photos (D5-2)", () => {
  it("adds images, ignores other files and repeats, and counts files it can't decode", async () => {
    const s = await fresh();
    const onProgress = vi.fn();
    const files = [img("a.jpg"), img("b.jpg"), img("c.heic"), new File(["x"], "notes.txt", { type: "text/plain" })];
    const first = await importPhotos(files, "mine", s, { decode, readDate, onProgress });
    expect(first).toEqual({ added: 2, duplicates: 0, skipped: 1 });
    expect(onProgress).toHaveBeenLastCalledWith({ done: 3, total: 3 });

    const again = await importPhotos([img("a.jpg"), img("d.jpg")], "mine", s, { decode, readDate });
    expect(again).toEqual({ added: 1, duplicates: 1, skipped: 0 });
    expect(await s.counts()).toEqual({ mine: 3, family: 0 });
  });

  it("treats the same name with a different size or date as a new file", () => {
    expect(fileKey(img("a.jpg"))).toBe(fileKey(img("a.jpg")));
    expect(fileKey(img("a.jpg", T + 1))).not.toBe(fileKey(img("a.jpg")));
    expect(fileKey(new File(["longer"], "a.jpg", { lastModified: T }))).not.toBe(fileKey(img("a.jpg")));
  });

  it("keeps HEIC and other image extensions without a MIME type as images", async () => {
    const s = await fresh();
    const noType = new File(["x"], "IMG_1.HEIC", { lastModified: T });
    const res = await importPhotos([noType], "family", s, { decode: async () => new Blob(["j"]), readDate });
    expect(res.added).toBe(1);
  });
});
