import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, emptyData, type AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { receivedKey } from "@/app/intro/gifts/local-received";
import { AppShown } from "@/app/intro/app-shown";
import type { ReceivedGift } from "@/app/intro/gifts/received";

const NOW = new Date(2026, 10, 11, 12).getTime();
let n = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

/** `shown`: the sunrise intro has ended and the app is showing (GIFT-19). */
const app = (data: AppData, initialTab: "Circles" | "Me", id: number) => (
  <AppClient initialTab={initialTab} data={data} now={() => NOW} openStore={() => openPhotoStore(`rcv-photos-${id}`)} openArchive={() => openArchiveStore(`rcv-archive-${id}`)} hasFace={async () => true} />
);
const renderApp = (data: AppData = demoData, initialTab: "Circles" | "Me" = "Circles", shown = false) => {
  const id = ++n;
  return render(<AppShown.Provider value={shown}>{app(data, initialTab, id)}</AppShown.Provider>);
};
/** Opens the app as the user does: the intro ends, and any gift waiting pops up once the saved gifts have loaded. */
const openApp = async (data: AppData = demoData) => {
  const r = renderApp(data, "Circles", true);
  await act(async () => {});
  return r;
};
const phone = () => document.querySelector("[data-layout='phone']") as HTMLElement | null;
const toCircle = () => fireEvent.click(within((phone() ?? document.body).querySelector("[role='group'][aria-label='Circles view']") as HTMLElement).getByRole("button", { name: "your circle" }));
const popup = () => screen.queryByRole("dialog", { name: /sent you a gift$/ });
const unwrap = () => popup()!;
const heading = () => within(unwrap()).getByRole("heading").textContent;
const keep = (from: string) => {
  fireEvent.click(within(unwrap()).getByRole("button", { name: `Pull the ribbon on ${from}’s gift` }));
  fireEvent.click(within(unwrap()).getByRole("button", { name: "Put on my shelf" }));
};
const saved = (): ReceivedGift[] => JSON.parse(localStorage.getItem(receivedKey(".demo")) ?? "[]");

describe("gifts pop up when the app opens (GIFT-19)", () => {
  it("a waiting gift pops up once the intro has ended, not before", async () => {
    const id = ++n;
    const { rerender } = render(<AppShown.Provider value={false}>{app(demoData, "Circles", id)}</AppShown.Provider>);
    await act(async () => {});
    expect(popup()).toBeNull();
    rerender(<AppShown.Provider value={true}>{app(demoData, "Circles", id)}</AppShown.Provider>);
    expect(heading()).toBe("Mom sent you a gift");
  });

  it("several wait their turn, oldest first: the next drops in once one is on the shelf", async () => {
    await openApp();
    expect(heading()).toBe("Mom sent you a gift");
    keep("Mom");
    expect(heading()).toBe("Leo sent you a gift");
    keep("Leo");
    expect(popup()).toBeNull();
    // After the last, your shelf, with the rest.
    const shelf = screen.getByRole("region", { name: "Your shelf" });
    expect(within(shelf).getAllByRole("button", { name: /^Gift from / }).map((b) => b.getAttribute("aria-label")).sort()).toEqual(["Gift from Ana", "Gift from Leo", "Gift from Mom", "Gift from Priya"]);
  });

  it("one already opened doesn't pop up again", async () => {
    const opened = demoData.gifts(NOW).map((g) => (g.id === "placeholder-gift-mom/me" ? { ...g, openedAt: NOW - 1000 } : g));
    localStorage.setItem(receivedKey(".demo"), JSON.stringify(opened));
    await openApp();
    expect(heading()).toBe("Leo sent you a gift");
  });

  it("with none waiting, nothing pops up", async () => {
    await openApp(emptyData);
    expect(popup()).toBeNull();
  });

  it("there are no presents under your tree; 'your gifts' still shows your shelf", async () => {
    renderApp();
    toCircle();
    expect(document.querySelector("[data-gift]")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Open .+'s gift/ })).toBeNull();
    fireEvent.click(within(phone()!).getByRole("button", { name: "your gifts, 2 on your shelf" }));
    expect(screen.getByRole("region", { name: "Your shelf" })).toBeTruthy();
    await act(async () => {});
  });
});

describe("unwrapping (GIFT-20)", () => {
  it("shows the gift as its sender wrapped it, from who and when", async () => {
    await openApp();
    keep("Mom");
    const d = unwrap();
    expect(within(d).getByRole("heading", { name: "Leo sent you a gift" })).toBeTruthy();
    expect(d.textContent).toContain("wrapped Nov 11 · just for you");
    expect(d.textContent).toContain("Pull the ribbon");
    const paper = d.querySelector("[data-unwrap-paper]")!;
    expect(paper.getAttribute("data-pattern")).toBe("stars");
    expect(d.querySelector("[data-unwrap-paper] [data-ribbon]")!.getAttribute("fill")).toBe("#F2BE4A");
    expect(d.textContent).toContain("from Leo");
  });

  it("can't be closed: the only way on is to open it", async () => {
    await openApp();
    expect(within(unwrap()).queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("pulling the ribbon tears it open; the card turns over to the note; Put on my shelf keeps it", async () => {
    await openApp();
    fireEvent.click(within(unwrap()).getByRole("button", { name: "Pull the ribbon on Mom’s gift" }));
    expect(unwrap().getAttribute("data-phase")).toBe("open");
    expect(unwrap().textContent).toContain("Tap to turn it over");
    fireEvent.click(within(unwrap()).getByRole("button", { name: "Turn the card over to read Mom’s note" }));
    expect(unwrap().textContent).toContain("Found this in the kitchen drawer. Love you.");
    expect(unwrap().textContent).toContain("— Mom");
    fireEvent.click(within(unwrap()).getByRole("button", { name: "Put on my shelf" }));
    expect(saved().find((g) => g.id === "placeholder-gift-mom/me")!.openedAt).toBe(NOW);
  });

  it("opening is never told to anyone: nothing is sent, only kept here", async () => {
    await openApp();
    keep("Mom");
    const keys = Object.keys(localStorage);
    expect(keys.filter((k) => /deliver|sent|events/i.test(k) && (localStorage.getItem(k) ?? "").includes("opened"))).toEqual([]);
  });
});

describe("the shelf (GIFT-21)", () => {
  it("fills the cubbies with opened gifts; one opens big and turns over", async () => {
    renderApp(demoData, "Me");
    fireEvent.click(screen.getByRole("button", { name: "gifts" }));
    const shelf = screen.getByRole("region", { name: "Your shelf" });
    expect(within(shelf).getAllByRole("button", { name: /^Gift from / }).map((b) => b.getAttribute("aria-label"))).toEqual(["Gift from Ana", "Gift from Priya"]);
    fireEvent.click(within(shelf).getByRole("button", { name: "Gift from Ana" }));
    const big = screen.getByRole("dialog", { name: "Gift from Ana" });
    fireEvent.click(within(big).getByRole("button", { name: "turn it over" }));
    expect(big.textContent).toContain("Madrid, round two?");
    fireEvent.click(within(big).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "Gift from Ana" })).toBeNull();
    await act(async () => {});
  });

  it("empty with no gifts", () => {
    renderApp(emptyData, "Me");
    fireEvent.click(screen.getByRole("button", { name: "gifts" }));
    expect(within(screen.getByRole("region", { name: "Your shelf" })).queryAllByRole("button", { name: /^Gift from / })).toEqual([]);
  });
});

describe("receive a gift, for testing (GIFT-22)", () => {
  it("pops a new wrapped gift up right away", async () => {
    await openApp(emptyData);
    toCircle();
    fireEvent.click(screen.getByRole("button", { name: "Receive a test gift" }));
    expect(heading()).toBe("Riley Test sent you a gift");
  });
});
