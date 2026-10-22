import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { HomeClient } from "@/app/intro/home-client";
import { placeholderGroups } from "@/app/intro/placeholder-data";
import { wideLabelZones } from "@/components/home/home-screen";

afterEach(cleanup);

function renderHome() {
  const utils = render(<HomeClient groups={placeholderGroups} />);
  const phone = utils.container.querySelector("[data-layout='phone']") as HTMLElement;
  const wide = utils.container.querySelector("[data-layout='wide']") as HTMLElement;
  return { ...utils, phone, wide };
}

const card = (layout: HTMLElement) => within(layout).getByRole("region", { name: "Selected circle" });
const cardName = (layout: HTMLElement) => within(card(layout)).getByRole("heading").textContent;
const treeNames = (layout: HTMLElement) =>
  Array.from(layout.querySelectorAll("[data-tree-label]"), (el) => el.textContent);
const next = (layout: HTMLElement) => fireEvent.click(within(layout).getByRole("button", { name: "Next circle" }));
/** For many presses in a row: the arrows stay put while the trees rotate, so find them (by role) once. */
const arrows = (layout: HTMLElement) => {
  const nextButton = within(layout).getByRole("button", { name: "Next circle" });
  const prevButton = within(layout).getByRole("button", { name: "Previous circle" });
  return { next: () => fireEvent.click(nextButton), prev: () => fireEvent.click(prevButton) };
};

describe("Home — Your Circles", () => {
  it("opens on Hoops Since ’14, the middle closest circle, with the reference card (HOME-2/4)", () => {
    const { phone } = renderHome();
    const c = card(phone);
    expect(cardName(phone)).toBe("Hoops Since ’14");
    expect(c.textContent).toContain("5");
    expect(c.textContent).toContain("FRIENDS");
    expect(within(c).getByRole("button", { name: "swap photos" })).toBeTruthy();
    for (const caption of ["buzzer beater", "the 6am run", "post-game tacos"]) {
      expect(c.textContent!.replace(/\s+/g, " ")).toContain(caption);
    }
    expect(c.textContent).toContain("last memory yesterday");
  });

  it("announces the card politely (HOME-4)", () => {
    const { phone } = renderHome();
    expect(card(phone).getAttribute("aria-live")).toBe("polite");
  });

  it("Next and Previous rotate the center group, from the closest circles into the other groups (HOME-2)", () => {
    const { phone } = renderHome();
    const { next, prev } = arrows(phone);
    next();
    expect(cardName(phone)).toBe("Apt 4B");
    next();
    next();
    expect(cardName(phone)).toBe("Uni Mates");
    prev();
    prev();
    prev();
    prev();
    expect(cardName(phone)).toBe("Madrid Crew");
  });

  it("wraps around (HOME-2)", () => {
    const { phone } = renderHome();
    const { next, prev } = arrows(phone);
    for (let i = 0; i < 7; i++) next();
    expect(cardName(phone)).toBe("Hoops Since ’14");
    prev();
    prev();
    expect(cardName(phone)).toBe("Fall 24");
  });

  it("opens with closest circles in the center and nearest slots, five trees wide (HOME-2/10)", () => {
    const { phone, wide } = renderHome();
    expect(treeNames(phone)).toEqual(["Madrid Crew", "Hoops Since ’14", "Apt 4B"]);
    expect(treeNames(wide)).toEqual(["Fall 24", "Madrid Crew", "Hoops Since ’14", "Apt 4B", "Family"]);
    expect(cardName(wide)).toBe("Hoops Since ’14");
    const closest = new Set(placeholderGroups.filter((g) => g.closest).map((g) => g.name));
    for (const name of treeNames(wide).slice(1, 4)) expect(closest.has(name!)).toBe(true);
  });

  it("after rotating, phone shows center ±1 and wide center ±2 (HOME-2/3)", () => {
    const { phone, wide } = renderHome();
    next(wide);
    expect(treeNames(phone)).toEqual(["Hoops Since ’14", "Apt 4B", "Family"]);
    expect(treeNames(wide)).toEqual(["Madrid Crew", "Hoops Since ’14", "Apt 4B", "Family", "Uni Mates"]);
    const xs = Array.from(wide.querySelectorAll<SVGGElement>("[data-tree]"), (t) => Number(t.dataset.cx)).sort((a, b) => a - b);
    expect(xs).toEqual([216, 431, 656, 881, 1096]);
  });

  it("each visible tree has its friend-count badge and three ornaments; only the center glows (HOME-3)", () => {
    const { phone } = renderHome();
    const trees = Array.from(phone.querySelectorAll<SVGGElement>("[data-tree]"));
    // Paint order puts the center tree last (on top), as in the reference.
    expect(trees.map((t) => t.dataset.slot)).toEqual(["left", "right", "center"]);
    expect(trees.map((t) => t.dataset.groupId)).toEqual(["madrid-crew", "apt-4b", "hoops-since-14"]);
    for (const t of trees) expect(t.querySelectorAll("[data-ornament]")).toHaveLength(3);
    expect(trees.map((t) => t.querySelector("[data-glow]") !== null)).toEqual([false, false, true]);
    expect(Array.from(phone.querySelectorAll("[data-badge]"), (b) => b.textContent)).toEqual(["6", "5", "3"]);
    expect(phone.querySelector("[data-ring]")).not.toBeNull();
  });

  it("each tree's halo glows in its own canopy color, the center's strongest, in both layouts (HOME-3)", () => {
    const { phone, wide } = renderHome();
    const canopy = (id: string) => placeholderGroups.find((g) => g.id === id)!.palette.canopy;
    for (const layout of [phone, wide]) {
      const trees = Array.from(layout.querySelectorAll<SVGGElement>("[data-tree]"));
      const halos = trees.map((t) => t.querySelector("[data-halo]")!);
      expect(halos.map((h) => h.getAttribute("stroke"))).toEqual(trees.map((t) => canopy(t.dataset.groupId!)));
      const strength = (h: Element) => Number(h.getAttribute("opacity"));
      const center = halos[trees.findIndex((t) => t.dataset.slot === "center")];
      for (const h of halos) if (h !== center) expect(strength(h)).toBeLessThan(strength(center));
    }
  });

  it("the only full-size trees are the group trees; the small distant trees stay (HOME-3)", () => {
    const { phone, wide } = renderHome();
    for (const [layout, n] of [[phone, 3], [wide, 5]] as const) {
      const canopies = Array.from(layout.querySelectorAll("[data-canopy]"));
      expect(canopies).toHaveLength(n);
      for (const c of canopies) expect(c.closest("[data-tree]")).not.toBeNull();
    }
    expect(wide.querySelectorAll("[data-small-tree]").length).toBeGreaterThan(0);
  });

  it("each canopy is shaded by one radial gradient in its own color plus one soft highlight (HOME-3)", () => {
    const { phone, wide } = renderHome();
    for (const layout of [phone, wide]) {
      for (const t of Array.from(layout.querySelectorAll<SVGGElement>("[data-tree]"))) {
        const { palette } = placeholderGroups.find((g) => g.id === t.dataset.groupId)!;
        const canopy = t.querySelector("[data-canopy]")!;
        const shading = t.querySelector("[data-canopy-shading]")!;
        expect(canopy.getAttribute("fill")).toBe(palette.canopy);
        const id = shading.getAttribute("fill")!.match(/^url\(#(.+)\)$/)![1];
        const gradient = layout.querySelector(`radialGradient[id="${id}"]`)!;
        const stops = Array.from(gradient.querySelectorAll("stop"), (st) => st.getAttribute("stop-color"));
        expect(stops).toEqual([palette.highlight, palette.canopy, palette.shade]);
        expect(t.querySelectorAll("[data-canopy-highlight]")).toHaveLength(1);
        // no separate shade blobs: the canopy's own shapes are just the base, the gradient and the highlight
        expect(t.querySelectorAll(`[fill="${palette.shade}"]`)).toHaveLength(0);
      }
    }
  });

  it("toggle has one option pressed, 'your circles' first (HOME-5)", () => {
    const { phone } = renderHome();
    const circles = within(phone).getByRole("button", { name: "your circles" });
    const circle = within(phone).getByRole("button", { name: "your circle" });
    expect(circles.getAttribute("aria-pressed")).toBe("true");
    expect(circle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(circle);
    // "your circle" swaps in the private tree (CIRCLE-1), with the same toggle on top.
    const now = document.querySelector("[data-layout='phone']") as HTMLElement;
    expect(within(now).getByRole("button", { name: "your circles" }).getAttribute("aria-pressed")).toBe("false");
    expect(within(now).getByRole("button", { name: "your circle" }).getAttribute("aria-pressed")).toBe("true");
    expect(within(now).getByRole("group", { name: "Your circle tree" })).toBeTruthy();
  });

  it("has the header and nav, with the current tab marked, in both layouts (HOME-6)", () => {
    const { phone, wide } = renderHome();
    for (const layout of [phone, wide]) {
      const w = within(layout);
      expect(w.getByText("Now & Then")).toBeTruthy();
      for (const name of ["Search", "Notifications, 1 new", "Your account"]) expect(w.getByRole("button", { name })).toBeTruthy();
      const nav = w.getByRole("navigation", { name: "Main" });
      const labels = ["Circles", "Daily 5", "Archive", "Messages", "Me"];
      const items = labels.map((name) => within(nav).getByRole("button", { name }));
      expect(within(nav).getAllByRole("button")).toEqual(items);
      expect(items.map((b) => b.getAttribute("aria-current"))).toEqual(["page", null, null, null, null]);
    }
  });

  it("wide nav sits directly on the sky: no header background, shadow or border (HOME-8)", () => {
    const { wide } = renderHome();
    const header = wide.querySelector("header") as HTMLElement;
    expect(header.style.background).toBe("");
    expect(header.style.backgroundColor).toBe("");
    expect(header.style.boxShadow).toBe("");
    expect(header.style.border).toBe("");
  });

  it("the logo sits left of the wordmark at the wordmark's height, in both layouts (HOME-6)", () => {
    const { phone, wide } = renderHome();
    for (const layout of [phone, wide]) {
      const mark = within(layout).getByText("Now & Then");
      const row = mark.parentElement!;
      const logo = row.querySelector("img")!;
      expect(logo.getAttribute("src")).toContain("logo-365.png");
      expect(row.firstElementChild).toBe(logo);
      expect(logo.style.height).toBe(mark.style.fontSize);
      expect(mark.style.lineHeight).toBe("1");
    }
  });

  it("wide toggle is centered on the screen's width (HOME-8)", () => {
    const { wide } = renderHome();
    const toggle = within(wide).getByRole("button", { name: "your circles" }).closest("[data-toggle-slot]") as HTMLElement;
    expect(toggle.style.left).toBe("50%");
    expect(toggle.style.transform).toBe("translateX(-50%)");
  });

  it("wide nav shows Me as the person icon; the J avatar is only Your account (HOME-6)", () => {
    const { wide } = renderHome();
    const me = within(within(wide).getByRole("navigation", { name: "Main" })).getByRole("button", { name: "Me" });
    expect(me.textContent).toBe("Me");
    expect(me.querySelector("svg")).not.toBeNull();
    expect(within(wide).getByRole("button", { name: "Your account" }).textContent).toBe("J");
  });

  it("wide small trees stay clear of every group label (HOME-8)", () => {
    const { wide } = renderHome();
    const zones = wideLabelZones();
    expect(zones).toHaveLength(5);
    const trees = Array.from(wide.querySelectorAll("[data-small-tree]"), (t) => {
      const [cx, cy, r] = ["data-cx", "data-cy", "data-r"].map((a) => Number(t.getAttribute(a)));
      return { x0: cx - r, x1: cx + r, y0: cy - r, y1: cy + 2.1 * r };
    });
    expect(trees.length).toBeGreaterThan(0);
    for (const z of zones) {
      expect(trees.filter((b) => b.x0 < z.x1 && b.x1 > z.x0 && b.y0 < z.y1 && b.y1 > z.y0)).toEqual([]);
    }
  });

  it("phone and wide layouts are split at 768px (HOME-7/8)", () => {
    const { phone, wide } = renderHome();
    expect(phone.className).toContain("md:hidden");
    expect(wide.className).toMatch(/\bhidden\b/);
    expect(wide.className).toContain("md:block");
  });

  it("animates fog, river and ring with reduced-motion-aware classes; decorative SVG is hidden (HOME-9)", () => {
    const { container, phone } = renderHome();
    expect(phone.querySelector("[data-ring] .hm-anim")).not.toBeNull();
    expect(container.querySelectorAll(".hm-anim").length).toBeGreaterThan(0);
    for (const svg of Array.from(container.querySelectorAll("svg"))) {
      // every svg is decorative or inside an aria-hidden svg/label-bearing control
      const hidden = svg.closest("[aria-hidden='true']");
      expect(hidden).not.toBeNull();
    }
  });
});
