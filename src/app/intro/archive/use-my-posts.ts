"use client";

import { useCallback, useEffect, useState } from "react";
import type { PhotoView } from "@/components/archive/types";
import type { ArchiveStore, NewPost } from "./archive-store";
import type { ArchivePost } from "./posts";

/**
 * Your own Archive posts: the demo's (if any) plus the ones in this browser's Archive store,
 * with object URLs for the stored images, revoked when the tab closes.
 */
export function useMyPosts(store: ArchiveStore | null, seeded: readonly ArchivePost[]) {
  const [stored, setStored] = useState<ArchivePost[]>([]);

  useEffect(() => {
    if (!store) return;
    let live = true;
    store.posts().then((p) => live && setStored(p));
    return () => {
      live = false;
    };
  }, [store]);

  const urls = useImageUrls(store, stored);
  const add = useCallback(
    async (post: NewPost) => {
      if (!store) throw new Error("The Archive store isn't open yet");
      const p = await store.add(post);
      setStored((s) => [...s, p]);
      return p;
    },
    [store],
  );

  return { mine: [...seeded, ...stored], urls, add };
}

function useImageUrls(store: ArchiveStore | null, posts: readonly ArchivePost[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = posts.flatMap((p) => (p.photo.kind === "stored" ? [p.photo.photoId] : [])).join(",");
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

/** A post's photo for the views. */
export function photoView(post: ArchivePost, urls: Record<string, string>, alt: string): PhotoView {
  return post.photo.kind === "art" ? { kind: "art", art: post.photo.art, alt } : { kind: "image", src: urls[post.photo.photoId], alt };
}
