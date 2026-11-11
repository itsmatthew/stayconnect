import type { CSSProperties } from "react";
import "../home/home.css";
import { CircleToggle, type CirclesView } from "../home/circle-toggle";
import { HeaderActions, Wordmark } from "../home/header-actions";
import { BottomNav, TopNav, type NavProps } from "../home/main-nav";
import { Scenery, useSceneIds } from "../home/scenery/scenery";
import { INK, KARLA, s } from "../home/units";
import { TreeMailbox } from "../mail/tree-mailbox";
import { CircleTree } from "./circle-tree";
import { RingCard } from "./ring-card";
import { TREE_BOX } from "./ring-layout";
import type { CirclePerson, CircleSuggestion, Ring } from "./types";

type CircleScreenProps = {
  /** Everyone the user can place, placed people in each ring's order. */
  people: readonly CirclePerson[];
  /** "your gifts" on the tree: how many are on your shelf, and the way there (GIFT-21). */
  shelf?: { count: number; onOpen: () => void };
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
  /** Your mailbox, by the tree (docs/specs/mailbox.md, MAILBOX-1). */
  mailbox?: { count: number; label: string; onOpen: () => void };
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

function Tree({ people, onOpenChat, onMove }: CircleScreenProps) {
  return (
    <>
      <CircleTree people={people} onOpenChat={onOpenChat} onMove={onMove} />
    </>
  );
}

/** "your gifts", as on Main.dc.html's tree: a red pill with how many are on your shelf. Looks 32 tall, 44 to tap. */
function ShelfPill({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <button type="button" aria-label={`your gifts, ${count} on your shelf`} onClick={onOpen} style={{ minHeight: 44, padding: 0, border: 0, background: "none", display: "flex", alignItems: "center", cursor: "pointer" }}>
      <span style={{ height: s(32), boxSizing: "border-box", padding: `0 ${s(5)} 0 ${s(9)}`, display: "flex", alignItems: "center", gap: s(5), borderRadius: s(16), border: `${s(2)} solid #2B3350`, background: "#B43A2A", color: "#FFF6DA", boxShadow: `0 ${s(2)} 0 #2B3350` }}>
        <svg width={s(13)} height={s(13)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="11" width="16" height="10" rx="1.5" />
          <rect x="2.5" y="7" width="19" height="4" rx="1" />
          <path d="M12 7v14" />
          <path d="M12 7c-4-6-8-2-5 0zm0 0c4-6 8-2 5 0z" />
        </svg>
        <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontStyle: "italic", fontWeight: 700, fontSize: s(12), whiteSpace: "nowrap" }}>your gifts</span>
        <span style={{ minWidth: s(18), height: s(18), boxSizing: "border-box", padding: `0 ${s(4)}`, borderRadius: s(9), background: "#2B3350", color: "#F7CB4D", fontWeight: 800, fontSize: s(11), lineHeight: s(18), textAlign: "center" }}>{count}</span>
      </span>
    </button>
  );
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
          {/* Where Main.dc.html puts it: left of the trunk, standing on the grass. */}
          {props.mailbox && (
            <div style={{ position: "absolute", left: s(24), top: s(464), zIndex: 1 }}>
              <TreeMailbox {...props.mailbox} />
            </div>
          )}
          {/* Where Main.dc.html puts it: right of the trunk, at the canopy's foot. */}
          {props.shelf && (
            <div style={{ position: "absolute", right: s(12), top: s(534), zIndex: 1 }}>
              <ShelfPill {...props.shelf} />
            </div>
          )}
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
          {/* The phone's spot beside the tree, scaled with it: 171 left of the canopy's center and 146 below. */}
          {props.mailbox && (
            <div style={{ position: "absolute", left: d(WIDE_TREE.cx - 171 * WIDE_TREE.scale), top: d(WIDE_TREE.cy + 146 * WIDE_TREE.scale), "--s": `calc(${WIDE_TREE.scale} * var(--d))`, zIndex: 1 } as CSSProperties}>
              <TreeMailbox {...props.mailbox} />
            </div>
          )}
          {/* The phone's spot right of the tree, scaled with it: its right edge 183 right of the canopy's center, 216 below. */}
          {props.shelf && (
            <div style={{ position: "absolute", left: d(WIDE_TREE.cx + 183 * WIDE_TREE.scale), top: d(WIDE_TREE.cy + 216 * WIDE_TREE.scale), translate: "-100% 0", "--s": `calc(${WIDE_TREE.scale} * var(--d))`, zIndex: 1 } as CSSProperties}>
              <ShelfPill {...props.shelf} />
            </div>
          )}
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
