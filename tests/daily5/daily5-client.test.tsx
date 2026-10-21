import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { openPhotoStore, type PhotoStore } from "@/app/intro/daily5/photo-store";
import { chatStorageKey } from "@/app/intro/messages/use-chat";
import { demoData } from "@/app/intro/app-data";
import type { ChatState } from "@/app/intro/messages/conversations";

const NOW = new Date(2026, 9, 14, 12).getTime();
const OLD = new Date(2021, 4, 1).getTime();
let n = 0;
let dbName: string;
let store: PhotoStore;

beforeEach(async () => {
  localStorage.clear();
  let u = 0;
  URL.createObjectURL = vi.fn(() => `blob:${++u}`);
  URL.revokeObjectURL = vi.fn();
  dbName = `client-test-${++n}`;
  store = await openPhotoStore(dbName);
  for (let i = 0; i < 8; i++) await store.add({ pool: "mine", fileKey: `m${i}`, takenAt: OLD + i, image: new Blob([`m${i}`]) });
  for (let i = 0; i < 8; i++) await store.add({ pool: "family", fileKey: `f${i}`, takenAt: OLD + i, image: new Blob([`f${i}`]) });
});
afterEach(() => {
  cleanup();
  store.close();
});

const renderDaily5 = (now = NOW) =>
  render(<AppClient initialTab="Daily 5" data={demoData} now={() => now} openStore={() => openPhotoStore(dbName)} hasFace={async () => true} />);

describe("Daily 5, wired (D5-6/8/12, MSG-4)", () => {
  it("shows today's five and saves them for the day", async () => {
    renderDaily5();
    expect(await screen.findAllByRole("article")).toHaveLength(5);
    expect(screen.getByText("Wednesday, Oct 14")).toBeTruthy();
    const saved = await store.getDay("2026-10-14");
    expect(saved).toHaveLength(5);
  });

  it("re-shows the same five later the same day, even after more photos arrive", async () => {
    const first = renderDaily5();
    await screen.findAllByRole("article");
    const day = await store.getDay("2026-10-14");
    first.unmount();
    for (let i = 8; i < 30; i++) await store.add({ pool: "mine", fileKey: `m${i}`, takenAt: OLD, image: new Blob(["x"]) });
    renderDaily5(NOW + 6 * 3_600_000);
    await screen.findAllByRole("article");
    expect(await store.getDay("2026-10-14")).toEqual(day);
  });

  it("sending seals the memory: it's kept, but nothing shows in Messages yet", async () => {
    renderDaily5();
    const cards = await screen.findAllByRole("article");
    fireEvent.click(within(cards[0]).getByRole("button", { name: "Send this photo to someone" }));
    const sheet = screen.getByRole("dialog", { name: "Send this to…" });
    fireEvent.click(within(sheet).getByRole("button", { name: "Send to Work Mates" }));
    fireEvent.click(within(sheet).getByRole("button", { name: "Send" }));
    expect(screen.getByRole("status").textContent).toBe("Sent ✓");

    const saved = JSON.parse(localStorage.getItem(chatStorageKey(demoData.storageSuffix))!) as ChatState;
    expect(saved.sealed).toHaveLength(1);
    expect(saved.sealed[0].conversationId).toBe("group:work-mates");

    fireEvent.click(within(screen.getAllByRole("navigation", { name: "Main" })[0]).getByRole("button", { name: "Messages" }));
    const list = within(screen.getByRole("list", { name: "Chats" })).getAllByRole("button");
    expect(list.at(-1)!.getAttribute("aria-label")).toBe("Work Mates, nothing new");
  });

  it("a memory sent from a photo dated by its file says so; others don't (D5-4, GP-6)", async () => {
    const send = async () => {
      const cards = await screen.findAllByRole("article");
      fireEvent.click(within(cards[0]).getByRole("button", { name: "Send this photo to someone" }));
      const sheet = screen.getByRole("dialog", { name: "Send this to…" });
      fireEvent.click(within(sheet).getByRole("button", { name: "Send to Work Mates" }));
      fireEvent.click(within(sheet).getByRole("button", { name: "Send" }));
      return (JSON.parse(localStorage.getItem(chatStorageKey(demoData.storageSuffix))!) as ChatState).sealed[0];
    };
    renderDaily5();
    expect((await send()).fileDated).toBeUndefined();
    cleanup();
    localStorage.clear();
    store.close();
    dbName = `client-test-${++n}`;
    store = await openPhotoStore(dbName);
    for (let i = 0; i < 8; i++) await store.add({ pool: "mine", fileKey: `m${i}`, takenAt: OLD + i, fileDated: true, image: new Blob([`m${i}`]) });
    for (let i = 0; i < 8; i++) await store.add({ pool: "family", fileKey: `f${i}`, takenAt: OLD + i, fileDated: true, image: new Blob([`f${i}`]) });
    renderDaily5();
    expect((await send()).fileDated).toBe(true);
  });
});
