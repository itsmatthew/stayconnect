import { parseGroupNames, type GroupNameStore } from "./group-names";

/** Demo data saves under its own key, so it never mixes with real names (docs/specs/demo.md, DEMO-3). */
export const groupNamesKey = (suffix: string) => `nowandthen.groupNames.v1${suffix}`;

/** TODO(server: group rename needs an API route): a fake, so a rename only reaches this browser. */
export function localGroupNameStore(suffix: string): GroupNameStore {
  const key = groupNamesKey(suffix);
  return {
    async load() {
      try {
        return parseGroupNames(JSON.parse(localStorage.getItem(key) ?? "null"));
      } catch {
        return {};
      }
    },
    // Rejects when storage is blocked or full, so the app never claims a rename that wasn't kept (RENAME-4).
    async save(names) {
      localStorage.setItem(key, JSON.stringify(names));
    },
  };
}
