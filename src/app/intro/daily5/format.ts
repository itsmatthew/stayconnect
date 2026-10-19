// Labels for Daily 5 (docs/specs/daily5.md, D5-9). Local time, US English, as in the reference.

/** "Jul 2, 2023": the polaroid's handwritten date. */
export function formatPhotoDate(takenAt: number): string {
  return new Date(takenAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** "Tuesday, Oct 6": the banner. */
export function formatToday(d: Date): string {
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${weekday}, ${date}`;
}
