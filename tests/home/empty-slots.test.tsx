import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, emptyData, type AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";
import { ornamentKey, withOrnaments, type OrnamentState } from "@/app/intro/ornaments/ornaments";
import { placeholderGroups } from "@/app/intro/placeholder-data";
import { GroupCard } from "@/components/home/group-card";
import type { CircleGroup } from "@/components/home/types";

const NOW = new Date(2026, 9, 20, 12).getTime();
const HOOPS = "Hoops Since ’14";
let n = 0;
let dbName = "";
let urls = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => `blob:slot-${++urls}`);
  URL.revokeObjectURL = vi.fn();
  dbName = `empty-slots-${++n}`;
});
afterEach(cleanup);

const renderApp = (data: AppData = demoData, initialTab: "Circles" | "Messages" = "Circles") => {
  const utils = render(
    <AppClient
      initialTab={initialTab}
      data={data}
      now={() => NOW}
      openStore={() => openPhotoStore(`${dbName}-photos`)}
      openArchive={() => openArchiveStore(`${dbName}-archive`)}
      openOrnaments={() => openOrnamentStore(dbName)}
      decode={async () => new Blob(["jpeg"], { type: "image/jpeg" })}
      crop={async () => new Blob(["cut"], { type: "image/jpeg" })}
      hasFace={async () => true}
    />,
  );
  return { ...utils, phone: utils.container.querySelector("[data-layout='phone']") as HTMLElement, wide: utils.container.querySelector("[data-layout='wide']") as HTMLElement };
};

const card = (layout: HTMLElement) => within(layout).getByRole("region", { name: "Selected circle" });
const dialog = () => screen.getByRole("dialog", { name: /defining memories/ });
const pressed = () => within(dialog()).getAllByRole("button", { name: /^Ornament \d$/ }).map((b) => b.getAttribute("aria-pressed"));
const caption = () => within(dialog()).getByRole("textbox", { name: "Caption" }) as HTMLInputElement;
const save = () => within(dialog()).getByRole("button", { name: "Save" }) as HTMLButtonElement;
const addPhoto = async (text = "") => {
  fireEvent.change(within(dialog()).getByLabelText("Choose a photo"), { target: { files: [new File(["x"], "pic.jpg", { type: "image/jpeg" })] } });
  await within(dialog()).findByRole("img", { name: "New photo" });
  if (text) fireEvent.change(caption(), { target: { value: text } });
  fireEvent.click(save());
};
const tree = (layout: HTMLElement) => [...layout.querySelectorAll("[data-tree][data-group-id='hoops-since-14'] [data-ornament]")];
const filled = (els: Element[]) => els.map((o) => !!o.querySelector("image"));

const group = (srcs: (string | undefined)[]): CircleGroup => ({
  ...placeholderGroups[0],
  memories: placeholderGroups[0].memories.map((m, i) => ({ ...m, ...(srcs[i] ? { src: srcs[i] } : {}) })) as unknown as CircleGroup["memories"],
});

/** Real-looking data with captions left on empty slots: the rule must hold whatever the data says. */
const captioned: AppData = {
  ...demoData,
  groups: demoData.groups.map((g) => ({ ...g, memories: g.memories.map((m, i) => ({ ...m, caption: `leftover ${i}` })) as unknown as CircleGroup["memories"] })),
};

describe("tappable photo slots on the card (HOME-22)", () => {
  it("makes each empty slot a button, at least 44px", () => {
    render(<GroupCard group={group([undefined, undefined, undefined])} onSwapPhotos={() => {}} />);
    for (const i of [1, 2, 3]) {
      const slot = screen.getByRole("button", { name: `Add photo ${i} to Madrid Crew` });
      expect(slot.style.minWidth).toBe("44px");
      expect(slot.style.minHeight).toBe("44px");
      expect(slot.querySelector("[data-blank-ornament]")).toBeTruthy();
    }
  });

  it("opens the slot that was tapped, not the first blank", () => {
    const onSwapPhotos = vi.fn();
    render(<GroupCard group={group([undefined, undefined, undefined])} onSwapPhotos={onSwapPhotos} />);
    fireEvent.click(screen.getByRole("button", { name: "Add photo 3 to Madrid Crew" }));
    expect(onSwapPhotos).toHaveBeenCalledWith(2);
  });

  it("leaves a filled slot alone: only blanks are buttons", () => {
    render(<GroupCard group={group(["blob:a", undefined, "blob:c"])} onSwapPhotos={() => {}} />);
    expect(screen.getAllByRole("button", { name: /^Add photo \d to / }).map((b) => b.getAttribute("aria-label"))).toEqual(["Add photo 2 to Madrid Crew"]);
  });

  it.each(["phone", "wide"] as const)("fills the tapped slot and only that one (%s)", async (layout) => {
    const app = renderApp();
    fireEvent.click(within(card(app[layout])).getByRole("button", { name: `Add photo 3 to ${HOOPS}` }));
    expect(pressed()).toEqual(["false", "false", "true"]);
    await addPhoto();
    await waitFor(() => expect(filled(tree(app[layout]))).toEqual([false, false, true]));
    expect(screen.queryByRole("dialog")).toBeNull();
    const slots = within(card(app[layout])).getAllByRole("button", { name: /^Add photo \d to / }).map((b) => b.getAttribute("aria-label"));
    expect(slots).toEqual([`Add photo 1 to ${HOOPS}`, `Add photo 2 to ${HOOPS}`]);
    expect(card(app[layout]).querySelectorAll("image")).toHaveLength(1);
  });
});

describe("an empty slot has no caption (HOME-23)", () => {
  it("demo data has no captions on its empty slots", () => {
    for (const g of placeholderGroups) for (const m of g.memories) expect(m.caption).toBe("");
  });

  it("strips a caption from an empty slot, in any data", () => {
    const [g] = withOrnaments([{ ...placeholderGroups[0], memories: captioned.groups[0].memories }], {}, {});
    expect(g.memories.map((m) => m.caption)).toEqual(["", "", ""]);
  });

  it("keeps a caption hidden until its photo has loaded, then shows it", () => {
    const state: OrnamentState = { [ornamentKey(placeholderGroups[0].id, 0)]: { current: { photoId: "p1", caption: "the night", by: "me", at: NOW } } };
    expect(withOrnaments([placeholderGroups[0]], state, {})[0].memories[0].caption).toBe("");
    expect(withOrnaments([placeholderGroups[0]], state, { p1: "blob:p1" })[0].memories[0].caption).toBe("the night");
  });

  it("shows only the + on the card, in demo and real-looking data", () => {
    for (const data of [demoData, captioned]) {
      const { phone, unmount } = renderApp(data);
      const text = card(phone).textContent!;
      expect(text).not.toMatch(/leftover|buzzer|tacos/);
      expect(card(phone).querySelectorAll("[data-blank-ornament]")).toHaveLength(3);
      unmount();
    }
  });

  it("shows none on the profile, or in the sheet's caption field", () => {
    renderApp(captioned, "Messages");
    fireEvent.click(screen.getAllByRole("button", { name: /^Madrid Crew, / })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Open Madrid Crew profile" })[0]);
    expect(screen.getByRole("main", { name: "Madrid Crew profile" }).textContent).not.toContain("leftover");
    fireEvent.click(screen.getByRole("button", { name: "Add photo to ornament 1 of Madrid Crew" }));
    expect(caption().value).toBe("");
  });

  it("shows a caption once the slot has a photo, and drops it again on undo", async () => {
    const { phone } = renderApp();
    fireEvent.click(within(card(phone)).getByRole("button", { name: `Add photo 1 to ${HOOPS}` }));
    await addPhoto("the buzzer");
    await waitFor(() => expect(card(phone).textContent).toContain("the buzzer"));
    fireEvent.click(within(phone).getByRole("button", { name: `Change ornament 1 of ${HOOPS}` }));
    fireEvent.click(within(dialog()).getByRole("button", { name: "undo" }));
    await waitFor(() => expect(card(phone).textContent).not.toContain("the buzzer"));
    expect(caption().value).toBe("");
  });

  it("adds no old caption when a photo goes in without one", async () => {
    const { phone } = renderApp(captioned);
    fireEvent.click(within(card(phone)).getByRole("button", { name: `Add photo 2 to ${HOOPS}` }));
    await addPhoto();
    await waitFor(() => expect(filled(tree(phone))).toEqual([false, true, false]));
    expect(card(phone).textContent).not.toContain("leftover");
  });

  it("a new user with no demo data has no groups, so no slots or captions at all", () => {
    expect(emptyData.groups).toEqual([]);
    renderApp(emptyData);
    expect(screen.queryByRole("region", { name: "Selected circle" })).toBeNull();
  });
});
