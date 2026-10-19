"use client";

import { Daily5Screen } from "@/components/daily5/daily5-screen";
import type { RecipientSections } from "@/components/daily5/types";
import type { NavProps } from "@/components/home/main-nav";
import type { ChatAction } from "../messages/conversations";
import { formatPhotoDate, formatToday } from "./format";
import type { PhotoStore } from "./photo-store";
import { useDaily5 } from "./use-daily5";

type Daily5ClientProps = {
  store: PhotoStore | null;
  now: () => number;
  hasFace: (image: Blob) => Promise<boolean>;
  recipients: RecipientSections;
  dispatch: (a: ChatAction) => void;
  nav: NavProps;
};

const POOL_LABELS = { mine: "My photos", family: "Family computer" } as const;

export function Daily5Client({ store, now, hasFace, recipients, dispatch, nav }: Daily5ClientProps) {
  const { state, addFiles } = useDaily5(store, now, hasFace);
  const cards = state.photos.map((p) => {
    const dateLabel = formatPhotoDate(p.takenAt);
    return { id: p.id, src: p.src, alt: `Photo from ${dateLabel}`, dateLabel };
  });

  return (
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
        dispatch({ type: "sendMemory", id: crypto.randomUUID(), conversationId: recipientId, photoId: cardId, takenAt: photo.takenAt, note, at: now() });
      }}
      nav={nav}
    />
  );
}
