import type { GiftDelivery } from "./gift-delivery";

/** Demo data keeps its own record (docs/specs/demo.md, DEMO-3). */
export const giftsSentKey = (suffix: string) => `nowandthen.giftsDelivered.v1${suffix}`;

/** TODO(server): a fake that records each delivery in this browser; nobody else receives it. */
export function localGiftDelivery(suffix: string): GiftDelivery {
  const key = giftsSentKey(suffix);
  return {
    async deliver(gift, copies) {
      const prior: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
      localStorage.setItem(key, JSON.stringify([...(Array.isArray(prior) ? prior : []), { giftId: gift.id, copies, opens: gift.opens }]));
    },
  };
}
