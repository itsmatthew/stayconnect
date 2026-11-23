// Nudges & check-ins settings (docs/specs/nudges.md, NUDGE-2 to NUDGE-5, NUDGE-7). Plain TypeScript.

import type { Ring } from "@/components/circle/types";

export type PerWeek = 0 | 1 | 2;
/** `people`: your check-in people, by friend id. */
export type NudgeSettings = { people: string[]; sunday: boolean; perWeek: PerWeek; quiet: boolean };

export const defaultSettings: NudgeSettings = { people: [], sunday: true, perWeek: 1, quiet: true };

export type SettingsAction =
  | { type: "person"; id: string }
  | { type: "sunday"; on: boolean }
  | { type: "perWeek"; n: PerWeek }
  | { type: "quiet"; on: boolean }
  | { type: "load"; settings: NudgeSettings };

export function settingsReducer(s: NudgeSettings, a: SettingsAction): NudgeSettings {
  switch (a.type) {
    case "person":
      return { ...s, people: s.people.includes(a.id) ? s.people.filter((p) => p !== a.id) : [...s.people, a.id] };
    case "sunday":
      return { ...s, sunday: a.on };
    case "perWeek":
      return { ...s, perWeek: a.n };
    case "quiet":
      return { ...s, quiet: a.on };
    case "load":
      return a.settings;
  }
}

export function pickNote(n: number): string {
  if (n === 0) return "Nobody picked yet. Two to four works best.";
  return `${n} ${n === 1 ? "person" : "people"} picked. Two to four works best.`;
}

export const FREQ_NOTES: Readonly<Record<PerWeek, string>> = {
  0: "No nudges to reach out. Your Sunday check-in still comes.",
  1: "One person a week who you haven’t caught up with, at a random time. A nudge never means anything about anyone.",
  2: "Two a week, at random times. A nudge never means anything about anyone.",
};

const RING_ORDER: readonly Ring[] = ["nest", "branches", "bloom"];

/** Faces for picking: nest, branches, bloom, then everyone not placed, each group in the order given. */
export function orderPeople<F extends { id: string }>(friends: readonly F[], placements: Readonly<Record<string, Ring | undefined>>): F[] {
  const rank = (f: F) => {
    const r = placements[f.id];
    return r ? RING_ORDER.indexOf(r) : RING_ORDER.length;
  };
  return friends.map((f, i) => ({ f, i })).sort((a, b) => rank(a.f) - rank(b.f) || a.i - b.i).map((x) => x.f);
}

export function validSettings(x: unknown): x is NudgeSettings {
  if (!x || typeof x !== "object") return false;
  const s = x as Record<string, unknown>;
  return (
    Array.isArray(s.people) &&
    s.people.every((p) => typeof p === "string") &&
    typeof s.sunday === "boolean" &&
    (s.perWeek === 0 || s.perWeek === 1 || s.perWeek === 2) &&
    typeof s.quiet === "boolean"
  );
}
