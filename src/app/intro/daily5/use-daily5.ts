"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { localDateKey, needsNewPick, pickDaily, type PoolId } from "./daily-pick";
import { importPhotos, type ImportProgress } from "./import-photos";
import type { PhotoStore, StoredPhoto } from "./photo-store";

export type DailyPhoto = { id: string; takenAt: number; fileDated?: true; src: string };
type PoolState = { count: number; progress?: ImportProgress; skipped: number };

export type Daily5State = {
  loading: boolean;
  dateKey: string;
  photos: DailyPhoto[];
  pools: Record<PoolId, PoolState>;
};

/**
 * Wires the pure Daily 5 rules to the photo store (docs/specs/daily5.md, D5-2/6–8):
 * re-shows the day's saved set or picks a new one, imports into pools, and turns stored images into URLs.
 */
export function useDaily5(store: PhotoStore | null, now: () => number, hasFace: (image: Blob) => Promise<boolean>) {
  const [state, setState] = useState<Daily5State>(() => ({
    loading: true,
    dateKey: localDateKey(new Date(now())),
    photos: [],
    pools: { mine: { count: 0, skipped: 0 }, family: { count: 0, skipped: 0 } },
  }));
  const urls = useRef<string[]>([]);
  const dayIds = useRef<string[] | undefined>(undefined);

  const refresh = useCallback(async () => {
    if (!store) return;
    const today = new Date(now());
    const dateKey = localDateKey(today);
    const all = await store.list();
    const byId = new Map(all.map((p) => [p.id, p]));

    let ids = await store.getDay(dateKey);
    if (needsNewPick(ids)) {
      const cachedHasFace = async (p: { id: string }) => {
        const known = byId.get(p.id)?.hasFace;
        if (known !== undefined) return known;
        const image = await store.image(p.id);
        const found = image ? await hasFace(image).catch(() => false) : false;
        await store.setHasFace(p.id, found);
        return found;
      };
      const picked = await pickDaily({ photos: all, today, hasFace: cachedHasFace });
      ids = picked.map((p) => p.id);
      if (ids.length) await store.setDay(dateKey, ids);
    }
    dayIds.current = ids;

    const chosen = (ids ?? []).map((id) => byId.get(id)).filter((p): p is StoredPhoto => !!p);
    const photos = await Promise.all(
      chosen.map(async (p) => {
        const image = await store.image(p.id);
        return { id: p.id, takenAt: p.takenAt, ...(p.fileDated ? { fileDated: p.fileDated } : {}), src: image ? URL.createObjectURL(image) : "" };
      }),
    );
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = photos.map((p) => p.src).filter(Boolean);

    const counts = await store.counts();
    setState((s) => ({
      loading: false,
      dateKey,
      photos,
      pools: {
        mine: { ...s.pools.mine, count: counts.mine },
        family: { ...s.pools.family, count: counts.family },
      },
    }));
  }, [store, now, hasFace]);

  useEffect(() => {
    // Loading from IndexedDB is the external system this effect syncs with.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  // A new local date brings a new set: check whenever the tab comes back into view.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && localDateKey(new Date(now())) !== state.dateKey) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [now, refresh, state.dateKey]);

  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const addFiles = useCallback(
    async (pool: PoolId, files: File[]) => {
      if (!store) return;
      const setPool = (patch: Partial<PoolState>) =>
        setState((s) => ({ ...s, pools: { ...s.pools, [pool]: { ...s.pools[pool], ...patch } } }));
      const result = await importPhotos(files, pool, store, { onProgress: (progress) => setPool({ progress }) });
      setPool({ progress: undefined, skipped: result.skipped, count: (await store.counts())[pool] });
      // The day's set is fixed once full; until then, new photos can fill it.
      if (needsNewPick(dayIds.current)) await refresh();
    },
    [store, refresh],
  );

  return { state, addFiles };
}
