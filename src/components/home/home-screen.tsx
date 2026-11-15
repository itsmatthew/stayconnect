import type { CSSProperties } from "react";
import "./home.css";
import { CarouselArrow } from "./carousel-arrow";
import { CircleToggle, type CirclesView } from "./circle-toggle";
import { CircleTree, type TreeSlot } from "./circle-tree";
import { CountBadge } from "./count-badge";
import { DottedRing } from "./dotted-ring";
import { GroupCard } from "./group-card";
import { HeaderActions, Wordmark } from "./header-actions";
import { BottomNav, TopNav } from "./main-nav";
import { Scenery, useSceneIds, WIDE_SCENE, type SceneIds, type Zone } from "./scenery/scenery";
import type { CircleGroup } from "./types";
import { FRAUNCES, INK, KARLA, s } from "./units";

type HomeScreenProps = {
  /** Center ±1, for phones. */
  phone: readonly [CircleGroup, CircleGroup, CircleGroup];
  /** Center ±2, for wide screens. */
  wide: readonly [CircleGroup, CircleGroup, CircleGroup, CircleGroup, CircleGroup];
  view: CirclesView;
  onViewChange: (v: CirclesView) => void;
  onPrevious: () => void;
  onNext: () => void;
};

/** Home — Your Circles (docs/specs/home.md). Phone below 768px, wide at 768px and up. */
export function HomeScreen(props: HomeScreenProps) {
  return (
    <div className="absolute inset-0">
      <PhoneLayout {...props} />
      <WideLayout {...props} />
    </div>
  );
}

const abs = (left: number, top: number, extra: CSSProperties = {}): CSSProperties => ({
  position: "absolute",
  left: s(left),
  top: s(top),
  ...extra,
});

const treeDefs = (ids: SceneIds) => ({ ornShade: ids.ornShade, ornCap: ids.ornCap });


function Label({ name, center, glow = center, style }: { name: string; center: boolean; glow?: boolean; style: CSSProperties }) {
  return (
    <div
      data-tree-label=""
      style={{
        position: "absolute",
        textAlign: "center",
        fontFamily: FRAUNCES,
        fontStyle: "italic",
        fontWeight: center ? 700 : 600,
        color: INK,
        textShadow: glow ? "0 0 8px rgba(255,248,236,.9), 0 0 3px rgba(255,248,236,.9)" : undefined,
        ...style,
      }}
    >
      {name}
    </div>
  );
}

// ─── Phone: the reference's 390×844 canvas, coordinates verbatim ────────────────────────────────

const PHONE_TREES: Record<TreeSlot, { cx: number; cy: number; r: number; bottom: number; shadowRy: number }> = {
  left: { cx: 66, cy: 492, r: 64, bottom: 588, shadowRy: 7.76 },
  center: { cx: 195, cy: 476, r: 100, bottom: 610, shadowRy: 11 },
  right: { cx: 324, cy: 492, r: 64, bottom: 588, shadowRy: 7.76 },
};
const PHONE_LABELS: Record<TreeSlot, CSSProperties> = {
  left: { left: 0, top: s(402), width: s(120), fontSize: s(13) },
  center: { left: 0, top: s(346), width: s(390), fontSize: s(20) },
  right: { left: s(284), top: s(402), width: s(106), fontSize: s(13) },
};
const PHONE_BADGES: Record<TreeSlot, { left: number; top: number; size: number; fontSize: number }> = {
  left: { left: 100, top: 560, size: 24, fontSize: 12 },
  center: { left: 266, top: 574, size: 30, fontSize: 14 },
  right: { left: 352, top: 560, size: 24, fontSize: 12 },
};
const SLOTS: readonly TreeSlot[] = ["left", "center", "right"];

function PhoneLayout({ phone, view, onViewChange, onPrevious, onNext }: HomeScreenProps) {
  const ids = useSceneIds();
  const bySlot = { left: phone[0], center: phone[1], right: phone[2] };
  const tree = (slot: TreeSlot) => (
    <CircleTree key={bySlot[slot].id} group={bySlot[slot]} slot={slot} defs={treeDefs(ids)} {...PHONE_TREES[slot]} />
  );
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
          <Scenery
            variant="phone"
            ids={ids}
            className="absolute inset-0 h-full w-full"
            foreground={
              <>
                <g fill="#F2B23A">
                  <circle cx="44" cy="610" r="2.5" />
                  <circle cx="350" cy="620" r="2.5" />
                  <circle cx="132" cy="566" r="2" />
                </g>
                <g fill="#FFFDF4">
                  <circle cx="330" cy="452" r="1.5" />
                  <circle cx="20" cy="530" r="1.5" />
                  <circle cx="176" cy="622" r="1.5" />
                  <circle cx="380" cy="540" r="1.5" />
                </g>
                <DottedRing cx={195} cy={606} rx={122} ry={25} />
                {tree("left")}
                {tree("right")}
                {tree("center")}
              </>
            }
          />

          <div
            style={abs(0, 50, {
              width: s(390),
              boxSizing: "border-box",
              padding: `0 ${s(20)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            })}
          >
            <Wordmark size={28} />
            <HeaderActions />
          </div>

          <div style={abs(55, 104)}>
            <CircleToggle value={view} onChange={onViewChange} />
          </div>

          {SLOTS.map((slot) => (
            <Label key={slot} name={bySlot[slot].name} center={slot === "center"} style={PHONE_LABELS[slot]} />
          ))}
          {SLOTS.map((slot) => {
            const b = PHONE_BADGES[slot];
            return (
              <div key={slot} style={abs(b.left, b.top)}>
                <CountBadge count={bySlot[slot].friendCount} size={b.size} fontSize={b.fontSize} />
              </div>
            );
          })}

          <div style={abs(14, 592)}>
            <CarouselArrow direction="previous" onClick={onPrevious} />
          </div>
          <div style={abs(332, 592)}>
            <CarouselArrow direction="next" onClick={onNext} />
          </div>
        </div>

        {/* Card and nav hold to the bottom of the screen, as in the reference. */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: s(86), width: s(362) }}>
          <GroupCard group={phone[1]} />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: s(390), height: s(78) }}>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}

// ─── Wide: the desktop mockup's 1312×816 canvas, centered and scaled to fit ─────────────────────

type WideSlot = { cx: number; cy: number; r: number; bottom: number; shadowRy: number; slot: TreeSlot; badge: [number, number] };
const SIDE = { cy: 452, r: 88, bottom: 584, shadowRy: 10.7 };
const WIDE_TREES: readonly WideSlot[] = [
  { ...SIDE, cx: 216, slot: "left", badge: [0.53, 1.06] },
  { ...SIDE, cx: 431, slot: "left", badge: [0.53, 1.06] },
  { cx: 656, cy: 432, r: 135, bottom: 613, shadowRy: 15, slot: "center", badge: [0.71, 0.98] },
  { ...SIDE, cx: 881, slot: "right", badge: [0.44, 1.06] },
  { ...SIDE, cx: 1096, slot: "right", badge: [0.44, 1.06] },
];
/** Paint order: outer trees first, center last. */
const WIDE_PAINT = [0, 4, 1, 3, 2];

/** Each tree's name label box in canvas px: centered over the canopy, one line tall. */
function wideLabelBox(t: WideSlot) {
  const center = t.slot === "center";
  const width = center ? 420 : 180;
  const fontSize = center ? 27 : 18;
  return { left: t.cx - width / 2, top: t.cy - t.r - (center ? 42 : 36), width, fontSize, height: fontSize * 1.3 };
}

/**
 * Label boxes in the wide scene's units (the scene shares the canvas's frame: same height, same center),
 * padded, so the scenery keeps its small trees out from behind label text.
 */
export function wideLabelZones(pad = 6): Zone[] {
  const k = WIDE_SCENE.height / 816;
  const x = (X: number) => WIDE_SCENE.centerX + (X - 656) * k;
  const y = (Y: number) => WIDE_SCENE.top + Y * k;
  return WIDE_TREES.map((t) => {
    const b = wideLabelBox(t);
    return { x0: x(b.left - pad), x1: x(b.left + b.width + pad), y0: y(b.top - pad), y1: y(b.top + b.height + pad) };
  });
}
const WIDE_LABEL_ZONES = wideLabelZones();

function WideLayout({ wide, view, onViewChange, onPrevious, onNext }: HomeScreenProps) {
  const ids = useSceneIds();
  return (
    <div
      data-layout="wide"
      className="absolute inset-0 hidden overflow-hidden md:block"
      // Below the scene frame (taller-than-mockup screens): ground color.
      style={{ containerType: "size", background: "linear-gradient(#738DB9 0 50%, #7C9A45 50%)" }}
    >
      <div
        className="absolute inset-0"
        style={{ "--d": "min(100cqw / 1312, 100cqh / 816)", "--s": "var(--d)", fontFamily: KARLA, color: "#2B3350" } as CSSProperties}
      >
        {/* Above the scene frame: the sky gradient carries on up to the top of the screen, from the sky's top color. */}
        <div
          className="absolute inset-x-0 top-0"
          style={{ height: "calc(50% - 408 * var(--d))", background: "linear-gradient(#577EB0, #738DB9)" }}
        />
        {/* The scene shares the canvas's frame (and scale) vertically and spans the full width. */}
        <div className="absolute inset-x-0" style={{ top: "calc(50% - 408 * var(--d))", height: s(816) }}>
          <Scenery variant="wide" ids={ids} clearZones={WIDE_LABEL_ZONES} />
        </div>

        <svg viewBox="0 0 1312 816" preserveAspectRatio="xMidYMid meet" aria-hidden="true" className="absolute inset-0 h-full w-full">
          <DottedRing cx={656} cy={607} rx={165} ry={34} />
          {WIDE_PAINT.map((i) => {
            const { cx, cy, r, bottom, shadowRy, slot } = WIDE_TREES[i];
            return (
              <CircleTree
                key={wide[i].id}
                group={wide[i]}
                slot={slot}
                defs={treeDefs(ids)}
                {...{ cx, cy, r, bottom, shadowRy }}
              />
            );
          })}
        </svg>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: s(1312), height: s(816) }}>
          {WIDE_TREES.map((t, i) => {
            const b = wideLabelBox(t);
            return (
              <Label
                key={`label-${i}`}
                name={wide[i].name}
                center={t.slot === "center"}
                glow
                style={{ left: s(b.left), top: s(b.top), width: s(b.width), fontSize: s(b.fontSize), lineHeight: 1.3 }}
              />
            );
          })}
          {WIDE_TREES.map((t, i) => {
            const center = t.slot === "center";
            return (
              <div key={`badge-${i}`} style={abs(t.cx + t.badge[0] * t.r, t.cy + t.badge[1] * t.r)}>
                <CountBadge count={wide[i].friendCount} size={center ? 40 : 33} fontSize={center ? 19 : 16} />
              </div>
            );
          })}

          <div style={abs(22, 412)}>
            <CarouselArrow direction="previous" onClick={onPrevious} size={52} />
          </div>
          <div style={abs(1238, 412)}>
            <CarouselArrow direction="next" onClick={onNext} size={52} />
          </div>

          {/* The canvas is centered on the screen, so its center line is the screen's. */}
          <div
            data-toggle-slot=""
            style={{ ...abs(0, 118), left: "50%", transform: "translateX(-50%)", "--s": "calc(1.18 * var(--d))" } as CSSProperties}
          >
            <CircleToggle value={view} onChange={onViewChange} />
          </div>

          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: s(16), "--s": "calc(1.32 * var(--d))" } as CSSProperties}
          >
            <GroupCard group={wide[2]} />
          </div>
        </div>

        <header
          className="absolute inset-x-0 top-0 grid items-center"
          style={{
            height: s(92),
            gridTemplateColumns: "1fr auto 1fr",
            padding: `0 ${s(22)}`,
          }}
        >
          <Wordmark size={34} />
          <TopNav />
          <div style={{ justifySelf: "end" }}>
            <HeaderActions avatarSize={50} iconSize={24} color={INK} />
          </div>
        </header>
      </div>
    </div>
  );
}

