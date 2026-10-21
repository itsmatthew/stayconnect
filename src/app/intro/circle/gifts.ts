// Gifts the user has received, piled under Your circle's tree (docs/specs/circle.md, CIRCLE-12).
// TODO(re-evaluate when the memory mailbox is built): gifts can't be opened yet; this is where the mailbox goes.

export type ReceivedGift = { id: string; from: string; receivedAt: number };

/** The pile's order: newest first, so it sits in front. */
export const newestFirst = (gifts: readonly ReceivedGift[]) => [...gifts].sort((a, b) => b.receivedAt - a.receivedAt);
