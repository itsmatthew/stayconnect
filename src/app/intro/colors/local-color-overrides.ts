import { parseOverrides, type ColorOverrideStore } from "./color-overrides";

/** Demo data saves under its own key, so it never mixes with real overrides (docs/specs/demo.md, DEMO-3). */
export const colorOverridesKey = (suffix: string) => `nowandthen.groupColors.v1${suffix}`;

/** The web's override storage (COLOR-8). Missing, corrupt or blocked storage means no overrides, never an error. */
export function localColorOverrideStore(suffix: string): ColorOverrideStore {
  const key = colorOverridesKey(suffix);
  return {
    async load() {
      try {
        return parseOverrides(JSON.parse(localStorage.getItem(key) ?? "null"));
      } catch {
        return {};
      }
    },
    async save(overrides) {
      try {
        localStorage.setItem(key, JSON.stringify(overrides));
      } catch {
        // Blocked or full: the change still shows until the app closes.
      }
    },
  };
}
