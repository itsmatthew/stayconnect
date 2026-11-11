"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { TreeGift } from "@/components/circle/circle-tree";
import type { GiftCardLook } from "@/components/gifts/gift-card";
import { GiftUnwrap, type UnwrapPhase } from "@/components/gifts/gift-unwrap";
import { prefersLessMotion } from "@/components/gifts/motion";
import { MemoryArt } from "@/components/home/memory-art";
import type { ArtKind } from "@/components/home/types";
import { ShelfGiftView } from "@/components/me/shelf-gift-view";
import type { ShelfGift } from "@/components/me/gift-shelf";
import { monthCaption, postmark, stampCode, writtenDate } from "./gift";
import { INKS, RIBBONS, colorOf } from "./gift-catalog";
import { shelf, underTree, wrappedLine, type ReceivedGift } from "./received";

const ARTS: readonly ArtKind[] = ["city", "churro", "faces", "people", "cookie", "sunset", "basketball"];

/** A drawn demo photo filling the frame's photo box. TODO(server): received gifts will carry a stored photo. */
function art(kind: string): ReactNode {
  const k = (ARTS as readonly string[]).includes(kind) ? (kind as ArtKind) : "people";
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }}>
      <MemoryArt kind={k} cx={50} cy={50} R={50} />
    </svg>
  );
}

/** The gift as its sender made it, for the card: their frame, photo, note, handwriting, ink, stamp and wrapping (GIFT-18). */
export function receivedLook(g: ReceivedGift, viewerName: string): GiftCardLook {
  const ink = colorOf(INKS, g.note.ink);
  return {
    to: viewerName || "you",
    signature: g.from.name,
    picture: g.photo?.kind === "art" ? art(g.photo.art) : undefined,
    alt: g.takenAt !== undefined ? `Photo from ${writtenDate(g.takenAt)}` : `Photo from ${g.from.name}`,
    frame: g.frame.id,
    stamp: g.frame.dateStamp && g.takenAt !== undefined ? { code: stampCode(g.takenAt), written: writtenDate(g.takenAt) } : undefined,
    written: g.takenAt !== undefined && !g.fileDated ? { text: writtenDate(g.takenAt), hand: g.note.hand, ink } : undefined,
    // The month frame is the month it was sent in.
    monthCaption: monthCaption(g.sentAt),
    note: { text: g.note.text, placeholder: "", hand: g.note.hand, ink, stamp: g.note.stamp, postmark: postmark(g.sentAt) },
    wrap: { pattern: g.wrap.pattern, ribbon: colorOf(RIBBONS, g.wrap.ribbon) },
  };
}

/** Wrapped gifts under the tree, newest first, in their own paper and ribbon (GIFT-19). */
export const treeGifts = (list: readonly ReceivedGift[]): TreeGift[] => underTree(list).map((g) => ({ id: g.id, pattern: g.wrap.pattern, ribbon: colorOf(RIBBONS, g.wrap.ribbon) }));

/** Opened gifts for the shelf, newest first (GIFT-21). */
export const shelfGifts = (list: readonly ReceivedGift[], viewerName: string): ShelfGift[] => shelf(list).map((g) => ({ id: g.id, fromName: g.from.name, look: receivedLook(g, viewerName) }));

/** How long the gift takes to fly to the shelf before the shelf shows (GiftReceive.dc.html). */
const FLY_MS = 950;

/**
 * Opening a gift (GIFT-20): pull the ribbon, turn the card over, Put on my shelf. Opening is saved when it's kept,
 * and only here: nobody is told. Closing before then leaves it wrapped under the tree.
 */
export function useUnwrap({ list, open, viewerName, onKept }: { list: readonly ReceivedGift[]; open: (id: string) => void; viewerName: string; onKept: () => void }) {
  const [state, setState] = useState<{ id: string; phase: UnwrapPhase; flipped: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const g = state && list.find((x) => x.id === state.id);
  const keep = () => {
    if (!state || !g) return;
    open(g.id);
    const done = () => {
      setState(null);
      onKept();
    };
    if (prefersLessMotion()) return done();
    setState({ ...state, phase: "kept", flipped: false });
    timer.current = setTimeout(done, FLY_MS);
  };
  const screen =
    state && g ? (
      <GiftUnwrap
        fromName={g.from.name}
        line={wrappedLine(g)}
        look={receivedLook(g, viewerName)}
        phase={state.phase}
        flipped={state.flipped}
        onPull={() => setState({ ...state, phase: "open" })}
        onFlip={() => setState({ ...state, flipped: !state.flipped })}
        onKeep={keep}
        onClose={() => setState(null)}
      />
    ) : null;
  return { start: (id: string) => setState({ id, phase: "tied", flipped: false }), screen };
}

/** A gift from your shelf, big (GIFT-21). */
export function ShelfGiftScreen({ gift, viewerName, onClose }: { gift: ReceivedGift; viewerName: string; onClose: () => void }) {
  return <ShelfGiftView fromName={gift.from.name} look={receivedLook(gift, viewerName)} onClose={onClose} />;
}

/** TODO(server): stands in for a sender until real gifts arrive. Shown only by the dev control (GIFT-22). */
export function testGift(n: number, now: number): ReceivedGift {
  const pick = <T,>(xs: readonly T[]) => xs[n % xs.length];
  return {
    id: `test-gift-${now}-${n}/me`,
    giftId: `test-gift-${now}-${n}`,
    from: { id: "test-sender", name: "Riley Test" },
    photo: { kind: "art", art: pick(ARTS) },
    takenAt: now - (3 + (n % 5)) * 365 * 86_400_000,
    frame: { id: pick(["instant", "classic", "album", "film", "wood", "month"]), dateStamp: true },
    note: { text: pick(["Thought of you.", "Remember this?", "This one made me laugh."]), hand: pick(["pen", "pencil", "script"]), ink: pick(["navy", "red", "green", "graphite"]), stamp: pick(["tree", "sunrise", "calendar", "heart"]) },
    wrap: { pattern: pick(["candy", "dots", "kraft", "gingham", "newsprint", "stars"]), ribbon: pick(["gold", "red", "cream", "navy"]) },
    opens: { kind: "now" },
    sentAt: now,
  };
}
