// A photo's date (docs/specs/daily5.md, D5-4): EXIF capture date, else the file's modified date.
import { captureDate } from "../photo-file";

export async function photoDate(file: File): Promise<number> {
  return (await captureDate(file)) ?? file.lastModified;
}
