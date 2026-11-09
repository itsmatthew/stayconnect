"use client";

import { useCallback, useRef, useState } from "react";
import { giftReducer, newGift, newestDraft, type Gift, type GiftAction, type GiftPhoto } from "./gift";
import type { GiftDelivery } from "./gift-delivery";
import type { GiftEvents } from "./gift-events";
import { sendGift, settlePaying, type SendResult } from "./gift-flow";
import type { GiftStore } from "./gift-store";
import { betaPayment, type PaymentService } from "./payment";

type GiftDraftOptions = {
  store: GiftStore;
  events: GiftEvents;
  now: () => number;
  makeId: () => string;
  from: string;
  payment?: PaymentService;
  delivery?: GiftDelivery;
  membersOf?: (groupId: string) => readonly string[];
};

const nowhere: GiftDelivery = { deliver: async () => {} };

/** The gift in the maker. It's saved from the first pick of a person, after every change (GIFT-9), and sent safely (GIFT-15). */
export function useGiftDraft(options: GiftDraftOptions) {
  const [{ store, events, now, makeId, from, payment = betaPayment(), delivery = nowhere, membersOf = () => [] }] = useState(options);
  const [gift, setGift] = useState<Gift | null>(null);
  const current = useRef<Gift | null>(null);
  const made = useRef(false);

  const show = useCallback((next: Gift | null) => {
    current.current = next;
    setGift(next);
  }, []);

  const open = useCallback(async () => {
    const loaded = await store.load();
    // Settle anything the app closed on mid-payment before picking up (GIFT-15).
    const settled = await settlePaying(loaded, payment);
    await Promise.all(settled.filter((g, i) => g !== loaded[i]).map((g) => store.save(g).catch(() => {})));
    const draft = newestDraft(settled);
    made.current = !!draft;
    show(draft ?? newGift({ id: makeId(), from, now: now() }));
  }, [store, payment, makeId, from, now, show]);

  /** A new gift with this photo already picked (GIFT-17). Any saved gift stays saved. Nothing's saved until a person is picked. */
  const start = useCallback(
    (photo: { photo: GiftPhoto; takenAt: number; fileDated?: true }) => {
      made.current = false;
      show(giftReducer(newGift({ id: makeId(), from, now: now() }), { type: "photo", ...photo }));
    },
    [makeId, from, now, show],
  );

  const dispatch = useCallback(
    (action: GiftAction) => {
      if (!current.current) return;
      const next = giftReducer(current.current, action);
      show(next);
      if (!next.to) return;
      if (!made.current) {
        made.current = true;
        void events.record({ type: "made", giftId: next.id, at: now() });
      }
      // A failed save leaves the gift in memory, so the maker keeps working.
      store.save(next).catch(() => {});
    },
    [store, events, now, show],
  );

  const send = useCallback(async (): Promise<SendResult | undefined> => {
    if (!current.current) return undefined;
    const result = await sendGift(current.current, { store, payment, delivery, events, membersOf, now });
    if (current.current) show(result.gift);
    return result;
  }, [store, payment, delivery, events, membersOf, now, show]);

  const close = useCallback(() => {
    const g = current.current;
    if (g?.to && g.status !== "sent") void events.record({ type: "abandoned", giftId: g.id, step: g.step, at: now() });
    show(null);
  }, [events, now, show]);

  return { gift, open, start, dispatch, send, close };
}
