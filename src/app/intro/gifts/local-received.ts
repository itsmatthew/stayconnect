import type { ReceivedGift, ReceivedGiftStore } from "./received";

/** Demo data keeps its own gifts (docs/specs/demo.md, DEMO-3). */
export const receivedKey = (suffix: string) => `nowandthen.received.v1${suffix}`;

/** TODO(server): a fake, kept in this browser. Opening is never sent anywhere. */
export function localReceived(suffix: string): ReceivedGiftStore {
  const key = receivedKey(suffix);
  return {
    load: async () => {
      try {
        const raw = localStorage.getItem(key);
        const v: unknown = raw && JSON.parse(raw);
        return Array.isArray(v) ? (v as ReceivedGift[]) : undefined;
      } catch {
        return undefined;
      }
    },
    save: async (list) => {
      try {
        localStorage.setItem(key, JSON.stringify(list));
      } catch {
        // Blocked: gifts still open until the app closes.
      }
    },
  };
}
