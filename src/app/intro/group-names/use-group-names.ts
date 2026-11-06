"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GroupNameStore, GroupNames } from "./group-names";

/** Saved names, and a rename that applies only once the save succeeds. It rejects if the save fails (RENAME-4). */
export function useGroupNames(initialStore: GroupNameStore): [GroupNames, (groupId: string, name: string) => Promise<void>] {
  const [store] = useState(initialStore);
  const [names, setNames] = useState<GroupNames>({});
  const latest = useRef<GroupNames>({});

  useEffect(() => {
    let live = true;
    store.load().then((saved) => {
      if (!live) return;
      latest.current = { ...saved, ...latest.current };
      setNames(latest.current);
    });
    return () => {
      live = false;
    };
  }, [store]);

  const rename = useCallback(
    async (groupId: string, name: string) => {
      const next = { ...latest.current, [groupId]: name };
      await store.save(next);
      latest.current = next;
      setNames(next);
    },
    [store],
  );

  return [names, rename];
}
