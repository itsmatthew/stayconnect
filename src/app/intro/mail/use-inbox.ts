"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { inboxReducer, withInboxDefaults, type InboxAction, type InboxState, type InboxStore } from "./inbox";

/**
 * The mailbox: the saved one, or `seed` the first time. Each change is saved (docs/specs/mailbox.md). `loaded` turns true
 * once the saved mailbox has been read (or there was none), so mail that arrives once (ONB-1) isn't sent twice.
 */
export function useInbox(store: InboxStore, seed: () => InboxState): [InboxState, (action: InboxAction) => void, boolean] {
  const [state, setState] = useState<InboxState>(seed);
  const [loaded, setLoaded] = useState(false);
  const current = useRef(state);
  const [saved] = useState(store);
  useEffect(() => {
    let live = true;
    void saved.load().then((v) => {
      if (!live) return;
      if (v) {
        const read = withInboxDefaults(v);
        current.current = read;
        setState(read);
      }
      setLoaded(true);
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
  return [state, dispatch, loaded];
}
