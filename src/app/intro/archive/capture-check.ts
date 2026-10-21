// Only photos taken during the period may be posted for it (docs/specs/archive.md, ARC-4).
// `takenAt` is the EXIF capture date; undefined when the photo has none. The file's own date never counts.
import { rangeLabel, type Period } from "./periods";

export type CaptureCheck = { ok: true } | { ok: false; message: string };

/** "this week (Oct 19–25)", "October (Oct 1–31)", "2026", "the bonus week (Dec 28 – Jan 3)". */
function allowed(p: Period): string {
  switch (p.kind) {
    case "week":
      return `this week (${rangeLabel(p)})`;
    case "bonus":
      return `the bonus week (${rangeLabel(p)})`;
    case "month":
      return `${new Date(p.start).toLocaleDateString("en-US", { month: "long" })} (${rangeLabel(p)})`;
    case "year":
      return String(p.year);
  }
}

function photoDay(takenAt: number, p: Period): string {
  const d = new Date(takenAt);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (d.getFullYear() !== p.year) opts.year = "numeric";
  return d.toLocaleDateString("en-US", opts);
}

export function checkCapture(takenAt: number | undefined, p: Period): CaptureCheck {
  if (takenAt === undefined) return { ok: false, message: `We can't tell when this photo was taken — pick one from ${allowed(p)}.` };
  if (takenAt >= p.start && takenAt < p.end) return { ok: true };
  return { ok: false, message: `This photo is from ${photoDay(takenAt, p)} — pick one from ${allowed(p)}.` };
}

/** The picker's header: "Photos taken Oct 19–25", "Photos taken in 2026". */
export const pickerRange = (p: Period) => (p.kind === "year" ? `Photos taken in ${p.year}` : `Photos taken ${rangeLabel(p)}`);
