"use client";

import { useEffect, useState } from "react";
import type { PoolId } from "./daily-pick";
import { filesIn, type FolderAccess, type FolderHandle } from "./folders";

type PoolFolder = { folder?: FolderHandle; error?: string };

/**
 * Each pool's remembered folder (docs/specs/daily5.md, D5-14): choose one, check it again for new photos, or forget it.
 * Photos go in through `addFiles`, so a photo already in the pool is never added twice (D5-2). Undefined `access` means
 * the browser can't keep a folder, and the pools keep their plain folder picker.
 */
export function useFolders(access: FolderAccess | undefined, addFiles: (pool: PoolId, files: File[]) => Promise<void>) {
  const [byPool, setByPool] = useState<Partial<Record<PoolId, PoolFolder>>>({});
  const set = (pool: PoolId, f: PoolFolder) => setByPool((s) => ({ ...s, [pool]: f }));

  useEffect(() => {
    if (!access) return;
    let live = true;
    for (const pool of ["mine", "family"] as const) {
      access.load(pool).then((folder) => {
        if (live && folder) setByPool((s) => (s[pool] ? s : { ...s, [pool]: { folder } }));
      });
    }
    return () => {
      live = false;
    };
  }, [access]);

  const read = async (pool: PoolId, folder: FolderHandle) => {
    const files: File[] = [];
    for await (const f of filesIn(folder)) files.push(f);
    await addFiles(pool, files);
  };

  if (!access) return undefined;
  return {
    folders: byPool,
    choose: async (pool: PoolId) => {
      const folder = await access.pick();
      if (!folder) return;
      await access.save(pool, folder);
      set(pool, { folder });
      await read(pool, folder);
    },
    check: async (pool: PoolId) => {
      const folder = byPool[pool]?.folder;
      if (!folder) return;
      if (!(await access.allowed(folder))) return set(pool, { folder, error: `Allow access to ${folder.name} to check it for new photos.` });
      set(pool, { folder });
      await read(pool, folder);
    },
    forget: async (pool: PoolId) => {
      await access.forget(pool);
      set(pool, {});
    },
  };
}
