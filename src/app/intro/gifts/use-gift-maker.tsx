"use client";

import type { ReactNode } from "react";
import type { NavProps } from "@/components/home/main-nav";
import type { CircleGroup, Friend } from "@/components/home/types";
import type { Placements } from "../circle/rings";
import type { PhotoStore } from "../daily5/photo-store";
import { ME } from "../messages/conversations";
import type { GiftPhoto } from "./gift";
import type { GiftDelivery } from "./gift-delivery";
import type { GiftEvents } from "./gift-events";
import { GiftMakerClient } from "./gift-maker-client";
import type { GiftStore } from "./gift-store";
import type { PaymentService } from "./payment";
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
  const maker: ReactNode = draft.gift && (
    <GiftMakerClient
      gift={draft.gift}
      dispatch={draft.dispatch}
      onClose={draft.close}
      onSent={onSent}
      friends={deps.friends}
      groups={deps.groups}
      placements={deps.placements}
      photos={deps.photos}
      senderName={deps.senderName}
      now={now}
      onSend={draft.send}
      priceOf={(sku) => deps.payment.product(sku)}
      // Dev only (Next inlines NODE_ENV, so production drops it).
      onDevFail={process.env.NODE_ENV !== "production" && failNext ? failNext : undefined}
      onDaily5={() => {
        draft.close();
        nav.onNavigate?.("Daily 5");
      }}
    />
  );
  return { open: draft.open, start: draft.start, maker };
}
