// Everything the app shows that isn't the user's own: groups, friends, ring placements, gifts, chats and Archive posts.
// The demo switch picks placeholder data or nothing at all (docs/specs/demo.md); this is the only
// module that imports placeholder-data.ts.
import type { CircleGroup, Friend } from "@/components/home/types";
import type { UpToRow } from "@/components/profile/types";
import type { ArchivePost } from "./archive/posts";
import type { ReceivedGift } from "./circle/gifts";
import type { Placements } from "./circle/rings";
import { DEMO_DATA } from "./demo";
import type { Conversation } from "./messages/conversations";
import {
  friends,
  placeholderGoals,
  placeholderGroups,
  placeholderPosts,
  placeholderGifts,
  placeholderReplies,
  placeholderRings,
  placeholderUpTo,
  seedConversations,
} from "./placeholder-data";
import type { GoalState } from "./profile/goals";

export type AppData = {
  groups: readonly CircleGroup[];
  friends: readonly Friend[];
  /** Who's in which ring of Your circle (docs/specs/circle.md). */
  rings: Placements;
  /** Gifts received, piled under Your circle's tree (CIRCLE-12). */
  gifts: (now: number) => ReceivedGift[];
  seedConversations: (now: number) => Conversation[];
  /** What a recipient says when "simulate reply" fires (MSG-6). */
  replies: readonly string[];
  posts: (now: number) => ArchivePost[];
  /** Circles on which the user is a viewer (ARC-5). */
  viewerOf: readonly string[];
  /** Next-time-together goals to start from (docs/specs/group-profile.md, GP-11). */
  goals: (now: number) => GoalState;
  /** Group id → "what everyone’s up to" rows (GP-10). */
  upTo: Readonly<Record<string, readonly UpToRow[]>>;
  /** Appended to storage names so demo and real data never mix (DEMO-3). */
  storageSuffix: string;
};

export const emptyData: AppData = {
  groups: [],
  friends: [],
  rings: {},
  gifts: () => [],
  seedConversations: () => [],
  replies: [],
  posts: () => [],
  viewerOf: [],
  goals: () => ({}),
  upTo: {},
  storageSuffix: "",
};

export const demoData: AppData = {
  groups: placeholderGroups,
  friends,
  rings: placeholderRings,
  gifts: placeholderGifts,
  seedConversations,
  replies: placeholderReplies,
  posts: placeholderPosts,
  viewerOf: [],
  goals: placeholderGoals,
  upTo: placeholderUpTo,
  storageSuffix: ".demo",
};

export const defaultData: AppData = DEMO_DATA ? demoData : emptyData;
