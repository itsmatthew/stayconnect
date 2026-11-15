import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, emptyData, type AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { chatStorageKey } from "@/app/intro/messages/use-chat";

const DAY = 86_400_000;
const NOW = new Date(2026, 9, 20, 12).getTime();
let n = 0;

beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:photo");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

function renderApp(data: AppData = demoData, now = NOW) {
  const id = ++n;
  const utils = render(
    <AppClient
      data={data}
      now={() => now}
      openStore={() => openPhotoStore(`circle-photos-${id}`)}
      openArchive={() => openArchiveStore(`circle-archive-${id}`)}
      hasFace={async () => true}
    />,
  );
  return utils;
}
const layout = (name: "phone" | "wide") => document.querySelector(`[data-layout='${name}']`) as HTMLElement;
// Containers are found by selector, then queried by role: role queries over the whole scenery are slow in jsdom.
const one = (where: HTMLElement, selector: string) => {
  const el = where.querySelector(selector);
  if (!el) throw new Error(`no ${selector}`);
  return el as HTMLElement;
};
const toggle = (where: HTMLElement = layout("phone")) => one(where, "[role='group'][aria-label='Circles view']");
const toCircle = (where: HTMLElement = layout("phone")) => fireEvent.click(within(toggle(where)).getByRole("button", { name: "your circle" }));
const tree = (where: HTMLElement = layout("phone")) => one(where, "[role='group'][aria-label='Your circle tree']");
const card = (where: HTMLElement = layout("phone")) => one(where, "section[aria-label='Your rings']");
const inTree = (name: string, where?: HTMLElement) => within(tree(where)).getByRole("button", { name });
const tab = (name: RegExp, where?: HTMLElement) => within(card(where)).getByRole("tab", { name });
const cardPeople = (where?: HTMLElement) =>
  within(within(card(where)).getByRole("list", { name: "People in this ring" }))
    .queryAllByRole("button")
    .map((b) => b.textContent);

describe("the view (CIRCLE-1)", () => {
  it("the toggle swaps the group trees for the one big tree, in both layouts", () => {
    renderApp();
    expect(layout("phone").querySelector("[data-circle-tree]")).toBeNull();
    toCircle();
    for (const l of ["phone", "wide"] as const) {
      const where = layout(l);
      expect(within(toggle(where)).getByRole("button", { name: "your circle" }).getAttribute("aria-pressed")).toBe("true");
      expect(where.querySelector("[aria-label='Selected circle'], [aria-label='Next circle']")).toBeNull();
      const labels = Array.from(tree(where).querySelectorAll("[data-ring-label]"), (e) => e.textContent);
      expect(labels).toEqual(["bloom", "branches", "nest"]);
    }
  });

  it("'your circles' brings the group trees back", () => {
    renderApp();
    toCircle();
    fireEvent.click(within(toggle()).getByRole("button", { name: "your circles" }));
    expect(one(layout("phone"), "[aria-label='Selected circle']")).toBeTruthy();
    expect(layout("phone").querySelector("[data-circle-tree]")).toBeNull();
  });

  it("each placed person sits in their ring, lit when you've talked lately (CIRCLE-4)", () => {
    renderApp();
    toCircle();
    const ringOf = (name: string) => inTree(name).getAttribute("data-ring");
    expect(["Mom", "Priya", "Ana"].map(ringOf)).toEqual(["nest", "nest", "nest"]);
    expect(["Leo", "Sam", "Dad"].map(ringOf)).toEqual(["branches", "branches", "branches"]);
    expect(["Jordan", "Nico", "Grandma"].map(ringOf)).toEqual(["bloom", "bloom", "bloom"]);
    expect(inTree("Leo").getAttribute("data-lit")).toBe("true");
    expect(inTree("Priya").getAttribute("data-lit")).toBe("true");
    // Mom only talks in the Family group chat.
    expect(inTree("Mom").getAttribute("data-lit")).toBe("false");
  });

});

describe("gifts under the tree (CIRCLE-12)", () => {
  const gifts = () => Array.from(tree().querySelectorAll("[data-gift]"), (g) => g.getAttribute("data-gift"));

  it("demo on: the 2 placeholder gifts, announced, and nothing to open yet", () => {
    renderApp();
    toCircle();
    expect(gifts()).toHaveLength(2);
    expect(within(tree()).getByRole("img", { name: "2 gifts received" })).toBeTruthy();
    expect(tree().querySelector("[data-gift-pile] button")).toBeNull();
  });

  it("only gifts actually received, newest in front", () => {
    const received = (now: number) => [
      { id: "older", from: "a", receivedAt: now - 3 * DAY },
      { id: "newest", from: "b", receivedAt: now - 1000 },
      { id: "middle", from: "c", receivedAt: now - DAY },
    ];
    renderApp({ ...demoData, gifts: received });
    toCircle();
    // Drawn back to front: the last box is the one in front.
    expect(gifts()).toEqual(["older", "middle", "newest"]);
  });
});

describe("the card (CIRCLE-5)", () => {
  it("tabs with counts, Nest first, its blurb, its people, add and the privacy line", () => {
    renderApp();
    toCircle();
    expect(tab(/^Nest/).getAttribute("aria-selected")).toBe("true");
    expect(tab(/^Nest/).textContent).toBe("Nest 3");
    expect(tab(/^Branches/).textContent).toBe("Branches 3");
    expect(tab(/^Bloom/).textContent).toBe("Bloom 3");
    expect(card().textContent).toContain("your home people, the ones you love most");
    expect(cardPeople()).toEqual(["Mom", "Priya", "Ana"]);
    expect(within(card()).getByRole("button", { name: "Add to Nest" })).toBeTruthy();
    expect(card().textContent).toContain("Only you see your circle. No one is told which ring they're in.");
    fireEvent.click(tab(/^Bloom/));
    expect(card().textContent).toContain("the wider circle you're glad to know");
    expect(cardPeople()).toEqual(["Jordan", "Nico", "Grandma"]);
    fireEvent.click(tab(/^Branches/));
    expect(card().textContent).toContain("the friends you keep close");
  });

  it("past a ring's upper guide, a gentle note, and adding still works (CIRCLE-2)", () => {
    const many = Array.from({ length: 11 }, (_, i) => ({ ...demoData.friends[i % demoData.friends.length], id: `p${i}`, name: `Person ${i}`, closest: false }));
    renderApp({ ...emptyData, friends: many, rings: Object.fromEntries(many.slice(0, 10).map((f) => [f.id, "nest" as const])) });
    // No groups: the toggle sits on the empty home.
    toCircle(document.body);
    expect(card().textContent).not.toContain("Your nest is getting big");
    fireEvent.click(within(card()).getByRole("button", { name: "Add to Nest" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Add to Nest" })).getByRole("button", { name: "Person 10" }));
    expect(tab(/^Nest/).textContent).toBe("Nest 11");
    expect(card().textContent).toContain("Your nest is getting big — most people keep it under 10");
  });
});

describe("tap to talk (CIRCLE-6)", () => {
  it("tapping someone in the tree opens your chat with them", () => {
    renderApp();
    toCircle();
    fireEvent.click(inTree("Leo"));
    expect(screen.getByRole("textbox", { name: "Message Leo" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to messages" }));
    expect(screen.getByRole("heading", { name: "Messages" })).toBeTruthy();
  });

  it("opens an empty thread with someone you've never talked to", () => {
    renderApp();
    toCircle();
    fireEvent.click(inTree("Grandma"));
    expect(screen.getByRole("textbox", { name: "Message Grandma" })).toBeTruthy();
  });

  it("from the wide layout too", () => {
    renderApp();
    toCircle(layout("wide"));
    fireEvent.click(inTree("Ana", layout("wide")));
    expect(screen.getByRole("textbox", { name: "Message Ana" })).toBeTruthy();
  });
});

describe("move from the card (CIRCLE-8)", () => {
  it("tapping a person offers Message and the other two rings", () => {
    renderApp();
    toCircle();
    fireEvent.click(tab(/^Branches/));
    fireEvent.click(within(card()).getByRole("button", { name: "Leo" }));
    const menu = screen.getByRole("menu", { name: "Leo" });
    expect(within(menu).getAllByRole("menuitem").map((m) => m.textContent)).toEqual(["Message Leo", "Move to Nest", "Move to Bloom"]);
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Move to Nest" }));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(inTree("Leo").getAttribute("data-ring")).toBe("nest");
    expect(tab(/^Nest/).textContent).toBe("Nest 4");
    expect(tab(/^Branches/).textContent).toBe("Branches 2");
  });

  it("Message opens the chat", () => {
    renderApp();
    toCircle();
    fireEvent.click(within(card()).getByRole("button", { name: "Priya" }));
    fireEvent.click(within(screen.getByRole("menu", { name: "Priya" })).getByRole("menuitem", { name: "Message Priya" }));
    expect(screen.getByRole("textbox", { name: "Message Priya" })).toBeTruthy();
  });

  it("add lists everyone not in this ring, showing where they are now", () => {
    renderApp();
    toCircle();
    fireEvent.click(within(card()).getByRole("button", { name: "Add to Nest" }));
    const sheet = screen.getByRole("dialog", { name: "Add to Nest" });
    const options = within(sheet).getAllByRole("button").filter((b) => b.textContent !== "Close").map((b) => b.getAttribute("aria-label"));
    expect(options).toEqual(["Leo, in Branches", "Sam, in Branches", "Dad, in Branches", "Jordan, in Bloom", "Nico, in Bloom", "Grandma, in Bloom"]);
    fireEvent.click(within(sheet).getByRole("button", { name: "Jordan, in Bloom" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(cardPeople()).toEqual(["Mom", "Priya", "Ana", "Jordan"]);
  });

  it("is kept after a reload (CIRCLE-10)", () => {
    renderApp();
    toCircle();
    fireEvent.click(within(card()).getByRole("button", { name: "Ana" }));
    fireEvent.click(within(screen.getByRole("menu", { name: "Ana" })).getByRole("menuitem", { name: "Move to Bloom" }));
    cleanup();
    renderApp();
    toCircle();
    expect(inTree("Ana").getAttribute("data-ring")).toBe("bloom");
  });
});

describe("suggested moves (CIRCLE-9)", () => {
  const suggestionBox = () => within(card()).queryByRole("region", { name: "Suggestion" });

  it("suggests moving Leo inward, and Move moves him", () => {
    renderApp();
    toCircle();
    expect(suggestionBox()?.textContent).toContain("You and Leo have been close lately — move to Nest?");
    expect(inTree("Leo").getAttribute("data-ring")).toBe("branches");
    fireEvent.click(within(suggestionBox()!).getByRole("button", { name: "Move" }));
    expect(inTree("Leo").getAttribute("data-ring")).toBe("nest");
    expect(suggestionBox()).toBeNull();
  });

  it("Not now hides it, and it stays hidden after a reload until 30 days pass", () => {
    renderApp();
    toCircle();
    fireEvent.click(within(suggestionBox()!).getByRole("button", { name: "Not now" }));
    expect(suggestionBox()).toBeNull();
    expect(inTree("Leo").getAttribute("data-ring")).toBe("branches");
    cleanup();
    renderApp(demoData, NOW + 29 * DAY);
    toCircle();
    expect(suggestionBox()).toBeNull();
    cleanup();
    // Fresh seed chats, so Leo's activity is recent again 30 days on.
    localStorage.removeItem(chatStorageKey(demoData.storageSuffix));
    renderApp(demoData, NOW + 30 * DAY);
    toCircle();
    expect(suggestionBox()?.textContent).toContain("You and Leo have been close lately — move to Nest?");
  });
});

describe("demo off (CIRCLE-11)", () => {
  it("an empty tree that fills as you connect, reachable from the empty home", () => {
    renderApp(emptyData);
    toCircle(document.body);
    expect(within(tree()).queryAllByRole("button")).toEqual([]);
    // No gifts: just the trunk.
    expect(tree().querySelector("[data-trunk]")).toBeTruthy();
    expect(tree().querySelector("[data-gift-pile], [data-gift]")).toBeNull();
    expect(within(tree()).queryByRole("img", { name: /gifts? received/ })).toBeNull();
    expect(card().textContent).toContain("Your circle fills as you connect with people");
    expect(tab(/^Nest/).textContent).toBe("Nest 0");
    fireEvent.click(within(card()).getByRole("button", { name: "Add to Nest" }));
    expect(screen.getByRole("dialog", { name: "Add to Nest" }).textContent).toContain("No one to add yet");
  });
});
