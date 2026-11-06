"use client";

import { useCallback, useRef, useState } from "react";
import { giftReducer, newGift, newestDraft, type Gift, type GiftAction } from "./gift";
import type { GiftEvents } from "./gift-events";
import type { GiftStore } from "./gift-store";

type GiftDraftOptions = { store: GiftStore; events: GiftEvents; now: () => number; makeId: () => string; from: string };

/** The gift in the maker. It's saved from the first pick of a person, after every change (GIFT-9). */
export function useGiftDraft(options: GiftDraftOptions) {
  const [{ store, events, now, makeId, from }] = useState(options);
  const [gift, setGift] = useState<Gift | null>(null);
  const current = useRef<Gift | null>(null);
  const made = useRef(false);

  const show = useCallback((next: Gift | null) => {
    current.current = next;
    setGift(next);
  }, []);

  const open = useCallback(async () => {
    const draft = newestDraft(await store.load());
    made.current = !!draft;
    show(draft ?? newGift({ id: makeId(), from, now: now() }));
  }, [store, makeId, from, now, show]);

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

  const close = useCallback(() => {
    const g = current.current;
    if (g?.to) void events.record({ type: "abandoned", giftId: g.id, step: g.step, at: now() });
    show(null);
  }, [events, now, show]);

  return { gift, open, dispatch, close };
}
