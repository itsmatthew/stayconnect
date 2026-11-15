"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArchiveScreen } from "@/components/archive/archive-screen";
import type { FeedSectionView, PickerView, PostCardView, SlotView } from "@/components/archive/types";
import type { NavProps } from "@/components/home/main-nav";
import type { AppData } from "../app-data";
import { ME } from "../messages/conversations";
import type { ArchiveStore } from "./archive-store";
import { checkCapture, pickerRange } from "./capture-check";
import { CAPTION_MAX, captionPlaceholder, cleanCaption, lockedText, pickerTitle, ribbon, slotDirections, slotLabel } from "./copy";
import { postTime } from "./format";
import { circleTags, feedSections, outlineColors, sharedCircles, type FeedSection } from "./gate";
import { isOpen, openSlots, periodFromKey, periodTitle, rangeLabel } from "./periods";
import type { TrackStoreWork } from "../app-client";
import { photoView, useMyPosts } from "./use-my-posts";

// One-time, per browser (ARC-11).
export const EXPLAINER_KEY = "nowandthen.archive.explainer.v1";

function explainerSeen(): boolean {
  try {
    return localStorage.getItem(EXPLAINER_KEY) === "seen";
  } catch {
    return true; // No storage: skip the explainer rather than show it every time.
  }
}
const noSubscription = () => () => {};

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
};

type Picking = { key: string; error?: string; preview?: string; pending?: { image: Blob; takenAt: number }; busy: boolean };

export function ArchiveClient({ data, now, store, track, readCapture, decode, nav }: ArchiveClientProps) {
  const [placeholder] = useState(() => data.posts(now()));
  const seededMine = useMemo(() => placeholder.filter((p) => p.author === ME), [placeholder]);
  const { mine, urls, add } = useMyPosts(store, seededMine, track);
  const [picking, setPicking] = useState<Picking | null>(null);
  // Read after hydration; the server renders it as seen.
  const seen = useSyncExternalStore(noSubscription, explainerSeen, () => true);
  const [dismissed, setDismissed] = useState(false);

  // Revoke the preview's object URL when it's replaced or the picker closes.
  const preview = picking?.preview;
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const t = now();
  const friendById = new Map(data.friends.map((f) => [f.id, f]));
  const sections = feedSections({ posts: [...placeholder.filter((p) => p.author !== ME), ...mine], groups: data.groups, viewerOf: data.viewerOf, now: t });

  const slots: SlotView[] = openSlots(t).map((p) => {
    const posted = mine.find((m) => m.period === p.key);
    return { key: p.key, kind: p.kind, label: slotLabel(p), ...slotDirections(p, t), posted: posted && photoView(posted, urls, `Your ${slotLabel(p).toLowerCase()}`) };
  });

  const card = (section: FeedSection) => (post: (typeof section.visible)[number]): PostCardView => {
    const shared = sharedCircles(post.author, data.groups);
    const tags = circleTags(post.author, data.groups);
    const friend = friendById.get(post.author);
    const name = friend?.name ?? "Someone";
    return {
      id: post.id,
      variant: section.period.kind,
      label: `${name}, ${periodTitle(section.period)}`,
      author: { name, look: friend?.look ?? { skin: "#EDB98F", hair: "#6B3F23", shirt: "#2B3350", bg: "#CFE0F4", ring: "#3F9AD8" } },
      time: postTime(post.postedAt, section.period),
      outlines: outlineColors(post.author, data.groups),
      palette: shared[0].palette,
      tags: shared.slice(0, tags.names.length).map((g) => ({ name: g.name, color: g.palette.canopy })),
      moreTags: tags.more,
      ribbon: ribbon(section.period),
      photo: photoView(post, urls, `${name}'s photo of ${periodTitle(section.period)}`),
      caption: post.caption,
    };
  };
  const sectionViews: FeedSectionView[] = sections.map((s) => ({
    key: s.period.key,
    title: periodTitle(s.period),
    range: rangeLabel(s.period),
    cards: s.visible.map(card(s)),
    locked: lockedText(s),
    standins: s.hidden.map((p) => outlineColors(p.author, data.groups)[0]),
  }));

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
      slots={slots}
      sections={sectionViews}
      showExplainer={!seen && !dismissed}
      onDismissExplainer={() => {
        setDismissed(true);
        try {
          localStorage.setItem(EXPLAINER_KEY, "seen");
        } catch {
          // Shown again next time; harmless.
        }
      }}
      onPost={(key) => !mine.some((m) => m.period === key) && setPicking({ key, busy: false })}
      picker={picker}
      onPick={pick}
      onConfirmPost={confirm}
      onCancelPost={() => setPicking(null)}
      nav={nav}
    />
  );
}
