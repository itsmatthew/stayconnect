"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dayKey } from "./gift";
import { openGift, receiveGift, type ReceivedGift, type ReceivedGiftStore } from "./received";

/** Gifts you've received: the saved list, or `seed` the first time. Opening and arriving are saved (docs/specs/gifts.md). */
export function useReceived(store: ReceivedGiftStore, seed: () => ReceivedGift[], now: () => number) {
  const [list, setList] = useState<ReceivedGift[]>(seed);
  const current = useRef(list);
  const [saved] = useState(store);
  /** The saved list has been read (or there was none), so the list is the real one. */
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let live = true;
    void saved.load().then((v) => {
      if (!live) return;
      if (v) {
        current.current = v;
        setList(v);
      }
      setLoaded(true);
    });
    return () => {
      live = false;
    };
  }, [saved]);
  const change = useCallback(
    (next: ReceivedGift[]) => {
      current.current = next;
      setList(next);
      void saved.save(next);
    },
    [saved],
  );
  return {
    list,
    loaded,
    open: (id: string) => change(openGift(current.current, id, now(), dayKey(now()))),
    receive: (g: ReceivedGift) => change(receiveGift(current.current, g)),
  };
}
