"use client";

import { useEffect, useReducer, useRef } from "react";
import { goalsReducer, type GoalAction, type GoalState } from "./goals";

// TODO(re-evaluate when groups come from the database): localStorage stands in for the server, so "any member" is this browser (GP-11).
/** Demo data saves under its own key, so it never mixes with real goals (docs/specs/demo.md, DEMO-3). */
export const goalsStorageKey = (suffix: string) => `nowandthen.goals.v1${suffix}`;

function load(key: string): GoalState | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as GoalState) : null;
  } catch {
    return null;
  }
}

/** Next-time-together goals, kept in localStorage. Starts from the seed, then loads what's saved (as `useCircle` does). */
export function useGoals(seed: GoalState, storageSuffix: string): [GoalState, (a: GoalAction) => void] {
  const key = goalsStorageKey(storageSuffix);
  const [state, dispatch] = useReducer(goalsReducer, seed);
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
