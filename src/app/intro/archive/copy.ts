// The Archive's words, chosen from the period and the date (docs/specs/archive.md, ARC-8–10).
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

/** What an empty slot asks for (ARC-10). The monthly slot grows in the month's last week. */
export function slotDirections(p: Period, now: number): { directions: string; size: "large" | "medium" | "small" | "grown" } {
  const closes = closesLabel(p);
  switch (p.kind) {
    case "week":
      return { directions: `Post your photo of the week to see everyone's · ${closes}`, size: "large" };
    case "bonus":
      return { directions: `Bonus week · the week between years · ${closes}`, size: "large" };
    case "month":
      return inLastWeekOfMonth(now)
        ? { directions: `The photo that defines your ${monthName(p)} · ${closes}`, size: "grown" }
        : { directions: `Photo of ${monthName(p)} · ${closes}`, size: "small" };
    case "year":
      return { directions: `Your photo of ${p.year} · ${closes}`, size: "medium" };
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

/** The bigger cards' ribbon: "photo of October", "photo of 2026" (ARC-8). Weekly cards have none. */
export function ribbon(p: Period): string | undefined {
  switch (p.kind) {
    case "week":
      return undefined;
    case "bonus":
      return "Bonus week · the week between years";
    case "month":
      return `photo of ${monthName(p)}`;
    case "year":
      return `photo of ${p.year}`;
  }
}

const THIS: Record<Period["kind"], string> = { week: "this week", bonus: "this bonus week", month: "this month", year: "this year" };

function missedName(p: Period): string {
  if (p.kind === "week") return `week ${p.index}`;
  if (p.kind === "bonus") return "the bonus week";
  return periodTitle(p);
}

/** The locked line (ARC-9), or nothing when there's nothing left to unlock. */
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
