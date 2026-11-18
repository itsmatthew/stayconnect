// Limits on photos dropped for people outside your circle (docs/specs/mail.md, MAIL-6). Plain TypeScript.
// Time-based only: a limit that lifted when someone opened a drop would tell the sender they'd opened it.
// No per-person wait: repeat drops stack into one envelope on the recipient's side (MAIL-11), and they choose who can drop (MAIL-10).

const DAY = 86_400_000;
export const WEEK_DAYS = 7;
export const PER_WEEK = 3;

/** One drop sent: who it was for (an account id, or a number for an invite), and whether they were outside your circle. */
export type DropRecord = { to: string; at: number; outside: boolean };

export type DropCheck = { ok: true } | { ok: false; /** When it's allowed again. */ until: number };

/** Inside your circle there's no limit. Outside it: 3 in any 7 days, invites included. */
export function checkDrop(history: readonly DropRecord[], outside: boolean, now: number): DropCheck {
  if (!outside) return { ok: true };
  const week = history.filter((d) => d.outside && now - d.at < WEEK_DAYS * DAY).sort((a, b) => a.at - b.at);
  if (week.length >= PER_WEEK) return { ok: false, until: week[week.length - PER_WEEK].at + WEEK_DAYS * DAY };
  return { ok: true };
}
