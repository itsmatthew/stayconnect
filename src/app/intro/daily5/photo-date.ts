// A photo's date (docs/specs/daily5.md, D5-4): EXIF capture date, else the file's modified date.
import exifr from "exifr";

const valid = (d: unknown): d is Date => d instanceof Date && !Number.isNaN(d.getTime());

export async function photoDate(file: File): Promise<number> {
  try {
    // exifr reads EXIF times (which carry no zone) as local time.
    const tags = await exifr.parse(file, { pick: ["DateTimeOriginal", "CreateDate"] });
    if (valid(tags?.DateTimeOriginal)) return tags.DateTimeOriginal.getTime();
    if (valid(tags?.CreateDate)) return tags.CreateDate.getTime();
  } catch {
    // No readable EXIF (screenshots, scans, unsupported formats): use the file date.
  }
  return file.lastModified;
}
