// Sending a gift without ever losing it or charging twice (docs/specs/gifts.md, GIFT-15). Plain TypeScript.
import { giftCharge, giftCopies, type Gift, type GiftCopy } from "./gift";
import type { GiftDelivery } from "./gift-delivery";
import type { GiftEvents } from "./gift-events";
import type { GiftStore } from "./gift-store";
import type { PaymentService } from "./payment";

export type SendDeps = {
  store: GiftStore;
  payment: PaymentService;
  delivery: GiftDelivery;
  events: GiftEvents;
  /** A group's members now: who gets a copy is decided at send time (GIFT-13). */
  membersOf: (groupId: string) => readonly string[];
  now: () => number;
};

/** `own`: once sent, the sender's own copy of a group gift, for their shelf (GIFT-23). */
export type SendResult = { kind: "sent" | "failed" | "cancelled" | "pending" | "deliveryFailed"; gift: Gift; own?: GiftCopy };

/**
 * Saved as paying before the charge, as paid before delivery, as sent after. A failed or cancelled payment puts it back
 * to draft. A paid gift is never charged again: sending it again only delivers.
 */
export async function sendGift(gift: Gift, d: SendDeps): Promise<SendResult> {
  let g = gift;
  const save = async (next: Gift) => {
    g = next;
    await d.store.save(g);
  };
  if (g.status !== "paid") {
    await save({ ...g, status: "paying" });
    const { idempotencyKey, sku } = giftCharge(g);
    const result = await d.payment.pay({ idempotencyKey, payWith: { kind: "purchase", sku } });
    if (result.status === "pending") return { kind: "pending", gift: g };
    if (result.status !== "paid") {
      await save({ ...g, status: "draft" });
      return { kind: result.status, gift: g };
    }
    await save({ ...g, status: "paid", receiptId: result.receiptId });
  }
  const all = giftCopies(g, d.membersOf);
  // The sender's own copy isn't delivered: it goes straight on their shelf.
  const copies = all.filter((c) => !c.own);
  const own = all.find((c) => c.own);
  try {
    await d.delivery.deliver(g, copies);
  } catch {
    return { kind: "deliveryFailed", gift: g };
  }
  await save({ ...g, status: "sent", sentAt: d.now() });
  void d.events.record({ type: "sent", giftId: g.id, at: d.now(), recipient: g.to?.kind ?? "person", copies: copies.length });
  return { kind: "sent", gift: g, ...(own ? { own } : {}) };
}

/** After the app closed mid-payment: a charged gift is paid, an uncharged one is a draft again. Others are untouched. */
export async function settlePaying(gifts: readonly Gift[], payment: PaymentService): Promise<Gift[]> {
  return Promise.all(
    gifts.map(async (g) => {
      if (g.status !== "paying") return g;
      const found = await payment.find(g.id);
      return found?.status === "paid" ? { ...g, status: "paid" as const, receiptId: found.receiptId } : { ...g, status: "draft" as const };
    }),
  );
}
