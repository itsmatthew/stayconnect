// Birthdays coming up, for reminders in your mailbox (docs/specs/mailbox.md, MAILBOX-11). Plain TypeScript.
// Only the month and day are known: a birthday never needs a year.

/** "MM-DD". TODO(server/onboarding): each person answers this when they join; the demo makes some up. */
export type MonthDay = string;

/** A reminder comes this many days ahead. */
export const WEEK = 7;

const DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");
const parts = (day: string) => day.split("-").map(Number);
const leap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
/** A local "YYYY-MM-DD" as a day count, so differences are whole days whatever the clocks do. */
const dayNumber = (day: string) => {
  const [y, m, d] = parts(day);
  return Date.UTC(y, m - 1, d) / DAY;
};

/** This birthday in `year`: Feb 29 falls on Feb 28 outside leap years. */
const inYear = (md: MonthDay, year: number) => {
  const [m, d] = parts(md);
  return `${year}-${pad(m)}-${pad(m === 2 && d === 29 && !leap(year) ? 28 : d)}`;
};

/** The next time it's their birthday, today included. `today` is a local "YYYY-MM-DD". */
export function nextBirthday(md: MonthDay, today: string): string {
  const year = parts(today)[0];
  const thisYear = inYear(md, year);
  return thisYear >= today ? thisYear : inYear(md, year + 1);
}

export type Upcoming = { personId: string; day: string; daysAway: number };

/** Everyone in `circle` whose birthday is within a week, today included, soonest first. */
export function upcomingBirthdays(birthdays: Readonly<Record<string, MonthDay>>, circle: readonly string[], today: string, within = WEEK): Upcoming[] {
  return circle
    .flatMap((personId) => {
      const md = birthdays[personId];
      if (!md) return [];
      const day = nextBirthday(md, today);
      const daysAway = dayNumber(day) - dayNumber(today);
      return daysAway <= within ? [{ personId, day, daysAway }] : [];
    })
    .sort((a, b) => a.daysAway - b.daysAway || a.personId.localeCompare(b.personId));
}

/** "in 3 days", "tomorrow", "today". */
export const countdown = (daysAway: number) => (daysAway === 0 ? "today" : daysAway === 1 ? "tomorrow" : `in ${daysAway} days`);

const asDate = (day: string) => {
  const [y, m, d] = parts(day);
  return new Date(y, m - 1, d);
};
/** "Monday, Nov 16". */
export const birthdayLong = (day: string) => asDate(day).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
/** "Mon". */
export const birthdayShort = (day: string) => asDate(day).toLocaleDateString("en-US", { weekday: "short" });

/** One reminder per person per birthday. */
export const reminderId = (personId: string, day: string) => `bday-${personId}-${day}`;

/**
 * The birthday a gift is for, if it is one: it opens on their next birthday, or is sent on the day itself
 * (MAILBOX-12). `opensDay` is the day it opens, today for "right away".
 */
export const birthdayFor = (md: MonthDay | undefined, opensDay: string, today: string): string | undefined => (md && nextBirthday(md, today) === opensDay ? opensDay : undefined);

