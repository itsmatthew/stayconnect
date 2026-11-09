// What's recorded for analysis (docs/specs/gifts.md, GIFT-11). Our own data only. Never shown to anyone in the app. Plain TypeScript.
import type { GiftStep } from "./gift";

export type GiftEvent =
  | { type: "made"; giftId: string; at: number }
  | { type: "abandoned"; giftId: string; step: GiftStep; at: number }
  | { type: "sent"; giftId: string; at: number; recipient: "person" | "group"; copies: number };

/** TODO(server): only the fake in `local-gift-events.ts` exists, so nothing reaches anyone for analysis yet. */
export interface GiftEvents {
  record(event: GiftEvent): Promise<void>;
}
