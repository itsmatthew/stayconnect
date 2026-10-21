import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import "./circle.css";
import { faceGradient } from "../messages/avatar";
import { FRAUNCES, s } from "../home/units";
import { BANDS, LABELS, layoutRing, ringAt, TREE_BOX } from "./ring-layout";
import { RINGS, type CirclePerson, type Ring } from "./types";

export const RING_NAMES: Readonly<Record<Ring, string>> = { nest: "Nest", branches: "Branches", bloom: "Bloom" };

/** Canopy fills from the reference, outer to center, and the ring each one is. */
const CANOPY: readonly { ring: Ring; fill: string; stroke: string; shine: string; shineWidth: number; shineOpacity: number }[] = [
  { ring: "bloom", fill: "#6F9B4E", stroke: "#56803B", shine: "#8DB565", shineWidth: 0, shineOpacity: 0 },
  { ring: "branches", fill: "#E49B2E", stroke: "#C97F1E", shine: "#F6D36A", shineWidth: 5, shineOpacity: 0.55 },
  { ring: "nest", fill: "#B43A2A", stroke: "#8E2A1E", shine: "#E7884A", shineWidth: 4, shineOpacity: 0.5 },
];
const LABEL_INK: Readonly<Record<Ring, string>> = { bloom: "#FBF4DD", branches: "#FFF6DA", nest: "#FFE9D2" };

const HOLD_MS = 400;
/** A press that wanders this far (design px) before the hold is a scroll or a slip, not a pick-up. */
const SLOP = 8;
const ANNOUNCE_MS = 2500;

type CircleTreeProps = {
  people: readonly CirclePerson[];
  /** Gifts received, newest first (CIRCLE-12). */
  gifts: readonly { id: string }[];
  onOpenChat: (id: string) => void;
  onMove: (id: string, ring: Ring) => void;
};

type Drag = { id: string; dx: number; dy: number; over?: Ring };

/**
 * The private tree: three canopy rings, everyone placed in theirs (CIRCLE-1/3/4).
 * Tap opens the chat (CIRCLE-6); press-and-hold picks someone up to drop on another ring (CIRCLE-7).
 * Drawn in TREE_BOX design px; the layout sets `--s`.
 */
export function CircleTree({ people, gifts, onOpenChat, onMove }: CircleTreeProps) {
  const box = useRef<HTMLDivElement>(null);
  const press = useRef<{ id: string; x: number; y: number; timer?: ReturnType<typeof setTimeout> } | null>(null);
  const swallowClick = useRef(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const glowId = useId();

  useEffect(() => {
    if (!announcement) return;
    const t = setTimeout(() => setAnnouncement(""), ANNOUNCE_MS);
    return () => clearTimeout(t);
  }, [announcement]);
  useEffect(() => () => clearTimeout(press.current?.timer), []);

  /** Screen point → offset from the canopy's center, in design px. */
  const toTree = (e: PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    const k = r.width ? TREE_BOX.width / r.width : 1;
    return { dx: (e.clientX - r.left) * k - TREE_BOX.cx, dy: (e.clientY - r.top) * k - TREE_BOX.cy };
  };

  const down = (p: CirclePerson) => (e: PointerEvent<HTMLButtonElement>) => {
    const { dx, dy } = toTree(e);
    clearTimeout(press.current?.timer);
    const target = e.currentTarget;
    const pointerId = e.pointerId;
    press.current = {
      id: p.id,
      x: dx,
      y: dy,
      timer: setTimeout(() => {
        target.setPointerCapture?.(pointerId);
        setDrag({ id: p.id, dx, dy, over: ringAt(dx, dy) });
      }, HOLD_MS),
    };
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const { dx, dy } = toTree(e);
    if (drag) return setDrag({ ...drag, dx, dy, over: ringAt(dx, dy) });
    const p = press.current;
    if (p && Math.hypot(dx - p.x, dy - p.y) > SLOP) {
      clearTimeout(p.timer);
      press.current = null;
    }
  };
  const up = (p: CirclePerson) => (e: PointerEvent<HTMLButtonElement>) => {
    clearTimeout(press.current?.timer);
    press.current = null;
    if (!drag) return;
    swallowClick.current = true;
    const { dx, dy } = toTree(e);
    const to = ringAt(dx, dy);
    setDrag(null);
    if (to && to !== p.ring) {
      onMove(p.id, to);
      setAnnouncement(`${p.name} moved to ${RING_NAMES[to]}`);
    }
  };
  const cancel = () => {
    clearTimeout(press.current?.timer);
    press.current = null;
    setDrag(null);
  };
  const click = (p: CirclePerson) => () => {
    if (swallowClick.current) {
      swallowClick.current = false;
      return;
    }
    onOpenChat(p.id);
  };

  // Outer rings first, so a drag over the center reads the nest on top.
  const placed = [...RINGS].reverse().flatMap((ring) => {
    const theirs = people.filter((p) => p.ring === ring);
    const { spots, shown } = layoutRing(ring, theirs.length);
    return spots.map((spot, i) => ({ ring, spot, person: i < shown ? theirs[i] : undefined, more: theirs.length - shown }));
  });

  return (
    <div
      ref={box}
      role="group"
      aria-label="Your circle tree"
      data-circle-tree=""
      data-dragging={drag?.id}
      data-highlight={drag?.over}
      style={{ position: "relative", width: s(TREE_BOX.width), height: s(TREE_BOX.height), fontFamily: FRAUNCES, touchAction: drag ? "none" : undefined }}
    >
      <svg viewBox={`0 0 ${TREE_BOX.width} ${TREE_BOX.height}`} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        <defs>
          <radialGradient id={glowId} cx=".5" cy=".5" r=".5">
            <stop offset=".78" stopColor="#F6E25A" stopOpacity=".85" />
            <stop offset="1" stopColor="#F6E25A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform={`translate(${TREE_BOX.cx - 195} ${TREE_BOX.cy - 318})`}>
          <ellipse cx="160" cy="566" rx="130" ry="11" fill="#5E7C33" opacity=".45" />
          <g data-trunk="">
            <path d="M180 452c3 46 0 88-14 114h58c-14-26-17-68-14-114z" fill="#8C4A2B" />
            <path d="M197 452c2 46 4 88 14 114h13c-14-26-17-68-14-114z" fill="#6F3820" />
          </g>
          <circle cx="195" cy="318" r="170" fill={`url(#${glowId})`} />
          {gifts.length > 0 && <GiftPile gifts={gifts} />}
        </g>
        {CANOPY.map((c) => {
          const lit = drag?.over === c.ring;
          const r = BANDS[c.ring].outer;
          return (
            <g key={c.ring} data-canopy={c.ring}>
              <circle cx={TREE_BOX.cx} cy={TREE_BOX.cy} r={r} fill={c.fill} stroke={lit ? "#FFF3C4" : c.stroke} strokeWidth={lit ? 4 : 2} />
              {c.shineWidth > 0 && <circle cx={TREE_BOX.cx} cy={TREE_BOX.cy} r={r} fill="none" stroke={c.shine} strokeWidth={c.shineWidth} opacity={c.shineOpacity} />}
              {c.ring === "bloom" && <path d="M67 102a124 124 0 0 1 60-62" fill="none" stroke={c.shine} strokeWidth="7" strokeLinecap="round" opacity=".7" />}
              {lit && <circle className="yc-pulse" cx={TREE_BOX.cx} cy={TREE_BOX.cy} r={r - 2} fill="#FFF3C4" opacity=".25" />}
            </g>
          );
        })}
      </svg>

      {[...RINGS].reverse().map((ring) => (
        <div
          key={ring}
          data-ring-label=""
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            width: "100%",
            top: s(TREE_BOX.cy + LABELS[ring].top),
            textAlign: "center",
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: s(12),
            lineHeight: s(14),
            color: LABEL_INK[ring],
            pointerEvents: "none",
          }}
        >
          {ring}
        </div>
      ))}

      {placed.map(({ ring, spot, person, more }, i) => {
        const x = TREE_BOX.cx + spot.dx - spot.size / 2;
        const y = TREE_BOX.cy + spot.dy - spot.size / 2;
        if (!person) {
          return (
            <span
              key={`${ring}-more`}
              role="img"
              aria-label={`${more} more in ${RING_NAMES[ring]}`}
              style={{ ...dot(x, y, spot.size), background: "#2B3350", color: "#F7CB4D", fontFamily: "inherit", fontWeight: 800, fontSize: s(spot.size * 0.36), display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              +{more}
            </span>
          );
        }
        const held = drag?.id === person.id;
        const pos = held ? { x: TREE_BOX.cx + drag.dx - spot.size / 2, y: TREE_BOX.cy + drag.dy - spot.size / 2 } : { x, y };
        return (
          <button
            key={person.id}
            type="button"
            aria-label={person.name}
            data-ring={ring}
            data-lit={person.lit}
            className={person.lit ? "yc-lit" : undefined}
            onPointerDown={down(person)}
            onPointerMove={move}
            onPointerUp={up(person)}
            onPointerCancel={cancel}
            onContextMenu={(e) => e.preventDefault()}
            onClick={click(person)}
            style={{
              ...dot(pos.x, pos.y, spot.size),
              padding: 0,
              cursor: held ? "grabbing" : "pointer",
              background: faceGradient(person.look),
              ...(person.lit
                ? { border: `${s(2)} solid #FFF3C4`, boxShadow: `0 0 0 ${s(1.5)} #FFD75E, 0 0 ${s(9)} ${s(4)} rgba(255,221,96,.95)` }
                : { border: `${s(1.5)} solid rgba(50,42,34,.6)`, filter: "grayscale(1) brightness(.78) contrast(.95)" }),
              ...(held ? { transform: "scale(1.25)", zIndex: 5, transition: "none" } : { transition: "left .3s, top .3s" }),
              animationDelay: `${(i % 4) * -0.5}s`,
            }}
          />
        );
      })}

      {gifts.length > 0 && (
        <span
          role="img"
          aria-label={`${gifts.length} ${gifts.length === 1 ? "gift" : "gifts"} received`}
          style={{ position: "absolute", left: s(PILE_BOX.x + TREE_BOX.cx - 195), top: s(PILE_BOX.y + TREE_BOX.cy - 318), width: s(PILE_BOX.w), height: s(PILE_BOX.h), pointerEvents: "none" }}
        />
      )}

      <div role="status" aria-live="polite" style={{ position: "absolute", left: 0, width: "100%", top: s(TREE_BOX.cy + BANDS.bloom.outer + 6), textAlign: "center", pointerEvents: "none" }}>
        {announcement && (
          <span style={{ display: "inline-block", padding: `${s(4)} ${s(12)}`, borderRadius: s(14), background: "#2B3350", color: "#FBF4DD", fontStyle: "italic", fontWeight: 700, fontSize: s(13) }}>
            {announcement}
          </span>
        )}
      </div>
    </div>
  );
}

const dot = (x: number, y: number, size: number): CSSProperties => ({
  position: "absolute",
  left: s(x),
  top: s(y),
  width: s(size),
  height: s(size),
  boxSizing: "border-box",
  borderRadius: "50%",
  border: 0,
});

/**
 * Where a gift box sits under the trunk (reference canvas px), front first: the newest gift takes slot 0.
 * High enough that the phone card (top ≈ 556) doesn't hide them.
 */
const GIFT_SLOTS: readonly { x: number; y: number; w: number; h: number }[] = [
  { x: 128, y: 516, w: 34, h: 26 },
  { x: 178, y: 518, w: 28, h: 22 },
  { x: 92, y: 508, w: 30, h: 24 },
  { x: 150, y: 504, w: 26, h: 20 },
];
/** The pile's footprint, for its accessible label. */
const PILE_BOX = { x: 88, y: 498, w: 152, h: 56 };
/** Wrapping paper from the reference: box, lid, outline, ribbon. */
const WRAPS: readonly (readonly [string, string, string, string])[] = [
  ["#C8402D", "#E0553C", "#6E1D13", "#F7CB4D"],
  ["#2B3350", "#3A4570", "#161B2E", "#F4E9C8"],
  ["#6F9B4E", "#83B05E", "#3E5F2A", "#F2BE4A"],
  ["#4F8F8B", "#63A6A1", "#2C5552", "#F7CB4D"],
  ["#7A4E8C", "#9668A8", "#432650", "#F4E9C8"],
  ["#E49B2E", "#F2B546", "#8F5A12", "#B43A2A"],
];
/** A gift keeps its wrapping however the pile shifts. */
const wrapOf = (id: string) => WRAPS[[...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % WRAPS.length];

/**
 * Gifts the user has received, one box each, newest in front; past the slots, a "+N" chip (CIRCLE-12).
 * TODO(re-evaluate when the memory mailbox is built): gifts can't be opened yet; this pile is where the mailbox goes.
 */
function GiftPile({ gifts }: { gifts: readonly { id: string }[] }) {
  const shown = gifts.slice(0, GIFT_SLOTS.length);
  const more = gifts.length - shown.length;
  return (
    <g data-gift-pile="">
      {/* Back to front, so the newest is drawn last. */}
      {shown
        .map((g, i) => ({ g, slot: GIFT_SLOTS[i] }))
        .reverse()
        .map(({ g, slot: { x, y, w, h } }) => {
          const [box, lid, line, ribbon] = wrapOf(g.id);
          return (
            <g key={g.id} data-gift={g.id} transform={`translate(${x} ${y})`}>
              <rect x="0" y="10" width={w} height={h} rx="3" fill={box} stroke={line} strokeWidth="1.5" />
              <rect x={w / 2 - 4} y="10" width="8" height={h} fill={ribbon} />
              <rect x="-3" y="4" width={w + 6} height="9" rx="2.5" fill={lid} stroke={line} strokeWidth="1.5" />
              <rect x={w / 2 - 4} y="4" width="8" height="9" fill={ribbon} />
              <path transform={`translate(${w / 2} 4)`} d="M0 0c-4-13-13-11-10-4 2 4 6 4 10 4zm0 0c4-13 13-11 10-4-2 4-6 4-10 4z" fill={ribbon} stroke={line} strokeWidth="1.1" />
            </g>
          );
        })}
      {more > 0 && (
        <g data-gift-more="" transform="translate(212 532)">
          <rect width="26" height="16" rx="8" fill="#2B3350" stroke="#FFF3C4" strokeWidth="1.2" />
          <text x="13" y="11.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#F7CB4D" fontFamily="var(--font-karla), system-ui, sans-serif">
            +{more}
          </text>
        </g>
      )}
    </g>
  );
}
