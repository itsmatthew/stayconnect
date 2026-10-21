// An Archive post: one person's photo for one period (docs/specs/archive.md).
import type { ArtKind } from "@/components/home/types";

/** Placeholder posts draw memory art; your own posts point at an image in the Archive store. */
export type ArchivePhoto = { kind: "art"; art: ArtKind } | { kind: "stored"; photoId: string };

/** `author` is a friend id, or ME for your own. `period` is a period key ("2026-W43"). `caption` is optional and, like the photo, never edited (ARC-13). */
export type ArchivePost = { id: string; author: string; period: string; postedAt: number; takenAt: number; photo: ArchivePhoto; caption?: string };
