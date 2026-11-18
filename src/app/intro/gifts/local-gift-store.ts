import type { Gift } from "./gift";
import { parseGifts, type GiftStore } from "./gift-store";

/** Demo data saves under its own key, so it never mixes with real gifts (docs/specs/demo.md, DEMO-3). */
export const giftsKey = (suffix: string) => `nowandthen.gifts.v1${suffix}`;

/** TODO(server): a fake, so gifts stay in this browser. */
export function localGiftStore(suffix: string): GiftStore {
  const key = giftsKey(suffix);
  const read = (): Gift[] => {
    try {
      return parseGifts(JSON.parse(localStorage.getItem(key) ?? "null"));
    } catch {
      return [];
    }
  };
  return {
    load: async () => read(),
    async save(gift) {
      const gifts = read();
      const at = gifts.findIndex((g) => g.id === gift.id);
      localStorage.setItem(key, JSON.stringify(at === -1 ? [...gifts, gift] : gifts.map((g, i) => (i === at ? gift : g))));
    },
  };
}
