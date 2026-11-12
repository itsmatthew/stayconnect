// Gifts you've received (docs/specs/gifts.md, GIFT-18 to GIFT-22). Plain TypeScript: the mobile app imports this unchanged.
// Opening is yours alone: nobody else, the sender included, is ever told whether or when you opened it.

import { dayDate, type Gift, type GiftCopy, type GiftOpens, type GiftPhoto } from "./gift";

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
  /** The sender's own copy of a group gift: never unwrapped, it stands on their shelf once its day has come (GIFT-23). */
  own?: true;
  /** For a group gift, the group's name. */
  toGroup?: string;
};

/** A copy of `gift` for one recipient, as it arrives. `groupName` for a group gift. */
export function copyOf(gift: Gift, copy: GiftCopy, from: { id: string; name: string }, sentAt: number, groupName?: string): ReceivedGift {
  const { photo, takenAt, fileDated, frame, note, wrap, opens } = gift;
  return {
    id: copy.id,
    giftId: gift.id,
    from,
    ...(photo ? { photo } : {}),
    ...(takenAt !== undefined ? { takenAt } : {}),
    ...(fileDated ? { fileDated } : {}),
    frame,
    note,
    wrap,
    opens,
    sentAt,
    ...(copy.own ? { own: true as const } : {}),
    ...(groupName !== undefined ? { toGroup: groupName } : {}),
  };
}

/** A gift for a chosen day stays wrapped until that day (GIFT-20). `today` is a local "YYYY-MM-DD". */
export const canOpen = (g: Pick<ReceivedGift, "opens">, today: string) => g.opens.kind === "now" || g.opens.day <= today;

export const isOpened = (g: ReceivedGift) => g.openedAt !== undefined;

/** Gifts that pop up when the app opens: unopened, their day come, oldest first, never your own (GIFT-19). */
export const waiting = (list: readonly ReceivedGift[], today: string) => list.filter((g) => !g.own && !isOpened(g) && canOpen(g, today)).sort((a, b) => a.sentAt - b.sentAt);

/** When a gift came to stand on your shelf: when you opened it, or, for your own, when it was sent or its day began. */
const landedAt = (g: ReceivedGift) => g.openedAt ?? (g.opens.kind === "on" ? Math.max(g.sentAt, dayDate(g.opens.day).getTime()) : g.sentAt);

/** Your shelf: gifts you've opened, and your own copies of group gifts once their day has come; the latest first (GIFT-21, GIFT-23). */
export const shelf = (list: readonly ReceivedGift[], today: string) =>
  list.filter((g) => isOpened(g) || (g.own && canOpen(g, today))).sort((a, b) => landedAt(b) - landedAt(a));

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
