// Everything the app shows that isn't the user's own: groups, friends, chats and Archive posts.
// The demo switch picks placeholder data or nothing at all (docs/specs/demo.md); this is the only
// module that imports placeholder-data.ts.
import type { CircleGroup, Friend } from "@/components/home/types";
import type { ArchivePost } from "./archive/posts";
import { DEMO_DATA } from "./demo";
import type { Conversation } from "./messages/conversations";
import { friends, placeholderGroups, placeholderPosts, placeholderReplies, seedConversations } from "./placeholder-data";

export type AppData = {
  groups: readonly CircleGroup[];
  friends: readonly Friend[];
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
  seedConversations: () => [],
  replies: [],
  posts: () => [],
  viewerOf: [],
  storageSuffix: "",
};

export const demoData: AppData = {
  groups: placeholderGroups,
  friends,
  seedConversations,
  replies: placeholderReplies,
  posts: placeholderPosts,
  viewerOf: [],
  storageSuffix: ".demo",
};

export const defaultData: AppData = DEMO_DATA ? demoData : emptyData;
