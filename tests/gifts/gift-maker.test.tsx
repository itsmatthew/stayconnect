import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, emptyData, type AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { colorOverridesKey } from "@/app/intro/colors/local-color-overrides";
import { groupPalette } from "@/app/intro/colors/palette";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import type { Gift } from "@/app/intro/gifts/gift";
import { giftEventsKey } from "@/app/intro/gifts/local-gift-events";
import { giftsKey } from "@/app/intro/gifts/local-gift-store";
import { groupNamesKey } from "@/app/intro/group-names/local-group-names";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";

const NOW = new Date(2026, 10, 6, 12).getTime();
const OLD = new Date(2021, 4, 1).getTime();
let n = 0;
let dbName = "";
let u = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => `blob:gift-${++u}`);
  URL.revokeObjectURL = vi.fn();
  dbName = `gift-maker-${++n}`;
});
afterEach(cleanup);

const seedPhotos = async (count = 3, fileDated = false) => {
  const store = await openPhotoStore(`${dbName}-photos`);
  for (let i = 0; i < count; i++) await store.add({ pool: "mine", fileKey: `m${i}`, takenAt: OLD + i, image: new Blob([`m${i}`]), ...(fileDated ? { fileDated: true } : {}) });
  store.close();
};
/** The demo without birthdays: these tests are about the maker (birthdays: tests/mail/mailbox-birthday.test.tsx). */
const noBirthdays: AppData = { ...demoData, birthdays: () => ({}) };
const renderMe = (data: AppData = noBirthdays) =>
  render(
    <AppClient
      initialTab="Me"
      data={data}
      now={() => NOW}
      openStore={() => openPhotoStore(`${dbName}-photos`)}
      openArchive={() => openArchiveStore(`${dbName}-archive`)}
      openOrnaments={() => openOrnamentStore(dbName)}
      hasFace={async () => true}
    />,
  );

/**
 * The topmost sheet (the maker, or checkout or the sent screen over it), else the page. Role queries over the whole Me
 * screen behind the maker are slow in jsdom, so taps look only where the user is.
 */
const top = () => {
  const open = document.querySelectorAll<HTMLElement>("[role='dialog']");
  return open.length ? open[open.length - 1] : document.body;
};
const tap = (name: string | RegExp) => fireEvent.click(within(top()).getByRole("button", { name }));
const openMaker = async () => {
  tap("gifts");
  tap("send a gift");
  await waitFor(() => expect(top()).not.toBe(document.body));
  await within(top()).findByRole("heading", { name: "Who's it for?" });
};
const saved = (): Gift[] => JSON.parse(localStorage.getItem(giftsKey(".demo")) ?? "[]");
const next = (name: string) => tap(new RegExp(`^Next: ${name}`));
const toFrame = async () => {
  await openMaker();
  tap("Leo");
  next("photo");
  fireEvent.click((await within(top()).findAllByRole("button", { name: /^Photo from / }))[0]);
  next("frame");
};

describe("way in (GIFT-1)", () => {
  it("the gifts pill shows the shelf and send a gift, and posts comes back", () => {
    renderMe();
    tap("gifts");
    expect(screen.getByRole("button", { name: "gifts" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: "send a gift" })).toBeTruthy();
    tap("posts");
    expect(screen.queryByRole("button", { name: "send a gift" })).toBeNull();
  });
});

describe("five steps (GIFT-2)", () => {
  it("shows the chips, with Next off until a person is picked, and tap targets of 44px", async () => {
    renderMe();
    await openMaker();
    const chips = within(screen.getByRole("navigation", { name: "Gift steps" })).getAllByRole("button");
    expect(chips.map((c) => c.textContent)).toEqual(["1To", "2Photo", "3Frame", "4Note", "5Wrap"]);
    for (const chip of chips) expect(chip.style.minHeight).toBe("44px");
    expect(chips[0].getAttribute("aria-current")).toBe("step");
    expect((chips[1] as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /^Next: photo/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: /^Next: photo/ }).style.minHeight).toBe("44px");
    expect(screen.getByRole("button", { name: "Cancel and go back to your gifts" }).style.minHeight).toBe("44px");
  });

  it("walks to Wrap and back, keeping everything", async () => {
    await seedPhotos();
    renderMe();
    await toFrame();
    tap("Film");
    next("note");
    fireEvent.change(screen.getByLabelText("Write on the back"), { target: { value: "Miss you guys." } });
    next("wrap");
    expect(screen.getByRole("heading", { name: "Wrap it up" })).toBeTruthy();
    tap("Back");
    expect((screen.getByLabelText("Write on the back") as HTMLTextAreaElement).value).toBe("Miss you guys.");
    tap("Back");
    expect(screen.getByRole("button", { name: "Film" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("a chip jumps back to a finished step", async () => {
    await seedPhotos();
    renderMe();
    await toFrame();
    fireEvent.click(within(screen.getByRole("navigation", { name: "Gift steps" })).getByRole("button", { name: /To$/ }));
    expect(screen.getByRole("heading", { name: "Who's it for?" })).toBeTruthy();
  });
});

describe("live card (GIFT-3)", () => {
  it("shows the postcard on To and Note, the photo on Frame, and the wrapping on Wrap", async () => {
    await seedPhotos();
    const { container } = renderMe();
    await openMaker();
    const flip = () => container.ownerDocument.querySelector<HTMLElement>("[data-flip]");
    expect(flip()!.style.transform).toContain("180deg");
    tap("Leo");
    next("photo");
    fireEvent.click((await screen.findAllByRole("button", { name: /^Photo from / }))[0]);
    next("frame");
    expect(flip()!.style.transform).not.toContain("180deg");
    tap("turn it over");
    expect(flip()!.style.transform).toContain("180deg");
    next("note");
    next("wrap");
    expect(container.ownerDocument.querySelector("[data-pattern]")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /turn it over|see the photo/ })).toBeNull();
  });
});

describe("To (GIFT-4)", () => {
  it("lists rings, keeps the rest behind everyone, and searches", async () => {
    renderMe();
    await openMaker();
    expect(screen.getByText("your nest")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Leo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /everyone/ })).toBeTruthy();
    tap("Search friends");
    fireEvent.change(screen.getByRole("searchbox", { name: "Search people" }), { target: { value: "gran" } });
    expect(screen.getByRole("button", { name: "Grandma" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Leo" })).toBeNull();
  });

  it("names the gift for the person picked", async () => {
    renderMe();
    await openMaker();
    tap("Leo");
    expect(screen.getByRole("heading", { name: "A gift for Leo" })).toBeTruthy();
  });

  it("says so with nobody to pick", async () => {
    renderMe(emptyData);
    await openMaker();
    expect(screen.getByText("People show up here once they're in your circle.")).toBeTruthy();
  });
});

describe("groups (GIFT-4, GIFT-13)", () => {
  const HOOPS = "Hoops Since ’14";
  const labels = () => [...document.querySelectorAll("[data-recipient-section]")].map((s) => s.getAttribute("data-recipient-section"));

  it("shows groups first, then people", async () => {
    renderMe();
    await openMaker();
    expect(screen.getByText("your groups")).toBeTruthy();
    expect(labels()).toEqual(["groups", "nest", "branches"]);
    expect(screen.getByRole("button", { name: HOOPS })).toBeTruthy();
  });

  it("draws a group in its own color, with its name and logo as this viewer sees them", async () => {
    localStorage.setItem(colorOverridesKey(".demo"), JSON.stringify({ "hoops-since-14": "teal" }));
    localStorage.setItem(groupNamesKey(".demo"), JSON.stringify({ "hoops-since-14": "Court Rats" }));
    renderMe();
    tap("gifts");
    tap("send a gift");
    const logo = await screen.findByRole("img", { name: "Court Rats logo" });
    expect(logo.getAttribute("style")).toContain(groupPalette("teal", 0).canopy);
  });

  it("searches groups", async () => {
    renderMe();
    await openMaker();
    tap("Search friends");
    fireEvent.change(screen.getByRole("searchbox", { name: "Search people" }), { target: { value: "hoops" } });
    expect(screen.getByRole("button", { name: HOOPS })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Madrid Crew" })).toBeNull();
  });

  it("names the gift, the tag and the postcard for the group", async () => {
    await seedPhotos();
    renderMe();
    await openMaker();
    tap(HOOPS);
    expect(screen.getByRole("heading", { name: `A gift for ${HOOPS}` })).toBeTruthy();
    expect(saved()[0].to).toEqual({ kind: "group", id: "hoops-since-14" });
    expect(screen.getByTestId("gift-postcard").textContent).toContain(HOOPS);
    next("photo");
    fireEvent.click((await screen.findAllByRole("button", { name: /^Photo from / }))[0]);
    next("frame");
    next("note");
    expect(screen.getByRole("button", { name: "Pen handwriting" }).textContent).toBe("Hey all");
    next("wrap");
    expect(document.querySelector("[data-pattern]")!.textContent).toContain(`to ${HOOPS}`);
  });

  it("keeps a long title to two lines", async () => {
    renderMe();
    await openMaker();
    tap(HOOPS);
    expect(screen.getByRole("heading", { name: `A gift for ${HOOPS}` }).className).toBe("gf-two-lines");
  });

  it("switches between a group and a person", async () => {
    renderMe();
    await openMaker();
    tap(HOOPS);
    tap("Leo");
    expect(screen.getByRole("heading", { name: "A gift for Leo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Leo" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: HOOPS }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "Leo" }).querySelector("[data-picked]")).toBeTruthy();
  });
});

describe("Photo (GIFT-5)", () => {
  it("shows 30 newest at a time", async () => {
    await seedPhotos(31);
    renderMe();
    await openMaker();
    tap("Leo");
    next("photo");
    expect(await screen.findAllByRole("button", { name: /^Photo from / })).toHaveLength(30);
    tap("Show more");
    await waitFor(() => expect(screen.getAllByRole("button", { name: /^Photo from / })).toHaveLength(31));
  });

  it("offers Daily 5 with no photos", async () => {
    renderMe();
    await openMaker();
    tap("Leo");
    next("photo");
    tap(await screen.findByText("Add photos in Daily 5").then(() => "Add photos in Daily 5"));
    await screen.findAllByRole("button", { name: "Daily 5", current: "page" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Frame (GIFT-6)", () => {
  it("offers six frames and a date stamp that's on", async () => {
    await seedPhotos();
    renderMe();
    await toFrame();
    for (const f of ["Classic", "Instant", "Album", "Film", "Wood", "November"]) expect(screen.getByRole("button", { name: f })).toBeTruthy();
    const toggle = screen.getByRole("switch", { name: "Date stamp" });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(toggle.style.minHeight).toBe("44px");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("turns the stamp off for a photo dated only by its file, and says why", async () => {
    await seedPhotos(3, true);
    renderMe();
    await toFrame();
    const toggle = screen.getByRole("switch", { name: "Date stamp" }) as HTMLButtonElement;
    expect(toggle.disabled).toBe(true);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByText("this photo has no capture date")).toBeTruthy();
  });
});

describe("Note (GIFT-7)", () => {
  const toNote = async () => {
    await seedPhotos();
    renderMe();
    await toFrame();
    next("note");
  };

  it("writes onto the postcard, counts, and signs with the sender's name", async () => {
    await toNote();
    fireEvent.change(screen.getByLabelText("Write on the back"), { target: { value: "Found this." } });
    expect(screen.getByText("11/140")).toBeTruthy();
    const card = screen.getByTestId("gift-postcard");
    expect(card.textContent).toContain("Found this.");
    expect(card.textContent).toContain(`— ${demoData.senderName}`);
  });

  it("stops at 140", async () => {
    await toNote();
    fireEvent.change(screen.getByLabelText("Write on the back"), { target: { value: "a".repeat(150) } });
    expect((screen.getByLabelText("Write on the back") as HTMLTextAreaElement).value).toHaveLength(140);
  });

  it("changes handwriting, ink and stamp", async () => {
    await toNote();
    tap("Pencil handwriting");
    tap("Red ink");
    tap("Heart stamp");
    expect(saved()[0].note).toMatchObject({ hand: "pencil", ink: "red", stamp: "heart" });
    for (const name of ["Pencil handwriting", "Red ink", "Heart stamp"]) expect(within(top()).getByRole("button", { name }).style.minHeight).toBe("44px");
  });
});

describe("Wrap (GIFT-8)", () => {
  const toWrap = async () => {
    await seedPhotos();
    renderMe();
    await toFrame();
    next("note");
    next("wrap");
  };

  it("chooses a paper and ribbon, then Send opens checkout", async () => {
    await toWrap();
    tap("Gingham paper");
    tap("Red ribbon");
    expect(saved()[0].wrap).toEqual({ pattern: "gingham", ribbon: "red" });
    expect((screen.getByRole("button", { name: /^Send to Leo/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("opens on a chosen day after today, and tags it", async () => {
    await toWrap();
    tap("on a day");
    const day = screen.getByLabelText("Opens on") as HTMLInputElement;
    expect(day.min).toBe("2026-11-07");
    expect(day.style.minHeight).toBe("44px");
    fireEvent.change(day, { target: { value: "2026-11-12" } });
    expect(saved()[0].opens).toEqual({ kind: "on", day: "2026-11-12" });
    expect(document.querySelector("[data-pattern]")!.textContent).toContain("open Nov 12");
    tap("right away");
    expect(saved()[0].opens).toEqual({ kind: "now" });
  });
});

describe("never lost (GIFT-9, GIFT-11)", () => {
  it("keeps the gift through closing and reopening the app, on the same step", async () => {
    await seedPhotos();
    const first = renderMe();
    await toFrame();
    next("note");
    fireEvent.change(screen.getByLabelText("Write on the back"), { target: { value: "Keep me" } });
    tap("Cancel and go back to your gifts");
    expect(screen.queryByRole("heading", { name: "A gift for Leo" })).toBeNull();
    first.unmount();

    renderMe();
    tap("gifts");
    tap("send a gift");
    expect(await screen.findByRole("heading", { name: "A gift for Leo" })).toBeTruthy();
    expect((screen.getByLabelText("Write on the back") as HTMLTextAreaElement).value).toBe("Keep me");
    expect(saved()).toHaveLength(1);
  });

  it("records made and abandoned", async () => {
    renderMe();
    await openMaker();
    tap("Leo");
    tap("Cancel and go back to your gifts");
    await waitFor(() => expect(JSON.parse(localStorage.getItem(giftEventsKey(".demo")) ?? "[]").map((e: { type: string }) => e.type)).toEqual(["made", "abandoned"]));
  });
});

