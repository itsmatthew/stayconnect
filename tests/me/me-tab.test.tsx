import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import type { AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { at, fixtureData, mine, post } from "../archive/fixtures";

const NOW = at(2026, 10, 20);
let n = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:photo");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

function renderMe(data: AppData = fixtureData([mine("2026-W42"), mine("2026-09"), mine("2025-03"), post("leo", "2026-W41")])) {
  const id = ++n;
  return render(
    <AppClient
      initialTab="Me"
      data={data}
      now={() => NOW}
      openStore={() => openPhotoStore(`me-photos-${id}`)}
      openArchive={() => openArchiveStore(`me-archive-${id}`)}
      hasFace={async () => true}
    />,
  );
}
const grid = (year: number) => screen.findByRole("list", { name: `Your 65 for ${year}` });
const tiles = (list: HTMLElement) => within(list).getAllByRole("listitem");

describe("Me (ME-1)", () => {
  it("has posts, a year dropdown and a disabled gifts pill", async () => {
    renderMe();
    await grid(2026);
    expect(screen.getByRole("button", { name: "posts" }).getAttribute("aria-current")).toBe("page");
    const year = screen.getByRole("button", { name: "Year, 2026" });
    expect(year.getAttribute("aria-haspopup")).toBe("listbox");
    expect((screen.getByRole("button", { name: /gifts/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("the dropdown lists this year and every year you've posted in, newest first, and switches the grid", async () => {
    renderMe();
    await grid(2026);
    fireEvent.click(screen.getByRole("button", { name: "Year, 2026" }));
    const list = screen.getByRole("listbox", { name: "Year" });
    expect(within(list).getAllByRole("option").map((o) => o.textContent)).toEqual(["2026", "2025"]);
    fireEvent.click(within(list).getByRole("option", { name: "2025" }));
    expect(screen.getByRole("button", { name: "Year, 2025" })).toBeTruthy();
    expect(tiles(await grid(2025))).toHaveLength(65);
  });
});

describe("the 65 grid (ME-2, ME-3)", () => {
  it("2026: the year, each month then its weeks, and the bonus week last", async () => {
    renderMe();
    const all = tiles(await grid(2026));
    expect(all).toHaveLength(66);
    const sizes = all.map((t) => t.getAttribute("data-size"));
    expect(sizes.filter((s) => s === "week")).toHaveLength(52);
    expect(sizes.filter((s) => s === "month")).toHaveLength(12);
    expect(sizes.filter((s) => s === "year")).toHaveLength(1);
    expect(sizes.filter((s) => s === "bonus")).toHaveLength(1);
    expect(all.slice(0, 4).map((t) => t.getAttribute("aria-label"))).toEqual([
      "2026, waiting to be filled",
      "January, waiting to be filled",
      "Week 1, waiting to be filled",
      "Week 2, waiting to be filled",
    ]);
    expect(all.at(-1)!.getAttribute("aria-label")).toBe("Bonus week, waiting to be filled");
  });

  it("your posts fill their slots; other people's never do", async () => {
    renderMe();
    const list = await grid(2026);
    expect(await within(list).findByRole("listitem", { name: "Week 42" })).toBeTruthy();
    expect(within(list).getByRole("listitem", { name: "September" })).toBeTruthy();
    expect(within(list).getByRole("listitem", { name: "Week 41, waiting to be filled" })).toBeTruthy();
    expect(within(within(list).getByRole("listitem", { name: "Week 42" })).getByRole("img")).toBeTruthy();
  });
});

describe("opening a tile (ME-4)", () => {
  it("a filled tile opens your photo and caption, read-only; empty tiles don't open", async () => {
    renderMe(fixtureData([mine("2026-W42"), { ...mine("2026-09"), caption: "the summer we finally went" }]));
    const list = await grid(2026);
    expect(within(within(list).getByRole("listitem", { name: "Week 41, waiting to be filled" })).queryByRole("button")).toBeNull();

    fireEvent.click(within(list).getByRole("button", { name: "Open September" }));
    const open = screen.getByRole("dialog", { name: "September" });
    expect(within(open).getByRole("img")).toBeTruthy();
    expect(open.textContent).toContain("the summer we finally went");
    expect(within(open).queryByRole("textbox")).toBeNull();
    fireEvent.click(within(open).getByRole("button", { name: "Close" }));

    fireEvent.click(within(list).getByRole("button", { name: "Open Week 42" }));
    const week = screen.getByRole("dialog", { name: "Week 42" });
    expect(week.querySelector("[data-caption]")).toBeNull();
  });
});

