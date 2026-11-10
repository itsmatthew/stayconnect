"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { inboxReducer, type InboxAction, type InboxState, type InboxStore } from "./inbox";

/** The mailbox: the saved one, or `seed` the first time. Each change is saved (docs/specs/mailbox.md). */
export function useInbox(store: InboxStore, seed: () => InboxState): [InboxState, (action: InboxAction) => void] {
  const [state, setState] = useState<InboxState>(seed);
  const current = useRef(state);
  const [saved] = useState(store);
  useEffect(() => {
    let live = true;
    void saved.load().then((v) => {
      if (!live || !v) return;
      current.current = v;
      setState(v);
    });
    return () => {
      live = false;
    };
  }, [saved]);
  const dispatch = useCallback(
    (action: InboxAction) => {
      const next = inboxReducer(current.current, action);
      if (next === current.current) return;
      current.current = next;
      setState(next);
      void saved.save(next);
    },
    [saved],
  );
  return [state, dispatch];
}
