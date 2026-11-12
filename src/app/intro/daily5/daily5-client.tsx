"use client";

import { Daily5Screen } from "@/components/daily5/daily5-screen";
import type { RecipientSections } from "@/components/daily5/types";
import type { NavProps } from "@/components/home/main-nav";
import type { TrackStoreWork } from "../app-client";
import { useState } from "react";
import { noGiftDeps, useGiftMaker, type GiftDeps } from "../gifts/use-gift-maker";
import { DropClient, type DropDeps } from "../mail/drop-client";
import { ME, type ChatAction } from "../messages/conversations";
import { formatPhotoDate, formatToday } from "./format";
import type { PhotoStore } from "./photo-store";
import { useDaily5 } from "./use-daily5";

type Daily5ClientProps = {
  store: PhotoStore | null;
  /** Keeps the store open until a pick or import in flight has finished writing. */
  track?: TrackStoreWork;
  now: () => number;
  hasFace: (image: Blob) => Promise<boolean>;
  recipients: RecipientSections;
  dispatch: (a: ChatAction) => void;
  nav: NavProps;
  /** For "send as a gift" (docs/specs/gifts.md, GIFT-17). */
  gifts?: GiftDeps;
  /** For "drop in a mailbox" (docs/specs/mail.md). */
  drops?: DropDeps;
};

const POOL_LABELS = { mine: "My photos", family: "Family computer" } as const;

export function Daily5Client({ store, track, now, hasFace, recipients, dispatch, nav, gifts, drops }: Daily5ClientProps) {
  const { state, addFiles } = useDaily5(store, now, hasFace, track);
  const [toast, setToast] = useState<string>();
  const [dropping, setDropping] = useState<string | null>(null);
  const gift = useGiftMaker(gifts ?? noGiftDeps, { now, nav, onSent: (name) => setToast(`Wrapped and on its way to ${name}`) });
  const dropPhoto = state.photos.find((p) => p.id === dropping);
  const cards = state.photos.map((p) => {
    const dateLabel = formatPhotoDate(p.takenAt);
    return { id: p.id, src: p.src, alt: `Photo from ${dateLabel}`, dateLabel };
  });

  return (
    <>
    <Daily5Screen
      todayLabel={formatToday(new Date(now()))}
      cards={cards}
      loading={state.loading}
      pools={(["mine", "family"] as const).map((id) => ({ id, label: POOL_LABELS[id], ...state.pools[id] }))}
      recipients={recipients}
      onAddFiles={addFiles}
      onSend={({ cardId, recipientId, note }) => {
        const photo = state.photos.find((p) => p.id === cardId);
        if (!photo) return;
        // Sealed until a reply (docs/specs/messages.md, MSG-4).
        dispatch({
          type: "sendMemory",
          id: crypto.randomUUID(),
          conversationId: recipientId,
          photoId: cardId,
          takenAt: photo.takenAt,
          ...(photo.fileDated ? { fileDated: photo.fileDated } : {}),
          note,
          at: now(),
        });
      }}
      nav={nav}
      onGift={
        gifts &&
        ((cardId) => {
          const p = state.photos.find((x) => x.id === cardId);
          if (p) gift.start({ photo: { kind: "stored", photoId: p.id }, takenAt: p.takenAt, ...(p.fileDated ? { fileDated: p.fileDated } : {}) });
        })
      }
      onMailbox={drops && setDropping}
      toast={toast}
      onDismissToast={() => setToast(undefined)}
    />
    {gift.maker}
    {drops && dropPhoto && <DropClient {...drops} photo={{ id: dropPhoto.id, src: dropPhoto.src, alt: `Photo from ${formatPhotoDate(dropPhoto.takenAt)}`, takenAt: dropPhoto.takenAt }} from={ME} now={now} onClose={() => setDropping(null)} />}
    </>
  );
}
