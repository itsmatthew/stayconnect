import { emptyNudges, readNudges, type NudgeStore } from "./state";

export const nudgesKey = (suffix: string) => `nowandthen.nudges.v1${suffix}`;

/** TODO(server): settings and what has shown, kept in this browser. Check-in answers stay here even once there's a server. */
export function localNudges(suffix: string): NudgeStore {
  const key = nudgesKey(suffix);
  return {
    load: async () => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? readNudges(JSON.parse(raw)) : emptyNudges;
      } catch {
        return emptyNudges;
      }
    },
    save: async (s) => {
      try {
        localStorage.setItem(key, JSON.stringify(s));
      } catch {
        // Blocked: the change still holds until the app closes.
      }
    },
  };
}
