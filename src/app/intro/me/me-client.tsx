"use client";

import { useState } from "react";
import type { NavProps } from "@/components/home/main-nav";
import type { CircleGroup } from "@/components/home/types";
import { MeScreen } from "@/components/me/me-screen";
import type { MeTile } from "@/components/me/types";
import type { AppData } from "../app-data";
import type { ArchiveStore } from "../archive/archive-store";
import { periodFromKey, periodsOfYear, periodTitle } from "../archive/periods";
import { photoView, useMyPosts } from "../archive/use-my-posts";
import type { Placements } from "../circle/rings";
import type { PhotoStore } from "../daily5/photo-store";
import { GiftMakerClient } from "../gifts/gift-maker-client";
import type { GiftEvents } from "../gifts/gift-events";
import type { GiftDelivery } from "../gifts/gift-delivery";
import type { GiftStore } from "../gifts/gift-store";
import type { PaymentService } from "../gifts/payment";
import { useGiftDraft } from "../gifts/use-gift-draft";
import { ME } from "../messages/conversations";

type MeClientProps = {
  data: AppData;
  now: () => number;
  store: ArchiveStore | null;
  nav: NavProps;
  /** What the gift maker needs (docs/specs/gifts.md). */
  gifts: { store: GiftStore; events: GiftEvents; photos: PhotoStore | null; placements: Placements; groups: readonly CircleGroup[]; payment: PaymentService; delivery: GiftDelivery };
};

/** Your own 65 for the chosen year (docs/specs/me.md). Other people's posts never fill your slots. */
export function MeClient({ data, now, store, nav, gifts }: MeClientProps) {
  const draft = useGiftDraft({
    store: gifts.store,
    events: gifts.events,
    now,
    makeId: () => crypto.randomUUID(),
    from: ME,
    payment: gifts.payment,
    delivery: gifts.delivery,
    // Who's in a group when it's sent decides who gets a copy (GIFT-13).
    membersOf: (groupId) => gifts.groups.find((g) => g.id === groupId)?.members ?? [],
  });
  const failNext = (gifts.payment as { failNext?: () => void }).failNext;
  const [seeded] = useState(() => data.posts(now()).filter((p) => p.author === ME));
  const { mine, urls } = useMyPosts(store, seeded);
  const thisYear = new Date(now()).getFullYear();
  const [year, setYear] = useState(thisYear);

  const years = [...new Set([thisYear, ...mine.map((p) => periodFromKey(p.period).year)])].sort((a, b) => b - a);
  const byPeriod = new Map(mine.map((p) => [p.period, p]));
  const tiles: MeTile[] = periodsOfYear(year).map((p) => {
    const post = byPeriod.get(p.key);
    const title = periodTitle(p);
    return { key: p.key, size: p.kind, title, photo: post && photoView(post, urls, `Your photo of ${title}`), caption: post?.caption };
  });

  return (
    <>
      <MeScreen year={year} years={years} onYearChange={setYear} tiles={tiles} nav={nav} onSendGift={() => void draft.open()} />
      {draft.gift && (
        <GiftMakerClient
          gift={draft.gift}
          dispatch={draft.dispatch}
          onClose={draft.close}
          friends={data.friends}
          groups={gifts.groups}
          placements={gifts.placements}
          photos={gifts.photos}
          senderName={data.senderName}
          now={now}
          onSend={draft.send}
          priceOf={(sku) => gifts.payment.product(sku)}
          // Dev only (Next inlines NODE_ENV, so production drops it).
          onDevFail={process.env.NODE_ENV !== "production" && failNext ? failNext : undefined}
          onDaily5={() => {
            draft.close();
            nav.onNavigate?.("Daily 5");
          }}
        />
      )}
    </>
  );
}
