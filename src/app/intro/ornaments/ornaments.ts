// A group's ornaments, changed by any member (docs/specs/home.md, HOME-14–17). Pure rules: each changed
// ornament keeps its current version and the one before it, so a member can undo the last change.

import type { CircleGroup } from "@/components/home/types";
import { formatPhotoDate } from "../daily5/format";
import { ME } from "../messages/conversations";

export const CAPTION_MAX = 40;

/** No `photoId`: the ornament's original art. `by` is a friend id, or ME. */
export type OrnamentVersion = { photoId?: string; caption: string; by: string; at: number };
/** `previous` is what undo restores: an earlier version, or "original" (no change at all). */
export type OrnamentEntry = { current: OrnamentVersion; previous?: OrnamentVersion | "original" };
/** Keyed by `ornamentKey`. Only changed ornaments are in here. */
export type OrnamentState = Record<string, OrnamentEntry>;

export type OrnamentAction =
  | { type: "change"; groupId: string; index: number; /** Omitted: keep the current photo. */ photoId?: string; caption: string; by: string; at: number }
  | { type: "undo"; groupId: string; index: number }
  | { type: "load"; state: OrnamentState };

export const ornamentKey = (groupId: string, index: number) => `${groupId}/${index}`;

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

export const canUndo = (state: OrnamentState, groupId: string, index: number) => !!state[ornamentKey(groupId, index)]?.previous;

/** Groups as everyone in them sees them: changed ornaments carry their caption and photo URL. Untouched groups are returned as is. */
export function withOrnaments(groups: readonly CircleGroup[], state: OrnamentState, urls: Readonly<Record<string, string>>): CircleGroup[] {
  return groups.map((g) => {
    const versions = g.memories.map((_, i) => state[ornamentKey(g.id, i)]?.current);
    if (!versions.some(Boolean)) return g;
    const memories = g.memories.map((m, i) => {
      const v = versions[i];
      if (!v) return m;
      const src = v.photoId ? urls[v.photoId] : undefined;
      return { ...m, caption: v.caption, ...(src ? { src } : {}) };
    }) as unknown as CircleGroup["memories"];
    return { ...g, memories };
  });
}

/** "Leo changed this · Oct 21", "You changed this · Oct 21", with the year when it isn't the current one. */
export function changedLine(v: OrnamentVersion, nameOf: (id: string) => string | undefined, now: number): string {
  const who = v.by === ME ? "You" : (nameOf(v.by) ?? "Someone");
  const sameYear = new Date(v.at).getFullYear() === new Date(now).getFullYear();
  const date = sameYear ? new Date(v.at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : formatPhotoDate(v.at);
  return `${who} changed this · ${date}`;
}

const photoIds = (state: OrnamentState) =>
  new Set(Object.values(state).flatMap((e) => [e.current.photoId, e.previous !== "original" ? e.previous?.photoId : undefined].filter((id): id is string => !!id)));

/** Images in `before` that `after` can no longer show or restore, so they can be deleted. */
export function unreachableImages(before: OrnamentState, after: OrnamentState): string[] {
  const kept = photoIds(after);
  return [...photoIds(before)].filter((id) => !kept.has(id));
}
