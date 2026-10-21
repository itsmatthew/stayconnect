"use client";

import { useState } from "react";
import type { NavProps } from "@/components/home/main-nav";
import { MeScreen } from "@/components/me/me-screen";
import type { MeTile } from "@/components/me/types";
import type { AppData } from "../app-data";
import type { ArchiveStore } from "../archive/archive-store";
import { periodFromKey, periodsOfYear, periodTitle } from "../archive/periods";
import { photoView, useMyPosts } from "../archive/use-my-posts";
import { ME } from "../messages/conversations";

type MeClientProps = { data: AppData; now: () => number; store: ArchiveStore | null; nav: NavProps };

/** Your own 65 for the chosen year (docs/specs/me.md). Other people's posts never fill your slots. */
export function MeClient({ data, now, store, nav }: MeClientProps) {
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

  return <MeScreen year={year} years={years} onYearChange={setYear} tiles={tiles} nav={nav} />;
}
