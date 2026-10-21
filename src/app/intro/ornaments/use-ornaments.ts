"use client";

import { useEffect, useRef, useState } from "react";
import type { OrnamentStore } from "./ornament-store";
import { ornamentReducer, unreachableImages, type OrnamentAction, type OrnamentState } from "./ornaments";

export type OrnamentEdit = { image?: Blob; caption: string };

type Ornaments = {
  state: OrnamentState;
  /** Object URLs for the photos the state can show, by photo id. */
  urls: Record<string, string>;
  change(groupId: string, index: number, edit: OrnamentEdit, by: string, at: number): Promise<void>;
  undo(groupId: string, index: number): Promise<void>;
};

/**
 * Ornament changes (docs/specs/home.md, HOME-15/17): loaded from the store, saved after every change, with unreachable
 * images deleted. Opens the store itself, and every change waits until it's open and loaded, so an early tap is neither
 * lost nor overwritten by the load.
 */
export function useOrnaments(open: () => Promise<OrnamentStore>): Ornaments {
  const [state, setState] = useState<OrnamentState>({});
  const [store, setStore] = useState<OrnamentStore | null>(null);
  const latest = useRef(state);
  const ready = useRef<Promise<OrnamentStore> | null>(null);

  useEffect(() => {
    let live = true;
    const opened = open().then(async (s) => {
      const saved = await s.load();
      if (live) {
        latest.current = saved;
        setState(saved);
        setStore(s);
      }
      return s;
    });
    ready.current = opened;
    return () => {
      live = false;
      ready.current = null;
      opened.then((s) => s.close());
    };
  }, [open]);

  const apply = async (s: OrnamentStore, action: OrnamentAction) => {
    const before = latest.current;
    const after = ornamentReducer(before, action);
    if (after === before) return;
    latest.current = after;
    setState(after);
    await s.save(after);
    await Promise.all(unreachableImages(before, after).map((id) => s.deleteImage(id)));
  };

  return {
    state,
    urls: usePhotoUrls(store, state),
    async change(groupId, index, { image, caption }, by, at) {
      const s = await ready.current;
      if (!s) return;
      const photoId = image ? await s.putImage(image) : undefined;
      await apply(s, { type: "change", groupId, index, photoId, caption, by, at });
    },
    async undo(groupId, index) {
      const s = await ready.current;
      if (s) await apply(s, { type: "undo", groupId, index });
    },
  };
}

/** Object URLs for the current photos, revoked when they're no longer shown or on unmount. */
function usePhotoUrls(store: OrnamentStore | null, state: OrnamentState): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const made = useRef(new Map<string, string>());
  const key = Object.values(state)
    .flatMap((e) => (e.current.photoId ? [e.current.photoId] : []))
    .sort()
    .join(",");

  useEffect(() => {
    if (!store) return;
    let live = true;
    const ids = key ? key.split(",") : [];
    for (const [id, url] of made.current) {
      if (!ids.includes(id)) {
        URL.revokeObjectURL(url);
        made.current.delete(id);
      }
    }
    Promise.all(
      ids.map(async (id) => {
        if (made.current.has(id)) return;
        const blob = await store.image(id);
        if (blob && live) made.current.set(id, URL.createObjectURL(blob));
      }),
    ).then(() => {
      if (live) setUrls(Object.fromEntries(made.current));
    });
    return () => {
      live = false;
    };
  }, [store, key]);

  useEffect(() => {
    const all = made.current;
    return () => {
      all.forEach((u) => URL.revokeObjectURL(u));
      all.clear();
    };
  }, []);

  return urls;
}
