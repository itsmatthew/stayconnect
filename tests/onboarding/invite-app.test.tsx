import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { emptyData } from "@/app/intro/app-data";
import { AppShown } from "@/app/intro/app-shown";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { encodeInvite } from "@/app/intro/onboarding/invite";
import { myCirclesKey } from "@/app/intro/onboarding/local-my-circles";
import type { MyCircle } from "@/app/intro/onboarding/my-circles";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";

const NOW = new Date(2026, 10, 9, 17).getTime();
let n = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

const clear = vi.fn();
const RED_ROBIN = encodeInvite({ id: "mine-maya", name: "Red Robin", colorId: "red", from: "Maya" });
const app = (token: string | null, shown = true) => {
  const id = ++n;
  return (
    <AppShown.Provider value={shown}>
      <AppClient
        data={emptyData}
        now={() => NOW}
        openStore={() => openPhotoStore(`sc-photos-i${id}`)}
        openArchive={() => openArchiveStore(`sc-archive-i${id}`)}
        openOrnaments={() => openOrnamentStore(`sc-orn-i${id}`)}
        hasFace={async () => true}
        inviteLink={{ read: () => token, clear }}
        tourDelayMs={0}
      />
    </AppShown.Provider>
  );
};
const phone = () => document.querySelector("[data-layout='phone']") as HTMLElement | null;
const saved = (): MyCircle[] => JSON.parse(localStorage.getItem(myCirclesKey("")) ?? "[]");

describe("opening an invite link (ONB-19 to ONB-22)", () => {
  it("joins the circle, opens Home on it, and leaves a letter in your mailbox", async () => {
    render(app(RED_ROBIN));
    await waitFor(() => expect(saved()).toEqual([{ id: "mine-maya", name: "Red Robin", colorId: "red", createdAt: NOW, from: "Maya", joined: true }]));
    expect(clear).toHaveBeenCalled();
    await waitFor(() => expect(within(phone()!).getAllByText("you joined just now · Maya saved you a spot").length).toBeGreaterThan(0));
    fireEvent.click(await screen.findByRole("button", { name: "Go to Daily 5" }));
    // Through the tour to its end, which points at the letter.
    for (let i = 0; i < 20 && !screen.queryByRole("dialog", { name: "You’re all set" }); i++) {
      const d = screen.getByRole("dialog");
      fireEvent.click(within(d).queryByRole("button", { name: "Got it" }) ?? within(d).getByRole("button", { name: /^Go to / }));
    }
    const done = screen.getByRole("dialog", { name: "You’re all set" });
    expect(within(done).getByText("Red Robin is on your tree now. Check your mailbox, there’s a letter waiting for you.")).toBeTruthy();
    fireEvent.click(within(done).getByRole("button", { name: "Let’s go" }));
    fireEvent.click(within(document.querySelector("[role='group'][aria-label='Circles view']") as HTMLElement).getByRole("button", { name: "your circle" }));
    await waitFor(() => expect(within(phone()!).getByRole("button", { name: /^Your mailbox/ }).getAttribute("aria-label")).toMatch(/welcome letter/));
  });

  it("waits for the intro before the tour", async () => {
    const { rerender } = render(app(RED_ROBIN, false));
    await waitFor(() => expect(saved()).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(app(RED_ROBIN, true));
    expect(await screen.findByRole("dialog", { name: "Your tree’s planted" })).toBeTruthy();
  });

  it("a circle that's already yours just opens, with no tour", async () => {
    localStorage.setItem(myCirclesKey(""), JSON.stringify([{ id: "mine-maya", name: "Red Robin", colorId: "red", createdAt: NOW - 1000 }]));
    render(app(RED_ROBIN));
    await waitFor(() => expect(within(phone()!).getAllByText("you started it").length).toBeGreaterThan(0));
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(saved()).toHaveLength(1);
  });

  it("a link it can't read opens the app as usual", async () => {
    render(app("garbled"));
    await waitFor(() => expect(within(phone() ?? document.body).queryAllByText(/joined/).length).toBe(0));
    await new Promise((r) => setTimeout(r, 50));
    expect(saved()).toEqual([]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
