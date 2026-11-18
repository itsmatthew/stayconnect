// The Archive's words, chosen from the period and the date (docs/specs/archive.md, ARC-8–10, ARC-13).
import { closesLabel, inLastWeekOfMonth, periodTitle, type Period } from "./periods";
import type { FeedSection } from "./gate";

const monthName = (p: Period) => new Date(p.start).toLocaleDateString("en-US", { month: "long" });

/** The slot's region name. */
export function slotLabel(p: Period): string {
  switch (p.kind) {
    case "week":
      return "Photo of the week";
    case "bonus":
      return "Bonus week photo";
    case "month":
      return "Photo of the month";
    case "year":
      return "Photo of the year";
  }
}

/**
 * A row on this week's card (ARC-10): what to add, a line under it, and what it says once your photo is in. The
 * month's row asks for "the photo that defines" it in its last week.
 */
export function slotRow(p: Period, now: number): { title: string; sub: string; postedLine: string } {
  const closes = closesLabel(p);
  switch (p.kind) {
    case "week":
      return { title: "Add your photo of the week", sub: "your circles are waiting on you", postedLine: "Your photo of the week is in ✓" };
    case "bonus":
      return { title: "Add your bonus week photo", sub: `the week between years · ${closes}`, postedLine: "Your bonus week photo is in ✓" };
    case "month":
      return { title: `Add your photo of ${monthName(p)}`, sub: inLastWeekOfMonth(now) ? `the photo that defines your ${monthName(p)} · ${closes}` : closes, postedLine: `Your photo of ${monthName(p)} is in ✓` };
    case "year":
      return { title: `Add your photo of ${p.year}`, sub: closes, postedLine: `Your photo of ${p.year} is in ✓` };
  }
}

/** The picker's title. */
export function pickerTitle(p: Period): string {
  switch (p.kind) {
    case "week":
      return "Post your photo of the week";
    case "bonus":
      return "Post your bonus week photo";
    case "month":
      return `Post your photo of ${monthName(p)}`;
    case "year":
      return `Post your photo of ${p.year}`;
  }
}

const THIS: Record<Period["kind"], string> = { week: "this week", bonus: "this bonus week", month: "this month", year: "this year" };

function missedName(p: Period): string {
  if (p.kind === "week") return `week ${p.index}`;
  if (p.kind === "bonus") return "the bonus week";
  return periodTitle(p);
}

/** The locked line (ARC-9), or nothing when there's nothing left to unlock. Unused while "post to see" is off (POST_TO_SEE in gate.ts); kept for when it returns. */
export function lockedText({ period, status, visible, hidden }: FeedSection): string | undefined {
  if (status === "unlocked") return undefined;
  const n = hidden.length;
  const friends = `${n} friend${n === 1 ? "" : "s"}`;
  if (status === "closed") return n ? `${friends} posted ${missedName(period)} — this one's closed` : undefined;
  if (n) return `${friends} posted ${THIS[period.kind]} — post yours to see them`;
  return visible.length ? undefined : `No one's posted ${THIS[period.kind]} yet — be the first`;
}

/** Captions are one line, at most 80 characters (ARC-13). */
export const CAPTION_MAX = 80;

/** The caption field's placeholder: "what made this week", "what defined October". */
export function captionPlaceholder(p: Period): string {
  switch (p.kind) {
    case "week":
      return "what made this week";
    case "bonus":
      return "what made the week between years";
    case "month":
      return `what defined ${monthName(p)}`;
    case "year":
      return `what defined ${p.year}`;
  }
}

/** One line, trimmed, at most 80 characters; undefined when blank. */
export function cleanCaption(text: string): string | undefined {
  const line = text.replace(/\s+/g, " ").trim().slice(0, CAPTION_MAX).trim();
  return line || undefined;
}

const DAY = 86_400_000;
/** Whole days between two local dates. */
const daysBetween = (a: number, b: number) => {
  const d = (t: number) => {
    const x = new Date(t);
    return Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()) / DAY;
  };
  return d(b) - d(a);
};

/** This week's card (ARC-10): "5 days left", "1 day left", then "last day" on Sunday. */
export function daysLeft(p: Period, now: number): string {
  const n = daysBetween(now, p.end - 1);
  return n <= 0 ? "last day" : `${n} ${n === 1 ? "day" : "days"} left`;
}

/**
 * Under each photo in the feed (ARC-8): "Tue, Nov 3" (the day it was taken) and "WEEK 45"; "February" and "PHOTO OF THE
 * MONTH"; "2025" and "PHOTO OF THE YEAR"; the bonus week's day and "BONUS WEEK".
 */
export function footer(p: Period, takenAt: number): { left: string; right: string } {
  const day = new Date(takenAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  switch (p.kind) {
    case "week":
      return { left: day, right: `WEEK ${p.index}` };
    case "bonus":
      return { left: day, right: "BONUS WEEK" };
    case "month":
      return { left: new Date(p.start).toLocaleDateString("en-US", { month: "long" }), right: "PHOTO OF THE MONTH" };
    case "year":
      return { left: String(p.year), right: "PHOTO OF THE YEAR" };
  }
}
