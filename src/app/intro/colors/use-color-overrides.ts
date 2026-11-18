"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearOverride, setOverride, type ColorOverrideStore, type ColorOverrides } from "./color-overrides";

/** The viewer's overrides, and a setter (`null` clears). Starts empty, then loads what's saved. */
export function useColorOverrides(initialStore: ColorOverrideStore): [ColorOverrides, (groupId: string, colorId: string | null) => void] {
  const [store] = useState(initialStore);
  const [overrides, setOverrides] = useState<ColorOverrides>({});
  const latest = useRef<ColorOverrides>({});
  const changed = useRef(false);

  useEffect(() => {
    let live = true;
    store.load().then((saved) => {
      if (!live || changed.current) return;
      latest.current = saved;
      setOverrides(saved);
    });
    return () => {
      live = false;
    };
  }, [store]);

  const change = useCallback(
    (groupId: string, colorId: string | null) => {
      changed.current = true;
      latest.current = colorId ? setOverride(latest.current, groupId, colorId) : clearOverride(latest.current, groupId);
      setOverrides(latest.current);
      void store.save(latest.current);
    },
    [store],
  );

  return [overrides, change];
}
