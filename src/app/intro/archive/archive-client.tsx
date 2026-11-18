"use client";

import { useEffect, useMemo, useState } from "react";
import { ArchiveScreen } from "@/components/archive/archive-screen";
import type { FeedPostView, PickerView, SlotView, WeekCardView } from "@/components/archive/types";
import type { NavProps } from "@/components/home/main-nav";
import type { AppData } from "../app-data";
import { ME } from "../messages/conversations";
import type { ArchiveStore } from "./archive-store";
import { checkCapture, pickerRange } from "./capture-check";
import { CAPTION_MAX, captionPlaceholder, cleanCaption, daysLeft, footer, pickerTitle, slotLabel, slotRow } from "./copy";
import { feedPosts, weekSummary } from "./feed";
import { sharedCircles } from "./gate";
import { isOpen, openSlots, periodFromKey, periodTitle, rangeLabel, weekPeriod } from "./periods";
import type { TrackStoreWork } from "../app-client";
import { photoView, useMyPosts } from "./use-my-posts";

type ArchiveClientProps = {
  data: AppData;
  now: () => number;
  store: ArchiveStore | null;
  /** Keeps the store open until a post started before the app closed has saved. */
  track?: TrackStoreWork;
  /** The EXIF capture date, or undefined (ARC-4). Browser only, so injected. */
  readCapture: (f: File) => Promise<number | undefined>;
  /** A JPEG copy, at most 1600px. Browser only, so injected. */
  decode: (f: File) => Promise<Blob>;
  nav: NavProps;
  /** The send arrow on a post: a chat with its author (ARC-7). */
  onOpenChat?: (friendId: string) => void;
};

const SOMEONE = { skin: "#EDB98F", hair: "#6B3F23", shirt: "#2B3350", bg: "#CFE0F4", ring: "#3F9AD8" };

type Picking = { key: string; error?: string; preview?: string; pending?: { image: Blob; takenAt: number }; busy: boolean };

export function ArchiveClient({ data, now, store, track, readCapture, decode, nav, onOpenChat = () => {} }: ArchiveClientProps) {
  const [placeholder] = useState(() => data.posts(now()));
  const seededMine = useMemo(() => placeholder.filter((p) => p.author === ME), [placeholder]);
  const { mine, urls, add } = useMyPosts(store, seededMine, track);
  const [picking, setPicking] = useState<Picking | null>(null);

  // Revoke the preview's object URL when it's replaced or the picker closes.
  const preview = picking?.preview;
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const t = now();
  const friendById = new Map(data.friends.map((f) => [f.id, f]));
  const everyone = [...placeholder.filter((p) => p.author !== ME), ...mine];
  const friend = (id: string) => friendById.get(id);

  // This week's card (ARC-10).
  const summary = weekSummary({ posts: everyone, groups: data.groups, now: t });
  const week: WeekCardView = {
    range: rangeLabel(weekPeriod(t)),
    daysLeft: daysLeft(weekPeriod(t), t),
    line: summary.line,
    posters: summary.posted.map((id) => ({ name: friend(id)?.name ?? "Someone", look: friend(id)?.look ?? SOMEONE })),
  };
  const slots: SlotView[] = openSlots(t).map((p) => {
    const posted = mine.find((m) => m.period === p.key);
    return { key: p.key, kind: p.kind, label: slotLabel(p), ...slotRow(p, t), posted: posted && photoView(posted, urls, `Your ${slotLabel(p).toLowerCase()}`) };
  });

  // The feed: everyone's posts, newest first (ARC-8).
  const visible = feedPosts({ posts: everyone, groups: data.groups, viewerOf: data.viewerOf, now: t });
  const posts: FeedPostView[] = visible.map((post) => {
    const period = periodFromKey(post.period);
    const circle = sharedCircles(post.author, data.groups)[0];
    const name = friend(post.author)?.name ?? "Someone";
    return {
      id: post.id,
      variant: period.kind,
      label: `${name}, ${periodTitle(period)}`,
      author: { name, look: friend(post.author)?.look ?? SOMEONE },
      circle: { name: circle.name, color: circle.palette.canopy },
      photo: photoView(post, urls, `${name}'s photo of ${periodTitle(period)}`),
      footer: footer(period, post.takenAt),
      caption: post.caption,
    };
  });
  const authorOf = new Map(visible.map((p) => [p.id, p.author]));

  const pickingPeriod = picking && periodFromKey(picking.key);
  const picker: PickerView | null = pickingPeriod && {
    title: pickerTitle(pickingPeriod),
    range: pickerRange(pickingPeriod),
    error: picking.error,
    preview: picking.preview,
    captionPlaceholder: captionPlaceholder(pickingPeriod),
    captionMax: CAPTION_MAX,
    // Posting waits for the Archive store to open.
    busy: picking.busy || !store,
  };

  const pick = async (file: File) => {
    if (!picking || !pickingPeriod) return;
    const key = picking.key;
    setPicking({ key, busy: true });
    const takenAt = await readCapture(file);
    const check = checkCapture(takenAt, pickingPeriod);
    if (!check.ok) return setPicking({ key, error: check.message, busy: false });
    try {
      const image = await decode(file);
      setPicking({ key, preview: URL.createObjectURL(image), pending: { image, takenAt: takenAt! }, busy: false });
    } catch {
      setPicking({ key, error: "This photo can't be opened here — try another.", busy: false });
    }
  };

  const confirm = async (caption: string) => {
    if (!picking?.pending || !pickingPeriod) return;
    const at = now();
    if (!isOpen(pickingPeriod, at)) return setPicking({ key: picking.key, error: "This one's closed now.", busy: false });
    setPicking({ ...picking, busy: true });
    try {
      await add({ period: picking.key, postedAt: at, takenAt: picking.pending.takenAt, image: picking.pending.image, caption: cleanCaption(caption) });
      setPicking(null);
    } catch (e) {
      // Only a duplicate is "already posted"; anything else (storage full, blocked) can be retried.
      const duplicate = e instanceof DOMException && e.name === "ConstraintError";
      setPicking({ ...picking, error: duplicate ? "You've already posted for this one." : "Couldn't save your photo — try again.", busy: false });
    }
  };

  return (
    <ArchiveScreen
      week={week}
      slots={slots}
      posts={posts}
      onPost={(key) => !mine.some((m) => m.period === key) && setPicking({ key, busy: false })}
      onMessage={(id) => {
        const author = authorOf.get(id);
        if (author) onOpenChat(author);
      }}
      picker={picker}
      onPick={pick}
      onConfirmPost={confirm}
      onCancelPost={() => setPicking(null)}
      nav={nav}
    />
  );
}
