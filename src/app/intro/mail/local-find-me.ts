import type { FindMeSetting } from "./find-me";

export const findMeKey = (suffix: string) => `nowandthen.findMe.v1${suffix}`;

/** TODO(server): a fake, kept in this browser. */
export function localFindMe(suffix: string): FindMeSetting {
  const key = findMeKey(suffix);
  return {
    load: async () => {
      try {
        return localStorage.getItem(key) !== "false";
      } catch {
        return true;
      }
    },
    save: async (on) => {
      try {
        localStorage.setItem(key, String(on));
      } catch {
        // Blocked: the switch still shows the choice until the app closes.
      }
    },
  };
}
