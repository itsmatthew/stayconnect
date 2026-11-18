"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MyCircle, MyCircleStore } from "./my-circles";

/** Circles you started, loaded once and saved on each add (ONB-13). `loaded` is false until the saved ones are read. */
export function useMyCircles(store: MyCircleStore): { circles: MyCircle[]; loaded: boolean; add: (c: MyCircle) => void } {
  const [saved] = useState(store);
  const [circles, setCircles] = useState<MyCircle[]>([]);
  const [loaded, setLoaded] = useState(false);
  const current = useRef(circles);
  useEffect(() => {
    let live = true;
    void saved.load().then((v) => {
      if (!live) return;
      // Anything added before the load finished stays.
      const merged = [...v.filter((c) => !current.current.some((x) => x.id === c.id)), ...current.current];
      current.current = merged;
      setCircles(merged);
      setLoaded(true);
    });
    return () => {
      live = false;
    };
  }, [saved]);
  const add = useCallback(
    (c: MyCircle) => {
      const next = [...current.current, c];
      current.current = next;
      setCircles(next);
      void saved.save(next);
    },
    [saved],
  );
  return { circles, loaded, add };
}
