"use client";

import { useEffect, useMemo, useState } from "react";
import type { NavLabel } from "@/components/home/main-nav";
import { defaultData, type AppData } from "./app-data";
import { ArchiveClient } from "./archive/archive-client";
import { ARCHIVE_DB, openArchiveStore, type ArchiveStore } from "./archive/archive-store";
import { useCircle } from "./circle/use-circle";
import type { ColorOverrideStore } from "./colors/color-overrides";
import { withViewerColors } from "./colors/group-colors";
import { localColorOverrideStore } from "./colors/local-color-overrides";
import { useColorOverrides } from "./colors/use-color-overrides";
import { Daily5Client } from "./daily5/daily5-client";
import { detectFaces } from "./daily5/face-detector";
import { openPhotoStore, type PhotoStore } from "./daily5/photo-store";
import type { GiftEvents } from "./gifts/gift-events";
import type { GiftStore } from "./gifts/gift-store";
import type { GiftDelivery } from "./gifts/gift-delivery";
import type { GiftDeps } from "./gifts/use-gift-maker";
import { browserShare } from "./mail/browser-share";
import type { Directory } from "./mail/directory";
import type { FindMeSetting } from "./mail/find-me";
import { localFindMe } from "./mail/local-find-me";
import { localMailboxSetting } from "./mail/local-mailbox-setting";
import type { InboxStore } from "./mail/inbox";
import { localInbox } from "./mail/local-inbox";
import { useInbox } from "./mail/use-inbox";
import { localInvites, localMail } from "./mail/local-mail";
import type { Mail, Share } from "./mail/mail";
import type { MailboxSetting } from "./mail/mailbox-setting";
import { localGiftDelivery } from "./gifts/local-gift-delivery";
import { localGiftEvents } from "./gifts/local-gift-events";
import { localPayment } from "./gifts/local-payment";
import { betaPayment, type PaymentService } from "./gifts/payment";
import { localGiftStore } from "./gifts/local-gift-store";
import { validateGroupName, withGroupNames, type GroupNameStore } from "./group-names/group-names";
import { localGroupNameStore } from "./group-names/local-group-names";
import { useGroupNames } from "./group-names/use-group-names";
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
  /** Where this viewer's own group colors are kept (docs/specs/group-colors.md, COLOR-8). */
  colorOverrides?: (storageSuffix: string) => ColorOverrideStore;
  /** Where renamed groups are saved (docs/specs/group-rename.md, RENAME-4). */
  groupNames?: (storageSuffix: string) => GroupNameStore;
  /** Where gifts are saved, and what's recorded about them (docs/specs/gifts.md, GIFT-9/11). */
  giftStore?: (storageSuffix: string) => GiftStore;
  giftEvents?: (storageSuffix: string) => GiftEvents;
  /** How gifts are paid for (GIFT-14). In production, until a real one exists, gifts are free during beta. */
  payment?: () => PaymentService;
  /** How gifts reach people (GIFT-15). */
  giftDelivery?: (storageSuffix: string) => GiftDelivery;
  /** The share sheet, for invite links (docs/specs/mail.md, MAIL-5). */
  share?: () => Share;
  /** Where mailbox drops go (MAIL-4). TODO(server): a fake. */
  mail?: (storageSuffix: string, directory: Directory) => Mail;
  /** "Let people find me by name" (MAIL-7). */
  findMe?: (storageSuffix: string) => FindMeSetting;
  /** "Who can drop in my mailbox" (MAIL-10). */
  mailboxSetting?: (storageSuffix: string) => MailboxSetting;
  /** Your mailbox (docs/specs/mailbox.md). TODO(server): a fake. */
  inbox?: (storageSuffix: string) => InboxStore;
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
  colorOverrides = localColorOverrideStore,
  groupNames = localGroupNameStore,
  giftStore = localGiftStore,
  giftEvents = localGiftEvents,
  // TODO(mobile: Apple in-app purchase): a real PaymentService replaces both.
  payment = () => (process.env.NODE_ENV === "production" ? betaPayment() : localPayment()),
  giftDelivery = localGiftDelivery,
  share = () => browserShare,
  // Invite links go nowhere until issue #26's landing page exists, so production doesn't make them yet (MAIL-5).
  mail = (suffix, directory) => localMail(suffix, directory, localInvites(typeof location === "undefined" ? "" : location.origin), { invitesEnabled: process.env.NODE_ENV !== "production" }),
  findMe = localFindMe,
  mailboxSetting = localMailboxSetting,
  inbox = localInbox,
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
  const [overrides, setColorOverride] = useColorOverrides(colorOverrides(data.storageSuffix));
  const [paymentService] = useState(payment);
  const [shareService] = useState(share);
  const [mailService] = useState(() => mail(data.storageSuffix, data.directory));
  const [findMeSetting] = useState(() => findMe(data.storageSuffix));
  const [mailboxFrom] = useState(() => mailboxSetting(data.storageSuffix));
  const [inboxState, inboxDispatch] = useInbox(inbox(data.storageSuffix), () => data.mail(now()));
  const [names, saveGroupName] = useGroupNames(groupNames(data.storageSuffix));
  // Names and colors are applied once, here, so every screen shows the same ones (COLOR-9, RENAME-7).
  const viewerData = useMemo(() => ({ ...data, groups: withViewerColors(withGroupNames(data.groups, names), overrides) }), [data, names, overrides]);
  const homeGroups = useMemo(() => withOrnaments(viewerData.groups, ornaments.state, ornaments.urls), [viewerData.groups, ornaments.state, ornaments.urls]);
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
  /** Shared by Home's card and the group profile (RENAME-2). The note follows only a successful save (RENAME-4). */
  const renameGroup = async (groupId: string, raw: string) => {
    const check = validateGroupName(raw);
    if (!check.ok) return;
    await saveGroupName(groupId, check.name);
    dispatch({ type: "rename", id: crypto.randomUUID(), conversationId: conversationId("group", groupId), by: ME, name: check.name, at: now() });
  };
  /** Everything a gift needs, for Me and Daily 5 (docs/specs/gifts.md). */
  const giftDeps: GiftDeps = { store: giftStore(data.storageSuffix), events: giftEvents(data.storageSuffix), photos: store, placements: circle.placements, groups: homeGroups, friends: viewerData.friends, senderName: data.senderName, payment: paymentService, delivery: giftDelivery(data.storageSuffix) };
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
          onRename={renameGroup}
          countdowns={countdowns}
          mail={{ state: inboxState, dispatch: inboxDispatch, recipientName: data.senderName || undefined }}
        />
      );
    case "Daily 5":
      return <Daily5Client store={store} track={trackStoreWork} now={now} hasFace={hasFace} recipients={recipients} dispatch={dispatch} nav={nav} gifts={giftDeps} drops={{ directory: data.directory, mail: mailService, share: shareService, friends: data.friends, placements: circle.placements }} />;
    case "Archive":
      return <ArchiveClient data={viewerData} now={now} store={archive} track={trackArchiveWork} readCapture={readCapture} decode={decode} nav={nav} />;
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
            colors: { overrides, onChange: setColorOverride },
            rename: renameGroup,
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
      return <MeClient data={viewerData} now={now} store={archive} nav={nav} gifts={giftDeps} findMe={findMeSetting} mailboxSetting={mailboxFrom} />;
  }
}
