// Who sees what (docs/specs/archive.md, ARC-5–9). You see a friend's post for a period only once you've
// posted your own for that same period, unless you're a viewer on a circle they belong to.
import type { CircleGroup } from "@/components/home/types";
import { ME } from "../messages/conversations";
import { feedOrder, isOpen, openSlots, periodFromKey, type Period } from "./periods";
import type { ArchivePost } from "./posts";

/** The circles you share with `author`: closest first, then in circle order. */
export function sharedCircles(author: string, groups: readonly CircleGroup[]): CircleGroup[] {
  const shared = groups.filter((g) => g.members.includes(author));
  return [...shared.filter((g) => g.closest), ...shared.filter((g) => !g.closest)];
}

/** One thin outline per shared circle, in its canopy colour, at most 3 (ARC-7). */
export const outlineColors = (author: string, groups: readonly CircleGroup[]) =>
  sharedCircles(author, groups)
    .slice(0, 3)
    .map((g) => g.palette.canopy);

/** Circle name tags: at most 2, then "+N" (ARC-7). */
export function circleTags(author: string, groups: readonly CircleGroup[]): { names: string[]; more: number } {
  const shared = sharedCircles(author, groups);
  return { names: shared.slice(0, 2).map((g) => g.name), more: Math.max(0, shared.length - 2) };
}

type GateContext = { posted: ReadonlySet<string>; groups: readonly CircleGroup[]; viewerOf: readonly string[] };

export function canSee(post: ArchivePost, { posted, groups, viewerOf }: GateContext): boolean {
  const shared = sharedCircles(post.author, groups);
  if (!shared.length) return false;
  return posted.has(post.period) || shared.some((g) => viewerOf.includes(g.id));
}

/** `unlocked`: you posted. `open`: you still can. `closed`: you missed it, for good. */
export type FeedStatus = "unlocked" | "open" | "closed";
export type FeedSection = { period: Period; status: FeedStatus; visible: ArchivePost[]; hidden: ArchivePost[] };

type FeedInput = { posts: readonly ArchivePost[]; groups: readonly CircleGroup[]; viewerOf: readonly string[]; now: number };

/** The feed (ARC-8): every period friends have posted in, plus the ones open now, in feed order. Never your own posts. */
export function feedSections({ posts, groups, viewerOf, now }: FeedInput): FeedSection[] {
  const posted = new Set(posts.filter((p) => p.author === ME).map((p) => p.period));
  const byPeriod = new Map<string, ArchivePost[]>(openSlots(now).map((p) => [p.key, []]));
  for (const p of posts) {
    if (p.author === ME || p.postedAt > now || !sharedCircles(p.author, groups).length) continue;
    const list = byPeriod.get(p.period) ?? [];
    list.push(p);
    byPeriod.set(p.period, list);
  }

  const ctx = { posted, groups, viewerOf };
  return [...byPeriod]
    .map(([key, list]) => {
      const period = periodFromKey(key);
      const sorted = [...list].sort((a, b) => b.postedAt - a.postedAt);
      const status: FeedStatus = posted.has(key) ? "unlocked" : isOpen(period, now) ? "open" : "closed";
      return { period, status, visible: sorted.filter((p) => canSee(p, ctx)), hidden: sorted.filter((p) => !canSee(p, ctx)) };
    })
    .filter((s) => s.period.start <= now && (isOpen(s.period, now) || s.period.end <= now))
    .sort((a, b) => feedOrder(now)(a.period, b.period));
}
