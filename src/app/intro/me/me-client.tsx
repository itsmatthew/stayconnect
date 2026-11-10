"use client";

import { useState } from "react";
import type { NavProps } from "@/components/home/main-nav";
import { MeScreen } from "@/components/me/me-screen";
import type { MeTile } from "@/components/me/types";
import type { AppData } from "../app-data";
import type { ArchiveStore } from "../archive/archive-store";
import { periodFromKey, periodsOfYear, periodTitle } from "../archive/periods";
import { photoView, useMyPosts } from "../archive/use-my-posts";
import { useGiftMaker, type GiftDeps } from "../gifts/use-gift-maker";
import type { FindMeSetting } from "../mail/find-me";
import { DEFAULT_WHO_CAN_DROP, isWhoCanDrop, type MailboxSetting, type WhoCanDrop } from "../mail/mailbox-setting";
import { useFindMe } from "../mail/use-find-me";
import { useSavedSetting } from "../mail/use-saved-setting";
import { ME } from "../messages/conversations";

type MeClientProps = {
  data: AppData;
  now: () => number;
  store: ArchiveStore | null;
  nav: NavProps;
  /** What the gift maker needs (docs/specs/gifts.md). */
  gifts: GiftDeps;
  /** "Let people find me by name" (docs/specs/mail.md, MAIL-7). */
  findMe: FindMeSetting;
  /** "Who can drop in my mailbox" (docs/specs/mail.md, MAIL-10). */
  mailboxSetting: MailboxSetting;
};

const MAILBOX_OPTIONS: readonly { id: WhoCanDrop; label: string }[] = [
  { id: "anyone", label: "Anyone" },
  { id: "friendsOfFriends", label: "Friends of friends" },
  { id: "circles", label: "Only my circles" },
];

/** Your own 65 for the chosen year (docs/specs/me.md). Other people's posts never fill your slots. */
export function MeClient({ data, now, store, nav, gifts, findMe, mailboxSetting }: MeClientProps) {
  const gift = useGiftMaker(gifts, { now, nav });
  const [findable, setFindable] = useFindMe(findMe);
  const [mailboxFrom, setMailboxFrom] = useSavedSetting(mailboxSetting, DEFAULT_WHO_CAN_DROP);
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
      <MeScreen year={year} years={years} onYearChange={setYear} tiles={tiles} nav={nav} onSendGift={() => void gift.open()} findMe={{ on: findable, onChange: setFindable }} mailbox={{ options: MAILBOX_OPTIONS, value: mailboxFrom, onChange: (id) => isWhoCanDrop(id) && setMailboxFrom(id) }} />
      {gift.maker}
    </>
  );
}
