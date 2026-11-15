import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";
import type { CropArea } from "@/app/intro/photo-file";

const NOW = new Date(2026, 9, 20, 12).getTime();
let n = 0;
let dbName = "";
let urls = 0;
const cropStub = () => vi.fn<(image: Blob, area: CropArea | undefined, max: number) => Promise<Blob>>(async () => new Blob(["square"], { type: "image/jpeg" }));
let crop = cropStub();
beforeEach(() => {
  crop = cropStub();
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => `blob:ornament-${++urls}`);
  URL.revokeObjectURL = vi.fn();
  dbName = `ornament-sheet-${++n}`;
});
afterEach(cleanup);

/** Spies on the ornament store's close, so a test can wait until the app has finished with it. Reset per test, so a
 * store still opening can't leave the last test's (already called) spy in place. */
let closeOrnaments = vi.fn();
beforeEach(() => {
  closeOrnaments = vi.fn();
});
const openOrnaments = async () => {
  const s = await openOrnamentStore(dbName);
  closeOrnaments = vi.fn(s.close);
  return { ...s, close: closeOrnaments };
};

function renderHome() {
  const utils = render(
    <AppClient
      data={demoData}
      now={() => NOW}
      openStore={() => openPhotoStore(`${dbName}-photos`)}
      openArchive={() => openArchiveStore(`${dbName}-archive`)}
      openOrnaments={openOrnaments}
      decode={async () => new Blob(["jpeg"], { type: "image/jpeg" })}
      crop={crop}
      hasFace={async () => true}
    />,
  );
  const phone = utils.container.querySelector("[data-layout='phone']") as HTMLElement;
  const wide = utils.container.querySelector("[data-layout='wide']") as HTMLElement;
  return { ...utils, phone, wide };
}

const HOOPS = "Hoops Since ’14";
const ornamentButtons = (layout: HTMLElement) => within(layout).getAllByRole("button", { name: /^Change ornament \d of / });
const tapOrnament = (layout: HTMLElement, n: number, group = HOOPS) =>
  fireEvent.click(within(layout).getByRole("button", { name: `Change ornament ${n} of ${group}` }));
const dialog = () => screen.getByRole("dialog", { name: `${HOOPS}’s defining memories` });
const caption = () => within(dialog()).getByRole("textbox", { name: "Caption" }) as HTMLInputElement;
const save = () => within(dialog()).getByRole("button", { name: "Save" }) as HTMLButtonElement;
const choose = () =>
  fireEvent.change(within(dialog()).getByLabelText("Choose a photo"), {
    target: { files: [new File(["x"], "pic.jpg", { type: "image/jpeg" })] },
  });
const hoopsOrnaments = (layout: HTMLElement) =>
  Array.from(layout.querySelectorAll("[data-tree][data-group-id='hoops-since-14'] [data-ornament]"));
const card = (layout: HTMLElement) => within(layout).getByRole("region", { name: "Selected circle" });
const flat = (s: string | null) => (s ?? "").replace(/\s+/g, " ");

async function changeFirst(layout: HTMLElement, text = "new rim") {
  tapOrnament(layout, 1);
  choose();
  await waitFor(() => expect(within(dialog()).getByRole("img", { name: "New photo" })).toBeTruthy());
  fireEvent.change(caption(), { target: { value: text } });
  fireEvent.click(save());
  await waitFor(() => expect(hoopsOrnaments(layout)[0].querySelector("image[href^='blob:']")).toBeTruthy());
}

describe("ornaments are buttons (HOME-13)", () => {
  it("every visible ornament, in both layouts", () => {
    const { phone, wide } = renderHome();
    expect(ornamentButtons(phone)).toHaveLength(9);
    expect(ornamentButtons(wide)).toHaveLength(15);
    for (const i of [1, 2, 3]) {
      expect(within(phone).getByRole("button", { name: `Change ornament ${i} of ${HOOPS}` })).toBeTruthy();
      expect(within(wide).getByRole("button", { name: `Change ornament ${i} of Family` })).toBeTruthy();
    }
  });

  it("tapping one opens the sheet on it, titled with the group", () => {
    const { wide } = renderHome();
    tapOrnament(wide, 2);
    const choices = within(dialog()).getAllByRole("button", { name: /^Ornament \d$/ });
    expect(choices.map((c) => c.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"]);
    expect(caption().value).toBe("the 6am run");
    fireEvent.click(choices[2]);
    expect(caption().value).toBe("post-game tacos");
  });

  it("a side tree's ornament opens that group", () => {
    const { phone } = renderHome();
    tapOrnament(phone, 1, "Madrid Crew");
    expect(screen.getByRole("dialog", { name: "Madrid Crew’s defining memories" })).toBeTruthy();
  });

  it("“swap photos” opens the sheet on the center group's first ornament (HOME-4)", () => {
    const { phone } = renderHome();
    fireEvent.click(within(card(phone)).getByRole("button", { name: "swap photos" }));
    const choices = within(dialog()).getAllByRole("button", { name: /^Ornament \d$/ });
    expect(choices[0].getAttribute("aria-pressed")).toBe("true");
    expect(caption().value).toBe("buzzer beater");
  });
});

describe("the sheet (HOME-14)", () => {
  it("is a plain photo picker with an optional, short caption; Save waits for a change", () => {
    const { phone } = renderHome();
    tapOrnament(phone, 1);
    const input = within(dialog()).getByLabelText("Choose a photo") as HTMLInputElement;
    expect(input.type).toBe("file");
    expect(input.accept).toBe("image/*");
    expect(input.hasAttribute("capture")).toBe(false);
    expect(caption().maxLength).toBe(40);
    expect(caption().placeholder).toBe("what makes this one ours");
    expect(dialog().textContent).toContain("Pick a photo that defines this group — the inside joke, the trip, the night everyone still talks about.");
    expect(save().disabled).toBe(true);
    fireEvent.change(caption(), { target: { value: "buzzer beater " } });
    expect(save().disabled).toBe(true);
    fireEvent.change(caption(), { target: { value: "" } });
    expect(save().disabled).toBe(false);
  });

  it("opens a picked photo in the round cropper (LOGO-7)", async () => {
    const { phone } = renderHome();
    tapOrnament(phone, 1);
    choose();
    const img = await within(dialog()).findByRole("img", { name: "New photo" });
    expect(img.getAttribute("src")).toMatch(/^blob:/);
    expect(within(dialog()).getByRole("slider", { name: "Zoom" })).toBeTruthy();
    expect(save().disabled).toBe(false);
  });

  it("Cancel discards the photo and the caption", async () => {
    const { phone } = renderHome();
    tapOrnament(phone, 1);
    choose();
    await within(dialog()).findByRole("img", { name: "New photo" });
    fireEvent.change(caption(), { target: { value: "nope" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(hoopsOrnaments(phone)[0].querySelector("image")).toBeNull();
    expect(flat(card(phone).textContent)).toContain("buzzer beater");
    tapOrnament(phone, 1);
    expect(caption().value).toBe("buzzer beater");
    expect(within(dialog()).queryByRole("img", { name: "New photo" })).toBeNull();
  });
});

describe("saving (HOME-15)", () => {
  it("puts the photo on the tree in both layouts and on the card, with the caption", async () => {
    const { phone, wide } = renderHome();
    await changeFirst(phone);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(crop).toHaveBeenCalledTimes(1);
    expect(crop.mock.calls[0][2]).toBe(1024);
    expect(hoopsOrnaments(wide)[0].querySelector("image[href^='blob:']")).toBeTruthy();
    expect(hoopsOrnaments(phone)[1].querySelector("image")).toBeNull();
    for (const layout of [phone, wide]) {
      expect(card(layout).querySelector("image[href^='blob:']")).toBeTruthy();
      expect(flat(card(layout).textContent)).toContain("new rim");
      expect(flat(card(layout).textContent)).not.toContain("buzzer beater");
    }
  });

  it("is kept: it's still there after the app reopens", async () => {
    const first = renderHome();
    await changeFirst(first.phone);
    first.unmount();
    const { phone } = renderHome();
    await waitFor(() => expect(hoopsOrnaments(phone)[0].querySelector("image[href^='blob:']")).toBeTruthy());
    expect(flat(card(phone).textContent)).toContain("new rim");
  });

  it("is kept when the app closes while the photo is still being cropped", async () => {
    let release: (() => void) | null = null;
    crop = vi.fn(async () => {
      await new Promise<void>((r) => (release = r));
      return new Blob(["square"], { type: "image/jpeg" });
    });
    const first = renderHome();
    tapOrnament(first.phone, 1);
    choose();
    await waitFor(() => expect(within(dialog()).getByRole("img", { name: "New photo" })).toBeTruthy());
    fireEvent.change(caption(), { target: { value: "new rim" } });
    fireEvent.click(save());
    await waitFor(() => expect(release).not.toBeNull());
    first.unmount();
    release!();
    await waitFor(() => expect(closeOrnaments).toHaveBeenCalled());

    crop = cropStub();
    const { phone } = renderHome();
    await waitFor(() => expect(hoopsOrnaments(phone)[0].querySelector("image[href^='blob:']")).toBeTruthy());
    expect(flat(card(phone).textContent)).toContain("new rim");
  });
});

describe("who changed it (HOME-16)", () => {
  it("an untouched ornament shows no line; a changed one says who and when", async () => {
    const { phone } = renderHome();
    tapOrnament(phone, 1);
    expect(dialog().textContent).not.toContain("changed this");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Cancel" }));
    await changeFirst(phone);
    tapOrnament(phone, 1);
    expect(dialog().textContent).toContain("You changed this · Oct 20");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Ornament 2" }));
    expect(dialog().textContent).not.toContain("changed this");
  });
});

describe("undo (HOME-17)", () => {
  it("appears only after a change and restores the original", async () => {
    const { phone } = renderHome();
    tapOrnament(phone, 1);
    expect(within(dialog()).queryByRole("button", { name: "undo" })).toBeNull();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Cancel" }));
    await changeFirst(phone);
    tapOrnament(phone, 1);
    fireEvent.click(within(dialog()).getByRole("button", { name: "undo" }));
    await waitFor(() => expect(caption().value).toBe("buzzer beater"));
    expect(within(dialog()).queryByRole("button", { name: "undo" })).toBeNull();
    expect(dialog().textContent).not.toContain("changed this");
    expect(hoopsOrnaments(phone)[0].querySelector("image")).toBeNull();
    expect(flat(card(phone).textContent)).toContain("buzzer beater");
  });
});
