// Everything the app shows that isn't the user's own: groups, friends, ring placements, gifts, chats and Archive posts.
// The demo switch picks placeholder data or nothing at all (docs/specs/demo.md); this is the only
// module that imports placeholder-data.ts.
import type { CircleGroup, Friend } from "@/components/home/types";
import type { ArchivePost } from "./archive/posts";
import type { ReceivedGift } from "./circle/gifts";
import type { Placements } from "./circle/rings";
import { DEMO_DATA } from "./demo";
import type { Conversation } from "./messages/conversations";
import { friends, placeholderGroups, placeholderPosts, placeholderGifts, placeholderReplies, placeholderRings, seedConversations } from "./placeholder-data";

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
  storageSuffix: ".demo",
};

export const defaultData: AppData = DEMO_DATA ? demoData : emptyData;
