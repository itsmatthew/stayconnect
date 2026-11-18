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
  onOpenChat: (id: string) => void;
  onMove: (id: string, ring: Ring) => void;
};

type Drag = { id: string; dx: number; dy: number; over?: Ring };

/** Empty seats on a new tree: Main.dc.html's 5 / 12 / 38, placed as people would be. */
const SEATS: Readonly<Record<Ring, number>> = { nest: 5, branches: 12, bloom: 38 };
/** You, at the center of a new tree. The design's face is 44; 30 keeps it clear of the nest's seats. */
const YOU_SIZE = 30;
const YOU_LOOK = { skin: "#E8B58C", hair: "#3A2418", shirt: "#2A9D8F", bg: "#F6E6CF", ring: "#2A9D8F" };

/**
 * The private tree: three canopy rings, everyone placed in theirs (CIRCLE-1/3/4).
 * Tap opens the chat (CIRCLE-6); press-and-hold picks someone up to drop on another ring (CIRCLE-7).
 * Drawn in TREE_BOX design px; the layout sets `--s`.
 */
export function CircleTree({ people, onOpenChat, onMove }: CircleTreeProps) {
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
  // Nobody placed yet: the tree waits with empty seats (CIRCLE-11).
  const fresh = !people.some((p) => p.ring);
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

      {/* A brand new tree, as Main.dc.html's new account: a dashed seat in each of the design's spots, and you at the center (CIRCLE-11). */}
      {fresh &&
        RINGS.flatMap((ring) =>
          layoutRing(ring, SEATS[ring]).spots.map((spot, i) => (
            <span
              key={`seat-${ring}-${i}`}
              data-seat={ring}
              aria-hidden="true"
              style={{ ...dot(TREE_BOX.cx + spot.dx - spot.size / 2, TREE_BOX.cy + spot.dy - spot.size / 2, spot.size), background: "rgba(255,246,218,.12)", border: `${s(1.5)} dashed rgba(255,246,218,.55)`, pointerEvents: "none" }}
            />
          )),
        )}
      {fresh && (
        <span
          role="img"
          aria-label="You"
          className="yc-lit"
          style={{ ...dot(TREE_BOX.cx - YOU_SIZE / 2, TREE_BOX.cy - YOU_SIZE / 2, YOU_SIZE), background: faceGradient(YOU_LOOK), border: `${s(2.5)} solid #FFF3C4`, boxShadow: `0 0 0 ${s(1.5)} #FFD75E, 0 0 ${s(12)} ${s(5)} rgba(255,221,96,.95)`, pointerEvents: "none" }}
        />
      )}

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
