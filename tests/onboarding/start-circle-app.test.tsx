import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { emptyData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import type { Share } from "@/app/intro/mail/mail";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";
import { myCirclesKey } from "@/app/intro/onboarding/local-my-circles";
import type { MyCircle } from "@/app/intro/onboarding/my-circles";

const NOW = new Date(2026, 10, 8, 9).getTime();
let n = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

type Shared = { url?: string; text: string };
const renderApp = ({ data = emptyData, answer = "shared" as Awaited<ReturnType<Share["share"]>> } = {}) => {
  const id = ++n;
  const shared: Shared[] = [];
  const share: Share = {
    share: async (req) => {
      shared.push(req);
      return answer;
    },
  };
  render(
    <AppClient
      data={data}
      now={() => NOW}
      openStore={() => openPhotoStore(`sc-photos-${id}`)}
      openArchive={() => openArchiveStore(`sc-archive-${id}`)}
      openOrnaments={() => openOrnamentStore(`sc-orn-${id}`)}
      hasFace={async () => true}
      share={() => share}
      circleInvites={() => ({ create: async (c) => ({ link: `https://x.test/intro?invite=${c.name}` }) })}
    />,
  );
  return shared;
};
const phone = () => document.querySelector("[data-layout='phone']") as HTMLElement;
const mailbox = () => within(phone()).getByRole("button", { name: /^Your mailbox/ });
const flow = () => screen.getByRole("dialog", { name: /Start a circle|Pick a logo|Now & then|Your invite|is live/ });
const tap = (name: string | RegExp) => fireEvent.click(within(flow()).getByRole("button", { name }));
const saved = (suffix = ""): MyCircle[] => JSON.parse(localStorage.getItem(myCirclesKey(suffix)) ?? "[]");

/** From a brand-new app to step 1, through the welcome letter. */
async function toStart() {
  fireEvent.click(within(document.querySelector("[role='group'][aria-label='Circles view']") as HTMLElement).getByRole("button", { name: "your circle" }));
  await waitFor(() => expect(mailbox().getAttribute("aria-label")).toMatch(/welcome letter/));
  fireEvent.click(mailbox());
  fireEvent.click(screen.getByRole("button", { name: "Open the welcome letter" }));
  fireEvent.click(await screen.findByRole("button", { name: "Start my first circle" }));
  return flow();
}
const name = (text: string) => fireEvent.change(within(flow()).getByLabelText("Circle name"), { target: { value: text } });

describe("start my first circle (ONB-7)", () => {
  it("opens step 1 from the letter, which is then kept", async () => {
    renderApp();
    const d = await toStart();
    expect(within(d).getByRole("heading", { name: "Start a circle" })).toBeTruthy();
    expect(within(d).getByRole("img", { name: "Step 1 of 4" })).toBeTruthy();
    expect(screen.queryByRole("article")).toBeNull();
  });

  it("back on step 1 is back to the letter; back later keeps what you typed", async () => {
    renderApp();
    await toStart();
    name("Red Robin");
    tap("Next");
    expect(within(flow()).getByRole("img", { name: "Step 2 of 4" })).toBeTruthy();
    tap("Back");
    expect((within(flow()).getByLabelText("Circle name") as HTMLInputElement).value).toBe("Red Robin");
    tap("Back to the letter");
    expect(await screen.findByRole("article")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start my first circle" }));
    expect(flow()).toBeTruthy();
  });
});

describe("step 1: name and color (ONB-8)", () => {
  it("Next waits for a name", async () => {
    renderApp();
    await toStart();
    tap("Next");
    expect(within(flow()).getByRole("img", { name: "Step 1 of 4" })).toBeTruthy();
    name("  ");
    tap("Next");
    expect(within(flow()).getByRole("img", { name: "Step 1 of 4" })).toBeTruthy();
  });

  it("offers the twelve colors, the first free one picked", async () => {
    renderApp();
    await toStart();
    const colors = within(within(flow()).getByRole("radiogroup", { name: "Circle color" })).getAllByRole("radio");
    expect(colors).toHaveLength(12);
    expect(colors.find((c) => c.getAttribute("aria-checked") === "true")?.getAttribute("aria-label")).toBe("Red");
    fireEvent.click(within(flow()).getByRole("radio", { name: "Teal" }));
    expect(within(flow()).getByRole("radio", { name: "Teal" }).getAttribute("aria-checked")).toBe("true");
  });
});

describe("the color note (ONB-8)", () => {
  it("says which circle already has it", async () => {
    // A circle you've started already: the letter came before it.
    localStorage.setItem(myCirclesKey(""), JSON.stringify([{ id: "mine-1", name: "Lake Week", colorId: "red", createdAt: NOW - 1000 }]));
    localStorage.setItem("nowandthen.inbox.v1", JSON.stringify({ letters: [], blocked: [], reports: [], seen: [], birthdayGifts: [], welcome: { at: NOW - 2000, status: "kept" } }));
    renderApp();
    fireEvent.click(within(document.querySelector("[role='group'][aria-label='Circles view']") as HTMLElement).getByRole("button", { name: "your circle" }));
    fireEvent.click(mailbox());
    fireEvent.click(await screen.findByRole("button", { name: "Welcome letter from Harrison & Jackson" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start my first circle" }));
    fireEvent.click(within(flow()).getByRole("radio", { name: "Blue" }));
    expect(within(flow()).queryByText(/already uses/)).toBeNull();
    fireEvent.click(within(flow()).getByRole("radio", { name: /^Red/ }));
    expect(within(flow()).getByText("Lake Week")).toBeTruthy();
    expect(within(flow()).getByText(/already uses red, so yours gets its own shade/)).toBeTruthy();
  });
});

describe("steps 2 to 5 (ONB-9 to ONB-12) and your new circle (ONB-13)", () => {
  it("picks a logo and offers to skip the photos", async () => {
    renderApp();
    await toStart();
    name("Red Robin");
    tap("Next");
    expect(within(flow()).getByRole("heading", { name: "Pick a logo" })).toBeTruthy();
    expect(within(flow()).getByRole("img", { name: "Red Robin logo" }).innerHTML).toContain(">R<");
    fireEvent.click(within(flow()).getByRole("radio", { name: "Badge logo" }));
    expect(within(flow()).getByRole("img", { name: "Red Robin logo" }).innerHTML).toContain("RR");
    tap("Next");
    expect(within(flow()).getByRole("heading", { name: "Now & then" })).toBeTruthy();
    expect(within(flow()).getByRole("button", { name: "Skip for now" })).toBeTruthy();
  });

  it("shares the invite, makes the circle and lands on Home", async () => {
    const shared = renderApp({ data: { ...emptyData, senderName: "Maya" } });
    await toStart();
    name("Red Robin");
    tap("Next");
    tap("Next");
    tap("Skip for now");
    const d = flow();
    expect(within(d).getByRole("heading", { name: "Your invite" })).toBeTruthy();
    expect(within(d).getByText("from Maya")).toBeTruthy();
    expect(within(d).getByText("Maya started Red Robin and saved you a spot.")).toBeTruthy();
    expect(within(d).getByText("saved you a spot on our tree 🌲 come join Red Robin")).toBeTruthy();
    tap("Share invite");
    expect(await screen.findByRole("heading", { name: "Red Robin is live" })).toBeTruthy();
    expect(screen.getByText("Your people are on their way.")).toBeTruthy();
    expect(shared).toEqual([{ url: "https://x.test/intro?invite=Red Robin", text: "saved you a spot on our tree 🌲 come join Red Robin" }]);
    expect(saved()).toEqual([expect.objectContaining({ name: "Red Robin", colorId: "red", createdAt: NOW })]);
    tap("Go to my circle");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(within(phone()).getAllByText("Red Robin").length).toBeGreaterThan(0);
  });

  it("a cancelled share stays on the invite and makes nothing", async () => {
    renderApp({ answer: "cancelled" });
    await toStart();
    name("Lake Week");
    tap("Next");
    tap("Next");
    tap("Skip for now");
    tap("Share invite");
    await waitFor(() => expect(within(flow()).getByRole("heading", { name: "Your invite" })).toBeTruthy());
    expect(saved()).toEqual([]);
  });

  it("a copied link says so", async () => {
    renderApp({ answer: "copied" });
    await toStart();
    name("Lake Week");
    tap("Next");
    tap("Next");
    tap("Skip for now");
    tap("Share invite");
    expect(await screen.findByText("Link copied. Paste it in your group chat.")).toBeTruthy();
  });

  it("a picked photo fills its half and the button says Next", async () => {
    renderApp();
    await toStart();
    name("Lake Week");
    tap("Next");
    tap("Next");
    fireEvent.change(within(flow()).getByLabelText("Add a photo of your circle now"), { target: { files: [new File(["x"], "now.jpg", { type: "image/jpeg" })] } });
    expect(within(flow()).queryByText("Skip for now")).toBeNull();
    expect(within(flow()).getByRole("button", { name: "Next" })).toBeTruthy();
  });
});
