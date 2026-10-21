import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { HomeClient } from "@/app/intro/home-client";
import { placeholderGroups } from "@/app/intro/placeholder-data";
import { wideLabelZones } from "@/components/home/home-screen";
import { WIDE_CHURCH_BOX, WIDE_SCENE } from "@/components/home/scenery/scenery";
import { RIVER_FILL, wideRiver } from "@/components/home/wide-river";
import { WIDE_CENTER_X, WIDE_SLOTS } from "@/components/home/wide-row";

afterEach(cleanup);

function renderWide(groups = placeholderGroups) {
  const utils = render(<HomeClient groups={groups} />);
  const wide = utils.container.querySelector("[data-layout='wide']") as HTMLElement;
  return { ...utils, wide };
}
const trees = (wide: HTMLElement) => Array.from(wide.querySelectorAll<SVGGElement>("[data-tree]"));
const centerCx = (wide: HTMLElement) => Number(trees(wide).find((t) => t.dataset.slot === "center")!.dataset.cx);
const next = (wide: HTMLElement) => fireEvent.click(within(wide).getByRole("button", { name: "Next circle" }));

describe("wide row (HOME-10)", () => {
  it("keeps the center tree, ring and river at the screen's horizontal center, opening and rotated", () => {
    const { wide } = renderWide();
    for (let i = 0; i < 3; i++) {
      expect(centerCx(wide)).toBe(WIDE_CENTER_X);
      expect(Number(wide.querySelector("[data-ring] ellipse")!.getAttribute("cx"))).toBe(WIDE_CENTER_X);
      expect(Number(wide.querySelector("[data-river]")!.getAttribute("data-center-x"))).toBe(WIDE_CENTER_X);
      next(wide);
    }
  });

  it("uses five fixed slots, outermost at 216 and 1096", () => {
    expect(WIDE_SLOTS.map((s) => s.cx)).toEqual([216, 431, 656, 881, 1096]);
  });

  it("always shows five trees and no saplings, whatever the number of closest circles", () => {
    for (const extra of [null, "family", "uni-mates"]) {
      const groups = placeholderGroups.map((g) =>
        g.id === extra ? { ...g, closest: !g.closest } : g,
      );
      const { wide } = renderWide(groups);
      expect(trees(wide)).toHaveLength(5);
      expect(wide.querySelector("[data-sapling]")).toBeNull();
      expect(within(wide).queryByRole("button", { name: "more circles" })).toBeNull();
      cleanup();
    }
  });

  it("with three closest circles, the outer slots show the neighbouring groups", () => {
    const groups = placeholderGroups.map((g) => (g.id === "family" ? { ...g, closest: false } : g));
    const { wide } = renderWide(groups);
    expect(trees(wide).find((t) => t.dataset.slot === "center")!.dataset.groupId).toBe("hoops-since-14");
    const names = Array.from(wide.querySelectorAll("[data-tree-label]"), (el) => el.textContent);
    expect(names).toEqual(["Fall 24", "Madrid Crew", "Hoops Since ’14", "Apt 4B", "Family"]);
  });
});

describe("church and center label (HOME-8)", () => {
  it("the center name never overlaps the church tower, and the spire still peeks above the canopy", () => {
    const label = wideLabelZones(0)[2];
    const c = WIDE_CHURCH_BOX;
    const overlap = label.x0 < c.x1 && label.x1 > c.x0 && label.y0 < c.y1 && label.y1 > c.y0;
    expect(overlap).toBe(false);
    const k = WIDE_SCENE.height / 816;
    const center = WIDE_SLOTS[2];
    const canopyTopScene = WIDE_SCENE.top + (center.cy - center.r) * k;
    expect(c.y0).toBeLessThan(canopyTopScene - 20);
    expect(c.x0 + c.x1).toBeCloseTo(2 * WIDE_SCENE.centerX, 5);
  });
});

describe("wide river (HOME-11)", () => {
  const center = WIDE_SLOTS[2];
  const river = wideRiver(center);
  const inCircle = (x: number, y: number, cx: number, cy: number, r: number) => (x - cx) ** 2 + (y - cy) ** 2 < r * r;
  /** Both banks and the middle, every sampled step. */
  const bankPoints = river.points.flatMap((p) => [
    [p.x - p.w, p.y],
    [p.x, p.y],
    [p.x + p.w, p.y],
  ]);
  const trunkBox = (s: (typeof WIDE_SLOTS)[number]) => ({ x0: s.cx - 0.3 * s.r, x1: s.cx + 0.3 * s.r, y0: s.cy + 0.6 * s.r, y1: s.bottom });

  it("is one solid colour, the phone river's blue", () => {
    const { wide } = renderWide();
    const body = wide.querySelector("[data-river] [data-river-body]")!;
    expect(body.getAttribute("fill")).toBe(RIVER_FILL);
    expect(RIVER_FILL).toBe("#3FA9F0");
    expect(wide.querySelector("[data-river]")!.innerHTML).not.toContain("url(#");
  });

  it("rises at the horizon beside the sun", () => {
    const first = river.points[0];
    const horizon = (376 - WIDE_SCENE.top) / (WIDE_SCENE.height / 816);
    expect(Math.abs(first.y - horizon)).toBeLessThan(8);
    expect(Math.abs(first.x - center.cx)).toBeLessThan(110);
  });

  it("passes behind the center canopy, comes out, and never touches it again", () => {
    const touches = (p: { x: number; y: number; w: number }) =>
      [p.x - p.w, p.x, p.x + p.w].some((x) => inCircle(x, p.y, center.cx, center.cy, center.r));
    expect(river.points.some((p) => inCircle(p.x, p.y, center.cx, center.cy, center.r))).toBe(true);
    const behind = river.points.findIndex((p) => inCircle(p.x, p.y, center.cx, center.cy, center.r));
    const out = river.points.findIndex((p, i) => i > behind && !touches(p));
    expect(out).toBeGreaterThan(behind);
    expect(river.points.slice(out).filter(touches)).toEqual([]);
  });

  it("never touches another tree's canopy or any trunk", () => {
    for (const s of WIDE_SLOTS) {
      const t = trunkBox(s);
      for (const [x, y] of bankPoints) {
        if (s !== center) expect(inCircle(x, y, s.cx, s.cy, s.r + 6)).toBe(false);
        expect(x > t.x0 - 4 && x < t.x1 + 4 && y > t.y0 && y < t.y1).toBe(false);
      }
    }
  });

  it("runs clear of the center tree's friend-count badge", () => {
    const bx = center.cx + center.badge[0] * center.r;
    const by = center.cy + center.badge[1] * center.r;
    // the 40px badge is anchored at its top-left corner
    for (const [x, y] of bankPoints) expect(x > bx - 4 && x < bx + 44 && y > by - 4 && y < by + 44).toBe(false);
  });

  it("winds down through the gap between the center tree and its right neighbour", () => {
    const right = WIDE_SLOTS[3];
    const gap = river.points.filter((p) => p.y > center.cy + 0.6 * center.r && p.y < right.bottom + 20 && !inCircle(p.x, p.y, center.cx, center.cy, center.r));
    expect(gap.length).toBeGreaterThan(5);
    for (const p of gap) {
      expect(p.x).toBeGreaterThan(center.cx + 0.3 * center.r);
      expect(p.x).toBeLessThan(right.cx - 0.3 * right.r);
    }
  });

  it("ends behind the card", () => {
    const last = river.points.at(-1)!;
    expect(last.y).toBeGreaterThanOrEqual(700);
    expect(Math.abs(last.x - center.cx)).toBeLessThan(200);
  });

  it("is tied to the center tree, not the screen", () => {
    const moved = wideRiver({ ...center, cx: center.cx - 100 });
    moved.points.forEach((p, i) => {
      expect(p.x).toBeCloseTo(river.points[i].x - 100, 5);
      expect(p.y).toBeCloseTo(river.points[i].y, 5);
    });
  });

  it("flows, with reduced-motion-aware animation", () => {
    const { wide } = renderWide();
    expect(wide.querySelectorAll("[data-river] .hm-anim").length).toBeGreaterThan(0);
  });
});
