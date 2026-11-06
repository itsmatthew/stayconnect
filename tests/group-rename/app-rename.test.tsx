import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import type { GroupNameStore } from "@/app/intro/group-names/group-names";
import { groupNamesKey } from "@/app/intro/group-names/local-group-names";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";
import { placeholderGroups } from "@/app/intro/placeholder-data";
import type { NavLabel } from "@/components/home/main-nav";

const NOW = new Date(2026, 9, 21, 12).getTime();
const OLD = new Date(2021, 4, 1).getTime();
let n = 0;
let dbName = "";
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
  dbName = `group-rename-${++n}`;
});
afterEach(cleanup);

const renderApp = (initialTab: NavLabel, groupNames?: (suffix: string) => GroupNameStore) =>
  render(
    <AppClient
      initialTab={initialTab}
      data={demoData}
      now={() => NOW}
      openStore={() => openPhotoStore(`${dbName}-photos`)}
      openArchive={() => openArchiveStore(`${dbName}-archive`)}
      openOrnaments={() => openOrnamentStore(dbName)}
      hasFace={async () => true}
      {...(groupNames ? { groupNames } : {})}
    />,
  );

const openThread = (name: string) => fireEvent.click(screen.getAllByRole("button", { name: new RegExp(`^${name}, `) })[0]);
const openProfile = (name: string) => {
  openThread(name);
  fireEvent.click(screen.getAllByRole("button", { name: `Open ${name} profile` })[0]);
};
const rename = (from: string, to: string) => {
  fireEvent.click(screen.getByRole("button", { name: `Rename ${from}` }));
  const sheet = screen.getByRole("dialog", { name: "Rename group" });
  fireEvent.change(within(sheet).getByLabelText("Group name"), { target: { value: to } });
  fireEvent.click(within(sheet).getByRole("button", { name: "Save" }));
};
const seedNames = (names: Record<string, string>) => localStorage.setItem(groupNamesKey(".demo"), JSON.stringify(names));
const log = () => screen.getByRole("log", { name: "Conversation" });

describe("rename button (RENAME-2)", () => {
  it("is on the profile, at least 44px tall", () => {
    renderApp("Messages");
    openProfile("Madrid Crew");
    expect(screen.getByRole("button", { name: "Rename Madrid Crew" }).style.minHeight).toBe("44px");
  });
});

describe("renaming from the profile (RENAME-4, RENAME-5)", () => {
  it("changes the profile, closes the sheet and leaves a note in the thread", async () => {
    renderApp("Messages");
    openProfile("Madrid Crew");
    rename("Madrid Crew", "  Lisbon Crew  ");
    await screen.findByRole("main", { name: "Lisbon Crew profile" });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back to the chat" }));
    const note = log().querySelector("[data-note]")!;
    expect(note.textContent).toBe("You renamed the group to Lisbon Crew.");
    expect(log().textContent).not.toContain("Delivered");
    expect(screen.getByRole("banner", { name: "Lisbon Crew header" })).toBeTruthy();
  });

  it("adds nothing when the save fails", async () => {
    renderApp("Messages", () => ({ load: async () => ({}), save: async () => Promise.reject(new Error("offline")) }));
    openProfile("Madrid Crew");
    rename("Madrid Crew", "Lisbon Crew");
    await screen.findByText("Couldn't save. Try again.");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("main", { name: "Madrid Crew profile" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to the chat" }));
    expect(log().querySelector("[data-note]")).toBeNull();
  });

  it("keeps the name and the note after the app reopens", async () => {
    const first = renderApp("Messages");
    openProfile("Madrid Crew");
    rename("Madrid Crew", "Lisbon Crew");
    await screen.findByRole("main", { name: "Lisbon Crew profile" });
    first.unmount();
    renderApp("Messages");
    await screen.findAllByRole("button", { name: /^Lisbon Crew, / });
    openThread("Lisbon Crew");
    await waitFor(() => expect(log().querySelector("[data-note]")?.textContent).toBe("You renamed the group to Lisbon Crew."));
  });
});

describe("the chat list (RENAME-6)", () => {
  it("previews the note with no prefix", async () => {
    renderApp("Messages");
    openProfile("Fall 24");
    rename("Fall 24", "Fall Crew");
    await screen.findByRole("main", { name: "Fall Crew profile" });
    fireEvent.click(screen.getByRole("button", { name: "Back to the chat" }));
    fireEvent.click(screen.getByRole("button", { name: /^Back/ }));
    expect(await screen.findByText("You renamed the group to Fall Crew.")).toBeTruthy();
  });
});

describe("everywhere (RENAME-7)", () => {
  const renamed = Object.fromEntries(placeholderGroups.map((g, i) => [g.id, `Renamed ${i}`]));
  const oldNames = placeholderGroups.map((g) => g.name);
  const hoops = placeholderGroups.findIndex((g) => g.id === "hoops-since-14");

  beforeEach(() => seedNames(renamed));

  it("tree labels and the group card", async () => {
    const { container } = renderApp("Circles");
    await waitFor(() => {
      const labels = [...container.querySelectorAll("[data-tree-label]")].map((l) => l.textContent);
      expect(labels).toContain(`Renamed ${hoops}`);
      for (const name of oldNames) expect(labels).not.toContain(name);
    });
    for (const card of screen.getAllByRole("region", { name: "Selected circle" })) {
      expect(within(card).getByRole("heading", { level: 2 }).textContent).toBe(`Renamed ${hoops}`);
    }
  });

  it("the Messages list, and default logo initials", async () => {
    renderApp("Messages");
    await screen.findAllByRole("button", { name: /^Renamed 0, / });
    expect(screen.queryByRole("button", { name: /^Madrid Crew, / })).toBeNull();
    expect(screen.getAllByRole("img", { name: "Renamed 0 logo" })[0].textContent).toBe("R0");
  });

  it("the Daily 5 send sheet", async () => {
    const store = await openPhotoStore(`${dbName}-photos`);
    for (let i = 0; i < 6; i++) await store.add({ pool: "mine", fileKey: `m${i}`, takenAt: OLD + i, image: new Blob([`m${i}`]) });
    store.close();
    renderApp("Daily 5");
    const cards = await screen.findAllByRole("article");
    fireEvent.click(within(cards[0]).getByRole("button", { name: "Send this photo to someone" }));
    const sheet = screen.getByRole("dialog", { name: "Send this to…" });
    await within(sheet).findByRole("button", { name: "Send to Renamed 0" });
    expect(within(sheet).queryByRole("button", { name: "Send to Madrid Crew" })).toBeNull();
  });

  it("Archive tags", async () => {
    const { container } = renderApp("Archive");
    await waitFor(() => expect(container.textContent).toMatch(/Renamed \d/));
    for (const name of oldNames) expect(container.textContent).not.toContain(name);
  });

  it("keeps a group's chat, since groups are keyed by id", async () => {
    renderApp("Messages");
    await screen.findAllByRole("button", { name: /^Renamed 0, / });
    openThread("Renamed 0");
    expect(log().textContent!.length).toBeGreaterThan(0);
  });
});

describe("demo and real names never mix (DEMO-3)", () => {
  it("reads only its own key", async () => {
    localStorage.setItem(groupNamesKey(""), JSON.stringify({ "madrid-crew": "Not demo" }));
    renderApp("Messages");
    await screen.findAllByRole("button", { name: /^Madrid Crew, / });
    expect(screen.queryByRole("button", { name: /^Not demo, / })).toBeNull();
  });
});
