import type { CSSProperties } from "react";
import "./home.css";
import { CarouselArrow } from "./carousel-arrow";
import { CircleToggle, type CirclesView } from "./circle-toggle";
import { CircleTree, ornamentSpots, type TreeSlot } from "./circle-tree";
import { CountBadge } from "./count-badge";
import { DottedRing } from "./dotted-ring";
import { GroupCard } from "./group-card";
import { HeaderActions, Wordmark } from "./header-actions";
import { BottomNav, TopNav, type NavProps } from "./main-nav";
import { Scenery, useSceneIds, type SceneIds, type Zone } from "./scenery/scenery";
import type { CircleGroup } from "./types";
import { FRAUNCES, INK, KARLA, s } from "./units";
import { toSceneZone, WIDE_CENTER_SLOT, WIDE_PAINT, WIDE_SLOTS, wideLabelBox } from "./wide-row";

type HomeScreenProps = {
  /** Center ±1, for phones. */
  phone: readonly [CircleGroup, CircleGroup, CircleGroup];
  /** Center ±2, for wide screens. */
  wide: readonly [CircleGroup, CircleGroup, CircleGroup, CircleGroup, CircleGroup];
  view: CirclesView;
  onViewChange: (v: CirclesView) => void;
  onPrevious: () => void;
  onNext: () => void;
  nav: NavProps;
  /** A tap on one of a group's ornaments (0–2), or on the card's "swap photos" (HOME-13). */
  onOrnament?: (groupId: string, index: number) => void;
  /** Group id → "46 days · lake weekend": the next time together (HOME-19). */
  countdowns?: Readonly<Record<string, string>>;
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


/**
 * The ornaments' tap targets (HOME-13): the trees are decorative SVG, so each bauble gets a round HTML button
 * on top of it, in the same design px.
 */
function OrnamentButtons({ group, slot, cx, cy, r, onOrnament }: { group: CircleGroup; slot: TreeSlot; cx: number; cy: number; r: number; onOrnament?: HomeScreenProps["onOrnament"] }) {
  return ornamentSpots(slot, cx, cy, r).map((o, i) => {
    const R = o.R + 3;
    return (
      <button
        key={`${group.id}-${i}`}
        type="button"
        className="hm-orn"
        aria-label={`Change ornament ${i + 1} of ${group.name}`}
        onClick={() => onOrnament?.(group.id, i)}
        style={abs(o.cx - R, o.cy - R, { width: s(2 * R), height: s(2 * R) })}
      />
    );
  });
}

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

/**
 * The next time together (HOME-19): a small pill by the tree's name (above it; `below` it when `top` is the name's bottom),
 * kept out of the label so the name stays only the name. It centers on the label's column.
 */
function CountdownTag({
  groupId,
  text,
  left,
  top,
  width,
  fontSize,
  below = false,
  align = "center",
}: {
  groupId: string;
  text?: string;
  left: number;
  top: number;
  width: number;
  fontSize: number;
  below?: boolean;
  /** Phone side trees: a tag wider than the name's column hugs the screen edge instead of running off it. */
  align?: "start" | "center" | "end";
}) {
  if (!text) return null;
  const height = fontSize * 1.7;
  const justify = { start: "flex-start", center: "center", end: "flex-end" }[align];
  return (
    <div style={abs(left, below ? top + 3 : top - height - 3, { width: s(width), display: "flex", justifyContent: justify, pointerEvents: "none" })}>
      <span
        data-countdown={groupId}
        style={{
          height: s(height),
          padding: `0 ${s(fontSize * 0.8)}`,
          borderRadius: s(height / 2),
          background: "rgba(255,248,236,.92)",
          border: `${s(1.5)} solid ${INK}`,
          color: INK,
          fontFamily: KARLA,
          fontWeight: 800,
          fontSize: s(fontSize),
          lineHeight: s(height - 3),
          whiteSpace: "nowrap",
          boxShadow: `0 ${s(2)} ${s(4)} rgba(27,31,52,.25)`,
        }}
      >
        {text}
      </span>
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
/** The tags sit above the labels, in the same column (HOME-19). */
const PHONE_TAGS: Record<TreeSlot, { left: number; top: number; width: number; fontSize: number; align: "start" | "center" | "end" }> = {
  left: { left: 4, top: 402, width: 382, fontSize: 10, align: "start" },
  center: { left: 0, top: 346, width: 390, fontSize: 11, align: "center" },
  right: { left: 4, top: 402, width: 382, fontSize: 10, align: "end" },
};
const PHONE_BADGES: Record<TreeSlot, { left: number; top: number; size: number; fontSize: number }> = {
  left: { left: 100, top: 560, size: 24, fontSize: 12 },
  center: { left: 266, top: 574, size: 30, fontSize: 14 },
  right: { left: 352, top: 560, size: 24, fontSize: 12 },
};
const SLOTS: readonly TreeSlot[] = ["left", "center", "right"];

function PhoneLayout({ phone, view, onViewChange, onPrevious, onNext, nav, onOrnament, countdowns = {} }: HomeScreenProps) {
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
          {SLOTS.map((slot) => (
            <CountdownTag key={`tag-${slot}`} groupId={bySlot[slot].id} text={countdowns[bySlot[slot].id]} {...PHONE_TAGS[slot]} />
          ))}
          {SLOTS.map((slot) => {
            const { cx, cy, r } = PHONE_TREES[slot];
            return <OrnamentButtons key={slot} group={bySlot[slot]} slot={slot} cx={cx} cy={cy} r={r} onOrnament={onOrnament} />;
          })}
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
          <GroupCard group={phone[1]} onSwapPhotos={() => onOrnament?.(phone[1].id, 0)} />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: s(390), height: s(78) }}>
          <BottomNav {...nav} />
        </div>
      </div>
    </div>
  );
}

// ─── Wide: the desktop mockup's 1312×816 canvas, centered and scaled to fit ─────────────────────

/** Label boxes in the wide scene's units, padded, so the scenery keeps its small trees out from behind label text. */
export function wideLabelZones(pad = 6): Zone[] {
  return WIDE_SLOTS.map((t) => {
    const b = wideLabelBox(t);
    return toSceneZone({ x0: b.left - pad, x1: b.left + b.width + pad, y0: b.top - pad, y1: b.top + b.height + pad });
  });
}
const CENTER = WIDE_SLOTS[WIDE_CENTER_SLOT];
/** Small trees stay off the labels (HOME-8). There is no river on wide screens (HOME-11). */
const WIDE_CLEAR_ZONES = wideLabelZones();

function WideLayout({ wide, view, onViewChange, onPrevious, onNext, nav, onOrnament, countdowns = {} }: HomeScreenProps) {
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
          <Scenery variant="wide" ids={ids} clearZones={WIDE_CLEAR_ZONES} />
        </div>

        <svg viewBox="0 0 1312 816" preserveAspectRatio="xMidYMid meet" aria-hidden="true" className="absolute inset-0 h-full w-full">
          <DottedRing cx={CENTER.cx} cy={607} rx={165} ry={34} />
          {WIDE_PAINT.map((i) => {
            const { cx, cy, r, bottom, shadowRy, slot } = WIDE_SLOTS[i];
            return <CircleTree key={wide[i].id} group={wide[i]} slot={slot} defs={treeDefs(ids)} {...{ cx, cy, r, bottom, shadowRy }} />;
          })}
        </svg>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: s(1312), height: s(816) }}>
          {WIDE_SLOTS.map((t, i) => {
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
          {WIDE_SLOTS.map((t, i) => {
            const b = wideLabelBox(t);
            // The center name sits right under the toggle, so its tag goes below the name.
            const center = t.slot === "center";
            return (
              <CountdownTag
                key={`tag-${i}`}
                groupId={wide[i].id}
                text={countdowns[wide[i].id]}
                left={b.left}
                top={center ? b.top + b.height : b.top}
                width={b.width}
                fontSize={center ? 14 : 12}
                below={center}
              />
            );
          })}
          {WIDE_SLOTS.map((t, i) => (
            <OrnamentButtons key={`ornaments-${i}`} group={wide[i]} slot={t.slot} cx={t.cx} cy={t.cy} r={t.r} onOrnament={onOrnament} />
          ))}
          {WIDE_SLOTS.map((t, i) => {
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
            <GroupCard group={wide[WIDE_CENTER_SLOT]} onSwapPhotos={() => onOrnament?.(wide[WIDE_CENTER_SLOT].id, 0)} />
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
          <TopNav {...nav} />
          <div style={{ justifySelf: "end" }}>
            <HeaderActions avatarSize={50} iconSize={24} color={INK} />
          </div>
        </header>
      </div>
    </div>
  );
}

