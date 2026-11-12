"use client";

import { useRef, type ReactNode } from "react";
import type { NavProps } from "@/components/home/main-nav";
import type { CircleGroup, Friend } from "@/components/home/types";
import type { Placements } from "../circle/rings";
import type { PhotoStore } from "../daily5/photo-store";
import { ME } from "../messages/conversations";
import type { MonthDay } from "../mail/birthdays";
import { dayKey, type Gift, type GiftPhoto } from "./gift";
import type { GiftDelivery } from "./gift-delivery";
import type { GiftEvents } from "./gift-events";
import { GiftMakerClient } from "./gift-maker-client";
import type { GiftStore } from "./gift-store";
import type { PaymentService } from "./payment";
import { copyOf, type ReceivedGift } from "./received";
import { useGiftDraft } from "./use-gift-draft";

/** Everything a gift needs, gathered once by AppClient for Me and Daily 5 (docs/specs/gifts.md). */
export type GiftDeps = {
  store: GiftStore;
  events: GiftEvents;
  photos: PhotoStore | null;
  placements: Placements;
  /** As this viewer sees them. */
  groups: readonly CircleGroup[];
  friends: readonly Friend[];
  senderName: string;
  payment: PaymentService;
  delivery: GiftDelivery;
  /** Keeps your own copy of a group gift you sent, for your shelf (GIFT-23). */
  keepOwn?: (g: ReceivedGift) => void;
  /** After Done on a group gift that opens now: show your shelf, with it landing (GIFT-23). */
  onLanded?: (id: string) => void;
  /** Friend id → birthday ("MM-DD"), for the badge on who it's for and "on a day" (GIFT-24). */
  birthdays?: Readonly<Record<string, MonthDay>>;
  /** Every gift sent, wherever from: the mailbox notes birthday gifts (MAILBOX-12). */
  onSentGift?: (g: Gift) => void;
};

/** Without gift services there's no way into the maker, so these are never used. */
export const noGiftDeps: GiftDeps = {
  store: { load: async () => [], save: async () => {} },
  events: { record: async () => {} },
  photos: null,
  placements: {},
  groups: [],
  friends: [],
  senderName: "",
  payment: { product: async (sku) => ({ sku, displayPrice: "", free: true }), balance: async () => ({ credits: 0 }), pay: async () => ({ status: "failed" }), find: async () => undefined },
  delivery: { deliver: async () => {} },
};

/** A photo to start from: Daily 5's "send as a gift" (GIFT-17). */
export type StartPhoto = { photo: GiftPhoto; takenAt: number; fileDated?: true };

/**
 * The gift maker for any screen: `open()` picks up the saved gift, `start(photo)` begins a new one with that photo, and
 * `maker` is the maker while one is open. `onSent` hears who it went to, after Done on the sent screen.
 */
export function useGiftMaker(deps: GiftDeps, { now, nav, onSent }: { now: () => number; nav: NavProps; onSent?: (name: string) => void }) {
  const draft = useGiftDraft({
    store: deps.store,
    events: deps.events,
    now,
    makeId: () => crypto.randomUUID(),
    from: ME,
    payment: deps.payment,
    delivery: deps.delivery,
    // Who's in a group when it's sent decides who gets a copy (GIFT-13).
    membersOf: (groupId) => deps.groups.find((g) => g.id === groupId)?.members ?? [],
  });
  const failNext = (deps.payment as { failNext?: () => void }).failNext;
  /** Your own copy that just landed on your shelf, until Done. */
  const landed = useRef<string | undefined>(undefined);
  const send = async () => {
    const result = await draft.send();
    const g = result?.gift;
    if (result?.kind === "sent" && g) deps.onSentGift?.(g);
    if (result?.kind === "sent" && result.own && g) {
      const group = g.to?.kind === "group" ? deps.groups.find((x) => x.id === g.to?.id) : undefined;
      // TODO(server): kept on this device only; the server should keep it for the sender's other devices, never deliver it wrapped.
      deps.keepOwn?.(copyOf(g, result.own, { id: ME, name: deps.senderName }, g.sentAt ?? now(), group?.name));
      landed.current = g.opens.kind === "now" || g.opens.day <= dayKey(now()) ? result.own.id : undefined;
    }
    return result;
  };
  const maker: ReactNode = draft.gift && (
    <GiftMakerClient
      gift={draft.gift}
      dispatch={draft.dispatch}
      onClose={draft.close}
      onSent={(name) => {
        onSent?.(name);
        const id = landed.current;
        landed.current = undefined;
        if (id) deps.onLanded?.(id);
      }}
      friends={deps.friends}
      groups={deps.groups}
      placements={deps.placements}
      photos={deps.photos}
      senderName={deps.senderName}
      birthdays={deps.birthdays}
      now={now}
      onSend={send}
      priceOf={(sku) => deps.payment.product(sku)}
      // Dev only (Next inlines NODE_ENV, so production drops it).
      onDevFail={process.env.NODE_ENV !== "production" && failNext ? failNext : undefined}
      onDaily5={() => {
        draft.close();
        nav.onNavigate?.("Daily 5");
      }}
    />
  );
  return { open: draft.open, start: draft.start, startFor: draft.startFor, maker };
}
