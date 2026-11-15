// A group's ornaments and its logo, changed by any member (docs/specs/home.md, HOME-14–17; docs/specs/group-logo.md,
// LOGO-4–6). Pure rules: each changed ornament or logo keeps its current version and the one before it, so a member can
// undo the last change.

import type { CircleGroup } from "@/components/home/types";
import { formatPhotoDate } from "../daily5/format";
import { ME } from "../messages/conversations";

export const CAPTION_MAX = 40;

/** The logo's slot, next to the ornaments' indexes. Its versions have no caption. */
export const LOGO = "logo";
/** An ornament's index, or the group's logo. */
export type Slot = number | typeof LOGO;

/** No `photoId`: the ornament's original art. `by` is a friend id, or ME. */
export type OrnamentVersion = { photoId?: string; caption: string; by: string; at: number };
/** `previous` is what undo restores: an earlier version, or "original" (no change at all). */
export type OrnamentEntry = { current: OrnamentVersion; previous?: OrnamentVersion | "original" };
/** Keyed by `ornamentKey`. Only changed ornaments are in here. */
export type OrnamentState = Record<string, OrnamentEntry>;

export type OrnamentAction =
  | { type: "change"; groupId: string; index: Slot; /** Omitted: keep the current photo. */ photoId?: string; caption: string; by: string; at: number }
  | { type: "undo"; groupId: string; index: Slot }
  | { type: "load"; state: OrnamentState };

export const ornamentKey = (groupId: string, index: Slot) => `${groupId}/${index}`;

/** One line, trimmed, at most CAPTION_MAX characters; "" means no caption. */
export function normalizeCaption(caption: string): string {
  return caption.replace(/\s+/g, " ").trim().slice(0, CAPTION_MAX).trim();
}

export function ornamentReducer(state: OrnamentState, action: OrnamentAction): OrnamentState {
  switch (action.type) {
    case "change": {
      const key = ornamentKey(action.groupId, action.index);
      const was = state[key]?.current;
      const photoId = action.photoId ?? was?.photoId;
      const current: OrnamentVersion = { ...(photoId ? { photoId } : {}), caption: normalizeCaption(action.caption), by: action.by, at: action.at };
      return { ...state, [key]: { current, previous: was ?? "original" } };
    }
    case "undo": {
      const key = ornamentKey(action.groupId, action.index);
      const previous = state[key]?.previous;
      if (!previous) return state;
      const rest = { ...state };
      delete rest[key];
      return previous === "original" ? rest : { ...rest, [key]: { current: previous } };
    }
    case "load":
      return action.state;
  }
}

export const canUndo = (state: OrnamentState, groupId: string, index: Slot) => !!state[ornamentKey(groupId, index)]?.previous;

/**
 * Groups as everyone in them sees them: changed ornaments carry their caption and photo URL, a changed logo its image URL.
 * Untouched groups are returned as is.
 */
export function withOrnaments(groups: readonly CircleGroup[], state: OrnamentState, urls: Readonly<Record<string, string>>): CircleGroup[] {
  return groups.map((g) => {
    const versions = g.memories.map((_, i) => state[ornamentKey(g.id, i)]?.current);
    const logoId = state[ornamentKey(g.id, LOGO)]?.current.photoId;
    const logo = logoId ? urls[logoId] : undefined;
    if (!versions.some(Boolean)) return logo ? { ...g, logo } : g;
    const memories = g.memories.map((m, i) => {
      const v = versions[i];
      if (!v) return m;
      const src = v.photoId ? urls[v.photoId] : undefined;
      return { ...m, caption: v.caption, ...(src ? { src } : {}) };
    }) as unknown as CircleGroup["memories"];
    return { ...g, memories, ...(logo ? { logo } : {}) };
  });
}

/** "Leo changed this · Oct 21", "You changed the logo · Oct 21", with the year when it isn't the current one. */
export function changedLine(v: OrnamentVersion, nameOf: (id: string) => string | undefined, now: number, what: "this" | "the logo" = "this"): string {
  const who = v.by === ME ? "You" : (nameOf(v.by) ?? "Someone");
  const sameYear = new Date(v.at).getFullYear() === new Date(now).getFullYear();
  const date = sameYear ? new Date(v.at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : formatPhotoDate(v.at);
  return `${who} changed ${what} · ${date}`;
}

const photoIds = (state: OrnamentState) =>
  new Set(Object.values(state).flatMap((e) => [e.current.photoId, e.previous !== "original" ? e.previous?.photoId : undefined].filter((id): id is string => !!id)));

/** Images in `before` that `after` can no longer show or restore, so they can be deleted. */
export function unreachableImages(before: OrnamentState, after: OrnamentState): string[] {
  const kept = photoIds(after);
  return [...photoIds(before)].filter((id) => !kept.has(id));
}
