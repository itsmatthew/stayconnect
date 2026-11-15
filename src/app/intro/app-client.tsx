"use client";

import { useEffect, useState } from "react";
import type { NavLabel } from "@/components/home/main-nav";
import { defaultData, type AppData } from "./app-data";
import { ArchiveClient } from "./archive/archive-client";
import { ARCHIVE_DB, openArchiveStore, type ArchiveStore } from "./archive/archive-store";
import { Daily5Client } from "./daily5/daily5-client";
import { detectFaces } from "./daily5/face-detector";
import { openPhotoStore, type PhotoStore } from "./daily5/photo-store";
import { HomeClient } from "./home-client";
import { MeClient } from "./me/me-client";
import { MessagesClient } from "./messages/messages-client";
import { useChat } from "./messages/use-chat";
import { recipientSections } from "./parties";
import { captureDate, downscale } from "./photo-file";

type AppClientProps = {
  initialTab?: NavLabel;
  /** Placeholder data or none, from the demo switch (docs/specs/demo.md). */
  data?: AppData;
  now?: () => number;
  openStore?: () => Promise<PhotoStore>;
  openArchive?: (name: string) => Promise<ArchiveStore>;
  hasFace?: (image: Blob) => Promise<boolean>;
  readCapture?: (f: File) => Promise<number | undefined>;
  decode?: (f: File) => Promise<Blob>;
};

/** Opens a store once, closes it on unmount (or if it arrives after unmount). */
function useStore<T extends { close(): void }>(open: () => Promise<T>): T | null {
  const [store, setStore] = useState<T | null>(null);
  useEffect(() => {
    let opened: T | null = null;
    let live = true;
    open().then((s) => {
      opened = s;
      if (live) setStore(s);
      else s.close();
    });
    return () => {
      live = false;
      opened?.close();
    };
  }, [open]);
  return store;
}

/** The app's tabs. Chats are shared so a Daily 5 send lands in Messages; your Archive posts are shared by Archive and Me. */
export function AppClient({
  initialTab = "Circles",
  data = defaultData,
  now = Date.now,
  openStore = openPhotoStore,
  openArchive = openArchiveStore,
  hasFace = detectFaces,
  readCapture = captureDate,
  decode = downscale,
}: AppClientProps) {
  const [tab, setTab] = useState<NavLabel>(initialTab);
  const store = useStore(openStore);
  const [openArchiveNamed] = useState(() => () => openArchive(ARCHIVE_DB + data.storageSuffix));
  const archive = useStore(openArchiveNamed);
  const [chat, dispatch] = useChat(now, data.seedConversations, data.storageSuffix);
  const [recipients] = useState(() => recipientSections(data.groups, data.friends));

  const nav = { current: tab, onNavigate: setTab };

  switch (tab) {
    case "Circles":
      return <HomeClient groups={data.groups} nav={nav} />;
    case "Daily 5":
      return <Daily5Client store={store} now={now} hasFace={hasFace} recipients={recipients} dispatch={dispatch} nav={nav} />;
    case "Archive":
      return <ArchiveClient data={data} now={now} store={archive} readCapture={readCapture} decode={decode} nav={nav} />;
    case "Messages":
      return <MessagesClient chat={chat} dispatch={dispatch} now={now} store={store} groups={data.groups} friends={data.friends} replies={data.replies} nav={nav} />;
    case "Me":
      return <MeClient data={data} now={now} store={archive} nav={nav} />;
  }
}
