import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { emptyData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import type { Share } from "@/app/intro/mail/mail";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";

const NOW = new Date(2026, 10, 8, 9).getTime();
let n = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

const share: Share = { share: async () => "shared" };
const renderApp = () => {
  const id = ++n;
  render(
    <AppClient
      data={emptyData}
      now={() => NOW}
      openStore={() => openPhotoStore(`sc-photos-t${id}`)}
      openArchive={() => openArchiveStore(`sc-archive-t${id}`)}
      openOrnaments={() => openOrnamentStore(`sc-orn-t${id}`)}
      hasFace={async () => true}
      share={() => share}
      circleInvites={() => ({ create: async (c) => ({ link: `https://x.test/intro?invite=${c.name}` }) })}
      tourDelayMs={0}
    />,
  );
};
const phone = () => document.querySelector("[data-layout='phone']") as HTMLElement;
const flow = () => screen.getByRole("dialog", { name: /Start a circle|Pick a logo|Now & then|Your invite|is live/ });
const tap = (name: string | RegExp) => fireEvent.click(within(flow()).getByRole("button", { name }));

/** A brand-new app, through the letter and the four steps, to Home with a new circle. */
async function makeCircle() {
  renderApp();
  fireEvent.click(within(document.querySelector("[role='group'][aria-label='Circles view']") as HTMLElement).getByRole("button", { name: "your circle" }));
  const mailbox = () => within(phone()).getByRole("button", { name: /^Your mailbox/ });
  await waitFor(() => expect(mailbox().getAttribute("aria-label")).toMatch(/welcome letter/));
  fireEvent.click(mailbox());
  fireEvent.click(screen.getByRole("button", { name: "Open the welcome letter" }));
  fireEvent.click(await screen.findByRole("button", { name: "Start my first circle" }));
  fireEvent.change(within(flow()).getByLabelText("Circle name"), { target: { value: "Red Robin" } });
  tap("Next");
  tap("Next");
  tap("Skip for now");
  tap("Share invite");
  await screen.findByRole("heading", { name: "Red Robin is live" });
  tap("Go to my circle");
}
const card = (title: string) => screen.findByRole("dialog", { name: title });
const tabShown = (label: string) => within(document.querySelector("nav[aria-label='Main']") as HTMLElement).getByRole("button", { name: label }).getAttribute("aria-current");

describe("the tour (ONB-14 to ONB-18)", () => {
  it("starts on Home after Go to my circle, walks Daily 5, Archive, Messages and Me, then You're all set", async () => {
    await makeCircle();
    const first = await card("Your tree’s planted");
    expect(within(first).getByText("1 of 9")).toBeTruthy();
    expect(within(first).getByText("Let’s take a quick look around so you know what everything does.")).toBeTruthy();
    expect(within(first).queryByRole("button", { name: "Got it" })).toBeNull();
    const steps: [string, string][] = [
      ["Your tree’s planted", "Go to Daily 5"],
      ["Daily 5", "Got it"],
      ["From back whenever", "Got it"],
      ["Send one", "Got it"],
      ["Up next: Archive", "Go to Archive"],
      ["65 Archive", "Got it"],
      ["Everyone’s picks", "Got it"],
      ["Up next: Messages", "Go to Messages"],
      ["Your circle’s chat", "Got it"],
      ["Pin your people", "Got it"],
      ["Up next: Me", "Go to Me"],
      ["Your year", "Got it"],
      ["Up next: Circles", "Go to Circles"],
    ];
    for (const [title, button] of steps) {
      const d = screen.getByRole("dialog", { name: title });
      if (title === "Daily 5") expect(tabShown("Daily 5")).toBe("page");
      if (title === "65 Archive") expect(tabShown("Archive")).toBe("page");
      if (title === "Your circle’s chat") expect(tabShown("Messages")).toBe("page");
      if (title === "Your year") expect(tabShown("Me")).toBe("page");
      fireEvent.click(within(d).getByRole("button", { name: button }));
    }
    const done = screen.getByRole("dialog", { name: "You’re all set" });
    expect(within(done).getByText("Tap a + on your tree to add your 3 ornaments. Everything else is one tap away down here.")).toBeTruthy();
    expect(within(phone()).getAllByText("Red Robin").length).toBeGreaterThan(0);
    fireEvent.click(within(done).getByRole("button", { name: "Let’s go" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("runs once: a reload with your circle saved has no tour", async () => {
    await makeCircle();
    await card("Your tree’s planted");
    cleanup();
    renderApp();
    await waitFor(() => expect(within(phone()).getAllByText("Red Robin").length).toBeGreaterThan(0));
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
