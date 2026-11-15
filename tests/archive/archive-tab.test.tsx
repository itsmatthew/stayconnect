import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import type { AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { at, BLUE, fixtureData, GOLD, GREEN, mine, post, RED } from "./fixtures";

let n = 0;
beforeEach(() => {
  localStorage.clear();
  // The explainer is covered on its own below.
  localStorage.setItem("nowandthen.archive.explainer.v1", "seen");
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
const section = (name: string) => screen.findByRole("region", { name });
const text = (el: HTMLElement) => el.textContent!.replace(/\s+/g, " ");

describe("your slots (ARC-10)", () => {
  it("mid-October: a large weekly slot and a small monthly one, no yearly or bonus", async () => {
    renderArchive(at(2026, 10, 20));
    expect(await screen.findByRole("heading", { name: "65 Archive" })).toBeTruthy();
    const week = slot("Photo of the week");
    expect(week.getAttribute("data-size")).toBe("large");
    expect(text(week)).toContain("Post your photo of the week to see everyone's · closes Sunday");
    const month = slot("Photo of the month");
    expect(month.getAttribute("data-size")).toBe("small");
    expect(text(month)).toContain("Photo of October · closes Oct 31");
    expect(screen.queryByRole("region", { name: "Photo of the year" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Bonus week photo" })).toBeNull();
  });

  it("the last week of the month: the monthly slot grows and asks for the photo that defines it", () => {
    renderArchive(at(2026, 10, 26));
    const month = slot("Photo of the month");
    expect(month.getAttribute("data-size")).toBe("grown");
    expect(text(month)).toContain("The photo that defines your October · closes Oct 31");
  });

  it("December: the yearly slot appears", () => {
    renderArchive(at(2026, 12, 5));
    expect(text(slot("Photo of the year"))).toContain("Your photo of 2026 · closes Dec 31");
  });

  it("the bonus week has its own slot in place of the weekly one", () => {
    renderArchive(at(2026, 12, 29));
    expect(text(slot("Bonus week photo"))).toContain("Bonus week · the week between years · closes Sunday");
    expect(screen.queryByRole("region", { name: "Photo of the week" })).toBeNull();
  });

  it("a posted slot shows your photo, unlocked ✓, and no way to post again (ARC-3)", async () => {
    renderArchive(at(2026, 10, 20), fixtureData([mine("2026-W43")]));
    const week = slot("Photo of the week");
    expect(await within(week).findByText("unlocked ✓")).toBeTruthy();
    expect(within(week).getByRole("img")).toBeTruthy();
    expect(within(week).queryByRole("button")).toBeNull();
  });
});

describe("locked periods (ARC-9)", () => {
  it("counts friends who posted over blurred stand-ins that hold no photo or name", async () => {
    renderArchive(at(2026, 10, 20), fixtureData([post("ana", "2026-W43"), post("sam", "2026-W43"), post("leo", "2026-W43")]));
    const s = await section("Week 43");
    expect(text(s)).toContain("3 friends posted this week — post yours to see them");
    expect(s.querySelectorAll("[data-standin]")).toHaveLength(3);
    expect(s.querySelector("img")).toBeNull();
    expect(within(s).queryAllByRole("article")).toHaveLength(0);
    expect(text(s)).not.toMatch(/Ana|Sam|Leo/);
  });

  it("one friend, and nobody yet", async () => {
    renderArchive(at(2026, 10, 20), fixtureData([post("ana", "2026-W43")]));
    expect(text(await section("Week 43"))).toContain("1 friend posted this week — post yours to see them");
    expect(text(await section("October"))).toContain("No one's posted this month yet — be the first");
  });

  it("a missed period is closed for good", async () => {
    renderArchive(at(2026, 10, 20), fixtureData([post("ana", "2026-W41"), post("sam", "2026-W41")]));
    expect(text(await section("Week 41"))).toContain("2 friends posted week 41 — this one's closed");
  });

  it("a viewer sees their circle's members without posting (ARC-5)", async () => {
    renderArchive(at(2026, 10, 20), fixtureData([post("kim", "2026-W43"), post("ana", "2026-W43")], { viewerOf: ["blues"] }));
    const s = await section("Week 43");
    expect(within(s).getAllByRole("article").map((a) => a.getAttribute("aria-label"))).toEqual(["Kim, Week 43"]);
    expect(text(s)).toContain("1 friend posted this week — post yours to see them");
  });
});

describe("the feed (ARC-7, ARC-8)", () => {
  it("an unlocked week shows each friend's card with circle lines and tags", async () => {
    renderArchive(at(2026, 10, 20), fixtureData([mine("2026-W42"), post("leo", "2026-W42"), post("ana", "2026-W42")]));
    const s = await section("Week 42");
    const cards = within(s).getAllByRole("article");
    expect(cards.map((a) => a.getAttribute("aria-label"))).toEqual(["Leo, Week 42", "Ana, Week 42"]);
    const [leo, ana] = cards;
    expect(leo.getAttribute("data-variant")).toBe("week");
    expect(leo.getAttribute("data-outlines")).toBe([RED, GOLD, GREEN].join(" "));
    expect(text(leo)).toContain("Reds");
    expect(text(leo)).toContain("Golds");
    expect(text(leo)).toContain("+2");
    expect(ana.getAttribute("data-outlines")).toBe(RED);
  });

  it("monthly and yearly cards are a bigger deal", async () => {
    renderArchive(at(2026, 10, 20), fixtureData([mine("2026-09"), post("kim", "2026-09"), mine("2025"), post("leo", "2025")]));
    const month = within(await section("September")).getByRole("article");
    expect(month.getAttribute("data-variant")).toBe("month");
    expect(text(month)).toContain("photo of September");
    expect(month.getAttribute("data-outlines")).toBe(BLUE);
    const year = within(await section("2025")).getByRole("article");
    expect(year.getAttribute("data-variant")).toBe("year");
    expect(text(year)).toContain("photo of 2025");
  });

  it("the bonus week has its own look", async () => {
    renderArchive(at(2027, 1, 2), fixtureData([mine("2026-B"), post("leo", "2026-B")]));
    const card = within(await section("Bonus week")).getByRole("article");
    expect(card.getAttribute("data-variant")).toBe("bonus");
    expect(text(card)).toContain("Bonus week · the week between years");
  });
});

describe("captions on cards (ARC-13)", () => {
  it("show under the photo, and only when there is one", async () => {
    renderArchive(at(2026, 10, 20), fixtureData([mine("2026-W42"), post("leo", "2026-W42", { caption: "rooftop, last night" }), post("ana", "2026-W42")]));
    const [leo, ana] = within(await section("Week 42")).getAllByRole("article");
    const cap = within(leo).getByText("rooftop, last night");
    expect(within(leo).getByRole("img", { name: /photo of Week 42/ }).compareDocumentPosition(cap)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(ana.querySelector("[data-caption]")).toBeNull();
    expect(within(leo).queryByRole("textbox")).toBeNull();
  });
});

describe("explainer (ARC-11)", () => {
  it("shows once, until dismissed", async () => {
    localStorage.removeItem("nowandthen.archive.explainer.v1");
    const now = at(2026, 10, 20);
    const first = renderArchive(now);
    const card = await screen.findByRole("note", { name: "How the 65 Archive works" });
    expect(text(card)).toContain("65 photos a year: 52 weeks, 12 months, 1 year. Post yours to see your friends'.");
    fireEvent.click(within(card).getByRole("button", { name: "Got it" }));
    expect(screen.queryByRole("note", { name: "How the 65 Archive works" })).toBeNull();
    first.unmount();
    renderArchive(now);
    await screen.findByRole("region", { name: "Photo of the week" });
    expect(screen.queryByRole("note", { name: "How the 65 Archive works" })).toBeNull();
  });
});
