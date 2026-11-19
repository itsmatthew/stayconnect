// Circles you started or joined (docs/specs/onboarding.md, ONB-13, ONB-20). Plain TypeScript: no React or browser APIs.
// TODO(server): `POST /api/groups` makes them for real; until then they live in this browser.

import { groupPalette, type GroupPalette } from "../colors/palette";

/** `joined`: from an invite (ONB-20), with `from` the name of whoever saved you a spot. */
export type MyCircle = { id: string; name: string; colorId: string; createdAt: number; joined?: true; from?: string };

/** A new circle as Home and Messages draw groups: you're its only member until people join. */
export type CircleShape = {
  id: string;
  name: string;
  colorId: string;
  palette: GroupPalette;
  joinedAt: number;
  closest: boolean;
  members: readonly string[];
  friendCount: number;
  memories: readonly [{ id: string; caption: string }, { id: string; caption: string }, { id: string; caption: string }];
  lastMemory: string;
};

export function circleGroup(c: MyCircle): CircleShape {
  return {
    id: c.id,
    name: c.name,
    colorId: c.colorId,
    palette: groupPalette(c.colorId, 0),
    joinedAt: c.createdAt,
    closest: true,
    members: [],
    // TODO(server): real members; until then you, and whoever invited you.
    friendCount: c.joined ? 2 : 1,
    memories: [
      { id: `${c.id}-1`, caption: "" },
      { id: `${c.id}-2`, caption: "" },
      { id: `${c.id}-3`, caption: "" },
    ],
    lastMemory: !c.joined ? "you started it" : c.from ? `you joined just now · ${c.from} saved you a spot` : "you joined just now",
  };
}

/** Yours first, newest first, then everyone else's. */
export const withMyCircles = <G extends { id: string }>(groups: readonly G[], mine: readonly MyCircle[], shape: (c: MyCircle) => G): G[] => [
  ...[...mine].sort((a, b) => b.createdAt - a.createdAt).map(shape),
  ...groups.filter((g) => !mine.some((c) => c.id === g.id)),
];

export interface MyCircleStore {
  load(): Promise<MyCircle[]>;
  save(circles: readonly MyCircle[]): Promise<void>;
}

/** Saved circles from an older or damaged save are dropped rather than trusted. */
export const validCircles = (v: unknown): MyCircle[] =>
  Array.isArray(v) ? v.filter((c): c is MyCircle => !!c && typeof c.id === "string" && typeof c.name === "string" && typeof c.colorId === "string" && typeof c.createdAt === "number") : [];
