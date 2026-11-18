import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";
import { placeholderGroups } from "@/app/intro/placeholder-data";
import { GroupCard } from "@/components/home/group-card";
import { Ornament } from "@/components/home/ornament";
import { OrnamentSheet } from "@/components/home/ornament-sheet";
import type { Memory } from "@/components/home/types";

const NOW = new Date(2026, 9, 20, 12).getTime();
let n = 0;
let dbName = "";
let urls = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => `blob:blank-${++urls}`);
  URL.revokeObjectURL = vi.fn();
  dbName = `blank-ornaments-${++n}`;
});
afterEach(cleanup);

const renderApp = (initialTab: "Circles" | "Messages" = "Circles") =>
  render(
    <AppClient
      initialTab={initialTab}
      data={demoData}
      now={() => NOW}
      openStore={() => openPhotoStore(`${dbName}-photos`)}
      openArchive={() => openArchiveStore(`${dbName}-archive`)}
      openOrnaments={() => openOrnamentStore(dbName)}
      decode={async () => new Blob(["jpeg"], { type: "image/jpeg" })}
      crop={async () => new Blob(["cut"], { type: "image/jpeg" })}
      hasFace={async () => true}
    />,
  );

const defs = { ornCap: "cap" };
const bauble = (memory: Pick<Memory, "src">) =>
  render(
    <svg>
      <Ornament cx={50} cy={50} R={20} L={4} memory={memory} rim="#FFD2C4" color="#C8432B" defs={defs} />
    </svg>,
  ).container;

const dialog = () => screen.getByRole("dialog", { name: /defining memories/ });
const choose = () =>
  fireEvent.change(within(dialog()).getByLabelText("Choose a photo"), { target: { files: [new File(["x"], "pic.jpg", { type: "image/jpeg" })] } });

describe("blank ornaments (HOME-20)", () => {
  it("draws a faint outline in the group's color with a small plus, and no glass over it", () => {
    const c = bauble({});
    const blank = c.querySelector("[data-blank-ornament]")!;
    const outline = blank.querySelector("[data-blank-outline]")!;
    expect(outline.getAttribute("stroke")).toBe("#C8432B");
    expect(Number(outline.getAttribute("opacity"))).toBeLessThan(1);
    expect(blank.querySelector("[data-blank-plus]")!.getAttribute("stroke")).toBe("#C8432B");
    expect(c.querySelector("image")).toBeNull();
    expect(c.querySelector("[data-ornament-highlight]")).toBeNull();
  });

  it("shows the photo once there is one", () => {
    const c = bauble({ src: "blob:pic" });
    expect(c.querySelector("image")!.getAttribute("href")).toBe("blob:pic");
    expect(c.querySelector("[data-blank-ornament]")).toBeNull();
  });

  it("has no placeholder images on demo ornaments", () => {
    for (const g of placeholderGroups) for (const m of g.memories) expect(m).not.toHaveProperty("art");
  });

  it("shows only blanks on the trees until a photo is added", async () => {
    const { container } = renderApp();
    await screen.findAllByRole("button", { name: /^Add photo to ornament 1 of / });
    expect(container.querySelectorAll("[data-tree] [data-blank-ornament]").length).toBeGreaterThan(0);
    expect(container.querySelectorAll("[data-tree] image")).toHaveLength(0);
  });

  it("opens the add flow on the tapped ornament, and that ornament alone shows the photo after", async () => {
    const { container } = renderApp();
    const tree = () => container.querySelector("[data-tree][data-slot='center']")!;
    const name = placeholderGroups.find((g) => g.id === tree().getAttribute("data-group-id"))!.name;
    fireEvent.click(screen.getAllByRole("button", { name: `Add photo to ornament 2 of ${name}` })[0]);
    expect(within(dialog()).getByRole("button", { name: "Ornament 2" }).getAttribute("aria-pressed")).toBe("true");
    choose();
    await waitFor(() => expect((within(dialog()).getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(tree().querySelectorAll("image")).toHaveLength(1));
    expect(tree().querySelectorAll("[data-blank-ornament]")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: `Change ornament 2 of ${name}` }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: `Add photo to ornament 1 of ${name}` }).length).toBeGreaterThan(0);
  });

  it("goes straight to the add flow from a blank on the profile", async () => {
    renderApp("Messages");
    fireEvent.click(screen.getAllByRole("button", { name: /^Madrid Crew, / })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Open Madrid Crew profile" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Add photo to ornament 3 of Madrid Crew" }));
    expect(within(dialog()).getByRole("button", { name: "Ornament 3" }).getAttribute("aria-pressed")).toBe("true");
  });

  describe("the sheet", () => {
    const blank: Memory = { id: "a", caption: "" };
    const props = {
      groupName: "Madrid Crew",
      rim: "#FFD2C4",
      color: "#C8432B",
      ornaments: [blank, { ...blank, id: "b" }, { ...blank, id: "c" }].map((memory) => ({ memory, canUndo: false })) as never,
      selected: 0,
      captionMax: 40,
      onSelect: () => {},
      onPickFile: () => {},
      onSave: () => {},
      onUndo: () => {},
      onCancel: () => {},
    };
    const save = () => screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;

    it("says there's no photo yet", () => {
      render(<OrnamentSheet {...props} />);
      expect(screen.getByRole("img", { name: "No photo yet" })).toBeTruthy();
    });

    it("needs a photo: a caption alone can't be saved on a blank", () => {
      render(<OrnamentSheet {...props} />);
      fireEvent.change(screen.getByLabelText("Caption"), { target: { value: "the night" } });
      expect(save().disabled).toBe(true);
    });

    it("saves once a photo is picked", () => {
      render(<OrnamentSheet {...props} preview="blob:new" />);
      expect(save().disabled).toBe(false);
    });
  });

  describe("the card", () => {
    const group = (srcs: (string | undefined)[]) => ({
      ...placeholderGroups[0],
      memories: placeholderGroups[0].memories.map((m, i) => ({ ...m, ...(srcs[i] ? { src: srcs[i] } : {}) })) as unknown as (typeof placeholderGroups)[0]["memories"],
    });

    it("offers to add photos, opening the first blank", () => {
      const onSwapPhotos = vi.fn();
      render(<GroupCard group={group(["blob:a", undefined, undefined])} onSwapPhotos={onSwapPhotos} />);
      fireEvent.click(screen.getByRole("button", { name: "add photos" }));
      expect(onSwapPhotos).toHaveBeenCalledWith(1);
    });

    it("offers to swap once all three are in", () => {
      const onSwapPhotos = vi.fn();
      render(<GroupCard group={group(["blob:a", "blob:b", "blob:c"])} onSwapPhotos={onSwapPhotos} />);
      fireEvent.click(screen.getByRole("button", { name: "swap photos" }));
      expect(onSwapPhotos).toHaveBeenCalledWith(0);
    });
  });
});

describe("ornament highlight (HOME-21)", () => {
  it("is faint enough to see the photo through, and still there", () => {
    const c = bauble({ src: "blob:pic" });
    const highlights = [...c.querySelectorAll("[data-ornament-highlight]")];
    expect(highlights).toHaveLength(2);
    for (const h of highlights) {
      const opacity = Number(h.getAttribute("opacity"));
      expect(opacity).toBeGreaterThanOrEqual(0.2);
      expect(opacity).toBeLessThanOrEqual(0.4);
    }
  });

  it("softens the white in the gloss, and keeps the dark edge that makes the bauble look round", () => {
    const c = bauble({ src: "blob:pic" });
    expect(c.querySelector("[data-ornament-gloss]")).toBeTruthy();
    const stops = [...c.querySelectorAll("radialGradient stop")].map((s) => [s.getAttribute("stop-color"), Number(s.getAttribute("stop-opacity"))] as const);
    expect(Math.max(...stops.filter(([color]) => color === "#fff").map(([, o]) => o))).toBeLessThanOrEqual(0.25);
    expect(stops.at(-1)).toEqual(["#3A1408", 0.42]);
  });
});
