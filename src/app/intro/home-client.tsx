"use client";

import { useState } from "react";
import { CircleScreen } from "@/components/circle/circle-screen";
import { RINGS, type CirclePerson } from "@/components/circle/types";
import type { CirclesView } from "@/components/home/circle-toggle";
import { HomeEmpty } from "@/components/home/home-empty";
import { HomeScreen } from "@/components/home/home-screen";
import type { NavProps } from "@/components/home/main-nav";
import type { CircleGroup, Friend } from "@/components/home/types";
import { initialCircleState, members, overGuide, type CircleAction, type CircleState } from "./circle/rings";
import { newestFirst, type ReceivedGift } from "./circle/gifts";
import { activity, isLit, suggestion } from "./circle/suggestions";
import { openingCenter, rotate, visibleAround } from "./circle-carousel";
import { initialChatState, type ChatState } from "./messages/conversations";
import { OrnamentSheetClient, noOrnaments, type OrnamentControls } from "./ornaments/ornament-sheet-client";

export type { OrnamentControls };

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
  /** Group id → "46 days · lake weekend" (docs/specs/home.md, HOME-19). */
  countdowns?: Readonly<Record<string, string>>;
};

const noChat = initialChatState([]);
const noCircle = initialCircleState({});
/** Which ornament sheet is open. */
type OpenSheet = { groupId: string; index: number };

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
  countdowns = {},
}: HomeClientProps) {
  const [center, setCenter] = useState(() => openingCenter(groups));
  const [sheet, setSheet] = useState<OpenSheet | null>(null);
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

  const open = sheet && groups.find((g) => g.id === sheet.groupId);
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
        onOrnament={(groupId, index) => setSheet({ groupId, index })}
        countdowns={countdowns}
      />
      {open && sheet && <OrnamentSheetClient key={`${sheet.groupId}/${sheet.index}`} group={open} index={sheet.index} controls={ornaments} onClose={() => setSheet(null)} />}
    </>
  );
}
