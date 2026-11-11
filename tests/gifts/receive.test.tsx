import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, emptyData, type AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { receivedKey } from "@/app/intro/gifts/local-received";
import type { ReceivedGift } from "@/app/intro/gifts/received";

const NOW = new Date(2026, 10, 11, 12).getTime();
let n = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

const renderApp = (data: AppData = demoData, initialTab: "Circles" | "Me" = "Circles") => {
  const id = ++n;
  return render(
    <AppClient initialTab={initialTab} data={data} now={() => NOW} openStore={() => openPhotoStore(`rcv-photos-${id}`)} openArchive={() => openArchiveStore(`rcv-archive-${id}`)} hasFace={async () => true} />,
  );
};
const phone = () => document.querySelector("[data-layout='phone']") as HTMLElement | null;
const toCircle = () => fireEvent.click(within((phone() ?? document.body).querySelector("[role='group'][aria-label='Circles view']") as HTMLElement).getByRole("button", { name: "your circle" }));
const pile = () => within(phone() ?? document.body).queryByRole("button", { name: /^Open .+'s gift/ });
const unwrap = () => screen.getByRole("dialog", { name: /sent you a gift$/ });
const saved = (): ReceivedGift[] => JSON.parse(localStorage.getItem(receivedKey(".demo")) ?? "[]");

describe("gifts under your tree (GIFT-19, CIRCLE-12)", () => {
  it("each present is in the paper and ribbon its sender chose; the newest one opens", () => {
    renderApp();
    toCircle();
    const boxes = Array.from(phone()!.querySelectorAll("[data-gift]"));
    // Back to front: Mom's is behind, Leo's (newest) in front.
    expect(boxes.map((b) => b.getAttribute("data-gift"))).toEqual(["placeholder-gift-mom/me", "placeholder-gift-leo/me"]);
    expect(boxes.map((b) => b.getAttribute("data-pattern"))).toEqual(["gingham", "stars"]);
    expect(boxes.map((b) => b.getAttribute("data-ribbon"))).toEqual(["#C8402D", "#F2BE4A"]);
    expect(phone()!.querySelector("[data-gift-fresh]")?.getAttribute("data-gift")).toBe("placeholder-gift-leo/me");
    expect(pile()!.getAttribute("aria-label")).toBe("Open Leo's gift, 2 wrapped");
    expect(pile()!.style.minHeight).toBe("44px");
  });

  it("'your gifts' on the tree shows how many are on your shelf, and opens it", () => {
    renderApp();
    toCircle();
    fireEvent.click(within(phone()!).getByRole("button", { name: "your gifts, 2 on your shelf" }));
    expect(screen.getByRole("region", { name: "Your shelf" })).toBeTruthy();
  });

  it("with none, there's no pile", () => {
    renderApp(emptyData);
    toCircle();
    expect(document.querySelector("[data-gift]")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Open .+'s gift/ })).toBeNull();
  });
});

describe("unwrapping (GIFT-20)", () => {
  it("opens on the gift as its sender wrapped it, from who and when", () => {
    renderApp();
    toCircle();
    fireEvent.click(pile()!);
    const d = unwrap();
    expect(within(d).getByRole("heading", { name: "Leo sent you a gift" })).toBeTruthy();
    expect(d.textContent).toContain("wrapped Nov 11 · just for you");
    expect(d.textContent).toContain("Pull the ribbon");
    const paper = d.querySelector("[data-unwrap-paper]")!;
    expect(paper.getAttribute("data-pattern")).toBe("stars");
    expect(d.querySelector("[data-unwrap-paper] [data-ribbon]")!.getAttribute("fill")).toBe("#F2BE4A");
    expect(d.textContent).toContain("from Leo");
  });

  it("pulling the ribbon tears it open; the card turns over to the note; Put on my shelf keeps it", () => {
    renderApp();
    toCircle();
    fireEvent.click(pile()!);
    fireEvent.click(within(unwrap()).getByRole("button", { name: "Pull the ribbon on Leo’s gift" }));
    expect(unwrap().getAttribute("data-phase")).toBe("open");
    expect(unwrap().textContent).toContain("Tap to turn it over");
    fireEvent.click(within(unwrap()).getByRole("button", { name: "Turn the card over to read Leo’s note" }));
    expect(unwrap().textContent).toContain("We were just talking about this the other day. Studs.");
    expect(unwrap().textContent).toContain("— Leo");
    fireEvent.click(within(unwrap()).getByRole("button", { name: "Put on my shelf" }));
    expect(saved().find((g) => g.id === "placeholder-gift-leo/me")!.openedAt).toBe(NOW);
    // On your shelf, with the rest.
    expect(screen.getByRole("region", { name: "Your shelf" })).toBeTruthy();
    expect(within(screen.getByRole("region", { name: "Your shelf" })).getAllByRole("button", { name: /^Gift from / }).map((b) => b.getAttribute("aria-label"))).toEqual([
      "Gift from Leo",
      "Gift from Ana",
      "Gift from Priya",
    ]);
  });

  it("closing before the ribbon leaves it wrapped under the tree", () => {
    renderApp();
    toCircle();
    fireEvent.click(pile()!);
    fireEvent.click(within(unwrap()).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: /sent you a gift$/ })).toBeNull();
    expect(pile()!.getAttribute("aria-label")).toBe("Open Leo's gift, 2 wrapped");
  });

  it("opening is never told to anyone: nothing is sent, only kept here", () => {
    renderApp();
    toCircle();
    fireEvent.click(pile()!);
    fireEvent.click(within(unwrap()).getByRole("button", { name: "Pull the ribbon on Leo’s gift" }));
    fireEvent.click(within(unwrap()).getByRole("button", { name: "Put on my shelf" }));
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
  it("puts a new wrapped gift under your tree", () => {
    renderApp(emptyData);
    toCircle();
    fireEvent.click(screen.getByRole("button", { name: "Receive a test gift" }));
    expect(pile()!.getAttribute("aria-label")).toBe("Open Riley Test's gift, 1 wrapped");
  });
});
