// Getting a gift to everyone it's for (docs/specs/gifts.md, GIFT-15). Plain TypeScript.
import type { Gift, GiftCopy } from "./gift";

/** TODO(server): only the fake in `local-gift-delivery.ts` exists, so a gift stays on this device. Throws when it fails. */
export interface GiftDelivery {
  deliver(gift: Gift, copies: readonly GiftCopy[]): Promise<void>;
}
