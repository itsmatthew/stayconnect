import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AppClient } from "@/app/intro/app-client";
import { demoData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import type { GroupNameStore } from "@/app/intro/group-names/group-names";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";
import { placeholderGroups } from "@/app/intro/placeholder-data";
import { GroupCard } from "@/components/home/group-card";

const NOW = new Date(2026, 9, 21, 12).getTime();
const OLD = new Date(2021, 4, 1).getTime();
const HOOPS = "Hoops Since ’14";
let n = 0;
let dbName = "";
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
  dbName = `home-rename-${++n}`;
});
afterEach(cleanup);

const renderHome = (groupNames?: (suffix: string) => GroupNameStore) => {
  const utils = render(
    <AppClient
      initialTab="Circles"
      data={demoData}
      now={() => NOW}
      openStore={() => openPhotoStore(`${dbName}-photos`)}
      openArchive={() => openArchiveStore(`${dbName}-archive`)}
      openOrnaments={() => openOrnamentStore(dbName)}
      hasFace={async () => true}
      {...(groupNames ? { groupNames } : {})}
    />,
  );
  return {
    ...utils,
    phone: utils.container.querySelector("[data-layout='phone']") as HTMLElement,
    wide: utils.container.querySelector("[data-layout='wide']") as HTMLElement,
  };
};

const card = (layout: HTMLElement) => within(layout).getByRole("region", { name: "Selected circle" });
const rename = (layout: HTMLElement, from: string, to: string) => {
  fireEvent.click(within(card(layout)).getByRole("button", { name: `Rename ${from}` }));
  const sheet = screen.getByRole("dialog", { name: "Rename group" });
  fireEvent.change(within(sheet).getByLabelText("Group name"), { target: { value: to } });
  fireEvent.click(within(sheet).getByRole("button", { name: "Save" }));
};
const go = (tab: string) => fireEvent.click(screen.getAllByRole("button", { name: tab })[0]);
const heading = (layout: HTMLElement) => within(card(layout)).getByRole("heading", { level: 2 }).textContent;

describe("rename on home (RENAME-2)", () => {
  const props = { group: placeholderGroups[0], onSwapPhotos: () => {}, onRename: () => {} };

  it("is the group name itself, with no separate rename button", () => {
    render(<GroupCard {...props} />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(within(heading).getByRole("button", { name: "Rename Madrid Crew" })).toBeTruthy();
    expect(heading.textContent).toBe("Madrid Crew");
    expect(heading.querySelector("[data-pencil]")).toBeTruthy();
    expect(screen.queryByText("rename")).toBeNull();
  });

  it("has tap targets of at least 44px, in a band that doesn't clip them on a narrow phone", () => {
    render(<GroupCard {...props} />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(within(heading).getByRole("button").style.minHeight).toBe("44px");
    expect(screen.getByRole("button", { name: "add photos" }).style.minHeight).toBe("44px");
    expect(heading.parentElement!.parentElement!.style.minHeight).toBe("44px");
  });

  it("wraps a name to two lines, then cuts it short, so it can't push the photos button out", () => {
    render(<GroupCard {...props} />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(within(heading).getByText("Madrid Crew").className).toBe("hm-card-name");
    expect(heading.style.minWidth).toBe("0px");
    const css = readFileSync(path.join(__dirname, "../../src/components/home/home.css"), "utf8");
    expect(css).toMatch(/\.hm-card-name \{[^}]*-webkit-line-clamp: 2/);
  });

  it("edits rather than doing anything a tap on the card would do", () => {
    const onCard = vi.fn();
    const onRename = vi.fn();
    render(
      <div onClick={onCard}>
        <GroupCard {...props} onRename={onRename} />
      </div>,
    );
    fireEvent.click(screen.getByText("Madrid Crew"));
    expect(onRename).toHaveBeenCalled();
    expect(onCard).not.toHaveBeenCalled();
  });

  it("tells the card which group", () => {
    const onRename = vi.fn();
    render(<GroupCard {...props} onRename={onRename} />);
    fireEvent.click(screen.getByRole("button", { name: "Rename Madrid Crew" }));
    expect(onRename).toHaveBeenCalled();
  });
});

describe("renaming from home does what the profile does (RENAME-4, RENAME-5, RENAME-7)", () => {
  it("updates every screen and adds the note", async () => {
    const store = await openPhotoStore(`${dbName}-photos`);
    for (let i = 0; i < 6; i++) await store.add({ pool: "mine", fileKey: `m${i}`, takenAt: OLD + i, image: new Blob([`m${i}`]) });
    store.close();

    const { container, phone, wide } = renderHome();
    rename(phone, HOOPS, "  Court Rats  ");

    // Home: both layouts' cards and tree labels, and the sheet is gone.
    await waitFor(() => expect(heading(phone)).toBe("Court Rats"));
    expect(heading(wide)).toBe("Court Rats");
    expect(screen.queryByRole("dialog")).toBeNull();
    const labels = [...container.querySelectorAll("[data-tree-label]")].map((l) => l.textContent);
    expect(labels).toContain("Court Rats");
    expect(labels).not.toContain(HOOPS);

    // Messages: Hoops is pinned, so it has no preview line; the thread has the note, and the thread and profile the name.
    go("Messages");
    const row = await screen.findAllByRole("button", { name: /^Court Rats, / });
    expect(screen.queryByRole("button", { name: new RegExp(`^${HOOPS}, `) })).toBeNull();
    fireEvent.click(row[0]);
    const log = screen.getByRole("log", { name: "Conversation" });
    expect(log.querySelector("[data-note]")!.textContent).toBe("You renamed the group to Court Rats.");
    expect(log.textContent).not.toContain("Delivered");
    fireEvent.click(screen.getAllByRole("button", { name: "Open Court Rats profile" })[0]);
    expect(screen.getByRole("main", { name: "Court Rats profile" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to the chat" }));
    fireEvent.click(screen.getByRole("button", { name: /^Back/ }));

    // Daily 5's send sheet.
    go("Daily 5");
    const cards = await screen.findAllByRole("article");
    fireEvent.click(within(cards[0]).getByRole("button", { name: "Send this photo to someone" }));
    const send = screen.getByRole("dialog", { name: "Send this to…" });
    expect(within(send).getByRole("button", { name: "Send to Court Rats" })).toBeTruthy();
    expect(within(send).queryByRole("button", { name: `Send to ${HOOPS}` })).toBeNull();
    fireEvent.click(within(send).getByRole("button", { name: "Cancel" }));

    // Archive tags.
    go("Archive");
    await waitFor(() => expect(container.textContent).toContain("Court Rats"));
    expect(container.textContent).not.toContain(HOOPS);
  });

  it("is kept after the app reopens", async () => {
    const first = renderHome();
    rename(first.phone, HOOPS, "Court Rats");
    await waitFor(() => expect(heading(first.phone)).toBe("Court Rats"));
    first.unmount();
    const { phone } = renderHome();
    await waitFor(() => expect(heading(phone)).toBe("Court Rats"));
  });

  it("changes nothing when the save fails, and adds no note", async () => {
    const { phone } = renderHome(() => ({ load: async () => ({}), save: async () => Promise.reject(new Error("offline")) }));
    rename(phone, HOOPS, "Court Rats");
    await screen.findByText("Couldn't save. Try again.");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(heading(phone)).toBe(HOOPS);
    go("Messages");
    expect(screen.queryByText(/renamed the group/)).toBeNull();
  });
});

describe("one implementation (RENAME-2)", () => {
  const source = (file: string) => readFileSync(path.join(__dirname, "../../src/app/intro", file), "utf8");

  it("home and the profile both use the shared sheet wrapper, and neither builds the sheet itself", () => {
    for (const file of ["home-client.tsx", "profile/profile-client.tsx"]) {
      expect(source(file)).toContain("<RenameSheetClient");
      expect(source(file)).not.toContain("<RenameSheet ");
      expect(source(file)).not.toContain("canRename");
    }
  });

  it("the save logic exists once", () => {
    expect(source("app-client.tsx").match(/type: "rename"/g)).toHaveLength(1);
  });
});
