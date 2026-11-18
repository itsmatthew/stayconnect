import type { GiftEvents } from "./gift-events";

/** Demo data saves under its own key (docs/specs/demo.md, DEMO-3). */
export const giftEventsKey = (suffix: string) => `nowandthen.giftEvents.v1${suffix}`;

/** TODO(server): a fake, so events stay in this browser. Recording never gets in the way of making a gift. */
export function localGiftEvents(suffix: string): GiftEvents {
  const key = giftEventsKey(suffix);
  return {
    async record(event) {
      try {
        const events: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
        localStorage.setItem(key, JSON.stringify([...(Array.isArray(events) ? events : []), event]));
      } catch {
        // Blocked, full or corrupt: analysis loses one event, and nothing else notices.
      }
    },
  };
}
