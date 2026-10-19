// Pure rules for the day's five (docs/specs/daily5.md, D5-5–8). Face detection is injected.

import type { PoolId } from "@/components/daily5/types";

export type { PoolId };
export type PhotoMeta = { id: string; pool: PoolId; takenAt: number };

export const DAILY_COUNT = 5;
const QUOTA: Record<PoolId, number> = { mine: 3, family: 2 };
/** At most this many of the five may have no face. */
const FACELESS_ALLOWED = 1;
const MAX_CHECKS = 80;

/** "2026-10-14" in local time. */
export function localDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** On or before the same calendar day one year ago (Feb 29 → Feb 28 last year). */
export function isEligible(takenAt: number, today: Date): boolean {
  const y = today.getFullYear() - 1;
  const m = today.getMonth();
  let d = today.getDate();
  if (m === 1 && d === 29 && !isLeap(y)) d = 28;
  return takenAt < new Date(y, m, d + 1).getTime();
}

// cyrb53-style string hash → mulberry32 PRNG: small, fast, stable everywhere.
function hash(s: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  return h1 >>> 0;
}
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates with a seeded PRNG: the same items and seed always give the same order. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const out = [...items];
  const rand = mulberry32(hash(seed));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type PickOptions = {
  photos: readonly PhotoMeta[];
  today: Date;
  hasFace: (p: PhotoMeta) => Promise<boolean>;
  maxChecks?: number;
};

/**
 * Today's five: 3 from My photos and 2 from Family computer (a short pool's share goes to the other),
 * at most one without a face, eligible photos only, seeded by the local date.
 */
export async function pickDaily({ photos, today, hasFace, maxChecks = MAX_CHECKS }: PickOptions): Promise<PhotoMeta[]> {
  const key = localDateKey(today);
  // Sort by id first so the input order never matters, only the photos and the date.
  const eligible = photos.filter((p) => isEligible(p.takenAt, today)).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const queues: Record<PoolId, PhotoMeta[]> = {
    mine: seededShuffle(eligible.filter((p) => p.pool === "mine"), `${key}:mine`),
    family: seededShuffle(eligible.filter((p) => p.pool === "family"), `${key}:family`),
  };
  const total = Math.min(DAILY_COUNT, eligible.length);

  let checks = 0;
  /** true / false, or undefined once the check budget is spent. */
  const check = async (p: PhotoMeta) => {
    if (checks >= maxChecks) return undefined;
    checks++;
    return hasFace(p);
  };

  const picked: PhotoMeta[] = [];
  const unknown: PhotoMeta[] = [];
  const faceless: PhotoMeta[] = [];
  let facelessUsed = 0;
  const take = async (pool: PoolId, upTo: number) => {
    const queue = queues[pool];
    while (picked.filter((p) => p.pool === pool).length < upTo && picked.length < total && queue.length) {
      const p = queue.shift()!;
      const face = await check(p);
      if (face === true) picked.push(p);
      else if (face === false && facelessUsed < FACELESS_ALLOWED) {
        facelessUsed++;
        picked.push(p);
      } else (face === false ? faceless : unknown).push(p);
    }
  };

  await take("mine", QUOTA.mine);
  await take("family", QUOTA.family);
  // A short pool's share goes to the other.
  await take("mine", total);
  await take("family", total);
  // Not enough faces anywhere: fill rather than show fewer. Unchecked photos may have faces, so they go first.
  for (const p of [...unknown, ...faceless, ...queues.mine, ...queues.family]) {
    if (picked.length >= total) break;
    picked.push(p);
  }
  return seededShuffle(picked, `${key}:order`);
}

/** A saved day's set stays all day, unless it isn't full yet. */
export function needsNewPick(saved: readonly string[] | undefined): boolean {
  return !saved || saved.length < DAILY_COUNT;
}
