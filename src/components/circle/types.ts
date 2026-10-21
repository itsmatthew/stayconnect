import type { FriendLook } from "../home/types";

/** The three rings of the user's private tree (docs/specs/circle.md), center outward. */
export type Ring = "nest" | "branches" | "bloom";
export const RINGS: readonly Ring[] = ["nest", "branches", "bloom"];

/** Someone the user can place: `ring` is where they are, if anywhere. */
export type CirclePerson = { id: string; name: string; look: FriendLook; lit: boolean; ring?: Ring };

/** An inward move the app suggests (CIRCLE-9). */
export type CircleSuggestion = { name: string; to: Ring };
