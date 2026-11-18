import type { ArtKind, FriendLook } from "../home/types";

/** A posted photo: an image (your own), or memory art standing in for one (placeholder posts). `src` is missing while it loads. */
export type PhotoView = { kind: "image"; src?: string; alt: string } | { kind: "art"; art: ArtKind; alt: string };

export type SlotKind = "week" | "month" | "year" | "bonus";

/** One row on this week's card: a slot you can post to, or your photo once it's in (docs/specs/archive.md, ARC-10). */
export type SlotView = {
  key: string;
  kind: SlotKind;
  /** The row's region name: "Photo of the week". */
  label: string;
  /** "Add your photo of the week". */
  title: string;
  /** "your circles are waiting on you", "closes Oct 31". */
  sub: string;
  posted?: PhotoView;
  /** "Your photo of the week is in ✓". */
  postedLine: string;
};

/** This week's card (ARC-10). */
export type WeekCardView = {
  /** "Oct 19–25". */
  range: string;
  /** "5 days left", "last day". */
  daysLeft: string;
  /** "2 of 5 friends have posted". */
  line: string;
  /** Faces of friends who have posted this week, first to post first. */
  posters: readonly { name: string; look: FriendLook }[];
};

/** One post in the feed (ARC-8). */
export type FeedPostView = {
  id: string;
  variant: SlotKind;
  /** "Leo, Week 42". */
  label: string;
  author: { name: string; look: FriendLook };
  /** Their first shared circle: its name and color (ARC-7). */
  circle: { name: string; color: string };
  photo: PhotoView;
  /** "Tue, Oct 13" · "WEEK 42"; "February" · "PHOTO OF THE MONTH". */
  footer: { left: string; right: string };
  /** Shown under the photo (ARC-13). */
  caption?: string;
};

/** The posting dialog for one slot. */
export type PickerView = {
  /** "Post your photo of the week". */
  title: string;
  /** "Photos taken Oct 19–25". */
  range: string;
  error?: string;
  /** The accepted photo, waiting for "Post". */
  preview?: string;
  /** "what made this week" (ARC-13). */
  captionPlaceholder: string;
  captionMax: number;
  busy: boolean;
};
