"use client";

import { useEffect, useReducer, useRef } from "react";
import { circleReducer, initialCircleState, type CircleAction, type CircleState, type Placements } from "./rings";

// TODO(re-evaluate when circles come from the database): localStorage stands in for the server (CIRCLE-10).
/** Demo data saves under its own key, so it never mixes with real placements (docs/specs/demo.md, DEMO-3). */
export const circleStorageKey = (suffix: string) => `nowandthen.circle.v1${suffix}`;

function load(key: string): CircleState | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CircleState) : null;
  } catch {
    return null;
  }
}

/** Ring placements and dismissed suggestions, kept in localStorage. Starts from the seed, then loads what's saved (as `useChat` does). */
export function useCircle(seed: Placements, storageSuffix: string): [CircleState, (a: CircleAction) => void] {
  const key = circleStorageKey(storageSuffix);
  const [state, dispatch] = useReducer(circleReducer, seed, initialCircleState);
  const mounted = useRef(false);

  useEffect(() => {
    const saved = load(key);
    if (saved) dispatch({ type: "load", state: saved });
  }, [key]);

  useEffect(() => {
    // Skip the first run: that's the seed, before the saved state has loaded.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, dispatch];
}
