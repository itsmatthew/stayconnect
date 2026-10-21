import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, type AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";

const NOW = new Date(2026, 9, 21, 12).getTime();
let n = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

function renderHome(data: AppData = demoData) {
  const name = `countdown-${++n}`;
  const utils = render(
    <AppClient
      data={data}
      now={() => NOW}
      openStore={() => openPhotoStore(`${name}-photos`)}
      openArchive={() => openArchiveStore(`${name}-archive`)}
      openOrnaments={() => openOrnamentStore(`${name}-ornaments`)}
      hasFace={async () => true}
    />,
  );
  const phone = utils.container.querySelector("[data-layout='phone']") as HTMLElement;
  const wide = utils.container.querySelector("[data-layout='wide']") as HTMLElement;
  return { phone, wide };
}
const tags = (layout: HTMLElement) => Array.from(layout.querySelectorAll("[data-countdown]"), (el) => el.textContent);
const goal = (date?: string): Partial<AppData> => ({ goals: () => ({ "madrid-crew": { label: "lake weekend", ...(date ? { date } : {}), setBy: "leo", in: ["leo"] } }) });

describe("next time together on Home (HOME-19)", () => {
  it("a dated goal tags its tree, phone and wide", () => {
    const { phone, wide } = renderHome();
    expect(tags(phone)).toEqual(["46 days · lake weekend"]);
    expect(tags(wide)).toEqual(["46 days · lake weekend"]);
  });

  it("the tag belongs to its own tree, and the tree's name stays just the name", () => {
    const { phone } = renderHome();
    expect(phone.querySelector("[data-countdown]")?.getAttribute("data-countdown")).toBe("madrid-crew");
    expect(Array.from(phone.querySelectorAll("[data-tree-label]"), (el) => el.textContent)).toContain("Madrid Crew");
  });

  it("“1 day”, “today”, then gone after the date", () => {
    expect(tags(renderHome({ ...demoData, ...goal("2026-10-22") }).phone)).toEqual(["1 day · lake weekend"]);
    cleanup();
    expect(tags(renderHome({ ...demoData, ...goal("2026-10-21") }).phone)).toEqual(["today · lake weekend"]);
    cleanup();
    expect(tags(renderHome({ ...demoData, ...goal("2026-10-20") }).phone)).toEqual([]);
  });

  it("an undated goal has no tag", () => {
    const { phone, wide } = renderHome({ ...demoData, ...goal() });
    expect(tags(phone)).toEqual([]);
    expect(tags(wide)).toEqual([]);
  });
});
