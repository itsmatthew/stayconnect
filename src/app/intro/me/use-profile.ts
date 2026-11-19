"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { emptyProfile, profileReducer, type Profile, type ProfileAction, type ProfileStore } from "./profile";

/** Your profile's text (ME-6 to ME-8): loaded once, each change saved. A change made before the load finishes is kept. */
export function useProfile(store: ProfileStore): [Profile, (a: ProfileAction) => void] {
  const [saved] = useState(store);
  const [profile, setProfile] = useState(emptyProfile);
  const latest = useRef(profile);
  const early = useRef<ProfileAction[]>([]);
  const loaded = useRef(false);
  useEffect(() => {
    let live = true;
    void saved.load().then((p) => {
      if (!live) return;
      loaded.current = true;
      const next = early.current.reduce(profileReducer, p);
      latest.current = next;
      setProfile(next);
      if (early.current.length) void saved.save(next);
    });
    return () => {
      live = false;
    };
  }, [saved]);
  const dispatch = useCallback(
    (a: ProfileAction) => {
      if (!loaded.current) early.current.push(a);
      const next = profileReducer(latest.current, a);
      latest.current = next;
      setProfile(next);
      if (loaded.current) void saved.save(next);
    },
    [saved],
  );
  return [profile, dispatch];
}
