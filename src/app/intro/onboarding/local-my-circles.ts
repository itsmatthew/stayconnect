import { validCircles, type MyCircleStore } from "./my-circles";

/** Demo data keeps its own circles (docs/specs/demo.md, DEMO-3). */
export const myCirclesKey = (suffix: string) => `nowandthen.circles.v1${suffix}`;

/** TODO(server): a fake, kept in this browser. */
export function localMyCircles(suffix: string): MyCircleStore {
  const key = myCirclesKey(suffix);
  return {
    load: async () => {
      try {
        return validCircles(JSON.parse(localStorage.getItem(key) ?? "[]"));
      } catch {
        return [];
      }
    },
    save: async (circles) => {
      try {
        localStorage.setItem(key, JSON.stringify(circles));
      } catch {
        // Blocked: the circle still shows until the app closes.
      }
    },
  };
}
