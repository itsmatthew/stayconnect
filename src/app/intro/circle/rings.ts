// Pure ring placements (docs/specs/circle.md, CIRCLE-2/8/10). Only the user places people:
// nothing here moves anyone except an explicit `place`, and no ring is ever full.
import { RINGS, type Ring } from "@/components/circle/types";

/** Friend id → ring. Key order is each ring's order (a move puts them last). */
export type Placements = Readonly<Record<string, Ring>>;

export type CircleState = {
  placements: Placements;
  /** Friend id → when the user last turned down a suggestion for them. */
  dismissed: Readonly<Record<string, number>>;
};

export type CircleAction =
  | { type: "place"; friendId: string; ring: Ring }
  | { type: "dismiss"; friendId: string; at: number }
  | { type: "load"; state: CircleState };

export function initialCircleState(placements: Placements): CircleState {
  return { placements, dismissed: {} };
}

export function circleReducer(state: CircleState, action: CircleAction): CircleState {
  switch (action.type) {
    case "place": {
      const rest = Object.entries(state.placements).filter(([id]) => id !== action.friendId);
      return { ...state, placements: { ...Object.fromEntries(rest), [action.friendId]: action.ring } };
    }
    case "dismiss":
      return { ...state, dismissed: { ...state.dismissed, [action.friendId]: action.at } };
    case "load":
      return action.state;
  }
}

export function members(placements: Placements, ring: Ring): string[] {
  return Object.keys(placements).filter((id) => placements[id] === ring);
}

/** Soft guides, never limits: rings can be below or above them. */
export const SOFT_GUIDES: Readonly<Record<Ring, { typical: number; low: number; high: number }>> = {
  nest: { typical: 5, low: 0, high: 10 },
  branches: { typical: 15, low: 5, high: 25 },
  bloom: { typical: 50, low: 25, high: 75 },
};

/** Past the upper end the card shows a gentle note; below the lower end is fine. */
export const overGuide = (ring: Ring, count: number) => count > SOFT_GUIDES[ring].high;

/** The ring one step in, if there is one. */
export const inward = (ring: Ring): Ring | undefined => RINGS[RINGS.indexOf(ring) - 1];
