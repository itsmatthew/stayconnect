import type { ArtKind, FriendLook, Memory, Party } from "../home/types";
import type { HeaderPane } from "../shared/header-photo";

/** A header half (GP-12) and whether anyone has set it; unset halves show the empty slot on the profile. */
export type HeaderSlotView = { pane: HeaderPane; set: boolean };
export type HeaderSlotName = "first" | "last";

/** A row of "what everyone’s up to" (docs/specs/group-profile.md, GP-10): a date chip and a line. Visual only for now. */
export type UpToRow = { when: string; text: string };

/** Someone in the group. `look` is absent for the user ("You"). `onOpen` only when they're in Your circle (GP-3). */
export type ProfileMember = { id: string; name: string; look?: FriendLook; onOpen?: () => void };

/** A photo in the grid: a stored image, or demo art. `label` is "Photo from ‹date›". */
export type ProfilePhoto = { id: string; label: string; src?: string; art?: ArtKind };

/** The "then" tile (GP-6). */
export type ThenTile = { photo: ProfilePhoto; yearsAgo: number };

/** The next-time-together card (GP-7/8). Without `goal`, it offers "Set a goal". */
export type NextGoal = {
  label: string;
  /** "46 days", "1 day", "today"; absent for an undated goal. */
  count?: string;
  /** "Dec 6". */
  dateLabel?: string;
  /** Who's in, in order (the user as a member with no look). */
  going: readonly ProfileMember[];
  total: number;
  mineIn: boolean;
};

export type GroupProfileProps = {
  party: Extract<Party, { kind: "group" }>;
  members: readonly ProfileMember[];
  ornaments: readonly Memory[];
  photos: readonly ProfilePhoto[];
  /** More visible memories than the grid shows: offer "See all". */
  hasMore: boolean;
  then?: ThenTile;
  goal?: NextGoal;
  upTo: readonly UpToRow[];
  /** The two header photos, and the "How was ‹label›?" prompt that replaces the right one after a goal (GP-12). */
  header: { first: HeaderSlotView; last: HeaderSlotView; prompt?: string };
  onPickHeader: (slot: HeaderSlotName, file: File) => void;
  onPickPrompt: (file: File) => void;
  onDismissPrompt: () => void;
  onBack: () => void;
  onChangeLogo: () => void;
  onViewOrnament: (index: number) => void;
  onSeeAll: () => void;
  onEditGoal: () => void;
  onToggleIn: () => void;
};
