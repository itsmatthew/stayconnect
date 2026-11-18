import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import type { AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { at, BLUE, fixtureData, mine, post, RED } from "./fixtures";

let n = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:photo");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

function renderArchive(now: number, data: AppData = fixtureData([])) {
  const id = ++n;
  return render(
    <AppClient
      initialTab="Archive"
      data={data}
      now={() => now}
      openStore={() => openPhotoStore(`archive-tab-photos-${id}`)}
      openArchive={() => openArchiveStore(`archive-tab-${id}`)}
      hasFace={async () => true}
    />,
  );
}
const slot = (name: string) => screen.getByRole("region", { name });
const feed = async () => within(await screen.findByRole("region", { name: "Feed" })).queryAllByRole("article");
const text = (el: HTMLElement) => el.textContent!.replace(/\s+/g, " ");

describe("the header (ARC-1)", () => {
  it("a bell, the title and you, with no 65 explainer", async () => {
    renderArchive(at(2026, 10, 20));
    expect(await screen.findByRole("heading", { name: "Archive" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Notifications, 1 new" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("note", { name: "How the 65 Archive works" })).toBeNull();
  });
});

describe("this week's card (ARC-10)", () => {
  it("the week, how long is left, and who has posted", async () => {
    renderArchive(at(2026, 10, 20), fixtureData([post("ana", "2026-W43"), post("leo", "2026-W43", { postedAt: at(2026, 10, 19, 15) })]));
    const card = await screen.findByRole("region", { name: "This week" });
    for (const part of ["this week", "Oct 19–25", "5 days left", "closes Sunday night", "2 of 5 friends have posted"]) expect(text(card)).toContain(part);
    expect(card.querySelectorAll("[data-poster]")).toHaveLength(2);
  });

  it("mid-October: add your photo of the week, and of the month; no year or bonus", () => {
    renderArchive(at(2026, 10, 20));
    expect(text(slot("Photo of the week"))).toContain("Add your photo of the week");
    expect(text(slot("Photo of the week"))).toContain("your circles are waiting on you");
    expect(text(slot("Photo of the month"))).toContain("Add your photo of October");
    expect(text(slot("Photo of the month"))).toContain("closes Oct 31");
    expect(screen.queryByRole("region", { name: "Photo of the year" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Bonus week photo" })).toBeNull();
  });

  it("the last week of the month asks for the photo that defines it", () => {
    renderArchive(at(2026, 10, 26));
    expect(text(slot("Photo of the month"))).toContain("the photo that defines your October · closes Oct 31");
  });

  it("December adds the year; the bonus week takes the week's place", () => {
    renderArchive(at(2026, 12, 5));
    expect(text(slot("Photo of the year"))).toContain("Add your photo of 2026");
    cleanup();
    renderArchive(at(2026, 12, 29));
    expect(text(slot("Bonus week photo"))).toContain("Add your bonus week photo");
    expect(text(slot("Bonus week photo"))).toContain("the week between years · closes Sunday");
    expect(screen.queryByRole("region", { name: "Photo of the week" })).toBeNull();
  });

  it("once you've posted: your photo, it's in, and no way to post again (ARC-3)", async () => {
    renderArchive(at(2026, 10, 20), fixtureData([mine("2026-W43")]));
    const week = slot("Photo of the week");
    expect(await within(week).findByText("Your photo of the week is in ✓")).toBeTruthy();
    expect(within(week).getByRole("img")).toBeTruthy();
    expect(within(week).queryByRole("button")).toBeNull();
  });
});

describe("the feed (ARC-5, ARC-7, ARC-8)", () => {
  it("everyone's posts, newest first, without posting your own first", async () => {
    renderArchive(
      at(2026, 10, 20),
      fixtureData([post("ana", "2026-W42", { postedAt: at(2026, 10, 13) }), post("leo", "2026-W43", { postedAt: at(2026, 10, 19) }), post("kim", "2026-09", { postedAt: at(2026, 9, 29) }), post("zed", "2026-W43")]),
    );
    expect((await feed()).map((a) => a.getAttribute("aria-label"))).toEqual(["Leo, Week 43", "Ana, Week 42", "Kim, September"]);
  });

  it("each post: who, their circle in its color, the photo, and a footer in that color", async () => {
    renderArchive(at(2026, 10, 20), fixtureData([post("leo", "2026-W42", { takenAt: at(2026, 10, 13) })]));
    const [leo] = await feed();
    expect(leo.getAttribute("data-variant")).toBe("week");
    expect(leo.getAttribute("data-color")).toBe(RED);
    expect(text(leo)).toContain("Leo");
    expect(text(leo)).toContain("Reds");
    expect(text(leo)).toContain("Tue, Oct 13");
    expect(text(leo)).toContain("WEEK 42");
    expect(within(leo).getByRole("img", { name: "Leo's photo of Week 42" })).toBeTruthy();
    expect(within(leo).getByRole("button", { name: "Message Leo" }).style.minHeight).toBe("44px");
  });

  it("months, years and the bonus week say so under the photo", async () => {
    renderArchive(at(2027, 1, 2), fixtureData([post("kim", "2026-09", { postedAt: at(2026, 9, 29) }), post("leo", "2025", { postedAt: at(2025, 12, 20) }), post("ana", "2026-B", { postedAt: at(2026, 12, 30), takenAt: at(2026, 12, 30) })]));
    const [ana, kim, leo] = await feed();
    expect(kim.getAttribute("data-variant")).toBe("month");
    expect(text(kim)).toContain("September");
    expect(text(kim)).toContain("PHOTO OF THE MONTH");
    expect(kim.getAttribute("data-color")).toBe(BLUE);
    expect(text(leo)).toContain("PHOTO OF THE YEAR");
    expect(text(ana)).toContain("BONUS WEEK");
  });

  it("the send arrow opens a chat with them", async () => {
    renderArchive(at(2026, 10, 20), fixtureData([post("leo", "2026-W42")]));
    const [leo] = await feed();
    fireEvent.click(within(leo).getByRole("button", { name: "Message Leo" }));
    expect(await screen.findByRole("heading", { name: "Leo" })).toBeTruthy();
  });
});

describe("captions (ARC-13)", () => {
  it("show under the photo, and only when there is one", async () => {
    renderArchive(at(2026, 10, 20), fixtureData([post("leo", "2026-W42", { caption: "rooftop, last night", postedAt: at(2026, 10, 14) }), post("ana", "2026-W42")]));
    const [leo, ana] = await feed();
    const cap = within(leo).getByText("rooftop, last night");
    expect(within(leo).getByRole("img", { name: /photo of Week 42/ }).compareDocumentPosition(cap)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(ana.querySelector("[data-caption]")).toBeNull();
  });
});
