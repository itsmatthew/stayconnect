// Geometry of the wide home row, in the desktop mockup's 1312×816 canvas (docs/specs/home.md, HOME-8/10).
// The canvas is centered on the screen, so x 656 is the screen's horizontal center.

import type { TreeSlot } from "./circle-tree";
import type { Zone } from "./scenery/scenery";
import { WIDE_SCENE } from "./scenery/scenery";

export const WIDE_CANVAS = { width: 1312, height: 816 } as const;
export const WIDE_CENTER_X = WIDE_CANVAS.width / 2;

export type WideSlot = { cx: number; cy: number; r: number; bottom: number; shadowRy: number; slot: TreeSlot; badge: [number, number] };

const SIDE = { cy: 452, r: 88, bottom: 584, shadowRy: 10.7 };

/** Five fixed slots, center tree always in the middle: 216 / 431 / 656 / 881 / 1096, as in the mockup. */
export const WIDE_SLOTS: readonly WideSlot[] = [
  { ...SIDE, cx: WIDE_CENTER_X - 440, slot: "left", badge: [0.53, 1.06] },
  { ...SIDE, cx: WIDE_CENTER_X - 225, slot: "left", badge: [0.53, 1.06] },
  { cx: WIDE_CENTER_X, cy: 432, r: 135, bottom: 613, shadowRy: 15, slot: "center", badge: [0.71, 0.98] },
  { ...SIDE, cx: WIDE_CENTER_X + 225, slot: "right", badge: [0.44, 1.06] },
  { ...SIDE, cx: WIDE_CENTER_X + 440, slot: "right", badge: [0.44, 1.06] },
];
export const WIDE_CENTER_SLOT = 2;
/** Paint order: outer trees first, center last. */
export const WIDE_PAINT = [0, 4, 1, 3, 2] as const;

/** The toggle sits at canvas y 118 × 1.18 and is 44 × 1.18 tall. */
const TOGGLE_BOTTOM = (118 + 44) * 1.18;
/**
 * The center name sits just under the toggle rather than on the canopy, leaving room for the church spire
 * between the name and the canopy (the scenery lowers the church to match).
 */
export const CENTER_LABEL_TOP = Math.round(TOGGLE_BOTTOM + 7);

export type LabelBox = { left: number; top: number; width: number; fontSize: number; height: number };

/** A tree's name label box: centered over the canopy, one line tall. */
export function wideLabelBox(t: WideSlot): LabelBox {
  const center = t.slot === "center";
  const width = center ? 420 : 180;
  const fontSize = center ? 27 : 18;
  return { left: t.cx - width / 2, top: center ? CENTER_LABEL_TOP : t.cy - t.r - 36, width, fontSize, height: fontSize * 1.3 };
}

/** A canvas box in the wide scene's units (the scene shares the canvas's frame: same height, same center). */
export function toSceneZone(b: { x0: number; x1: number; y0: number; y1: number }): Zone {
  const k = WIDE_SCENE.height / WIDE_CANVAS.height;
  const x = (X: number) => WIDE_SCENE.centerX + (X - WIDE_CENTER_X) * k;
  const y = (Y: number) => WIDE_SCENE.top + Y * k;
  return { x0: x(b.x0), x1: x(b.x1), y0: y(b.y0), y1: y(b.y1) };
}
