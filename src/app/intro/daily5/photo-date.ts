// A photo's date (docs/specs/daily5.md, D5-4): EXIF capture date, else the file's modified date, marked `fileDated`.
import { captureDate } from "../photo-file";

export type PhotoDating = { takenAt: number; fileDated?: true };

export async function photoDate(file: File): Promise<PhotoDating> {
  const captured = await captureDate(file);
  return captured === undefined ? { takenAt: file.lastModified, fileDated: true } : { takenAt: captured };
}
