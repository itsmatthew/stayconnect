// The Archive feed (docs/specs/archive.md, ARC-8, ARC-10). Plain TypeScript: the mobile app imports it unchanged.
import type { CircleGroup } from "@/components/home/types";
import { ME } from "../messages/conversations";
import { feedSections } from "./gate";
import { weekPeriod } from "./periods";
import type { ArchivePost } from "./posts";

type FeedInput = { posts: readonly ArchivePost[]; groups: readonly CircleGroup[]; viewerOf: readonly string[]; now: number; postToSee?: boolean };

/** Every post you can see, one after another, newest posted first: weeks, months and years mixed (ARC-8). */
export function feedPosts(input: FeedInput): ArchivePost[] {
  return feedSections(input)
    .flatMap((s) => s.visible)
    .sort((a, b) => b.postedAt - a.postedAt);
}

/** Everyone who shares a circle with you. */
const circleFriends = (groups: readonly CircleGroup[]) => new Set(groups.flatMap((g) => g.members).filter((m) => m !== ME));

/**
 * This week's card (ARC-10): who's posted this week (or the bonus week), first to post first, out of everyone who
 * shares a circle with you.
 */
export function weekSummary({ posts, groups, now }: { posts: readonly ArchivePost[]; groups: readonly CircleGroup[]; now: number }): { posted: string[]; friends: number; line: string } {
  const friends = circleFriends(groups);
  const week = weekPeriod(now).key;
  const posted = [...new Set(posts.filter((p) => p.period === week && friends.has(p.author) && p.postedAt <= now).sort((a, b) => a.postedAt - b.postedAt).map((p) => p.author))];
  const line = !posted.length ? "No one's posted yet this week" : `${posted.length} of ${friends.size} friends ${posted.length === 1 ? "has" : "have"} posted`;
  return { posted, friends: friends.size, line };
}
