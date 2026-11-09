import { describe, expect, it } from "vitest";
import { giftReducer, newGift, sentLine, type Gift } from "@/app/intro/gifts/gift";
import type { GiftEvent } from "@/app/intro/gifts/gift-events";
import { sendGift, settlePaying, type SendDeps } from "@/app/intro/gifts/gift-flow";
import type { GiftDelivery } from "@/app/intro/gifts/gift-delivery";
import { betaPayment, GIFT_SKU, type PaymentResult, type PaymentService } from "@/app/intro/gifts/payment";

const NOW = new Date(2026, 10, 9, 12).getTime();
const ready = (to: Gift["to"] = { kind: "person", id: "leo" }): Gift =>
  giftReducer(giftReducer(newGift({ id: "g1", from: "me", now: NOW }), { type: "to", to: to! }), { type: "photo", photo: { kind: "stored", photoId: "p1" } });

/** A payment service that answers from a script, and counts real charges by key. */
function scripted(results: PaymentResult["status"][]) {
  const charged = new Map<string, PaymentResult>();
  let calls = 0;
  const service: PaymentService & { calls: () => number; charges: () => number } = {
    product: async (sku) => ({ sku, displayPrice: "$0.99", free: false }),
    balance: async () => ({ credits: 0 }),
    async pay({ idempotencyKey }) {
      calls++;
      const done = charged.get(idempotencyKey);
      if (done) return done;
      const status = results.shift() ?? "paid";
      const r: PaymentResult = status === "paid" ? { status, receiptId: `r-${idempotencyKey}` } : { status };
      if (status === "paid") charged.set(idempotencyKey, r);
      return r;
    },
    find: async (key) => charged.get(key),
    calls: () => calls,
    charges: () => charged.size,
  };
  return service;
}

function deps(payment: PaymentService, delivery: GiftDelivery = { deliver: async () => {} }) {
  const saved: Gift[] = [];
  const events: GiftEvent[] = [];
  const d: SendDeps = {
    store: { load: async () => saved, save: async (g) => void saved.push(g) },
    payment,
    delivery,
    events: { record: async (e) => void events.push(e) },
    membersOf: (id) => ({ hoops: ["sam", "jordan", "me"] })[id] ?? [],
    now: () => NOW,
  };
  return { d, saved, events };
}

describe("sending a gift (GIFT-14, GIFT-15)", () => {
  it("saves it as paying before charging, then paid, then sent, and records it", async () => {
    const delivered: string[][] = [];
    const { d, saved, events } = deps(scripted(["paid"]), { deliver: async (_g, copies) => void delivered.push(copies.map((c) => c.to)) });
    expect(await sendGift(ready(), d)).toEqual({ kind: "sent", gift: expect.objectContaining({ status: "sent", sentAt: NOW, receiptId: "r-g1" }) });
    expect(saved.map((g) => g.status)).toEqual(["paying", "paid", "sent"]);
    expect(delivered).toEqual([["leo"]]);
    expect(events).toEqual([{ type: "sent", giftId: "g1", at: NOW, recipient: "person", copies: 1 }]);
  });

  it("keeps the gift as a draft when payment fails, and charges once when retried", async () => {
    const payment = scripted(["failed", "paid"]);
    const { d, saved } = deps(payment);
    const first = await sendGift(ready(), d);
    expect(first.kind).toBe("failed");
    expect(saved.at(-1)!.status).toBe("draft");
    expect((await sendGift(saved.at(-1)!, d)).kind).toBe("sent");
    expect(payment.charges()).toBe(1);
  });

  it("treats backing out of the purchase like a failure that keeps the gift", async () => {
    const { d, saved } = deps(scripted(["cancelled"]));
    expect((await sendGift(ready(), d)).kind).toBe("cancelled");
    expect(saved.at(-1)!.status).toBe("draft");
  });

  it("waits on a purchase that needs approval, and keeps it saved", async () => {
    const { d, saved } = deps(scripted(["pending"]));
    expect((await sendGift(ready(), d)).kind).toBe("pending");
    expect(saved.at(-1)!.status).toBe("paying");
  });

  it("never charges twice when delivery fails after paying: a retry only delivers", async () => {
    const payment = scripted(["paid"]);
    let fail = true;
    const { d, saved } = deps(payment, {
      deliver: async () => {
        if (fail) throw new Error("offline");
      },
    });
    expect((await sendGift(ready(), d)).kind).toBe("deliveryFailed");
    expect(saved.at(-1)!.status).toBe("paid");
    fail = false;
    expect((await sendGift(saved.at(-1)!, d)).kind).toBe("sent");
    expect(payment.calls()).toBe(1);
  });

  it("charges once for a group, and delivers a copy to each member but the sender", async () => {
    const payment = scripted(["paid"]);
    const delivered: string[][] = [];
    const { d, events } = deps(payment, { deliver: async (_g, copies) => void delivered.push(copies.map((c) => c.to)) });
    await sendGift(ready({ kind: "group", id: "hoops" }), d);
    expect(payment.charges()).toBe(1);
    expect(delivered).toEqual([["sam", "jordan"]]);
    expect(events[0]).toMatchObject({ recipient: "group", copies: 2 });
  });

  it("asks for the single-gift product", async () => {
    let asked = "";
    const payment = { ...scripted([]), pay: async (req: Parameters<PaymentService["pay"]>[0]) => { asked = req.payWith.kind === "purchase" ? req.payWith.sku : ""; return { status: "paid" as const, receiptId: "r" }; } };
    const { d } = deps(payment);
    await sendGift(ready(), d);
    expect(asked).toBe(GIFT_SKU);
  });
});

describe("after the app closed mid-payment (GIFT-15)", () => {
  it("marks a charged gift paid, and puts an uncharged one back to draft", async () => {
    const payment = scripted(["paid"]);
    await payment.pay({ idempotencyKey: "charged", payWith: { kind: "purchase", sku: GIFT_SKU } });
    const paying = (id: string): Gift => ({ ...ready(), id, status: "paying" });
    const settled = await settlePaying([paying("charged"), paying("never"), ready()], payment);
    expect(settled.map((g) => [g.id, g.status])).toEqual([
      ["charged", "paid"],
      ["never", "draft"],
      ["g1", "draft"],
    ]);
  });
});

describe("free during beta (GIFT-14)", () => {
  it("names the price as free, and pays without charging anything", async () => {
    const beta = betaPayment();
    expect(await beta.product(GIFT_SKU)).toEqual({ sku: GIFT_SKU, displayPrice: "free during beta", free: true });
    expect(await beta.pay({ idempotencyKey: "g", payWith: { kind: "purchase", sku: GIFT_SKU } })).toMatchObject({ status: "paid" });
    expect((await beta.balance()).credits).toBe(0);
  });
});

describe("the sent line (GIFT-16)", () => {
  it("reads as designed, for now, a chosen day, and a group", () => {
    expect(sentLine({ opens: { kind: "now" } }, "Maya", false)).toBe("It’s under Maya’s tree now, shaking until they open it.");
    expect(sentLine({ opens: { kind: "on", day: "2026-11-12" } }, "Maya", false)).toBe("It’ll sit under Maya’s tree, wrapped, until Thursday, Nov 12.");
    expect(sentLine({ opens: { kind: "now" } }, "Hoops", true)).toBe("It’s under every tree in Hoops now, shaking until they open it.");
    expect(sentLine({ opens: { kind: "on", day: "2026-11-12" } }, "Hoops", true)).toBe("It’ll sit under every tree in Hoops, wrapped, until Thursday, Nov 12.");
  });
});
