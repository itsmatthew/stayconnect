"use client";

import { useEffect, useState } from "react";

/** A saved setting: shows `initial` until loaded, and the setter saves each change. */
export function useSavedSetting<T>(setting: { load(): Promise<T>; save(v: T): Promise<void> }, initial: T): [T, (v: T) => void] {
  const [store] = useState(setting);
  const [value, setValue] = useState(initial);
  useEffect(() => {
    let live = true;
    void store.load().then((v) => live && setValue(v));
    return () => {
      live = false;
    };
  }, [store]);
  return [
    value,
    (next) => {
      setValue(next);
      void store.save(next);
    },
  ];
}
