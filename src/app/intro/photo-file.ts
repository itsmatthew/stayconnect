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

/** The part of a photo the cropper chose, in the photo's pixels (react-easy-crop's `croppedAreaPixels`). */
export type CropArea = { x: number; y: number; width: number; height: number };

/**
 * Which square of the photo to keep and how big to save it (docs/specs/group-logo.md, LOGO-7): the cropper's area clamped to
 * the photo, or the centered square when the cropper hasn't measured it yet. Never upscaled past the kept square.
 */
export function squareCrop(photo: { width: number; height: number }, area: CropArea | undefined, max: number) {
  const short = Math.min(photo.width, photo.height);
  const size = Math.round(Math.min(area ? Math.min(area.width, area.height) : short, short));
  const clamp = (v: number, edge: number) => Math.round(Math.min(Math.max(v, 0), edge - size));
  const sx = clamp(area ? area.x : (photo.width - size) / 2, photo.width);
  const sy = clamp(area ? area.y : (photo.height - size) / 2, photo.height);
  return { sx, sy, size, out: Math.min(size, max) };
}

/** The kept square as a JPEG, at most `max` px. Needs a real browser, so it's stubbed in tests. */
export async function cropSquare(image: Blob, area: CropArea | undefined, max: number): Promise<Blob> {
  const bitmap = await createImageBitmap(image);
  const { sx, sy, size, out } = squareCrop(bitmap, area, max);
  const canvas = new OffscreenCanvas(out, out);
  canvas.getContext("2d")!.drawImage(bitmap, sx, sy, size, size, 0, 0, out, out);
  bitmap.close();
  return canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
}
