// Reading a picked photo file: shared by Daily 5's pools and the Archive's picker, which are otherwise unrelated.
// Both need a real browser (EXIF parsing, createImageBitmap), so they're checked by hand and stubbed in tests.
import exifr from "exifr";

const MAX_EDGE = 1600;
const valid = (d: unknown): d is Date => d instanceof Date && !Number.isNaN(d.getTime());

/** The EXIF capture date (DateTimeOriginal, else CreateDate), read as local time; undefined if there is none. */
export async function captureDate(file: File): Promise<number | undefined> {
  try {
    const tags = await exifr.parse(file, { pick: ["DateTimeOriginal", "CreateDate"] });
    if (valid(tags?.DateTimeOriginal)) return tags.DateTimeOriginal.getTime();
    if (valid(tags?.CreateDate)) return tags.CreateDate.getTime();
  } catch {
    // No readable EXIF: screenshots, scans, unsupported formats.
  }
  return undefined;
}

/** At most 1600px on the long edge, JPEG 0.85. Throws if the browser can't decode the file. */
export async function downscale(f: File): Promise<Blob> {
  const bitmap = await createImageBitmap(f);
  const k = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * k);
  const h = Math.round(bitmap.height * k);
  const canvas = new OffscreenCanvas(w, h);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
}
