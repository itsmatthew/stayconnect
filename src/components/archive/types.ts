import type { ArtKind, FriendLook, Palette } from "../home/types";

/** A posted photo: an image (your own), or memory art standing in for one (placeholder posts). `src` is missing while it loads. */
export type PhotoView = { kind: "image"; src?: string; alt: string } | { kind: "art"; art: ArtKind; alt: string };

export type SlotKind = "week" | "month" | "year" | "bonus";

/** One of your own slots at the top of the Archive (docs/specs/archive.md, ARC-10). */
export type SlotView = {
  key: string;
  kind: SlotKind;
  /** The slot's region name: "Photo of the week". */
  label: string;
  size: "large" | "medium" | "small" | "grown";
  /** "Post your photo of the week to see everyone's · closes Sunday". */
  directions: string;
  posted?: PhotoView;
};

export type PostCardView = {
  id: string;
  variant: SlotKind;
  /** "Leo, Week 42". */
  label: string;
  author: { name: string; look: FriendLook };
  /** "Tuesday · 2:40 pm". */
  time: string;
  /** Canopy colours of the shared circles, closest first, at most 3 (ARC-7). */
  outlines: readonly string[];
  /** The first shared circle's colours, for the card itself. */
  palette: Palette;
  tags: readonly { name: string; color: string }[];
  moreTags: number;
  /** "photo of October"; none on weekly cards. */
  ribbon?: string;
  photo: PhotoView;
  /** Shown under the photo (ARC-13). */
  caption?: string;
};

export type FeedSectionView = {
  key: string;
  /** The section's region name: "Week 43", "October", "2026", "Bonus week". */
  title: string;
  /** "Oct 19–25". */
  range: string;
  cards: readonly PostCardView[];
  /** The locked line (ARC-9), when some posts are still hidden. */
  locked?: string;
  /** One blurred stand-in per hidden post, in its author's first circle colour. */
  standins: readonly string[];
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
