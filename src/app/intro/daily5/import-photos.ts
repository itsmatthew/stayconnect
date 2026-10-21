// Adding a folder or a pick of photos to a pool (docs/specs/daily5.md, D5-2/3).
// Files are handled one at a time so a 10,000-photo folder doesn't hold every image in memory.

import { downscale } from "../photo-file";
import type { PoolId } from "./daily-pick";
import { photoDate } from "./photo-date";
import type { PhotoStore } from "./photo-store";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|tiff?)$/i;

/** Same name, size and modified date: the same file. */
export function fileKey(f: File): string {
  return `${f.name}:${f.size}:${f.lastModified}`;
}

const isImage = (f: File) => f.type.startsWith("image/") || (!f.type && IMAGE_EXT.test(f.name));

export type ImportProgress = { done: number; total: number };
export type ImportResult = { added: number; duplicates: number; skipped: number };

type ImportOptions = {
  /** Decodes and downscales to a JPEG; throws if the browser can't read the file. */
  decode?: (f: File) => Promise<Blob>;
  readDate?: (f: File) => Promise<number>;
  onProgress?: (p: ImportProgress) => void;
};

export async function importPhotos(
  files: Iterable<File>,
  pool: PoolId,
  store: PhotoStore,
  { decode = downscale, readDate = photoDate, onProgress }: ImportOptions = {},
): Promise<ImportResult> {
  const images = Array.from(files).filter(isImage);
  const result: ImportResult = { added: 0, duplicates: 0, skipped: 0 };
  for (const [i, f] of images.entries()) {
    const key = fileKey(f);
    if (await store.has(pool, key)) result.duplicates++;
    else {
      try {
        const [image, takenAt] = await Promise.all([decode(f), readDate(f)]);
        await store.add({ pool, fileKey: key, takenAt, image });
        result.added++;
      } catch {
        result.skipped++;
      }
    }
    onProgress?.({ done: i + 1, total: images.length });
  }
  return result;
}
