import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { HomeClient } from "@/app/intro/home-client";
import { placeholderGroups } from "@/app/intro/placeholder-data";
import { wideLabelZones } from "@/components/home/home-screen";
import { WIDE_CHURCH_BOX, WIDE_SCENE } from "@/components/home/scenery/scenery";
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
  it("keeps the center tree and ring at the screen's horizontal center, opening and rotated", () => {
    const { wide } = renderWide();
    for (let i = 0; i < 3; i++) {
      expect(centerCx(wide)).toBe(WIDE_CENTER_X);
      expect(Number(wide.querySelector("[data-ring] ellipse")!.getAttribute("cx"))).toBe(WIDE_CENTER_X);
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

describe("no river on wide screens (HOME-11)", () => {
  const drawsRiver = (el: Element) =>
    Array.from(el.querySelectorAll("[fill],[clip-path],[stroke]")).some((n) =>
      ["fill", "clip-path", "stroke"].some((a) => /hRiver(Clip)?\)/.test(n.getAttribute(a) ?? "")),
    );

  it("the wide layout draws no river, opening or rotated", () => {
    const { wide } = renderWide();
    for (let i = 0; i < 3; i++) {
      expect(wide.querySelector("[data-river]")).toBeNull();
      expect(drawsRiver(wide)).toBe(false);
      next(wide);
    }
  });

  it("the phone layout keeps its river", () => {
    const { container } = renderWide();
    expect(drawsRiver(container.querySelector("[data-layout='phone']")!)).toBe(true);
  });
});
