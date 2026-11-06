"use client";

import { useEffect, useState } from "react";
import type { Placements } from "../circle/rings";
import { formatPhotoDate } from "../daily5/format";
import type { PhotoStore, StoredPhoto } from "../daily5/photo-store";
import { usePhotoUrls } from "../messages/use-photo-urls";
import { GiftMaker, type GiftChip } from "@/components/gifts/gift-maker";
import { FrameStep, NoteStep, PhotoStep, ToStep, WrapStep } from "@/components/gifts/gift-steps";
import type { GiftCardLook } from "@/components/gifts/gift-card";
import type { Friend } from "@/components/home/types";
import { STEPS, canContinue, canOpenStep, dateStampAllowed, dayAfter, dayKey, defaultSide, newestPhotos, nextStep, noteLength, NOTE_MAX, postmark, previousStep, shortDay, shortYear, writtenDate, type Gift, type GiftAction, type GiftStep } from "./gift";
import { FRAMES, HANDS, INKS, RIBBONS, STAMPS, WRAPS, colorOf, isAvailable } from "./gift-catalog";
import { giftRecipients } from "./gift-recipients";

const PAGE = 30;
const LABELS: Readonly<Record<GiftStep, string>> = { to: "To", photo: "Photo", frame: "Frame", note: "Note", wrap: "Wrap" };

type GiftMakerClientProps = {
  gift: Gift;
  dispatch: (a: GiftAction) => void;
  onClose: () => void;
  friends: readonly Friend[];
  placements: Placements;
  photos: PhotoStore | null;
  /** How the postcard is signed. */
  senderName: string;
  now: () => number;
  onDaily5: () => void;
};

/** Reads the photo pools once the store is open. */
function usePhotoList(store: PhotoStore | null) {
  const [list, setList] = useState<StoredPhoto[] | null>(null);
  useEffect(() => {
    let live = true;
    store?.list().then((l) => {
      if (live) setList(l);
    });
    return () => {
      live = false;
    };
  }, [store]);
  return list;
}

/** The gift maker, wired (docs/specs/gifts.md). Rules are in `gift.ts`; this only connects them to the views. */
export function GiftMakerClient({ gift, dispatch, onClose, friends, placements, photos, senderName, now, onDaily5 }: GiftMakerClientProps) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  /** The step the card was turned over on; the turn lasts until the step changes. */
  const [turnedOn, setTurnedOn] = useState<GiftStep | null>(null);
  const list = usePhotoList(photos);
  const shown = newestPhotos(list ?? [], limit);
  const pickedId = gift.photo?.kind === "stored" ? gift.photo.photoId : undefined;
  const urls = usePhotoUrls(photos, [...new Set([...shown.map((p) => p.id), ...(pickedId ? [pickedId] : [])])]);

  const today = dayKey(now());
  const recipient = friends.find((f) => f.id === gift.to);
  const stamp = gift.frame.dateStamp && gift.takenAt !== undefined ? { year: shortYear(gift.takenAt), written: writtenDate(gift.takenAt) } : undefined;
  const look: GiftCardLook = {
    to: recipient?.name ?? "",
    signature: senderName,
    src: pickedId ? urls[pickedId] : undefined,
    alt: gift.takenAt !== undefined ? `Photo from ${formatPhotoDate(gift.takenAt)}` : "Your photo",
    frame: gift.frame.id,
    stamp,
    note: { text: gift.note.text, hand: gift.note.hand, ink: colorOf(INKS, gift.note.ink), stamp: gift.note.stamp, postmark: postmark(now()) },
    wrap: { pattern: gift.wrap.pattern, ribbon: colorOf(RIBBONS, gift.wrap.ribbon), opens: gift.opens.kind === "on" && gift.opens.day ? shortDay(gift.opens.day) : undefined },
  };

  const base = defaultSide(gift.step);
  const side = base === "wrapped" || turnedOn !== gift.step ? base : base === "photo" ? "postcard" : "photo";
  const chips: GiftChip[] = STEPS.map((id) => ({
    id,
    label: LABELS[id],
    state: id === gift.step ? "current" : STEPS.indexOf(id) < STEPS.indexOf(gift.step) ? "done" : "todo",
    enabled: canOpenStep(gift, id, today),
  }));
  const next = nextStep(gift.step);
  const back = previousStep(gift.step);
  const go = (step: GiftStep) => dispatch({ type: "step", step });
  const pickPhoto = (id: string) => {
    const p = list?.find((x) => x.id === id);
    if (p) dispatch({ type: "photo", photo: { kind: "stored", photoId: p.id }, takenAt: p.takenAt, ...(p.fileDated ? { fileDated: true } : {}) });
  };

  return (
    <GiftMaker
      title={recipient ? `A gift for ${recipient.name}` : "A gift"}
      recipient={recipient}
      chips={chips}
      onChip={(id) => go(id as GiftStep)}
      look={look}
      side={side}
      onFlip={() => setTurnedOn(turnedOn === gift.step ? null : gift.step)}
      nextLabel={next ? `Next: ${next} →` : "Review gift →"}
      // TODO(re-evaluate when checkout is built): Wrap's "Review gift" opens it (GIFT-8).
      canNext={!!next && canContinue(gift, today)}
      onNext={() => next && go(next)}
      onBack={back ? () => go(back) : undefined}
      onClose={onClose}
    >
      {gift.step === "to" && <ToStep sections={giftRecipients(friends, placements, query)} query={query} onQuery={setQuery} picked={gift.to} onPick={(friendId) => dispatch({ type: "to", friendId })} />}
      {gift.step === "photo" && (
        <PhotoStep
          photos={shown.map((p) => ({ id: p.id, label: `Photo from ${formatPhotoDate(p.takenAt)}`, src: urls[p.id] }))}
          loading={list === null}
          picked={pickedId}
          onPick={pickPhoto}
          hasMore={(list?.length ?? 0) > limit}
          onMore={() => setLimit(limit + PAGE)}
          onDaily5={onDaily5}
        />
      )}
      {gift.step === "frame" && <FrameStep frames={FRAMES.filter(isAvailable)} frame={gift.frame.id} onFrame={(id) => dispatch({ type: "frame", id })} src={look.src} dateStamp={gift.frame.dateStamp} stampAllowed={dateStampAllowed(gift)} onDateStamp={(on) => dispatch({ type: "dateStamp", on })} />}
      {gift.step === "note" && (
        <NoteStep
          text={gift.note.text}
          count={`${noteLength(gift.note.text)}/${NOTE_MAX}`}
          onText={(text) => dispatch({ type: "note", text })}
          hands={HANDS.filter(isAvailable)}
          hand={gift.note.hand}
          onHand={(id) => dispatch({ type: "hand", id })}
          inks={INKS.filter(isAvailable)}
          ink={gift.note.ink}
          onInk={(id) => dispatch({ type: "ink", id })}
          stamps={STAMPS.filter(isAvailable)}
          stamp={gift.note.stamp}
          onStamp={(id) => dispatch({ type: "stamp", id })}
          sample={recipient?.name ?? "there"}
        />
      )}
      {gift.step === "wrap" && (
        <WrapStep
          patterns={WRAPS.filter(isAvailable)}
          pattern={gift.wrap.pattern}
          onPattern={(id) => dispatch({ type: "pattern", id })}
          ribbons={RIBBONS.filter(isAvailable)}
          ribbon={gift.wrap.ribbon}
          onRibbon={(id) => dispatch({ type: "ribbon", id })}
          day={gift.opens.kind === "on" ? gift.opens.day : undefined}
          minDay={dayAfter(today)}
          onOpens={(day) => dispatch({ type: "opens", opens: day === undefined ? { kind: "now" } : { kind: "on", day } })}
        />
      )}
    </GiftMaker>
  );
}

