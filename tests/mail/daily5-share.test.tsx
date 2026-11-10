import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, type AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { localPayment } from "@/app/intro/gifts/local-payment";
import { findMeKey } from "@/app/intro/mail/local-find-me";
import { mailboxSettingKey } from "@/app/intro/mail/local-mailbox-setting";
import { dropsKey } from "@/app/intro/mail/local-mail";
import type { Share } from "@/app/intro/mail/mail";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";

const NOW = new Date(2026, 10, 9, 12).getTime();
const OLD = new Date(2021, 4, 1).getTime();
let n = 0;
let dbName = "";
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
  dbName = `d5share-${++n}`;
});
afterEach(cleanup);

const seed = async () => {
  const store = await openPhotoStore(`${dbName}-photos`);
  for (let i = 0; i < 6; i++) await store.add({ pool: "mine", fileKey: `m${i}`, takenAt: OLD + i, image: new Blob([`m${i}`]) });
  store.close();
};
const shared: { url: string }[] = [];
const share: Share = { share: async (req) => (shared.push(req), "shared") };
const renderTab = (tab: "Daily 5" | "Me", data: AppData = demoData) =>
  render(
    <AppClient
      initialTab={tab}
      data={data}
      now={() => NOW}
      openStore={() => openPhotoStore(`${dbName}-photos`)}
      openArchive={() => openArchiveStore(`${dbName}-archive`)}
      openOrnaments={() => openOrnamentStore(dbName)}
      hasFace={async () => true}
      payment={() => localPayment({ wait: async () => {} })}
      share={() => share}
    />,
  );
const tap = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const firstCard = async () => (await screen.findAllByRole("article"))[0];
const sheet = () => screen.getByRole("dialog", { name: "Drop it in a mailbox" });
const search = (q: string) => fireEvent.change(within(sheet()).getByRole("searchbox", { name: "Find someone" }), { target: { value: q } });
const openDrop = async () => {
  await seed();
  renderTab("Daily 5");
  fireEvent.click(within(await firstCard()).getByRole("button", { name: "Drop this photo in someone's mailbox" }));
};

describe("the Daily 5 card (MAIL-1)", () => {
  it("has mailbox, gift and send, each labelled and 44px", async () => {
    await seed();
    renderTab("Daily 5");
    const card = await firstCard();
    for (const [name, label] of [["Drop this photo in someone's mailbox", "mailbox"], ["Send this photo as a gift", "gift"], ["Send this photo to someone", "send"]] as const) {
      const b = within(card).getByRole("button", { name });
      expect(b.style.minHeight).toBe("44px");
      expect(b.parentElement!.textContent).toContain(label);
    }
  });
});

describe("send as a gift (MAIL-8)", () => {
  it("opens the maker on To with the photo already picked, then shows the toast", async () => {
    await seed();
    renderTab("Daily 5");
    fireEvent.click(within(await firstCard()).getByRole("button", { name: "Send this photo as a gift" }));
    expect(await screen.findByRole("heading", { name: "Who's it for?" })).toBeTruthy();
    tap("Leo");
    tap(/^Next: frame/);
    tap(/^Next: note/);
    tap(/^Next: wrap/);
    tap(/^Send to Leo/);
    fireEvent.click(await screen.findByRole("button", { name: "Send to Leo · $0.99" }));
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    const toast = await screen.findByRole("status");
    expect(toast.textContent).toContain("Wrapped and on its way to Leo");
    fireEvent.click(within(toast).getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Wrapped and on its way to Leo")).toBeNull();
  });
});

describe("a Daily 5 gift keeps its photo (GIFT-17)", () => {
  const chipNames = () => within(screen.getByRole("navigation", { name: "Gift steps" })).getAllByRole("button").map((c) => c.textContent);

  it("has four steps, no camera roll, and Back from Frame goes to To", async () => {
    await seed();
    renderTab("Daily 5");
    fireEvent.click(within(await firstCard()).getByRole("button", { name: "Send this photo as a gift" }));
    await screen.findByRole("heading", { name: "Who's it for?" });
    expect(chipNames()).toEqual(["1To", "2Frame", "3Note", "4Wrap"]);
    tap("Leo");
    tap(/^Next: frame/);
    expect(screen.queryAllByRole("button", { name: /^Photo from / })).toEqual([]);
    tap(/^Back/);
    expect(screen.getByRole("heading", { name: "Who's it for?" })).toBeTruthy();
  });

  it("stays four steps when picked up again from Me", async () => {
    await seed();
    renderTab("Daily 5");
    fireEvent.click(within(await firstCard()).getByRole("button", { name: "Send this photo as a gift" }));
    await screen.findByRole("heading", { name: "Who's it for?" });
    tap("Leo");
    tap(/^Cancel/);
    cleanup();
    renderTab("Me");
    tap("gifts");
    tap(/send a gift/);
    await screen.findByRole("navigation", { name: "Gift steps" });
    expect(chipNames()).toEqual(["1To", "2Frame", "3Note", "4Wrap"]);
  });
});

describe("results as you type (MAIL-12)", () => {
  it("orders people with the same name by mutual friends", async () => {
    await openDrop();
    search("kate");
    await within(sheet()).findByRole("button", { name: /^Kate Sullivan/ });
    const names = within(sheet()).getAllByRole("button", { name: /^Kate / }).map((b) => b.getAttribute("aria-label") ?? b.textContent ?? "");
    const order = ["Kate Bishop", "Kate Morgan", "Kate Sullivan"].map((n) => names.findIndex((x) => x.startsWith(n)));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("finishes a partial @username", async () => {
    await openDrop();
    search("@katem");
    expect(await within(sheet()).findByRole("button", { name: /^Kate Morgan/ })).toBeTruthy();
  });
});

describe("no per-person wait, and who can drop (MAIL-6, MAIL-10)", () => {
  it("lets you drop for the same person again right away", async () => {
    await openDrop();
    search("kate");
    fireEvent.click(await within(sheet()).findByRole("button", { name: /^Kate Morgan/ }));
    tap("Drop in Kate Morgan’s mailbox");
    await screen.findByRole("heading", { name: "In Kate Morgan’s mailbox" });
    tap("Done");
    fireEvent.click(within(await firstCard()).getByRole("button", { name: "Drop this photo in someone's mailbox" }));
    search("kate");
    fireEvent.click(await within(sheet()).findByRole("button", { name: /^Kate Morgan/ }));
    expect(sheet().textContent).not.toContain("recently");
    expect((within(sheet()).getByRole("button", { name: "Drop in Kate Morgan’s mailbox" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows someone who isn't taking drops, with the button off and no reason given", async () => {
    await openDrop();
    search("@theopark");
    fireEvent.click(await within(sheet()).findByRole("button", { name: /^Theo Park/ }));
    expect(sheet().textContent).toContain("Theo Park isn't taking drops right now.");
    expect((within(sheet()).getByRole("button", { name: "Drop in Theo Park’s mailbox" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("by number, says so only after the drop, and records nothing", async () => {
    await openDrop();
    search("(555) 011-1222");
    fireEvent.click(await within(sheet()).findByRole("button", { name: /^Drop for \(555\) 011-1222/ }));
    tap("Drop it in their mailbox");
    expect(await within(sheet()).findByText("This number isn't taking drops right now.")).toBeTruthy();
    expect(localStorage.getItem(dropsKey(".demo"))).toBeNull();
  });

  it("Me has the setting, on anyone, and saves a change", async () => {
    renderTab("Me");
    const group = await screen.findByRole("radiogroup", { name: "Who can drop in my mailbox" });
    const options = within(group).getAllByRole("radio");
    expect(options.map((o) => o.textContent)).toEqual(["Anyone", "Friends of friends", "Only my circles"]);
    expect(options[0].getAttribute("aria-checked")).toBe("true");
    for (const o of options) expect(o.style.minHeight).toBe("44px");
    fireEvent.click(options[2]);
    expect(options[2].getAttribute("aria-checked")).toBe("true");
    await new Promise((r) => setTimeout(r, 0));
    expect(localStorage.getItem(mailboxSettingKey(".demo"))).toBe("circles");
  });
});

describe("drop in a mailbox (MAIL-2 to MAIL-5)", () => {
  it("says who it's for, and waits for someone to be picked", async () => {
    await openDrop();
    expect(sheet().textContent).toContain("Anyone on Now & Then. They don't have to be in your circles.");
    expect((within(sheet()).getByRole("button", { name: "Pick someone" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("finds people by name with a minimal card each, friends included", async () => {
    await openDrop();
    search("kate");
    const kate = await within(sheet()).findByRole("button", { name: /^Kate Morgan/ });
    expect(kate.textContent).toContain("@katemorgan");
    expect(kate.textContent).toContain("2 mutual · Leo, Ana");
    search("leo");
    const leo = await within(sheet()).findByRole("button", { name: /^Leo/ });
    expect(leo.textContent).toContain("in your branches");
  });

  it("finds someone who's hidden from name search by their exact username", async () => {
    await openDrop();
    search("theo");
    await within(sheet()).findByText("Nobody by that name on Now & Then.");
    search("@theopark");
    expect(await within(sheet()).findByRole("button", { name: /^Theo Park/ })).toBeTruthy();
  });

  it("drops into a picked person's mailbox, with the mailbox scene, and no friend request", async () => {
    await openDrop();
    search("kate");
    fireEvent.click(await within(sheet()).findByRole("button", { name: /^Kate Morgan/ }));
    tap("Drop in Kate Morgan’s mailbox");
    expect(await screen.findByRole("heading", { name: "In Kate Morgan’s mailbox" })).toBeTruthy();
    expect(screen.getByText(/Their mailbox will glow under their tree\.\s*No friend request needed\./)).toBeTruthy();
    expect(document.querySelector("[data-mailbox-flag='up']")).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(dropsKey(".demo"))!)).toHaveLength(1);
    tap("Done");
    expect(screen.queryByRole("heading", { name: /mailbox/ })).toBeNull();
  });

  it("drops by phone number without saying first whether they're on the app", async () => {
    await openDrop();
    search("(555) 012-3456");
    const row = await within(sheet()).findByRole("button", { name: /^Drop for \(555\) 012-3456/ });
    expect(row.textContent).not.toContain("Kate");
    fireEvent.click(row);
    tap("Drop it in their mailbox");
    expect(await screen.findByRole("heading", { name: "In their mailbox" })).toBeTruthy();
    expect(shared).toHaveLength(0);
  });

  it("turns a number with no account into an invite, shares the link, and waits", async () => {
    await openDrop();
    search("555 444 1212");
    fireEvent.click(await within(sheet()).findByRole("button", { name: /^Drop for \(555\) 444-1212/ }));
    tap("Drop it in their mailbox");
    expect(await screen.findByRole("heading", { name: "Waiting in their mailbox" })).toBeTruthy();
    expect(screen.getByText("It’ll be there when they join.")).toBeTruthy();
    expect(document.querySelector("[data-mailbox-flag='down']")).toBeTruthy();
    expect(shared.at(-1)!.url).toMatch(/\/invite\//);
    tap("Send the link again");
    expect(shared).toHaveLength(2);
  });

  it("holds back a fourth drop outside your circle in a week, and says when", async () => {
    const at = NOW - 86_400_000;
    localStorage.setItem(dropsKey(".demo"), JSON.stringify(["a", "b", "c"].map((to, i) => ({ id: `d${i}`, to, at, outside: true, photoId: "p" }))));
    await openDrop();
    search("kate");
    fireEvent.click(await within(sheet()).findByRole("button", { name: /^Kate Morgan/ }));
    expect(await within(sheet()).findByText("You've dropped 3 photos outside your circle this week. You can send another on Nov 15.")).toBeTruthy();
    expect((within(sheet()).getByRole("button", { name: "Drop in Kate Morgan’s mailbox" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("let people find me by name (MAIL-7)", () => {
  it("is on by default, and turns off, kept", async () => {
    renderTab("Me");
    const toggle = screen.getByRole("switch", { name: "Let people find me by name" });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(toggle.style.minHeight).toBe("44px");
    expect(screen.getByText("They can still find you by your exact @username or phone number.")).toBeTruthy();
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    await new Promise((r) => setTimeout(r, 0));
    expect(localStorage.getItem(findMeKey(".demo"))).toBe("false");
  });
});
