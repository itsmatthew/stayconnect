"use client";

import { useState } from "react";
import type { NavProps } from "@/components/home/main-nav";
import { MeScreen } from "@/components/me/me-screen";
import { MemorySheet, type SelfMemory } from "@/components/me/memories-row";
import type { MeTile } from "@/components/me/types";
import type { AppData } from "../app-data";
import type { ArchiveStore } from "../archive/archive-store";
import { periodFromKey, periodsOfYear, periodTitle } from "../archive/periods";
import { photoView, useMyPosts } from "../archive/use-my-posts";
import { dayKey } from "../gifts/gift";
import type { ReceivedGift } from "../gifts/received";
import { ShelfGiftScreen, shelfGifts, shelfPhotoIds } from "../gifts/received-client";
import { usePhotoUrls } from "../messages/use-photo-urls";
import { useGiftMaker, type GiftDeps } from "../gifts/use-gift-maker";
import type { FindMeSetting } from "../mail/find-me";
import { DEFAULT_WHO_CAN_DROP, isWhoCanDrop, type MailboxSetting, type WhoCanDrop } from "../mail/mailbox-setting";
import { useFindMe } from "../mail/use-find-me";
import { useSavedSetting } from "../mail/use-saved-setting";
import { ME } from "../messages/conversations";
import { FIRST, LAST, type Slot } from "../ornaments/ornaments";
import type { OrnamentEdit } from "../ornaments/use-ornaments";
import type { CropArea } from "../photo-file";
import { usePickedPhoto } from "../use-picked-photo";
import { ANSWER_MAX, BIO_MAX, emptyProfile, profileQuestions, type ProfileStore } from "./profile";
import { useProfile } from "./use-profile";

/** Your profile's photos, kept with the ornaments under `ME_PROFILE` (ME-5, ME-8). `AppClient` builds it. */
export type ProfilePhotos = {
  get(slot: Slot): { src?: string; caption: string } | undefined;
  /** `edit` may still be on its way (being downscaled or cropped). */
  save(slot: Slot, edit: Promise<OrnamentEdit>): void;
  decode(f: File): Promise<Blob>;
  crop(image: Blob, area: CropArea | undefined, max: number): Promise<Blob>;
};

/** Profile photos are saved at most this big, as ornaments are (HOME-14). */
const PHOTO_MAX = 1024;
const MEMORY_CAPTION_MAX = 40;

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
  /** Gifts you've received; opened ones stand on your shelf (docs/specs/gifts.md, GIFT-21). */
  received?: readonly ReceivedGift[];
  /** Open on the shelf: you came from "your gifts" or just kept a gift. */
  startOnShelf?: boolean;
  /** Your own copy of a group gift you just sent, landing on your shelf (GIFT-23). */
  landing?: string;
  /** Your profile's text and photos (docs/specs/me.md, ME-5 to ME-8). */
  profile?: { store: ProfileStore; photos: ProfilePhotos };
};

const MAILBOX_OPTIONS: readonly { id: WhoCanDrop; label: string }[] = [
  { id: "anyone", label: "Anyone" },
  { id: "friendsOfFriends", label: "Friends of friends" },
  { id: "circles", label: "Only my circles" },
];

/** Your own 65 for the chosen year (docs/specs/me.md). Other people's posts never fill your slots. */
export function MeClient({ data, now, store, nav, gifts, findMe, mailboxSetting, received = [], startOnShelf = false, landing, profile }: MeClientProps) {
  const header = useProfileHeader(profile, data.senderName, now);
  const [looking, setLooking] = useState<string | null>(null);
  const lookingAt = looking ? received.find((g) => g.id === looking) : undefined;
  const gift = useGiftMaker(gifts, { now, nav });
  const shelfUrls = usePhotoUrls(gifts.photos, shelfPhotoIds(received));
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
      <MeScreen year={year} years={years} onYearChange={setYear} tiles={tiles} nav={nav} onSendGift={() => void gift.open()} findMe={{ on: findable, onChange: setFindable }} mailbox={{ options: MAILBOX_OPTIONS, value: mailboxFrom, onChange: (id) => isWhoCanDrop(id) && setMailboxFrom(id) }} initialView={startOnShelf ? "gifts" : "posts"} shelf={{ gifts: shelfGifts(received, data.senderName, dayKey(now()), shelfUrls), onOpenGift: setLooking, landing }} profile={header.props} />
      {header.sheet}
      {lookingAt && <ShelfGiftScreen gift={lookingAt} viewerName={data.senderName} urls={shelfUrls} onClose={() => setLooking(null)} />}
      {gift.maker}
    </>
  );
}

const noProfile: { store: ProfileStore; photos: ProfilePhotos } = {
  store: { load: async () => emptyProfile(), save: async () => {} },
  photos: { get: () => undefined, save: () => {}, decode: async (f) => f, crop: async (b) => b },
};

/** The profile above your posts, and the memory sheet when one is open (ME-5 to ME-8). */
function useProfileHeader(deps: MeClientProps["profile"], senderName: string, now: () => number) {
  const { store, photos } = deps ?? noProfile;
  const [p, dispatch] = useProfile(store);
  const [editing, setEditing] = useState<number | null>(null);
  const picked = usePickedPhoto(photos.decode);
  const memories = [0, 1, 2].map((i) => {
    const m = photos.get(i);
    return { src: m?.src, caption: m?.caption ?? "", nest: p.audience[i] === "nest" };
  }) as unknown as readonly [SelfMemory, SelfMemory, SelfMemory];
  const close = () => {
    picked.drop();
    setEditing(null);
  };
  const pickHeader = (which: "now" | "then", file: File) =>
    photos.save(which === "now" ? LAST : FIRST, (async () => ({ image: await photos.crop(await photos.decode(file), undefined, PHOTO_MAX), caption: "" }))());

  const props = deps && {
    // TODO(server): your profile's name, from `GET /api/me`.
    name: senderName || "you",
    now: photos.get(LAST)?.src,
    then: photos.get(FIRST)?.src,
    onPick: pickHeader,
    bio: p.bio,
    bioMax: BIO_MAX,
    onBio: (text: string) => dispatch({ type: "bio", text }),
    questions: profileQuestions(p, now()),
    answerMax: ANSWER_MAX,
    onAnswer: (id: string, text: string) => dispatch({ type: "answer", id, text }),
    memories,
    onOpenMemory: setEditing,
  };
  const sheet = editing !== null && (
    <MemorySheet
      key={editing}
      memory={memories[editing]}
      preview={picked.pending?.url}
      captionMax={MEMORY_CAPTION_MAX}
      onPickFile={picked.choose}
      onSave={({ caption, nest, area }) => {
        const index = editing;
        const image = picked.pending?.image;
        close();
        dispatch({ type: "audience", index, audience: nest ? "nest" : "circles" });
        photos.save(index, (async () => ({ image: image && (await photos.crop(image, area, PHOTO_MAX)), caption }))());
      }}
      onCancel={close}
    />
  );
  return { props, sheet };
}
