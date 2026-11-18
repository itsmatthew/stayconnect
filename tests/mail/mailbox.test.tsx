import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, emptyData, type AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import type { InboxState } from "@/app/intro/mail/inbox";
import { inboxKey } from "@/app/intro/mail/local-inbox";

const NOW = new Date(2026, 10, 10, 12).getTime();
let n = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

/** The demo without birthdays: these tests are about photos (birthdays: mailbox-birthday.test.tsx). */
const noBirthdays: AppData = { ...demoData, birthdays: () => ({}) };
const renderApp = (data: AppData = noBirthdays) => {
  const id = ++n;
  return render(
    <AppClient data={data} now={() => NOW} openStore={() => openPhotoStore(`mb-photos-${id}`)} openArchive={() => openArchiveStore(`mb-archive-${id}`)} hasFace={async () => true} />,
  );
};
const phone = () => document.querySelector("[data-layout='phone']") as HTMLElement;
// With no groups (no demo data), the toggle sits on the empty home, outside the layouts.
const toCircle = () => fireEvent.click(within((phone() ?? document.body).querySelector("[role='group'][aria-label='Circles view']") as HTMLElement).getByRole("button", { name: "your circle" }));
/** The mailbox's note: other parts of the screen announce things too. */
const note = (text: string) => expect(screen.getAllByRole("status").some((el) => el.textContent?.includes(text))).toBe(true);
const mailbox = () => within(phone()).getByRole("button", { name: /^Your mailbox/ });
const viewer = () => screen.getByRole("dialog", { name: "Your mailbox" });
const tap = (name: string | RegExp, where: HTMLElement = viewer()) => fireEvent.click(within(where).getByRole("button", { name }));
const allKept = (): InboxState => {
  const s = demoData.mail(NOW);
  return { ...s, letters: s.letters.map((l) => ({ ...l, status: "kept" as const })) };
};

describe("the mailbox on your tree (MAILBOX-1)", () => {
  it("shows how many new photos there are, with the flag up", async () => {
    renderApp();
    toCircle();
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, 4 new photos");
    expect(mailbox().querySelector("[data-mailbox-flag='up']")).toBeTruthy();
    expect(mailbox().style.minHeight).toBe("44px");
  });

  it("with nothing new, says so and lowers the flag", () => {
    renderApp(emptyData);
    toCircle();
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, nothing new");
    expect(mailbox().querySelector("[data-mailbox-flag='down']")).toBeTruthy();
  });
});

describe("new mail (MAILBOX-2 to MAILBOX-4)", () => {
  it("opens on the first envelope, and the arrows flip between people", () => {
    renderApp();
    toCircle();
    fireEvent.click(mailbox());
    expect(viewer().textContent).toContain("4 new");
    expect(within(viewer()).getByText("1 of 2")).toBeTruthy();
    expect(within(viewer()).getByRole("button", { name: "Open the envelope from Leo" })).toBeTruthy();
    expect((within(viewer()).getByRole("button", { name: "Previous piece of mail" }) as HTMLButtonElement).disabled).toBe(true);
    tap("Next piece of mail");
    expect(within(viewer()).getByText("2 of 2")).toBeTruthy();
    const kate = within(viewer()).getByRole("button", { name: "Open the envelope from Kate Morgan, 3 photos" });
    expect(kate).toBeTruthy();
  });

  it("an opened envelope shows the photo; Done keeps it and moves on", () => {
    renderApp();
    toCircle();
    fireEvent.click(mailbox());
    tap("Open the envelope from Leo");
    expect(within(viewer()).getByText("Leo's Daily 5")).toBeTruthy();
    tap("Done");
    expect(viewer().textContent).toContain("3 new");
    expect(within(viewer()).getByText("1 of 1")).toBeTruthy();
    const saved: InboxState = JSON.parse(localStorage.getItem(inboxKey(".demo"))!);
    expect(saved.letters.find((l) => l.from.id === "leo" && l.status === "kept" && l.id === "demo-mail-1")).toBeTruthy();
  });

  it("a stack opens one photo at a time, then Done keeps them all and you're caught up", () => {
    renderApp();
    toCircle();
    fireEvent.click(mailbox());
    tap("Open the envelope from Leo");
    tap("Done");
    tap("Open the envelope from Kate Morgan, 3 photos");
    expect(within(viewer()).getByText("photo 1 of 3")).toBeTruthy();
    expect(within(viewer()).queryByRole("button", { name: "Done" })).toBeNull();
    tap("Next photo");
    tap("Next photo");
    expect(within(viewer()).getByText("photo 3 of 3")).toBeTruthy();
    tap("Done");
    expect(screen.queryByRole("dialog", { name: "Your mailbox" })).toBeNull();
    note("All caught up. Tap your mailbox to see old mail.");
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, nothing new");
  });

  it("closing without opening leaves the mail new: not now", () => {
    renderApp();
    toCircle();
    fireEvent.click(mailbox());
    tap("Close your mailbox");
    expect(screen.queryByRole("dialog", { name: "Your mailbox" })).toBeNull();
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, 4 new photos");
  });

  it("a photo can be seen big", () => {
    renderApp();
    toCircle();
    fireEvent.click(mailbox());
    tap("Open the envelope from Leo");
    tap("Make Leo's photo bigger");
    const big = screen.getByRole("dialog", { name: "Photo from Leo" });
    expect(big.textContent).toContain("from Leo · Daily 5");
    fireEvent.click(within(big).getByRole("button", { name: "Close the big photo" }));
    expect(screen.queryByRole("dialog", { name: "Photo from Leo" })).toBeNull();
  });
});

describe("the ⋯ menu: remove, block, report (MAILBOX-7)", () => {
  const openKate = () => {
    renderApp();
    toCircle();
    fireEvent.click(mailbox());
    tap("Next piece of mail");
    tap("Open the envelope from Kate Morgan, 3 photos");
    tap("More options for this photo");
    return screen.getByRole("menu", { name: "This photo" });
  };

  it("offers remove, block and report, each 44px", () => {
    const menu = openKate();
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["Remove from my mailbox", "Block Kate Morgan", "Report"]);
    for (const i of items) expect(i.style.minHeight).toBe("44px");
  });

  it("blocking removes all of Kate's photos and says so", () => {
    const menu = openKate();
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Block Kate Morgan" }));
    note("Kate Morgan is blocked. Their photos won't reach you.");
    const saved: InboxState = JSON.parse(localStorage.getItem(inboxKey(".demo"))!);
    expect(saved.blocked).toEqual(["kate-morgan"]);
    expect(saved.letters.filter((l) => l.from.id === "kate-morgan").every((l) => l.status === "removed")).toBe(true);
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, 1 new photo");
  });

  it("reporting thanks you and takes the photo away", () => {
    const menu = openKate();
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Report" }));
    note("Thanks for telling us. We'll take a look.");
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, 3 new photos");
  });
});

describe("kept mail (MAILBOX-5)", () => {
  it("with nothing new, the mailbox shows what you've kept, by week and month", async () => {
    localStorage.setItem(inboxKey(".demo"), JSON.stringify(allKept()));
    renderApp();
    // The saved mailbox loads after the first paint.
    await act(async () => {});
    toCircle();
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, nothing new");
    fireEvent.click(mailbox());
    const sheet = screen.getByRole("dialog", { name: "Your mailbox" });
    expect(sheet.textContent).toContain("nothing new · here's what you've kept");
    expect(within(sheet).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["this week", "october"]);
    fireEvent.click(within(sheet).getByRole("button", { name: "Photo from Ana, Oct 3" }));
    expect(screen.getByRole("dialog", { name: "Photo from Ana" })).toBeTruthy();
  });

  it("with nothing kept yet, says what goes here", () => {
    renderApp(emptyData);
    toCircle();
    fireEvent.click(mailbox());
    expect(screen.getByRole("dialog", { name: "Your mailbox" }).textContent).toContain("Photos people drop for you will be kept here.");
  });
});

describe("receive a drop, for testing (MAILBOX-8)", () => {
  it("adds a new photo to your mailbox", () => {
    renderApp(emptyData);
    toCircle();
    fireEvent.click(screen.getByRole("button", { name: "Receive a test drop" }));
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, 1 new photo");
  });
});
