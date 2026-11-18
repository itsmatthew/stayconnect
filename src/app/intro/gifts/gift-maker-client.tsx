"use client";

import { useEffect, useState } from "react";
import type { Placements } from "../circle/rings";
import { formatPhotoDate } from "../daily5/format";
import type { PhotoStore, StoredPhoto } from "../daily5/photo-store";
import { conversationId } from "../messages/conversations";
import { usePhotoUrls } from "../messages/use-photo-urls";
import { friendParty, groupParty } from "../parties";
import { CheckoutSheet } from "@/components/gifts/checkout-sheet";
import { GiftMaker, type GiftChip } from "@/components/gifts/gift-maker";
import { SentScreen } from "@/components/gifts/sent-screen";
import { FrameStep, NoteStep, PhotoStep, ToStep, WrapStep } from "@/components/gifts/gift-steps";
import { birthdayShort, upcomingBirthdays, type MonthDay } from "../mail/birthdays";
import type { GiftCardLook } from "@/components/gifts/gift-card";
import type { CircleGroup, Friend, Party } from "@/components/home/types";
import type { SendResult } from "./gift-flow";
import { GIFT_SKU, type Product } from "./payment";
import { canContinue, giftSteps, canOpenStep, dateStampAllowed, dayAfter, dayKey, dayLabel, defaultSide, monthCaption, monthFrameLabel, newestPhotos, nextStep, noteLength, NOTE_MAX, postmark, previousStep, sentLine, shortDay, stampCode, writtenDate, type Gift, type GiftAction, type GiftStep } from "./gift";
import { FRAMES, HANDS, INKS, RIBBONS, STAMPS, WRAPS, colorOf, isAvailable } from "./gift-catalog";
import { giftRecipients } from "./gift-recipients";

const PAGE = 30;
const LABELS: Readonly<Record<GiftStep, string>> = { to: "To", photo: "Photo", frame: "Frame", note: "Note", wrap: "Wrap" };

type GiftMakerClientProps = {
  gift: Gift;
  dispatch: (a: GiftAction) => void;
  onClose: () => void;
  friends: readonly Friend[];
  /** As this viewer sees them: their color, name and logo. */
  groups: readonly CircleGroup[];
  placements: Placements;
  photos: PhotoStore | null;
  /** How the postcard is signed. */
  senderName: string;
  /** Friend id → birthday ("MM-DD"): a badge on who it's for, and "on a day" picks it (GIFT-24). */
  birthdays?: Readonly<Record<string, MonthDay>>;
  now: () => number;
  onDaily5: () => void;
  /** After Done on the sent screen: who it went to (GIFT-17's toast). */
  onSent?: (name: string) => void;
  /** Pays and delivers the gift (GIFT-15). */
  onSend: () => Promise<SendResult | undefined>;
  /** The gift's price, from the payment service (GIFT-14). */
  priceOf: (sku: string) => Promise<Product>;
  /** Dev only: make the next payment fail. */
  onDevFail?: () => void;
};

/** Where checkout is: not open, ready, paying, or back with what went wrong. */
type Checkout = "ready" | "sending" | "failed" | "pending" | "deliveryFailed";

const MESSAGES: Partial<Record<Checkout, string>> = {
  failed: "Payment didn’t go through. Your gift is saved.",
  pending: "Waiting for the purchase to be approved. Your gift is saved.",
  deliveryFailed: "It’s paid for, but it didn’t send. Your gift is saved.",
};

/** The person or group a gift is for, as a party the views can draw. */
function recipientParty({ to }: Gift, friends: readonly Friend[], groups: readonly CircleGroup[]): Party | undefined {
  if (to?.kind === "person") {
    const f = friends.find((x) => x.id === to.id);
    return f && friendParty(f);
  }
  const g = groups.find((x) => x.id === to?.id);
  return g && groupParty(g);
}

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
export function GiftMakerClient({ gift, dispatch, onClose, friends, groups, placements, photos, senderName, birthdays = {}, now, onDaily5, onSend, onSent, priceOf, onDevFail }: GiftMakerClientProps) {
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (checkout && !product) void priceOf(GIFT_SKU).then(setProduct);
  }, [checkout, product, priceOf]);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  /** The step the card was turned over on; the turn lasts until the step changes. */
  const [turnedOn, setTurnedOn] = useState<GiftStep | null>(null);
  const list = usePhotoList(photos);
  const shown = newestPhotos(list ?? [], limit);
  const pickedId = gift.photo?.kind === "stored" ? gift.photo.photoId : undefined;
  const urls = usePhotoUrls(photos, [...new Set([...shown.map((p) => p.id), ...(pickedId ? [pickedId] : [])])]);

  const today = dayKey(now());
  const recipient = recipientParty(gift, friends, groups);
  // Birthdays this week, by tile: "bday Fri" (GIFT-24).
  const soon = upcomingBirthdays(birthdays, friends.map((f) => f.id), today);
  const badges = Object.fromEntries(
    soon.map((u) => [conversationId("friend", u.personId), u.daysAway === 0 ? { short: "bday today", long: "birthday today" } : { short: `bday ${birthdayShort(u.day)}`, long: `birthday ${dayLabel(u.day)}` }]),
  );
  /** Their birthday, if it's coming up and still ahead: "on a day" picks it. */
  const theirBirthday = gift.to?.kind === "person" ? soon.find((u) => u.personId === gift.to?.id && u.daysAway > 0)?.day : undefined;
  const sections = giftRecipients({ friends, groups, placements }, query);
  const stamp = gift.frame.dateStamp && gift.takenAt !== undefined ? { code: stampCode(gift.takenAt), written: writtenDate(gift.takenAt) } : undefined;
  const name = recipient?.name ?? "";
  const placeholder = `Something only ${name || "they"} would get…`;
  const look: GiftCardLook = {
    to: recipient?.name ?? "",
    signature: senderName,
    src: pickedId ? urls[pickedId] : undefined,
    alt: gift.takenAt !== undefined ? `Photo from ${formatPhotoDate(gift.takenAt)}` : "Your photo",
    frame: gift.frame.id,
    stamp,
    // Instant's date is written whether or not the stamp is on, in the note's hand and ink (as designed).
    written: gift.takenAt !== undefined && !gift.fileDated ? { text: writtenDate(gift.takenAt), hand: gift.note.hand, ink: colorOf(INKS, gift.note.ink) } : undefined,
    monthCaption: monthCaption(now()),
    note: { text: gift.note.text, placeholder, hand: gift.note.hand, ink: colorOf(INKS, gift.note.ink), stamp: gift.note.stamp, postmark: postmark(now()) },
    wrap: { pattern: gift.wrap.pattern, ribbon: colorOf(RIBBONS, gift.wrap.ribbon), opens: gift.opens.kind === "on" ? (gift.opens.day ? shortDay(gift.opens.day) : "later") : undefined },
  };

  const base = defaultSide(gift.step);
  const side = base === "wrapped" || turnedOn !== gift.step ? base : base === "photo" ? "postcard" : "photo";
  const steps = giftSteps(gift);
  const chips: GiftChip[] = steps.map((id) => ({
    id,
    label: LABELS[id],
    state: id === gift.step ? "current" : steps.indexOf(id) < steps.indexOf(gift.step) ? "done" : "todo",
    enabled: canOpenStep(gift, id, today),
  }));
  const next = nextStep(gift);
  const back = previousStep(gift);
  const go = (step: GiftStep) => dispatch({ type: "step", step });
  const pickPhoto = (id: string) => {
    const p = list?.find((x) => x.id === id);
    if (p) dispatch({ type: "photo", photo: { kind: "stored", photoId: p.id }, takenAt: p.takenAt, ...(p.fileDated ? { fileDated: true } : {}) });
  };

  const isGroup = gift.to?.kind === "group";
  const group = isGroup ? groups.find((g) => g.id === gift.to?.id) : undefined;
  const price = product?.displayPrice;
  const paid = gift.status === "paid";
  const buttonLabel =
    checkout === "sending" ? "Sending…" : !price ? "…" : checkout === "failed" || checkout === "pending" ? `Try again · ${price}` : checkout === "deliveryFailed" || paid ? (checkout === "deliveryFailed" ? "Try again" : `Send to ${name}`) : `Send to ${name} · ${price}`;
  const pay = async () => {
    setCheckout("sending");
    const result = await onSend();
    if (!result) return setCheckout("ready");
    if (result.kind === "sent") {
      setCheckout(null);
      setSent(true);
    } else setCheckout(result.kind === "cancelled" ? "ready" : result.kind);
  };
  const frameLabel = gift.frame.id === "month" ? monthFrameLabel(now()) : (FRAMES.find((f) => f.id === gift.frame.id)?.label ?? "Classic");
  const rings: readonly [string, string, string] = group ? [group.palette.canopy, group.palette.highlight, group.palette.shade] : ["#6F9B4E", "#E49B2E", "#B43A2A"];

  return (
    <>
    <GiftMaker
      title={recipient ? `A gift for ${recipient.name}` : "A gift"}
      recipient={recipient}
      chips={chips}
      onChip={(id) => go(id as GiftStep)}
      look={look}
      side={side}
      onFlip={() => setTurnedOn(turnedOn === gift.step ? null : gift.step)}
      nextLabel={next ? `Next: ${next}` : `Send to ${name}`}
      canNext={canContinue(gift, today)}
      onNext={() => (next ? go(next) : setCheckout("ready"))}
      onBack={back ? () => go(back) : undefined}
      onClose={onClose}
    >
      {gift.step === "to" && (
        <ToStep
          sections={{ ...sections, groups: sections.groups.map(groupParty), nest: sections.nest.map(friendParty), branches: sections.branches.map(friendParty), everyone: sections.everyone.map(friendParty) }}
          query={query}
          onQuery={setQuery}
          picked={recipient?.id}
          badges={badges}
          onPick={(p) => dispatch({ type: "to", to: { kind: p.kind === "group" ? "group" : "person", id: p.id.slice(p.id.indexOf(":") + 1) } })}
        />
      )}
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
      {gift.step === "frame" && <FrameStep frames={FRAMES.filter(isAvailable).map((f) => (f.id === "month" ? { ...f, label: monthFrameLabel(now()) } : f))} frame={gift.frame.id} onFrame={(id) => dispatch({ type: "frame", id })} src={look.src} dateStamp={gift.frame.dateStamp} stampAllowed={dateStampAllowed(gift)} onDateStamp={(on) => dispatch({ type: "dateStamp", on })} />}
      {gift.step === "note" && (
        <NoteStep
          text={gift.note.text}
          count={`${noteLength(gift.note.text)}/${NOTE_MAX}`}
          placeholder={placeholder}
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
          sample={recipient?.kind === "group" ? "Hey all" : `Hey ${recipient?.name ?? "there"}`}
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
          dayLabel={gift.opens.kind === "on" && gift.opens.day ? `${dayLabel(gift.opens.day)}${gift.opens.day === theirBirthday ? " · their birthday" : ""}` : undefined}
          minDay={dayAfter(today)}
          onOpens={(day) => dispatch({ type: "opens", opens: day === undefined ? { kind: "now" } : { kind: "on", day: day || theirBirthday || "" } })}
        />
      )}
    </GiftMaker>
    {checkout && (
      <CheckoutSheet
        recipient={recipient}
        forLine={group ? `${group.name} · ${group.members.length + 1} people` : name}
        group={isGroup}
        opens={gift.opens.kind === "on" && gift.opens.day ? dayLabel(gift.opens.day) : "right away"}
        inside={`${frameLabel} frame · ${gift.note.text.trim() ? "a note on the back" : "no note"}`}
        wrap={{ pattern: gift.wrap.pattern, ribbon: colorOf(RIBBONS, gift.wrap.ribbon) }}
        buttonLabel={buttonLabel}
        busy={checkout === "sending" || !price}
        paying={checkout === "sending"}
        message={MESSAGES[checkout]}
        onSend={() => void pay()}
        onCancel={() => setCheckout(null)}
        onDevFail={onDevFail}
      />
    )}
    {sent && <SentScreen recipient={recipient} title={`On its way to ${name}`} line={sentLine(gift, name, isGroup)} wrap={{ to: name, ...look.wrap }} rings={rings} onDone={() => { onSent?.(name); onClose(); }} />}
    </>
  );
}
