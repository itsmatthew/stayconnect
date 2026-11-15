"use client";

import { useEffect, useMemo, useState } from "react";
import type { NavLabel } from "@/components/home/main-nav";
import { defaultData, type AppData } from "./app-data";
import { ArchiveClient } from "./archive/archive-client";
import { ARCHIVE_DB, openArchiveStore, type ArchiveStore } from "./archive/archive-store";
import { useCircle } from "./circle/use-circle";
import { Daily5Client } from "./daily5/daily5-client";
import { detectFaces } from "./daily5/face-detector";
import { openPhotoStore, type PhotoStore } from "./daily5/photo-store";
import { HomeClient } from "./home-client";
import { MeClient } from "./me/me-client";
import { conversationId, ME } from "./messages/conversations";
import { MessagesClient } from "./messages/messages-client";
import { ORNAMENT_DB, openOrnamentStore, type OrnamentStore } from "./ornaments/ornament-store";
import { FIRST, LAST, LOGO, canUndo, changedLine, ornamentKey, withOrnaments } from "./ornaments/ornaments";
import type { OrnamentControls } from "./ornaments/ornament-sheet-client";
import { useOrnaments } from "./ornaments/use-ornaments";
import { useChat } from "./messages/use-chat";
import { recipientSections } from "./parties";
import { captureDate, cropSquare, downscale, type CropArea } from "./photo-file";
import { activeGoal, countdownTag } from "./profile/goals";
import { useGoals } from "./profile/use-goals";

type AppClientProps = {
  initialTab?: NavLabel;
  /** Placeholder data or none, from the demo switch (docs/specs/demo.md). */
  data?: AppData;
  now?: () => number;
  openStore?: () => Promise<PhotoStore>;
  openArchive?: (name: string) => Promise<ArchiveStore>;
  openOrnaments?: (name: string) => Promise<OrnamentStore>;
  hasFace?: (image: Blob) => Promise<boolean>;
  readCapture?: (f: File) => Promise<number | undefined>;
  decode?: (f: File) => Promise<Blob>;
  /** Cuts a cropped square out of a photo (docs/specs/group-logo.md, LOGO-7). */
  crop?: (image: Blob, area: CropArea | undefined, max: number) => Promise<Blob>;
};

/** Work on a store that must finish before it closes. */
export type TrackStoreWork = <T>(work: Promise<T>) => Promise<T>;

/**
 * Opens a store once, closes it on unmount (or if it arrives after unmount). Work passed to `track` keeps it open
 * until that work settles, so a write started before unmount never hits a closed database.
 * TODO(re-evaluate when a fourth IndexedDB store is added, or the stores move to the database): the photo, Archive and
 * ornament stores are three databases, and `useOrnaments` repeats this open/track/close guard; consolidate them.
 */
function useStore<T extends { close(): void }>(open: () => Promise<T>): [T | null, TrackStoreWork] {
  const [store, setStore] = useState<T | null>(null);
  const [inFlight] = useState(() => new Set<Promise<unknown>>());
  const [track] = useState(() => <W,>(work: Promise<W>) => {
    inFlight.add(work);
    work.finally(() => inFlight.delete(work)).catch(() => {});
    return work;
  });
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
      const s = opened;
      if (s) Promise.allSettled(inFlight).then(() => s.close());
    };
  }, [open, inFlight]);
  return [store, track];
}

/**
 * The app's tabs. Chats are shared so a Daily 5 send lands in Messages (and Your circle can read who's been close); your Archive posts are shared by Archive and Me.
 * Ornament changes are merged into the groups Home shows (docs/specs/home.md, HOME-15).
 */
export function AppClient({
  initialTab = "Circles",
  data = defaultData,
  now = Date.now,
  openStore = openPhotoStore,
  openArchive = openArchiveStore,
  openOrnaments = openOrnamentStore,
  hasFace = detectFaces,
  readCapture = captureDate,
  decode = downscale,
  crop = cropSquare,
}: AppClientProps) {
  const [tab, setTab] = useState<NavLabel>(initialTab);
  const [store, trackStoreWork] = useStore(openStore);
  const [openArchiveNamed] = useState(() => () => openArchive(ARCHIVE_DB + data.storageSuffix));
  const [archive, trackArchiveWork] = useStore(openArchiveNamed);
  const [openOrnamentsNamed] = useState(() => () => openOrnaments(ORNAMENT_DB + data.storageSuffix));
  const ornaments = useOrnaments(openOrnamentsNamed);
  const homeGroups = useMemo(() => withOrnaments(data.groups, ornaments.state, ornaments.urls), [data.groups, ornaments.state, ornaments.urls]);
  const [chat, dispatch] = useChat(now, data.seedConversations, data.storageSuffix);
  const recipients = useMemo(() => recipientSections(homeGroups, data.friends), [homeGroups, data.friends]);
  const nameOf = (id: string) => data.friends.find((f) => f.id === id)?.name;
  const [circle, circleDispatch] = useCircle(data.rings, data.storageSuffix);
  const [gifts] = useState(() => data.gifts(now()));
  const [goalSeed] = useState(() => data.goals(now()));
  const [goals, dispatchGoal] = useGoals(goalSeed, data.storageSuffix);
  /** A thread for Messages to open on arrival (CIRCLE-6). */
  const [openThread, setOpenThread] = useState<string | null>(null);

  const navigate = (to: NavLabel) => {
    setOpenThread(null);
    setTab(to);
  };
  const nav = { current: tab, onNavigate: navigate };
  const openChat = (friendId: string) => {
    const id = conversationId("friend", friendId);
    dispatch({ type: "open", conversationId: id, at: now() });
    setOpenThread(id);
    setTab("Messages");
  };

  // Shared by Home's trees and the group profile's "Edit" (HOME-14, GP-4).
  const ornamentControls: OrnamentControls = {
    lineOf: (groupId, index) => {
      const v = ornaments.state[ornamentKey(groupId, index)]?.current;
      return v && changedLine(v, nameOf, now());
    },
    canUndo: (groupId, index) => canUndo(ornaments.state, groupId, index),
    onSave: (groupId, index, edit) => void ornaments.change(groupId, index, edit, ME, now()),
    onUndo: (groupId, index) => void ornaments.undo(groupId, index),
    decode,
    crop,
  };
  /** The next time together on Home's trees (HOME-19). */
  const countdowns = Object.fromEntries(
    homeGroups.flatMap((g) => {
      const tag = countdownTag(activeGoal(goals, g.id, now()), now());
      return tag ? [[g.id, tag]] : [];
    }),
  );

  switch (tab) {
    case "Circles":
      return (
        <HomeClient
          groups={homeGroups}
          friends={data.friends}
          chat={chat}
          circle={circle}
          circleDispatch={circleDispatch}
          gifts={gifts}
          now={now}
          onOpenChat={openChat}
          nav={nav}
          ornaments={ornamentControls}
          countdowns={countdowns}
        />
      );
    case "Daily 5":
      return <Daily5Client store={store} track={trackStoreWork} now={now} hasFace={hasFace} recipients={recipients} dispatch={dispatch} nav={nav} />;
    case "Archive":
      return <ArchiveClient data={data} now={now} store={archive} track={trackArchiveWork} readCapture={readCapture} decode={decode} nav={nav} />;
    case "Messages":
      return (
        <MessagesClient
          chat={chat}
          dispatch={dispatch}
          now={now}
          store={store}
          groups={homeGroups}
          friends={data.friends}
          replies={data.replies}
          initialOpenId={openThread}
          nav={nav}
          logos={{
            lineOf: (groupId) => {
              const v = ornaments.state[ornamentKey(groupId, LOGO)]?.current;
              return v && changedLine(v, nameOf, now(), "the logo");
            },
            canUndo: (groupId) => canUndo(ornaments.state, groupId, LOGO),
            onSave: (groupId, image) => void ornaments.change(groupId, LOGO, image.then((image) => ({ image, caption: "" })), ME, now()),
            onUndo: (groupId) => void ornaments.undo(groupId, LOGO),
            decode,
            crop,
          }}
          profile={{
            goals,
            dispatchGoal,
            placements: circle.placements,
            upTo: data.upTo,
            ornaments: ornamentControls,
            // Header photos are saved at once, downscaled, with their capture date (GP-12). The change starts at the tap,
            // so the store stays open while the photo is prepared.
            setHeaderPhoto: (groupId, slot, file) =>
              ornaments.change(
                groupId,
                slot === "first" ? FIRST : LAST,
                Promise.all([decode(file), readCapture(file)]).then(([image, takenAt]) => ({ image, caption: "", takenAt })),
                ME,
                now(),
              ),
          }}
        />
      );
    case "Me":
      return <MeClient data={data} now={now} store={archive} nav={nav} />;
  }
}
