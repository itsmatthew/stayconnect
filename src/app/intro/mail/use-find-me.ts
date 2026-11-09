"use client";

import { useEffect, useState } from "react";
import type { FindMeSetting } from "./find-me";

/** The setting, on until loaded otherwise, and a setter that saves it (MAIL-7). */
export function useFindMe(setting: FindMeSetting): [boolean, (on: boolean) => void] {
  const [store] = useState(setting);
  const [on, setOn] = useState(true);
  useEffect(() => {
    let live = true;
    void store.load().then((v) => live && setOn(v));
    return () => {
      live = false;
    };
  }, [store]);
  return [
    on,
    (next) => {
      setOn(next);
      void store.save(next);
    },
  ];
}
