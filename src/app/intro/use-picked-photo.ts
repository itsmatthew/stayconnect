"use client";

import { useEffect, useRef, useState } from "react";

export type PickedPhoto = { image: Blob; url: string };

/**
 * A photo picked in a sheet, decoded and not yet saved (the ornament and logo sheets). Its preview URL is revoked when it's
 * dropped, and a pick that finishes decoding after `drop` is ignored.
 */
export function usePickedPhoto(decode: (f: File) => Promise<Blob>) {
  const [pending, setPending] = useState<PickedPhoto | null>(null);
  const pick = useRef(0);
  useEffect(() => () => {
    if (pending) URL.revokeObjectURL(pending.url);
  }, [pending]);
  const drop = () => {
    pick.current++;
    setPending(null);
  };
  const choose = async (file: File) => {
    const mine = ++pick.current;
    const image = await decode(file);
    if (mine === pick.current) setPending({ image, url: URL.createObjectURL(image) });
  };
  return { pending, choose, drop };
}
