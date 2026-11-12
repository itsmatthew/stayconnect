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
import type { ReceivedGift } from "./gifts/received";
import { dayKey } from "./gifts/gift";
import { shelf as shelfOf } from "./gifts/received";
import { testGift } from "./gifts/received-client";
import { activity, isLit, suggestion } from "./circle/suggestions";
import { openingCenter, rotate, visibleAround } from "./circle-carousel";
import { RenameSheetClient } from "./group-names/rename-sheet-client";
import type { InboxAction, InboxState, MailSender } from "./mail/inbox";
import { useMailbox } from "./mail/mailbox-client";
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
  /** Gifts you've received; "your gifts" on the tree counts those on your shelf (docs/specs/gifts.md, GIFT-21). */
  gifts?: readonly ReceivedGift[];
  /** A test gift arriving (dev only, GIFT-22), and the way to your shelf. Waiting gifts pop up from AppClient (GIFT-19). */
  giftActions?: { receive: (g: ReceivedGift) => void; onShowShelf: () => void };
  now?: () => number;
  onOpenChat?: (friendId: string) => void;
  nav?: NavProps;
  ornaments?: OrnamentControls;
  /** Renames a group; rejects if it couldn't be saved (docs/specs/group-rename.md, RENAME-4). */
  onRename?: (groupId: string, raw: string) => Promise<void>;
  /** Group id → "46 days · lake weekend" (docs/specs/home.md, HOME-19). */
  countdowns?: Readonly<Record<string, string>>;
  /** Your mailbox, by your circle's tree (docs/specs/mailbox.md). */
  mail?: { state: InboxState; dispatch: (a: InboxAction) => void; recipientName?: string };
};

const noGiftActions = { receive: () => {}, onShowShelf: () => {} };
const noMail = { state: { letters: [], blocked: [], reports: [] }, dispatch: () => {} };

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
  giftActions = noGiftActions,
  now = Date.now,
  onOpenChat = () => {},
  nav = { current: "Circles" },
  ornaments = noOrnaments,
  onRename = async () => {},
  countdowns = {},
  mail = noMail,
}: HomeClientProps) {
  // Your circle is everyone you've placed or can place: the dev control sends as some of them (MAILBOX-8).
  const circleSenders: MailSender[] = friends.map((f) => ({ id: f.id, name: f.name, look: f.look, inCircle: true }));
  const mailbox = useMailbox({ ...mail, now, circle: circleSenders });
  const [testGifts, setTestGifts] = useState(0);
  const [center, setCenter] = useState(() => openingCenter(groups));
  const [sheet, setSheet] = useState<OpenSheet | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
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
      <>
      <CircleScreen
        mailbox={mailbox.tree}
        people={people}
        shelf={{ count: shelfOf(gifts, dayKey(now())).length, onOpen: giftActions.onShowShelf }}
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
      {mailbox.screens}
      {/* Dev only (Next inlines NODE_ENV, so production drops it): receive a gift to test opening one (GIFT-22). */}
      {process.env.NODE_ENV !== "production" && (
        <button
          type="button"
          onClick={() => {
            giftActions.receive(testGift(testGifts, now()));
            setTestGifts(testGifts + 1);
          }}
          aria-label="Receive a test gift"
          title="Receive a test gift (dev only)"
          style={{ position: "fixed", left: 4, top: 250, zIndex: 45, width: 44, height: 44, padding: 0, border: "1.5px dashed #2B3350", borderRadius: 22, background: "rgba(255,248,236,.85)", color: "#2B3350", font: "800 13px system-ui, sans-serif", cursor: "pointer" }}
        >
          🎁+
        </button>
      )}
      </>
    );
  }

  // HOME-12: no circles yet.
  if (!groups.length) return <HomeEmpty nav={nav} onDaily5={() => nav.onNavigate?.("Daily 5")} view={view} onViewChange={setView} />;

  const open = sheet && groups.find((g) => g.id === sheet.groupId);
  const renamingGroup = groups.find((g) => g.id === renaming);
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
        onRename={setRenaming}
        countdowns={countdowns}
      />
      {open && sheet && <OrnamentSheetClient key={`${sheet.groupId}/${sheet.index}`} group={open} index={sheet.index} controls={ornaments} onClose={() => setSheet(null)} />}
      {renamingGroup && <RenameSheetClient group={renamingGroup} onRename={onRename} onClose={() => setRenaming(null)} />}
    </>
  );
}
