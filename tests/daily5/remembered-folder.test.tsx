import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { emptyData } from "@/app/intro/app-data";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { filesIn, type FolderAccess, type FolderHandle, type FolderItem } from "@/app/intro/daily5/folders";

// A folder you can remember on desktop Chrome and Edge, and check again for new photos (docs/specs/daily5.md, D5-14).

const NOW = new Date(2026, 10, 23, 12).getTime();
const OLD = new Date(2019, 6, 4).getTime();
let n = 0;

const photo = (name: string, lastModified = OLD): FolderItem => ({
  kind: "file",
  name,
  getFile: async () => new File(["x"], name, { type: "image/jpeg", lastModified }),
});
const folder = (name: string, items: FolderItem[]): FolderHandle & { items: FolderItem[] } => ({
  kind: "directory",
  name,
  items,
  async *values() {
    yield* this.items;
  },
});

/** Remembered folders kept in memory, like the browser's IndexedDB would across reloads. */
function fakeAccess(picked: FolderHandle | undefined, allowed = true) {
  const saved = new Map<string, FolderHandle>();
  const access: FolderAccess = {
    pick: vi.fn(async () => picked),
    load: async (pool) => saved.get(pool),
    save: async (pool, f) => void saved.set(pool, f),
    forget: async (pool) => void saved.delete(pool),
    allowed: vi.fn(async () => allowed),
  };
  return { access, saved };
}

beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

const renderDaily5 = (folders: FolderAccess | undefined, db = `folder-test-${++n}`) =>
  render(
    <AppClient
      initialTab="Daily 5"
      data={emptyData}
      now={() => NOW}
      openStore={() => openPhotoStore(db)}
      hasFace={async () => true}
      decode={async (f) => f}
      folders={folders}
    />,
  );
const family = () => screen.getByRole("group", { name: "Family folder" });
/** The pools take photos once the store has loaded. */
const ready = (name: string) =>
  waitFor(() => {
    const b = within(family()).getByRole("button", { name }) as HTMLButtonElement;
    expect(b.disabled).toBe(false);
    return b;
  });

describe("filesIn (D5-14)", () => {
  it("walks into subfolders and skips hidden files", async () => {
    const root = folder("Family", [photo("a.jpg"), photo(".DS_Store"), folder("2019", [photo("b.jpg"), folder(".thumbs", [photo("c.jpg")])])]);
    const names: string[] = [];
    for await (const f of filesIn(root)) names.push(f.name);
    expect(names).toEqual(["a.jpg", "b.jpg"]);
  });
});

describe("a remembered family folder (D5-2, D5-14)", () => {
  it("the family pool is called Family folder and says what goes in it", () => {
    renderDaily5(undefined);
    expect(within(family()).getByText("The family computer’s photos, or a shared album saved to a folder.")).toBeTruthy();
  });

  it("choosing a folder adds its photos and remembers it; Check for new photos adds only what's new", async () => {
    const pics = folder("Beach house", [photo("1.jpg"), photo("2.jpg")]);
    const { access, saved } = fakeAccess(pics);
    renderDaily5(access);
    fireEvent.click(await ready("Choose folder"));
    await waitFor(() => expect(within(family()).getByText("2 photos")).toBeTruthy());
    expect(within(family()).getByText("From Beach house")).toBeTruthy();
    expect(saved.get("family")).toBe(pics);

    pics.items.push(photo("3.jpg"));
    fireEvent.click(await ready("Check Beach house for new photos"));
    await waitFor(() => expect(within(family()).getByText("3 photos")).toBeTruthy());
  });

  it("is still remembered after the app reopens", async () => {
    const pics = folder("Beach house", [photo("1.jpg")]);
    const { access } = fakeAccess(pics);
    const db = `folder-test-${++n}`;
    const first = renderDaily5(access, db);
    fireEvent.click(await ready("Choose folder"));
    await waitFor(() => expect(within(family()).getByText("From Beach house")).toBeTruthy());
    first.unmount();
    renderDaily5(access, db);
    expect(await within(family()).findByRole("button", { name: "Check Beach house for new photos" })).toBeTruthy();
  });

  it("asks the browser again before checking, and says so if access isn't allowed", async () => {
    const pics = folder("Beach house", [photo("1.jpg")]);
    const { access, saved } = fakeAccess(pics, false);
    saved.set("family", pics);
    renderDaily5(access);
    fireEvent.click(await ready("Check Beach house for new photos"));
    expect(await within(family()).findByText("Allow access to Beach house to check it for new photos.")).toBeTruthy();
    expect(within(family()).getByText("0 photos")).toBeTruthy();
  });

  it("Forget folder keeps its photos but stops checking it", async () => {
    const pics = folder("Beach house", [photo("1.jpg")]);
    const { access, saved } = fakeAccess(pics);
    renderDaily5(access);
    fireEvent.click(await ready("Choose folder"));
    await waitFor(() => expect(within(family()).getByText("1 photo")).toBeTruthy());
    fireEvent.click(within(family()).getByRole("button", { name: "Forget Beach house" }));
    await waitFor(() => expect(within(family()).queryByText("From Beach house")).toBeNull());
    expect(saved.has("family")).toBe(false);
    expect(within(family()).getByText("1 photo")).toBeTruthy();
    expect(within(family()).getByRole("button", { name: "Choose folder" })).toBeTruthy();
  });

  it("a cancelled pick changes nothing", async () => {
    const { access } = fakeAccess(undefined);
    renderDaily5(access);
    fireEvent.click(await ready("Choose folder"));
    await waitFor(() => expect(access.pick).toHaveBeenCalled());
    expect(within(family()).queryByText(/^From /)).toBeNull();
  });

  it("nothing can be added before the photos have loaded", () => {
    const { access } = fakeAccess(folder("Beach house", []));
    renderDaily5(access);
    expect((within(family()).getByRole("button", { name: "Choose folder" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("browsers that can't remember a folder keep the plain folder picker", () => {
    renderDaily5(undefined);
    const input = family().querySelector("input[webkitdirectory]");
    expect(input).toBeTruthy();
  });
});
