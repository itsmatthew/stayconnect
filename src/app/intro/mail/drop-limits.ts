// Limits on photos dropped for people outside your circle (docs/specs/mail.md, MAIL-6). Plain TypeScript.
// Time-based only: a limit that lifted when someone opened a drop would tell the sender they'd opened it.

const DAY = 86_400_000;
export const PER_PERSON_DAYS = 14;
export const WEEK_DAYS = 7;
export const PER_WEEK = 3;

/** One drop sent: who it was for (an account id, or a number for an invite), and whether they were outside your circle. */
export type DropRecord = { to: string; at: number; outside: boolean };

export type DropCheck = { ok: true } | { ok: false; reason: "person" | "week"; /** When it's allowed again. */ until: number };

/** Inside your circle there's no limit. Outside it: one per person per 14 days, and 3 in any 7 days, invites included. */
export function checkDrop(history: readonly DropRecord[], to: string, outside: boolean, now: number): DropCheck {
  if (!outside) return { ok: true };
  const recent = history.filter((d) => d.outside);
  const last = recent.filter((d) => d.to === to).reduce((max, d) => Math.max(max, d.at), -Infinity);
  if (now - last < PER_PERSON_DAYS * DAY) return { ok: false, reason: "person", until: last + PER_PERSON_DAYS * DAY };
  const week = recent.filter((d) => now - d.at < WEEK_DAYS * DAY).sort((a, b) => a.at - b.at);
  if (week.length >= PER_WEEK) return { ok: false, reason: "week", until: week[week.length - PER_WEEK].at + WEEK_DAYS * DAY };
  return { ok: true };
}
