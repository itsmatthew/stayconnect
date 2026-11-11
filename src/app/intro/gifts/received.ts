// Gifts you've received (docs/specs/gifts.md, GIFT-18 to GIFT-22). Plain TypeScript: the mobile app imports this unchanged.
// Opening is yours alone: nobody else, the sender included, is ever told whether or when you opened it.

import type { Gift, GiftCopy, GiftOpens, GiftPhoto } from "./gift";

/** One copy of a gift, as its holder has it: the gift as it was made, wrapped until they open it. */
export type ReceivedGift = {
  /** The copy's id (GIFT-13). */
  id: string;
  giftId: string;
  from: { id: string; name: string };
  /** TODO(server): a stored photo's URL. The demo draws one. */
  photo?: GiftPhoto;
  takenAt?: number;
  fileDated?: true;
  frame: Gift["frame"];
  note: Gift["note"];
  wrap: Gift["wrap"];
  opens: GiftOpens;
  sentAt: number;
  /** Set when its holder opens it. Never shared. */
  openedAt?: number;
};

/** A copy of `gift` for one recipient, as it arrives. */
export function copyOf(gift: Gift, copy: GiftCopy, from: { id: string; name: string }, sentAt: number): ReceivedGift {
  const { photo, takenAt, fileDated, frame, note, wrap, opens } = gift;
  return { id: copy.id, giftId: gift.id, from, ...(photo ? { photo } : {}), ...(takenAt !== undefined ? { takenAt } : {}), ...(fileDated ? { fileDated } : {}), frame, note, wrap, opens, sentAt };
}

/** A gift for a chosen day stays wrapped until that day (GIFT-20). `today` is a local "YYYY-MM-DD". */
export const canOpen = (g: Pick<ReceivedGift, "opens">, today: string) => g.opens.kind === "now" || g.opens.day <= today;

export const isOpened = (g: ReceivedGift) => g.openedAt !== undefined;

/** Unopened gifts, newest first: the newest one is the one that glows and shakes (GIFT-19). */
export const underTree = (list: readonly ReceivedGift[]) => list.filter((g) => !isOpened(g)).sort((a, b) => b.sentAt - a.sentAt);

/** Opened gifts, the latest opened first (GIFT-21). */
export const shelf = (list: readonly ReceivedGift[]) => list.filter(isOpened).sort((a, b) => b.openedAt! - a.openedAt!);

/** Opens a gift, once, if its day has come. */
export function openGift(list: readonly ReceivedGift[], id: string, now: number, today: string): ReceivedGift[] {
  return list.map((g) => (g.id === id && !isOpened(g) && canOpen(g, today) ? { ...g, openedAt: now } : g));
}

/** A gift arriving: added once, wrapped. */
export function receiveGift(list: readonly ReceivedGift[], g: ReceivedGift): ReceivedGift[] {
  if (list.some((x) => x.id === g.id)) return [...list];
  const wrapped = { ...g };
  delete wrapped.openedAt;
  return [...list, wrapped];
}

/** "wrapped Nov 5 · just for you", under who sent it (GIFT-20). */
export const wrappedLine = (g: Pick<ReceivedGift, "sentAt">) => `wrapped ${new Date(g.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · just for you`;

/** TODO(server): only the fake in `local-received.ts` exists, so gifts arrive only from the demo and the dev control. */
export interface ReceivedGiftStore {
  load(): Promise<ReceivedGift[] | undefined>;
  save(list: readonly ReceivedGift[]): Promise<void>;
}
