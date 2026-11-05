import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, emptyData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { colorOverridesKey } from "@/app/intro/colors/local-color-overrides";
import { groupPalette } from "@/app/intro/colors/palette";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";
import { placeholderGroups } from "@/app/intro/placeholder-data";
import type { NavLabel } from "@/components/home/main-nav";

const NOW = new Date(2026, 9, 21, 12).getTime();
let n = 0;
let dbName = "";
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
  dbName = `group-colors-${++n}`;
});
afterEach(cleanup);

const renderApp = (initialTab: NavLabel, data = demoData) =>
  render(
    <AppClient
      initialTab={initialTab}
      data={data}
      now={() => NOW}
      openStore={() => openPhotoStore(`${dbName}-photos`)}
      openArchive={() => openArchiveStore(`${dbName}-archive`)}
      openOrnaments={() => openOrnamentStore(dbName)}
      hasFace={async () => true}
    />,
  );

const openProfile = () => {
  fireEvent.click(screen.getAllByRole("button", { name: /^Madrid Crew, / })[0]);
  fireEvent.click(screen.getAllByRole("button", { name: "Open Madrid Crew profile" })[0]);
};
const logoRing = (name: string) => screen.getAllByRole("img", { name: `${name} logo` })[0].style.boxShadow;
/** jsdom normalises colors to rgb() in styles. */
const asRgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;
const showsColor = (style: string, hex: string) => style.includes(hex) || style.includes(asRgb(hex));

describe("demo data", () => {
  it("every group has a color from the palette, joined dates, and Fall 24 shares red with Madrid Crew", () => {
    for (const g of placeholderGroups) expect(g.palette).toEqual(groupPalette(g.colorId, 0));
    expect(new Set(placeholderGroups.map((g) => g.joinedAt)).size).toBe(placeholderGroups.length);
    const color = (name: string) => placeholderGroups.find((g) => g.name === name)!.colorId;
    expect(color("Madrid Crew")).toBe("red");
    expect(color("Fall 24")).toBe("red");
  });

  it("gives the member color source its data with the switch on, and none with it off", async () => {
    expect((await demoData.memberColors.colorsUsedByMembers(["leo"])).length).toBeGreaterThan(0);
    expect(await emptyData.memberColors.colorsUsedByMembers(["leo"])).toEqual([]);
  });
});

describe("everywhere the same (COLOR-9)", () => {
  it("shows two of my groups in one color as different shades", async () => {
    renderApp("Messages");
    await waitFor(() => expect(screen.getAllByRole("img", { name: "Fall 24 logo" }).length).toBeGreaterThan(0));
    expect(showsColor(logoRing("Madrid Crew"), groupPalette("red", 0).canopy)).toBe(true);
    expect(showsColor(logoRing("Fall 24"), groupPalette("red", 1).canopy)).toBe(true);
  });

  it("applies a saved override on load, and keeps it to this device's storage", async () => {
    localStorage.setItem(colorOverridesKey(".demo"), JSON.stringify({ "madrid-crew": "teal" }));
    renderApp("Messages");
    await waitFor(() => expect(showsColor(logoRing("Madrid Crew"), groupPalette("teal", 0).canopy)).toBe(true));
    // Madrid Crew left red, so Fall 24 is now the first in it.
    expect(showsColor(logoRing("Fall 24"), groupPalette("red", 0).canopy)).toBe(true);
  });

  it("reaches the Archive's circle colors", async () => {
    const data = { ...demoData };
    localStorage.setItem(colorOverridesKey(".demo"), JSON.stringify(Object.fromEntries(placeholderGroups.map((g) => [g.id, "teal"]))));
    const { container } = renderApp("Archive", data);
    const teals = [0, 1, 2].map((s) => groupPalette("teal", s).canopy);
    await waitFor(() => {
      const outlines = [...container.querySelectorAll("[data-outlines]")].flatMap((el) => el.getAttribute("data-outlines")!.split(" ")).filter(Boolean);
      expect(outlines.length).toBeGreaterThan(0);
      for (const c of outlines) expect(teals).toContain(c);
    });
  });
});

describe("color sheet in the app (COLOR-10)", () => {
  const sheet = () => screen.getByRole("dialog", { name: "Madrid Crew color" });
  const open = () => fireEvent.click(screen.getByRole("button", { name: "Color on my screen" }));

  it("recolors on this screen, saves it, and resets", async () => {
    renderApp("Messages");
    openProfile();
    open();
    expect(within(sheet()).getByRole("button", { name: "Red" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(within(sheet()).getByRole("button", { name: "Teal" }));
    expect(screen.queryByRole("dialog", { name: "Madrid Crew color" })).toBeNull();
    await waitFor(() => expect(showsColor(logoRing("Madrid Crew"), groupPalette("teal", 0).canopy)).toBe(true));
    expect(JSON.parse(localStorage.getItem(colorOverridesKey(".demo"))!)).toEqual({ "madrid-crew": "teal" });

    open();
    fireEvent.click(within(sheet()).getByRole("button", { name: "Use group color" }));
    await waitFor(() => expect(showsColor(logoRing("Madrid Crew"), groupPalette("red", 0).canopy)).toBe(true));
    expect(JSON.parse(localStorage.getItem(colorOverridesKey(".demo"))!)).toEqual({});
  });

  it("keeps the entry button at least 44px tall", () => {
    renderApp("Messages");
    openProfile();
    expect(screen.getByRole("button", { name: "Color on my screen" }).style.minHeight).toBe("44px");
  });
});
