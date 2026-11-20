import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, emptyData, type AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import type { InboxState } from "@/app/intro/mail/inbox";
import { inboxKey } from "@/app/intro/mail/local-inbox";

const NOW = new Date(2026, 10, 8, 9).getTime();
let n = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

const renderApp = (data: AppData = emptyData) => {
  const id = ++n;
  return render(<AppClient data={data} now={() => NOW} openStore={() => openPhotoStore(`onb-photos-${id}`)} openArchive={() => openArchiveStore(`onb-archive-${id}`)} hasFace={async () => true} />);
};
const toggle = () => document.querySelector("[role='group'][aria-label='Circles view']") as HTMLElement;
const toCircle = () => fireEvent.click(within(toggle()).getByRole("button", { name: "your circle" }));
const mailbox = () => within(document.querySelector("[data-layout='phone']") as HTMLElement).getByRole("button", { name: /^Your mailbox/ });
const saved = (): InboxState => JSON.parse(localStorage.getItem(inboxKey(""))!);
const letterDialog = () => screen.getByRole("dialog", { name: "Your mailbox" });
const phone = () => document.querySelector("[data-layout='phone']") as HTMLElement;
/** The letter arrives once the saved mailbox has been read (ONB-1). */
const letterArrived = () => waitFor(() => expect(mailbox().getAttribute("aria-label")).toMatch(/a welcome letter/));
/** Your circle, once the letter is there. */
const circleWithLetter = async () => {
  toCircle();
  await letterArrived();
};

describe("the welcome letter arrives (ONB-1)", () => {
  it("lands as new mail for someone with no circles, and is saved", async () => {
    renderApp();
    await waitFor(() => expect(saved().welcome).toEqual({ at: NOW, status: "new" }));
  });

  it("never comes with demo data, which has circles", async () => {
    renderApp(demoData);
    toCircle();
    await waitFor(() => expect(localStorage.getItem(inboxKey(".demo"))).toBeNull());
    expect(mailbox().getAttribute("aria-label")).not.toMatch(/welcome letter/);
  });

  it("doesn't come back once read", async () => {
    localStorage.setItem(inboxKey(""), JSON.stringify({ letters: [], blocked: [], reports: [], seen: [], birthdayGifts: [], welcome: { at: NOW - 86_400_000, status: "kept" } }));
    renderApp();
    toCircle();
    await waitFor(() => expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, nothing new"));
  });
});

describe("start here (ONB-2) and on your tree (ONB-3)", () => {
  it("Home points to your circle, and your circle points to the mailbox", async () => {
    renderApp();
    expect(await screen.findByText("Start here")).toBeTruthy();
    expect(screen.getByText(/to see your tree/)).toBeTruthy();
    toCircle();
    expect(within(phone()).getByText("You’ve got mail")).toBeTruthy();
    expect(within(phone()).getByText("Tap your mailbox to open it.")).toBeTruthy();
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, a welcome letter");
    expect(mailbox().querySelector("[data-mailbox-flag='up']")).toBeTruthy();
  });

  it("the callouts go once the letter's read", async () => {
    renderApp();
    await circleWithLetter();
    fireEvent.click(mailbox());
    fireEvent.click(within(letterDialog()).getByRole("button", { name: "Open the welcome letter" }));
    fireEvent.click(await screen.findByRole("button", { name: "Close the letter" }));
    expect(screen.queryByText("You’ve got mail")).toBeNull();
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, nothing new");
  });
});

describe("the envelope (ONB-4) and the letter (ONB-5)", () => {
  it("opens first, addressed to you, then shows the letter", async () => {
    renderApp({ ...emptyData, senderName: "Maya" });
    await circleWithLetter();
    fireEvent.click(mailbox());
    const d = letterDialog();
    expect(within(d).getByText("1 new")).toBeTruthy();
    expect(within(d).getByText("Harrison & Jackson")).toBeTruthy();
    expect(within(d).getByText("Maya")).toBeTruthy();
    expect(within(d).getByText("NOV 8")).toBeTruthy();
    expect(within(d).getByText("tap to open")).toBeTruthy();
    fireEvent.click(within(d).getByRole("button", { name: "Open the welcome letter" }));
    const letter = await screen.findByRole("article");
    expect(within(letter).getByText("Hey Maya,")).toBeTruthy();
    expect(within(letter).getByText("Sun, Nov 8")).toBeTruthy();
    for (const f of ["65 Archive", "Daily 5", "Your circles", "Your circle", "Gifts"]) expect(within(letter).getByText(f)).toBeTruthy();
    expect(within(letter).getByText(/We will never sell your data/)).toBeTruthy();
    expect(within(letter).getByText(/Glad you’re here/)).toBeTruthy();
  });

  it("with no name yet, it's for you", async () => {
    renderApp();
    await circleWithLetter();
    fireEvent.click(mailbox());
    expect(within(letterDialog()).getByText("you")).toBeTruthy();
    fireEvent.click(within(letterDialog()).getByRole("button", { name: "Open the welcome letter" }));
    return screen.findByText("Hey there,");
  });

  it("closing the envelope unopened keeps it new", async () => {
    renderApp();
    await circleWithLetter();
    fireEvent.click(mailbox());
    // The callout steps aside while the mailbox is open (ONB-2).
    expect(within(phone()).queryByText("You’ve got mail")).toBeNull();
    fireEvent.click(within(letterDialog()).getByRole("button", { name: "Close your mailbox" }));
    expect(within(phone()).getByText("You’ve got mail")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, a welcome letter");
  });
});

describe("read, then kept (ONB-6)", () => {
  it("is kept with your mail, and opens again from its tile", async () => {
    renderApp();
    await circleWithLetter();
    fireEvent.click(mailbox());
    fireEvent.click(within(letterDialog()).getByRole("button", { name: "Open the welcome letter" }));
    fireEvent.click(await screen.findByRole("button", { name: "Close the letter" }));
    await waitFor(() => expect(saved().welcome?.status).toBe("kept"));
    fireEvent.click(mailbox());
    const kept = screen.getByRole("dialog", { name: "Your mailbox" });
    fireEvent.click(within(kept).getByRole("button", { name: "Welcome letter from Harrison & Jackson" }));
    expect(await screen.findByRole("article")).toBeTruthy();
  });
});
