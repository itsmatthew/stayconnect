"use client";

import { useEffect, useState } from "react";
import type { PhotoStore } from "../daily5/photo-store";

/** Object URLs for memory photos from the Daily 5 store, revoked when the thread or profile closes. */
export function usePhotoUrls(store: PhotoStore | null, ids: readonly string[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = ids.join(",");
  useEffect(() => {
    if (!store || !key) return;
    let live = true;
    const made: string[] = [];
    Promise.all(
      key.split(",").map(async (id) => {
        const blob = await store.image(id);
        if (!blob) return [id, undefined] as const;
        const url = URL.createObjectURL(blob);
        made.push(url);
        return [id, url] as const;
      }),
    ).then((pairs) => {
      if (live) setUrls(Object.fromEntries(pairs.filter((pair): pair is readonly [string, string] => !!pair[1])));
    });
    return () => {
      live = false;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [store, key]);
  return urls;
}
