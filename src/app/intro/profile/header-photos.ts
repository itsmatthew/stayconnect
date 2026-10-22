// A group's two header photos (docs/specs/group-profile.md, GP-12), as the thread and the profile show them.
import type { CircleGroup, HeaderPhoto } from "@/components/home/types";
import type { HeaderPane } from "@/components/shared/header-photo";

/** "Jun 2014". */
export const monthYear = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", year: "numeric" });

/** A half and whether anyone has set it. Unset halves fall back to the group's tree-colour art (its first and third ornaments'). */
export type HeaderSlot = { pane: HeaderPane; set: boolean };

function slot(g: CircleGroup, label: string, photo: HeaderPhoto | undefined, fallback: CircleGroup["memories"][number], dateLine: (t: number) => string): HeaderSlot {
  if (!photo || (!photo.src && !photo.art)) return { pane: { label, art: fallback.art }, set: false };
  return {
    pane: { label, ...(photo.src ? { src: photo.src } : { art: photo.art }), ...(photo.takenAt !== undefined ? { dateLine: dateLine(photo.takenAt) } : {}) },
    set: true,
  };
}

export function headerSlots(g: CircleGroup): { first: HeaderSlot; last: HeaderSlot } {
  return {
    first: slot(g, `${g.name} first photo together`, g.firstPhoto, g.memories[0], (t) => `since ${monthYear(t)}`),
    last: slot(g, `${g.name} last time together`, g.lastPhoto, g.memories[2], monthYear),
  };
}
