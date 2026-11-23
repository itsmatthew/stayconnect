// When nudges come (docs/specs/nudges.md, NUDGE-5, NUDGE-8, NUDGE-13). Plain TypeScript: times are local.

import { isoWeek } from "../archive/periods";
import { seededRandom, seededShuffle } from "../seeded";
import type { Mood } from "./check-in";
import type { NudgeSettings, PerWeek } from "./settings";

const DAY = 86_400_000;
const QUIET_FROM = 23;
const QUIET_UNTIL = 9;
const CHECK_IN_HOUR = 18;

/** `reachOut`: slot ids already shown ("2026-W48#0"). `checkIns`: week key → your answer, or skipped. */
export type NudgeLog = { reachOut: string[]; checkIns: Record<string, Mood | "skipped"> };
export const emptyLog: NudgeLog = { reachOut: [], checkIns: {} };

/** "2026-W48". */
export function weekKey(t: number): string {
  const { year, week } = isoWeek(t);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function quietNow(t: number, quiet: boolean): boolean {
  if (!quiet) return false;
  const h = new Date(t).getHours();
  return h >= QUIET_FROM || h < QUIET_UNTIL;
}

/**
 * The week's reach-out times, slot 0 first: different days, seeded by the week, so a reload never moves them and
 * going from 1 to 2 a week keeps the first. Between 9 am and 11 pm with quiet hours on, any time with them off.
 */
export function reachOutTimes(t: number, perWeek: PerWeek, quiet: boolean): number[] {
  const key = weekKey(t);
  const monday = isoWeek(t).monday;
  const days = seededShuffle([0, 1, 2, 3, 4, 5, 6], `${key}:days`).slice(0, perWeek);
  return days.map((d, i) => {
    const rand = seededRandom(`${key}:${i}`);
    const [from, until] = quiet ? [QUIET_UNTIL * 60, QUIET_FROM * 60] : [0, 24 * 60];
    const minute = from + Math.floor(rand() * (until - from));
    const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + d);
    return day.getTime() + minute * 60_000;
  });
}

/** The latest reach-out slot whose time has passed this week and wasn't shown; earlier missed ones don't pile up. */
export function dueReachOut(now: number, settings: NudgeSettings, log: NudgeLog): string | undefined {
  if (!settings.perWeek || quietNow(now, settings.quiet)) return undefined;
  const key = weekKey(now);
  const due = reachOutTimes(now, settings.perWeek, settings.quiet)
    .map((t, i) => ({ t, id: `${key}#${i}` }))
    .filter((s) => s.t <= now)
    .sort((a, b) => b.t - a.t)[0];
  if (!due || log.reachOut.includes(due.id)) return undefined;
  return due.id;
}

/** All of this week's slots up to now, to mark shown together, so a missed one never shows later. */
export function passedSlots(now: number, settings: NudgeSettings): string[] {
  const key = weekKey(now);
  return reachOutTimes(now, settings.perWeek, settings.quiet).flatMap((t, i) => (t <= now ? [`${key}#${i}`] : []));
}

/** Sundays from 6 pm, once a week, while the switch is on and it isn't quiet hours. */
export function checkInDue(now: number, settings: NudgeSettings, log: NudgeLog): boolean {
  const d = new Date(now);
  if (!settings.sunday || d.getDay() !== 0 || d.getHours() < CHECK_IN_HOUR || quietNow(now, settings.quiet)) return false;
  return !(weekKey(now) in log.checkIns);
}

export const DAY_MS = DAY;
