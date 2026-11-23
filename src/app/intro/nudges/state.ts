// Everything nudges keep: your settings and what has already shown (docs/specs/nudges.md, NUDGE-7, NUDGE-17). Plain TypeScript.

import { isMood, type Mood } from "./check-in";
import { emptyLog, type NudgeLog } from "./schedule";
import { defaultSettings, settingsReducer, validSettings, type NudgeSettings, type SettingsAction } from "./settings";

export type NudgeState = { settings: NudgeSettings; log: NudgeLog };
export const emptyNudges: NudgeState = { settings: defaultSettings, log: emptyLog };

export type NudgeAction =
  | SettingsAction
  /** Reach-out slots now shown, so none of them shows again. */
  | { type: "shown"; slots: readonly string[] }
  /** This week's check-in: your answer, kept only here, or skipped. */
  | { type: "checkIn"; week: string; answer: Mood | "skipped" };

export function nudgeReducer(s: NudgeState, a: NudgeAction): NudgeState {
  switch (a.type) {
    case "shown":
      return { ...s, log: { ...s.log, reachOut: [...new Set([...s.log.reachOut, ...a.slots])] } };
    case "checkIn":
      return { ...s, log: { ...s.log, checkIns: { ...s.log.checkIns, [a.week]: a.answer } } };
    default:
      return { ...s, settings: settingsReducer(s.settings, a) };
  }
}

/** What was saved, or the defaults where it can't be read. */
export function readNudges(x: unknown): NudgeState {
  if (!x || typeof x !== "object") return emptyNudges;
  const { settings, log } = x as { settings?: unknown; log?: { reachOut?: unknown; checkIns?: unknown } };
  const reachOut = Array.isArray(log?.reachOut) ? log.reachOut.filter((v): v is string => typeof v === "string") : [];
  const checkIns =
    log?.checkIns && typeof log.checkIns === "object"
      ? Object.fromEntries(Object.entries(log.checkIns as Record<string, unknown>).filter(([, v]) => v === "skipped" || isMood(v)) as [string, Mood | "skipped"][])
      : {};
  return { settings: validSettings(settings) ? settings : defaultSettings, log: { reachOut, checkIns } };
}

export type NudgeStore = { load(): Promise<NudgeState>; save(s: NudgeState): Promise<void> };
