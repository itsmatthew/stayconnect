// A group's two header photos (docs/specs/group-profile.md, GP-12), as the thread and the profile show them.
import type { ArtKind, CircleGroup, HeaderPhoto } from "@/components/home/types";
import type { HeaderPane } from "@/components/shared/header-photo";

/** "Jun 2014". */
export const monthYear = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", year: "numeric" });

/** A half and whether anyone has set it. Unset halves show stand-in art behind the "+" until someone adds a photo. */
export type HeaderSlot = { pane: HeaderPane; set: boolean };

function slot(label: string, photo: HeaderPhoto | undefined, standIn: ArtKind, dateLine: (t: number) => string): HeaderSlot {
  if (!photo || (!photo.src && !photo.art)) return { pane: { label, art: standIn }, set: false };
  return {
    pane: { label, ...(photo.src ? { src: photo.src } : { art: photo.art }), ...(photo.takenAt !== undefined ? { dateLine: dateLine(photo.takenAt) } : {}) },
    set: true,
  };
}

export function headerSlots(g: CircleGroup): { first: HeaderSlot; last: HeaderSlot } {
  return {
    first: slot(`${g.name} first photo together`, g.firstPhoto, "faces", (t) => `since ${monthYear(t)}`),
    last: slot(`${g.name} last time together`, g.lastPhoto, "city", monthYear),
  };
}
