import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, type AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import type { InboxState } from "@/app/intro/mail/inbox";
import { inboxKey } from "@/app/intro/mail/local-inbox";
import { localPayment } from "@/app/intro/gifts/local-payment";

// Tuesday, Nov 10: the demo's Leo turns a year older on Friday, Nov 13.
const NOW = new Date(2026, 10, 10, 12).getTime();
const OLD = new Date(2021, 4, 1).getTime();
let n = 0;
let id = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
  id = ++n;
});
afterEach(cleanup);

const renderApp = (data: AppData = demoData, initialTab: "Circles" | "Me" = "Circles") =>
  render(
    <AppClient
      initialTab={initialTab}
      data={data}
      now={() => NOW}
      openStore={() => openPhotoStore(`bd-photos-${id}`)}
      openArchive={() => openArchiveStore(`bd-archive-${id}`)}
      hasFace={async () => true}
      payment={() => localPayment({ wait: async () => {} })}
    />,
  );
const seedPhoto = async () => {
  const store = await openPhotoStore(`bd-photos-${id}`);
  await store.add({ pool: "mine", fileKey: "m0", takenAt: OLD, image: new Blob(["m0"]) });
  store.close();
};
const phone = () => document.querySelector("[data-layout='phone']") as HTMLElement;
const toCircle = () => fireEvent.click(within(phone().querySelector("[role='group'][aria-label='Circles view']") as HTMLElement).getByRole("button", { name: "your circle" }));
const mailbox = () => within(phone()).getByRole("button", { name: /^Your mailbox/ });
const viewer = () => screen.getByRole("dialog", { name: "Your mailbox" });
const card = () => within(viewer()).getByRole("region", { name: /^Birthday coming up/ });
const tap = (name: string | RegExp, where: HTMLElement = viewer()) => fireEvent.click(within(where).getByRole("button", { name }));
const saved = (): InboxState => JSON.parse(localStorage.getItem(inboxKey(".demo")) ?? "null");
const md = (daysAway: number) => {
  const d = new Date(NOW + daysAway * 86_400_000);
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const withBirthdays = (b: Record<string, string>): AppData => ({ ...demoData, birthdays: () => b });

describe("a birthday coming up is new mail (MAILBOX-11)", () => {
  it("counts on the mailbox with the photos", () => {
    renderApp();
    toCircle();
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, 4 new photos and 1 birthday");
  });

  it("comes first: a card, not a letter, with who, the day and a countdown", () => {
    renderApp();
    toCircle();
    fireEvent.click(mailbox());
    const c = card();
    expect(c.getAttribute("aria-label")).toBe("Birthday coming up: Leo, Friday, Nov 13");
    for (const part of ["birthday coming up", "Leo", "Friday, Nov 13", "in 3 days"]) expect(c.textContent).toContain(part);
    expect(within(viewer()).getByRole("button", { name: "Schedule a gift" }).style.minHeight).toBe("44px");
    expect(viewer().textContent).toContain("1 of 3");
  });

  it("anyone in your whole circle, bloom too; nobody's a week or more early", () => {
    renderApp(withBirthdays({ grandma: md(7), nico: md(8) }));
    toCircle();
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, 4 new photos and 1 birthday");
    fireEvent.click(mailbox());
    expect(card().textContent).toContain("Grandma");
    expect(card().textContent).toContain("in 7 days");
  });

  it("says tomorrow and today, and on the day it's Send a gift", () => {
    renderApp(withBirthdays({ leo: md(0) }));
    toCircle();
    fireEvent.click(mailbox());
    expect(card().textContent).toContain("today");
    expect(within(viewer()).getByRole("button", { name: "Send a gift" })).toBeTruthy();
  });

  it("once you've seen it, it's no longer new: moving on keeps it", () => {
    renderApp();
    toCircle();
    fireEvent.click(mailbox());
    tap("Next piece of mail");
    expect(viewer().textContent).toContain("1 of 2");
    expect(saved().seen.map((r) => r.id)).toEqual(["bday-leo-2026-11-13"]);
  });

  it("closing on it keeps it too", () => {
    renderApp();
    toCircle();
    fireEvent.click(mailbox());
    tap("Close your mailbox");
    expect(mailbox().getAttribute("aria-label")).toBe("Your mailbox, 4 new photos");
  });
});

describe("Schedule a gift (MAILBOX-12)", () => {
  it("opens the gift maker for them, set to open on their birthday, at the photo", async () => {
    renderApp();
    toCircle();
    fireEvent.click(mailbox());
    tap("Schedule a gift");
    expect(await screen.findByRole("heading", { name: "A gift for Leo" })).toBeTruthy();
    const steps = within(screen.getByRole("navigation", { name: "Gift steps" })).getAllByRole("button");
    expect(steps.find((b) => b.getAttribute("aria-current") === "step")!.textContent).toContain("Photo");
    const draft = JSON.parse(localStorage.getItem("nowandthen.gifts.v1.demo") ?? "[]").at(-1);
    expect(draft).toMatchObject({ to: { kind: "person", id: "leo" }, opens: { kind: "on", day: "2026-11-13" }, step: "photo" });
  });

  it("sent, the card says it's scheduled, and so does the kept reminder", async () => {
    await seedPhoto();
    renderApp();
    toCircle();
    fireEvent.click(mailbox());
    tap("Schedule a gift");
    await screen.findByRole("heading", { name: "A gift for Leo" });
    fireEvent.click((await screen.findAllByRole("button", { name: /^Photo from / }))[0]);
    for (const step of [/^Next: frame/, /^Next: note/, /^Next: wrap/]) fireEvent.click(screen.getByRole("button", { name: step }));
    fireEvent.click(screen.getByRole("button", { name: /^Send to Leo/ }));
    fireEvent.click(await within(screen.getByRole("dialog", { name: "Ready to send" })).findByRole("button", { name: /^Send to Leo · / }));
    expect(await screen.findByText("It’ll stay wrapped until Friday, Nov 13, then pop up for Leo.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    const done = within(card().parentElement!.parentElement!).getByRole("status");
    expect(done.textContent).toContain("Gift scheduled");
    expect(done.textContent).toContain("It’ll pop up for Leo on Friday.");
    expect(within(viewer()).queryByRole("button", { name: "Schedule a gift" })).toBeNull();
    expect(saved().birthdayGifts).toEqual([{ personId: "leo", day: "2026-11-13" }]);
  });

  it("a gift sent for their birthday from anywhere counts", async () => {
    const mail = demoData.mail(NOW);
    localStorage.setItem(inboxKey(".demo"), JSON.stringify({ ...mail, birthdayGifts: [{ personId: "leo", day: "2026-11-13" }] }));
    renderApp();
    await act(async () => {});
    toCircle();
    fireEvent.click(mailbox());
    expect(within(card().parentElement!.parentElement!).getByRole("status").textContent).toContain("Gift scheduled");
  });
});

describe("kept with your photos (MAILBOX-13)", () => {
  it("a seen reminder stays as a tile: who and the weekday, reminder or gift scheduled; it opens the card again", async () => {
    const mail = demoData.mail(NOW);
    localStorage.setItem(inboxKey(".demo"), JSON.stringify({ ...mail, letters: mail.letters.map((l) => ({ ...l, status: "kept" })), seen: [{ id: "bday-leo-2026-11-13", personId: "leo", day: "2026-11-13", at: NOW - 1000 }] }));
    renderApp();
    await act(async () => {});
    toCircle();
    fireEvent.click(mailbox());
    const sheet = screen.getByRole("dialog", { name: "Your mailbox" });
    const tile = within(sheet).getByRole("button", { name: "Birthday reminder for Leo" });
    expect(tile.textContent).toContain("Leo · Fri");
    expect(tile.textContent).toContain("reminder");
    expect(tile.textContent).toContain("birthday reminder");
    fireEvent.click(tile);
    expect(card().textContent).toContain("Friday, Nov 13");
    expect(within(viewer()).getByRole("button", { name: "Schedule a gift" })).toBeTruthy();
  });
});

describe("birthdays in the gift maker (GIFT-24)", () => {
  const toLeo = async () => {
    renderApp(demoData, "Me");
    fireEvent.click(screen.getByRole("button", { name: "gifts" }));
    fireEvent.click(screen.getByRole("button", { name: "send a gift" }));
    await screen.findByRole("heading", { name: "Who's it for?" });
  };

  it("a birthday this week shows a badge on who it's for", async () => {
    await toLeo();
    const leo = screen.getByRole("button", { name: "Leo, birthday Fri, Nov 13" });
    expect(leo.textContent).toContain("bday Fri");
    expect(screen.getByRole("button", { name: "Priya" }).textContent).not.toContain("bday");
  });

  it("'on a day' for them picks their birthday", async () => {
    await seedPhoto();
    await toLeo();
    fireEvent.click(screen.getByRole("button", { name: "Leo, birthday Fri, Nov 13" }));
    fireEvent.click(screen.getByRole("button", { name: /^Next: photo/ }));
    fireEvent.click((await screen.findAllByRole("button", { name: /^Photo from / }))[0]);
    for (const step of [/^Next: frame/, /^Next: note/, /^Next: wrap/]) fireEvent.click(screen.getByRole("button", { name: step }));
    fireEvent.click(screen.getByRole("button", { name: "on a day" }));
    expect(screen.getByText("Fri, Nov 13 · their birthday")).toBeTruthy();
  });
});
