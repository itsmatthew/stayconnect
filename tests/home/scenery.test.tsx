import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Scenery } from "@/components/home/scenery/scenery";

const GOLDEN = readFileSync(path.join(__dirname, "../../public/home-background.svg"), "utf8");

type Zone = { x0: number; x1: number; y0: number; y1: number };
function wideRoot(clearZones?: Zone[]) {
  const html = renderToStaticMarkup(<Scenery variant="wide" clearZones={clearZones} />);
  return new DOMParser().parseFromString(html, "text/html").body;
}

function parse(svg: string) {
  return new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;
}

/** Element tree as comparable data: tag, attributes (ids un-prefixed, styles whitespace-normalized), children. */
type Node = { tag: string; attrs: Record<string, string>; children: Node[] };
function tree(el: Element, unprefix: (v: string) => string): Node {
  const attrs: Record<string, string> = {};
  for (const a of Array.from(el.attributes)) {
    let v = unprefix(a.value);
    if (a.name === "style") v = v.replace(/\s*([:;])\s*/g, "$1").replace(/;$/, "");
    attrs[a.name] = v;
  }
  return {
    tag: el.tagName,
    attrs,
    children: Array.from(el.children)
      .filter((c) => c.tagName !== "metadata")
      .map((c) => tree(c, unprefix)),
  };
}

describe("Scenery", () => {
  it("phone variant is exactly public/home-background.svg (HOME-7)", () => {
    const rendered = parse(renderToStaticMarkup(<Scenery variant="phone" />));
    const prefix = rendered.querySelector("linearGradient")!.id.replace(/hSky$/, "");
    expect(prefix).not.toBe("");
    const unprefix = (v: string) => v.split(prefix).join("");
    const golden = parse(GOLDEN);
    expect(rendered.getAttribute("viewBox")).toBe(golden.getAttribute("viewBox"));
    expect(tree(rendered, unprefix).children).toEqual(tree(golden, (v) => v).children);
  });

  it("wide variant stretches sky and hills but keeps the sun and town in shape (HOME-8)", () => {
    const html = renderToStaticMarkup(<Scenery variant="wide" />);
    const root = new DOMParser().parseFromString(html, "text/html").body;
    const stretch = Array.from(root.querySelectorAll("svg[preserveAspectRatio='none']"));
    const fixed = Array.from(root.querySelectorAll("svg[preserveAspectRatio='xMidYMax meet']"));
    expect(stretch.length).toBeGreaterThan(0);
    expect(fixed.length).toBeGreaterThan(0);
    const inStretch = (sel: string) => stretch.some((s) => s.querySelector(sel));
    const inFixed = (sel: string) => fixed.some((s) => s.querySelector(sel));
    expect(inStretch("rect[height='380']")).toBe(true); // sky
    expect(inStretch("path[fill*='hl6']")).toBe(true); // front hill
    expect(inFixed("circle[r='42']")).toBe(true); // sun
    expect(inStretch("circle[r='42']")).toBe(false);
    for (const s of fixed) expect(s.getAttribute("style")).toContain("overflow:visible");
  });

  it("wide variant has one church tower, centered, and repeats only the houses (HOME-8)", () => {
    const root = wideRoot();
    const spires = root.querySelectorAll("path[d='M259 318L271 286L283 318Z']");
    expect(spires).toHaveLength(1);
    // the tower (x 259–283, center 271) is moved to the scene's center line, x 195
    expect(spires[0].closest("[data-church]")!.getAttribute("transform")).toBe("translate(-76 0)");
    expect(root.querySelectorAll("use[data-repeat='houses']").length).toBeGreaterThanOrEqual(4);
    expect(root.querySelectorAll("use[data-repeat='town']")).toHaveLength(0);
    for (const use of Array.from(root.querySelectorAll("use"))) {
      const target = root.querySelector(use.getAttribute("href")!)!;
      expect(target.querySelector("[data-church]")).toBeNull();
    }
  });

  it("wide variant staggers clouds at different heights and sizes (HOME-8)", () => {
    const clouds = Array.from(wideRoot().querySelectorAll("[data-cloud]"));
    expect(clouds.length).toBeGreaterThanOrEqual(8);
    const ys = new Set(clouds.map((c) => c.getAttribute("data-y")));
    const scales = new Set(clouds.map((c) => c.getAttribute("data-scale")));
    expect(ys.size).toBeGreaterThanOrEqual(clouds.length / 2);
    expect(scales.size).toBeGreaterThanOrEqual(3);
  });

  it("wide variant keeps small trees out of clear zones (HOME-8)", () => {
    const zone = { x0: 100, x1: 300, y0: 375, y1: 400 };
    const trees = (zones?: (typeof zone)[]) =>
      Array.from(wideRoot(zones).querySelectorAll("[data-small-tree]"), (t) => {
        const [cx, cy, r] = ["data-cx", "data-cy", "data-r"].map((a) => Number(t.getAttribute(a)));
        return { x0: cx - r, x1: cx + r, y0: cy - r, y1: cy + 2.1 * r };
      });
    const hits = (b: typeof zone) => b.x0 < zone.x1 && b.x1 > zone.x0 && b.y0 < zone.y1 && b.y1 > zone.y0;
    expect(trees().some(hits)).toBe(true); // without the zone, trees do grow there
    const kept = trees([zone]);
    expect(kept.length).toBeGreaterThanOrEqual(20);
    expect(kept.filter(hits)).toEqual([]);
  });

  it("two scenes on one page don't share gradient ids", () => {
    const html = renderToStaticMarkup(
      <>
        <Scenery variant="phone" />
        <Scenery variant="wide" />
      </>,
    );
    const ids = Array.from(html.matchAll(/ id="([^"]+)"/g), (m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
