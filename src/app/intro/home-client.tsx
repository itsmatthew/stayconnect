"use client";

import { useEffect, useRef, useState } from "react";
import { CircleScreen } from "@/components/circle/circle-screen";
import { RINGS, type CirclePerson } from "@/components/circle/types";
import type { CirclesView } from "@/components/home/circle-toggle";
import { HomeEmpty } from "@/components/home/home-empty";
import { HomeScreen } from "@/components/home/home-screen";
import { OrnamentSheet } from "@/components/home/ornament-sheet";
import type { NavProps } from "@/components/home/main-nav";
import type { CircleGroup, Friend } from "@/components/home/types";
import { initialCircleState, members, overGuide, type CircleAction, type CircleState } from "./circle/rings";
import { newestFirst, type ReceivedGift } from "./circle/gifts";
import { activity, isLit, suggestion } from "./circle/suggestions";
import { openingCenter, rotate, visibleAround } from "./circle-carousel";
import { initialChatState, type ChatState } from "./messages/conversations";
import { CAPTION_MAX } from "./ornaments/ornaments";
import type { OrnamentEdit } from "./ornaments/use-ornaments";

/** Changing a group's ornaments (docs/specs/home.md, HOME-14–17). `groups` already carry the changes. */
export type OrnamentControls = {
  lineOf: (groupId: string, index: number) => string | undefined;
  canUndo: (groupId: string, index: number) => boolean;
  onSave: (groupId: string, index: number, edit: OrnamentEdit) => void;
  onUndo: (groupId: string, index: number) => void;
  /** Downscales a picked photo before it's previewed and saved. */
  decode: (f: File) => Promise<Blob>;
};

type HomeClientProps = {
  groups: readonly CircleGroup[];
  friends?: readonly Friend[];
  /** For who's been close lately (docs/specs/circle.md, CIRCLE-4/9). */
  chat?: ChatState;
  circle?: CircleState;
  circleDispatch?: (a: CircleAction) => void;
  gifts?: readonly ReceivedGift[];
  now?: () => number;
  onOpenChat?: (friendId: string) => void;
  nav?: NavProps;
  ornaments?: OrnamentControls;
};

const noChat = initialChatState([]);
const noCircle = initialCircleState({});
const noOrnaments: OrnamentControls = {
  lineOf: () => undefined,
  canUndo: () => false,
  onSave: () => {},
  onUndo: () => {},
  decode: async (f) => f,
};

type Pending = { image: Blob; url: string };

/** The open ornament sheet and the photo picked in it, not yet saved. The preview URL is revoked when it's dropped. */
function useOrnamentSheet(decode: OrnamentControls["decode"]) {
  const [open, setOpen] = useState<{ groupId: string; index: number } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  // A pick that finishes decoding after the sheet moved on is dropped.
  const pick = useRef(0);
  useEffect(() => () => {
    if (pending) URL.revokeObjectURL(pending.url);
  }, [pending]);
  const show = (next: { groupId: string; index: number } | null) => {
    pick.current++;
    setPending(null);
    setOpen(next);
  };
  const choose = async (file: File) => {
    const mine = ++pick.current;
    const image = await decode(file);
    if (mine === pick.current) setPending({ image, url: URL.createObjectURL(image) });
  };
  return { open, pending, show, choose };
}

export function HomeClient({
  groups,
  friends = [],
  chat = noChat,
  circle: state = noCircle,
  circleDispatch: dispatch = () => {},
  gifts = [],
  now = Date.now,
  onOpenChat = () => {},
  nav = { current: "Circles" },
  ornaments = noOrnaments,
}: HomeClientProps) {
  const [center, setCenter] = useState(() => openingCenter(groups));
  const sheet = useOrnamentSheet(ornaments.decode);
  const [view, setView] = useState<CirclesView>("circles");
  const turn = (delta: number) => setCenter((c) => rotate(c, delta, groups.length));

  if (view === "circle") {
    const at = now();
    const byId = new Map(friends.map((f) => [f.id, f]));
    const person = (f: Friend): CirclePerson => ({
      id: f.id,
      name: f.name,
      look: f.look,
      lit: isLit(activity(chat, f.id, at)),
      ring: state.placements[f.id],
    });
    // Placed people in each ring's order, then everyone not placed yet.
    const placed = RINGS.flatMap((r) => members(state.placements, r).flatMap((id) => (byId.has(id) ? [person(byId.get(id)!)] : [])));
    const people = [...placed, ...friends.filter((f) => !state.placements[f.id]).map(person)];
    const next = suggestion(state, chat, at);
    const name = next && byId.get(next.friendId)?.name;
    return (
      <CircleScreen
        people={people}
        gifts={newestFirst(gifts).map((g) => ({ id: g.id }))}
        crowded={RINGS.filter((r) => overGuide(r, placed.filter((p) => p.ring === r).length))}
        suggestion={next && name ? { name, to: next.to } : undefined}
        onAcceptSuggestion={() => next && dispatch({ type: "place", friendId: next.friendId, ring: next.to })}
        onDismissSuggestion={() => next && dispatch({ type: "dismiss", friendId: next.friendId, at: now() })}
        onOpenChat={onOpenChat}
        onMove={(friendId, ring) => dispatch({ type: "place", friendId, ring })}
        view={view}
        onViewChange={setView}
        nav={nav}
      />
    );
  }

  // HOME-12: no circles yet.
  if (!groups.length) return <HomeEmpty nav={nav} onDaily5={() => nav.onNavigate?.("Daily 5")} view={view} onViewChange={setView} />;

  const open = sheet.open && groups.find((g) => g.id === sheet.open!.groupId);
  return (
    <>
      <HomeScreen
        phone={visibleAround(groups, center, 1) as [CircleGroup, CircleGroup, CircleGroup]}
        wide={visibleAround(groups, center, 2) as [CircleGroup, CircleGroup, CircleGroup, CircleGroup, CircleGroup]}
        view={view}
        onViewChange={setView}
        onPrevious={() => turn(-1)}
        onNext={() => turn(+1)}
        nav={nav}
        onOrnament={(groupId, index) => sheet.show({ groupId, index })}
      />
      {open && sheet.open && (
        <OrnamentSheet
          groupName={open.name}
          rim={open.palette.rim}
          ornaments={
            open.memories.map((memory, i) => ({
              memory,
              line: ornaments.lineOf(open.id, i),
              canUndo: ornaments.canUndo(open.id, i),
            })) as unknown as Parameters<typeof OrnamentSheet>[0]["ornaments"]
          }
          selected={sheet.open.index}
          preview={sheet.pending?.url}
          captionMax={CAPTION_MAX}
          onSelect={(index) => sheet.show({ groupId: open.id, index })}
          onPickFile={sheet.choose}
          onSave={(caption) => {
            ornaments.onSave(open.id, sheet.open!.index, { image: sheet.pending?.image, caption });
            sheet.show(null);
          }}
          onUndo={() => {
            ornaments.onUndo(open.id, sheet.open!.index);
            sheet.show({ ...sheet.open! });
          }}
          onCancel={() => sheet.show(null)}
        />
      )}
    </>
  );
}
