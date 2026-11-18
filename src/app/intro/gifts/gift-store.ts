// Where gifts are kept (docs/specs/gifts.md, GIFT-9). Plain TypeScript.
import type { Gift } from "./gift";

/** TODO(server): only the fake in `local-gift-store.ts` exists. Async, because mobile storage and a server are. */
export interface GiftStore {
  load(): Promise<Gift[]>;
  /** Adds the gift, or replaces the one with its id. */
  save(gift: Gift): Promise<void>;
}

const isGift = (raw: unknown): raw is Gift => {
  const g = raw as Partial<Gift> | null;
  return typeof g === "object" && g !== null && typeof g.id === "string" && typeof g.status === "string" && typeof g.note === "object" && typeof g.frame === "object" && typeof g.wrap === "object";
};

/** Before gifts could go to groups, `to` was a friend id, or "" for nobody. */
function upgrade(gift: Gift): Gift {
  const to: unknown = gift.to;
  if (typeof to !== "string") return gift;
  return { ...gift, to: to ? { kind: "person", id: to } : undefined };
}

/** Keeps what's valid from stored data of any shape. */
export const parseGifts = (raw: unknown): Gift[] => (Array.isArray(raw) ? raw.filter(isGift).map(upgrade) : []);
