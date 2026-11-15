"use client";

import { useEffect, useState } from "react";
import type { NavLabel } from "@/components/home/main-nav";
import { Daily5Client } from "./daily5/daily5-client";
import { detectFaces } from "./daily5/face-detector";
import { openPhotoStore, type PhotoStore } from "./daily5/photo-store";
import { HomeClient } from "./home-client";
import { MessagesClient } from "./messages/messages-client";
import { useChat } from "./messages/use-chat";
import { recipientSections } from "./parties";
import { friends, placeholderGroups } from "./placeholder-data";

type Tab = "Circles" | "Daily 5" | "Messages";
const TABS: readonly NavLabel[] = ["Circles", "Daily 5", "Messages"];

type AppClientProps = {
  initialTab?: Tab;
  now?: () => number;
  openStore?: () => Promise<PhotoStore>;
  hasFace?: (image: Blob) => Promise<boolean>;
};

const recipients = recipientSections(placeholderGroups, friends);

/** The app's tabs: Circles (home), Daily 5 and Messages. Chats are shared so a Daily 5 send lands in Messages. */
export function AppClient({ initialTab = "Circles", now = Date.now, openStore = openPhotoStore, hasFace = detectFaces }: AppClientProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [store, setStore] = useState<PhotoStore | null>(null);
  const [chat, dispatch] = useChat(now);

  useEffect(() => {
    let opened: PhotoStore | null = null;
    let live = true;
    openStore().then((s) => {
      opened = s;
      if (live) setStore(s);
      else s.close();
    });
    return () => {
      live = false;
      opened?.close();
    };
  }, [openStore]);

  // TODO(re-evaluate when Archive and Me exist): taps on them are ignored.
  const nav = { current: tab, onNavigate: (to: NavLabel) => TABS.includes(to) && setTab(to as Tab) };

  switch (tab) {
    case "Circles":
      return <HomeClient nav={nav} />;
    case "Daily 5":
      return <Daily5Client store={store} now={now} hasFace={hasFace} recipients={recipients} dispatch={dispatch} nav={nav} />;
    case "Messages":
      return <MessagesClient chat={chat} dispatch={dispatch} now={now} store={store} groups={placeholderGroups} friends={friends} nav={nav} />;
  }
}
