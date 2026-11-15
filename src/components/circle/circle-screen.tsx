import type { CSSProperties } from "react";
import "../home/home.css";
import { CircleToggle, type CirclesView } from "../home/circle-toggle";
import { HeaderActions, Wordmark } from "../home/header-actions";
import { BottomNav, TopNav, type NavProps } from "../home/main-nav";
import { Scenery, useSceneIds } from "../home/scenery/scenery";
import { INK, KARLA, s } from "../home/units";
import { CircleTree } from "./circle-tree";
import { RingCard } from "./ring-card";
import { TREE_BOX } from "./ring-layout";
import type { CirclePerson, CircleSuggestion, Ring } from "./types";

type CircleScreenProps = {
  /** Everyone the user can place, placed people in each ring's order. */
  people: readonly CirclePerson[];
  /** Gifts received, newest first (CIRCLE-12). */
  gifts?: readonly { id: string }[];
  /** Rings past their soft guide (CIRCLE-2). */
  crowded?: readonly Ring[];
  suggestion?: CircleSuggestion;
  onAcceptSuggestion: () => void;
  onDismissSuggestion: () => void;
  onOpenChat: (id: string) => void;
  onMove: (id: string, ring: Ring) => void;
  view: CirclesView;
  onViewChange: (v: CirclesView) => void;
  nav: NavProps;
};

/** Your circle (docs/specs/circle.md): the private tree and its card, in Home's scenery. Phone below 768px, wide at 768px and up. */
export function CircleScreen(props: CircleScreenProps) {
  return (
    <div className="absolute inset-0">
      <PhoneLayout {...props} />
      <WideLayout {...props} />
    </div>
  );
}

function Tree({ people, gifts = [], onOpenChat, onMove }: CircleScreenProps) {
  return <CircleTree people={people} gifts={gifts} onOpenChat={onOpenChat} onMove={onMove} />;
}
function Card({ crowded = [], ...p }: CircleScreenProps) {
  return <RingCard {...p} crowded={crowded} />;
}

// ─── Phone: the reference's 390×844 canvas; the canopy's center is at (195, 318) ────────────────

function PhoneLayout(props: CircleScreenProps) {
  const ids = useSceneIds();
  const { view, onViewChange, nav } = props;
  return (
    <div
      data-layout="phone"
      className="absolute inset-0 overflow-hidden md:hidden"
      style={{ containerType: "size", background: "linear-gradient(#577EB0 0 50%, #7C9A45 50%)" }}
    >
      <div
        className="absolute inset-0"
        style={{ "--u": "min(100cqw / 390, 100cqh / 844)", "--s": "var(--u)", fontFamily: KARLA, color: "#2B3350" } as CSSProperties}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2" style={{ width: s(390), height: s(844) }}>
          <Scenery variant="phone" ids={ids} className="absolute inset-0 h-full w-full" />
          <div style={{ position: "absolute", left: s(195 - TREE_BOX.cx), top: s(318 - TREE_BOX.cy) }}>
            <Tree {...props} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: s(50),
              width: s(390),
              boxSizing: "border-box",
              padding: `0 ${s(20)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Wordmark size={28} />
            <HeaderActions />
          </div>
          <div style={{ position: "absolute", left: s(55), top: s(104) }}>
            <CircleToggle value={view} onChange={onViewChange} />
          </div>
        </div>

        {/* Card and nav hold to the bottom of the screen, as in the reference. */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: s(86), width: s(362), zIndex: 2 }}>
          <Card {...props} />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: s(390), height: s(78), zIndex: 2 }}>
          <BottomNav {...nav} />
        </div>
      </div>
    </div>
  );
}

// ─── Wide: Home's 1312×816 canvas; the tree left of center, the card beside it ─────────────────

/** The tree is drawn larger on wide screens; its canopy's center in the canvas. */
const WIDE_TREE = { scale: 1.3, cx: 500, cy: 385 } as const;
/** Canvas px, for boxes that rescale `--s` for their own content (so their own offsets mustn't use it). */
const d = (n: number) => `calc(${n} * var(--d))`;

function WideLayout(props: CircleScreenProps) {
  const ids = useSceneIds();
  const { view, onViewChange, nav } = props;
  return (
    <div
      data-layout="wide"
      className="absolute inset-0 hidden overflow-hidden md:block"
      style={{ containerType: "size", background: "linear-gradient(#738DB9 0 50%, #7C9A45 50%)" }}
    >
      <div
        className="absolute inset-0"
        style={{ "--d": "min(100cqw / 1312, 100cqh / 816)", "--s": "var(--d)", fontFamily: KARLA, color: "#2B3350" } as CSSProperties}
      >
        <div className="absolute inset-x-0 top-0" style={{ height: "calc(50% - 408 * var(--d))", background: "linear-gradient(#577EB0, #738DB9)" }} />
        <div className="absolute inset-x-0" style={{ top: "calc(50% - 408 * var(--d))", height: s(816) }}>
          <Scenery variant="wide" ids={ids} />
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: s(1312), height: s(816) }}>
          <div
            style={
              {
                position: "absolute",
                left: d(WIDE_TREE.cx - TREE_BOX.cx * WIDE_TREE.scale),
                top: d(WIDE_TREE.cy - TREE_BOX.cy * WIDE_TREE.scale),
                "--s": `calc(${WIDE_TREE.scale} * var(--d))`,
              } as CSSProperties
            }
          >
            <Tree {...props} />
          </div>
          <div style={{ position: "absolute", top: d(118), left: "50%", transform: "translateX(-50%)", "--s": "calc(1.18 * var(--d))" } as CSSProperties}>
            <CircleToggle value={view} onChange={onViewChange} />
          </div>
          <div
            style={{ position: "absolute", left: d(760), top: d(WIDE_TREE.cy), transform: "translateY(-40%)", "--s": "calc(1.3 * var(--d))" } as CSSProperties}
          >
            <Card {...props} />
          </div>
        </div>

        <header className="absolute inset-x-0 top-0 grid items-center" style={{ height: s(92), gridTemplateColumns: "1fr auto 1fr", padding: `0 ${s(22)}` }}>
          <Wordmark size={34} />
          <TopNav {...nav} />
          <div style={{ justifySelf: "end" }}>
            <HeaderActions avatarSize={50} iconSize={24} color={INK} />
          </div>
        </header>
      </div>
    </div>
  );
}
