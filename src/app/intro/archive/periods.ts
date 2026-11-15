// The 65 Archive's periods (docs/specs/archive.md, ARC-2/3, docs/specs/me.md, ME-2). All in local time.
// Weeks are ISO weeks (Monday–Sunday, owned by the year their Thursday falls in); weeks 1–52 are weekly
// periods and week 53, when a year has one, is the bonus week. Dates are built from calendar fields,
// never by adding milliseconds, so daylight-saving changes can't shift a boundary.

export type PeriodKind = "week" | "bonus" | "month" | "year";

/** `index` is the week (1–52) or month (1–12) number; 53 for the bonus week, 0 for the year. `end` is exclusive. */
export type Period = { kind: PeriodKind; key: string; year: number; index: number; start: number; end: number };

const DAY = 86_400_000;
const date = (y: number, m: number, d: number) => new Date(y, m, d);
const dayDiff = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY);
const pad = (n: number) => String(n).padStart(2, "0");
const shortMonth = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });
const monthName = (m: number) => date(2000, m, 1).toLocaleDateString("en-US", { month: "long" });

function mondayOf(t: number): Date {
  const d = new Date(t);
  return date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
}
const plusDays = (d: Date, n: number) => date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const firstMonday = (isoYear: number) => mondayOf(date(isoYear, 0, 4).getTime());

function isoWeek(t: number): { year: number; week: number; monday: Date } {
  const monday = mondayOf(t);
  const year = plusDays(monday, 3).getFullYear();
  return { year, week: dayDiff(firstMonday(year), monday) / 7 + 1, monday };
}

export const hasBonusWeek = (year: number) => isoWeek(date(year, 11, 28).getTime()).week === 53;

function week(year: number, w: number): Period {
  const monday = plusDays(firstMonday(year), 7 * (w - 1));
  const bonus = w === 53;
  return {
    kind: bonus ? "bonus" : "week",
    key: bonus ? `${year}-B` : `${year}-W${pad(w)}`,
    year,
    index: w,
    start: monday.getTime(),
    end: plusDays(monday, 7).getTime(),
  };
}

function month(year: number, m: number): Period {
  return { kind: "month", key: `${year}-${pad(m)}`, year, index: m, start: date(year, m - 1, 1).getTime(), end: date(year, m, 1).getTime() };
}

function year(y: number): Period {
  return { kind: "year", key: String(y), year: y, index: 0, start: date(y, 0, 1).getTime(), end: date(y + 1, 0, 1).getTime() };
}

/** The week (or bonus week) containing `t`. */
export function weekPeriod(t: number): Period {
  const { year: y, week: w } = isoWeek(t);
  return week(y, w);
}
export const monthPeriod = (t: number) => month(new Date(t).getFullYear(), new Date(t).getMonth() + 1);
export const yearPeriod = (t: number) => year(new Date(t).getFullYear());

export function periodFromKey(key: string): Period {
  let m: RegExpMatchArray | null;
  if ((m = key.match(/^(\d{4})-W(\d{2})$/))) return week(+m[1], +m[2]);
  if ((m = key.match(/^(\d{4})-B$/))) return week(+m[1], 53);
  if ((m = key.match(/^(\d{4})-(\d{2})$/))) return month(+m[1], +m[2]);
  if ((m = key.match(/^(\d{4})$/))) return year(+m[1]);
  throw new Error(`Not a period key: ${key}`);
}

/** "Week 43", "October", "2026", "Bonus week". */
export function periodTitle(p: Period): string {
  switch (p.kind) {
    case "week":
      return `Week ${p.index}`;
    case "bonus":
      return "Bonus week";
    case "month":
      return monthName(p.index - 1);
    case "year":
      return String(p.year);
  }
}

/** "Oct 19–25", "Sep 28 – Oct 4", "Oct 1–31", "2026". */
export function rangeLabel(p: Period): string {
  if (p.kind === "year") return String(p.year);
  const first = new Date(p.start);
  const last = new Date(p.end - DAY / 2);
  return first.getMonth() === last.getMonth()
    ? `${shortMonth(first)} ${first.getDate()}–${last.getDate()}`
    : `${shortMonth(first)} ${first.getDate()} – ${shortMonth(last)} ${last.getDate()}`;
}

/** "closes Sunday", "closes Oct 31", "closes Dec 31". */
export function closesLabel(p: Period): string {
  if (p.kind === "week" || p.kind === "bonus") return "closes Sunday";
  const last = new Date(p.end - DAY / 2);
  return `closes ${shortMonth(last)} ${last.getDate()}`;
}

/** Whether you can post for `p` at `now`: during its days, and for the year only in December. */
export function isOpen(p: Period, now: number): boolean {
  const from = p.kind === "year" ? date(p.year, 11, 1).getTime() : p.start;
  return now >= from && now < p.end;
}

/** The slots you can post now: the week (or bonus week), the month, and in December the year. */
export function openSlots(now: number): Period[] {
  const y = yearPeriod(now);
  return [weekPeriod(now), monthPeriod(now), ...(isOpen(y, now) ? [y] : [])];
}

/** The month's last 7 days, when the monthly slot grows (ARC-10). */
export function inLastWeekOfMonth(now: number): boolean {
  const d = new Date(now);
  const days = date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return d.getDate() > days - 7;
}

/** A year's slots in Me-grid order: the year, then each month followed by the weeks whose Thursday falls in it, then the bonus week. */
export function periodsOfYear(y: number): Period[] {
  const weeks = Array.from({ length: 52 }, (_, i) => week(y, i + 1));
  const thursdayMonth = (w: Period) => new Date(w.start + 3.5 * DAY).getMonth();
  return [
    year(y),
    ...Array.from({ length: 12 }, (_, m) => [month(y, m + 1), ...weeks.filter((w) => thursdayMonth(w) === m)]).flat(),
    ...(hasBonusWeek(y) ? [week(y, 53)] : []),
  ];
}

const RANK: Record<PeriodKind, number> = { week: 0, bonus: 1, month: 2, year: 3 };

/** Feed order (ARC-8): open periods first (week or bonus, month, year), then ended ones, most recently ended first. */
export function feedOrder(now: number) {
  return (a: Period, b: Period) => {
    const open = Number(isOpen(b, now)) - Number(isOpen(a, now));
    if (open) return open;
    if (!isOpen(a, now) && a.end !== b.end) return b.end - a.end;
    return RANK[a.kind] - RANK[b.kind];
  };
}
