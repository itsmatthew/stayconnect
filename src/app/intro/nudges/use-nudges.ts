"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { emptyNudges, nudgeReducer, type NudgeAction, type NudgeState, type NudgeStore } from "./state";

/** Nudges' settings and log: loaded once, each change saved; a change made before the load finishes is kept. */
export function useNudges(store: NudgeStore): { state: NudgeState; loaded: boolean; dispatch: (a: NudgeAction) => void } {
  const [saved] = useState(store);
  const [state, setState] = useState(emptyNudges);
  const [loaded, setLoaded] = useState(false);
  const latest = useRef(state);
  const early = useRef<NudgeAction[]>([]);
  const ready = useRef(false);
  useEffect(() => {
    let live = true;
    void saved.load().then((s) => {
      if (!live) return;
      ready.current = true;
      const next = early.current.reduce(nudgeReducer, s);
      latest.current = next;
      setState(next);
      setLoaded(true);
      if (early.current.length) void saved.save(next);
    });
    return () => {
      live = false;
    };
  }, [saved]);
  const dispatch = useCallback(
    (a: NudgeAction) => {
      if (!ready.current) early.current.push(a);
      const next = nudgeReducer(latest.current, a);
      latest.current = next;
      setState(next);
      if (ready.current) void saved.save(next);
    },
    [saved],
  );
  return { state, loaded, dispatch };
}
