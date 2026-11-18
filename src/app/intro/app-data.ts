// Everything the app shows that isn't the user's own: groups, friends, ring placements, gifts, chats and Archive posts.
// The demo switch picks placeholder data or nothing at all (docs/specs/demo.md); this is the only
// module that imports placeholder-data.ts.
import type { CircleGroup, Friend } from "@/components/home/types";
import type { UpToRow } from "@/components/profile/types";
import type { ArchivePost } from "./archive/posts";
import type { ReceivedGift } from "./gifts/received";
import type { Placements } from "./circle/rings";
import { fakeMemberColors, type MemberColorSource } from "./colors/member-colors";
import { fakeDirectory, type Directory } from "./mail/directory";
import type { MonthDay } from "./mail/birthdays";
import { emptyInbox, type InboxState } from "./mail/inbox";
import { DEMO_DATA } from "./demo";
import type { Conversation } from "./messages/conversations";
import {
  friends,
  placeholderGoals,
  placeholderGroups,
  placeholderMemberColors,
  placeholderPosts,
  placeholderGifts,
  placeholderReplies,
  placeholderRings,
  placeholderDirectory,
  placeholderMail,
  placeholderBirthdays,
  placeholderSenderName,
  placeholderUpTo,
  seedConversations,
} from "./placeholder-data";
import type { GoalState } from "./profile/goals";

export type AppData = {
  groups: readonly CircleGroup[];
  friends: readonly Friend[];
  /** Who's in which ring of Your circle (docs/specs/circle.md). */
  rings: Placements;
  /** Gifts received: wrapped under Your circle's tree, then on the shelf once opened (CIRCLE-12, GIFT-18). */
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
  /** Colors a group's members already use (docs/specs/group-colors.md, COLOR-4). */
  memberColors: MemberColorSource;
  /** How the user signs a gift's postcard. TODO(server): the user's real name. */
  senderName: string;
  /** Finding people outside your circle (docs/specs/mail.md, MAIL-3). TODO(server): a fake. */
  directory: Directory;
  /** Your mailbox to start from (docs/specs/mailbox.md). TODO(server): mail will arrive from the server. */
  mail: (now: number) => InboxState;
  /** Friend id → their birthday's month and day (docs/specs/mailbox.md, MAILBOX-11). TODO(server/onboarding): asked when people join. */
  birthdays: (now: number) => Readonly<Record<string, MonthDay>>;
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
  memberColors: fakeMemberColors({}),
  senderName: "",
  directory: fakeDirectory([]),
  mail: () => emptyInbox,
  birthdays: () => ({}),
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
  memberColors: fakeMemberColors(placeholderMemberColors),
  senderName: placeholderSenderName,
  directory: fakeDirectory(placeholderDirectory),
  mail: placeholderMail,
  birthdays: placeholderBirthdays,
  storageSuffix: ".demo",
};

export const defaultData: AppData = DEMO_DATA ? demoData : emptyData;
