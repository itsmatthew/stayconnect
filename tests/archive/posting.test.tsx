import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { at, fixtureData, post } from "./fixtures";

const NOW = at(2026, 10, 20);
let n = 0;
let dbName = "";
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("nowandthen.archive.explainer.v1", "seen");
  URL.createObjectURL = vi.fn(() => "blob:posted");
  URL.revokeObjectURL = vi.fn();
  dbName = `posting-${++n}`;
});
afterEach(cleanup);

// The capture date comes from the stand-in, keyed by file name; the file's own lastModified is always "now".
const captureDates: Record<string, number | undefined> = {
  "in-week.jpg": at(2026, 10, 19, 9),
  "september.jpg": at(2026, 9, 12),
  "no-exif.png": undefined,
};
const photo = (name: string) => new File(["x"], name, { type: "image/jpeg", lastModified: NOW });

function renderArchive() {
  return render(
    <AppClient
      initialTab="Archive"
      data={fixtureData([post("leo", "2026-W43")])}
      now={() => NOW}
      openStore={() => openPhotoStore(`${dbName}-photos`)}
      openArchive={() => openArchiveStore(dbName)}
      readCapture={async (f) => captureDates[f.name]}
      decode={async () => new Blob(["jpeg"], { type: "image/jpeg" })}
      hasFace={async () => true}
    />,
  );
}

async function openPicker() {
  const week = await screen.findByRole("region", { name: "Photo of the week" });
  fireEvent.click(within(week).getByRole("button", { name: /Post your photo of the week/ }));
  return screen.getByRole("dialog", { name: "Post your photo of the week" });
}
const choose = (dialog: HTMLElement, file: File) =>
  fireEvent.change(within(dialog).getByLabelText("Choose a photo"), { target: { files: [file] } });

describe("posting (ARC-3, ARC-4, ARC-12)", () => {
  it("the picker is its own file input and shows the allowed range", async () => {
    renderArchive();
    const dialog = await openPicker();
    expect(dialog.textContent).toContain("Photos taken Oct 19–25");
    const input = within(dialog).getByLabelText("Choose a photo") as HTMLInputElement;
    expect(input.type).toBe("file");
    expect(input.accept).toBe("image/*");
    expect(input.multiple).toBe(false);
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("rejects a photo from outside the week", async () => {
    renderArchive();
    const dialog = await openPicker();
    choose(dialog, photo("september.jpg"));
    expect((await within(dialog).findByRole("alert")).textContent).toBe(
      "This photo is from Sep 12 — pick one from this week (Oct 19–25).",
    );
    expect(within(dialog).queryByRole("button", { name: "Post" })).toBeNull();
  });

  it("rejects a photo with no capture date, even though the file itself is dated this week", async () => {
    renderArchive();
    const dialog = await openPicker();
    choose(dialog, photo("no-exif.png"));
    expect((await within(dialog).findByRole("alert")).textContent).toBe(
      "We can't tell when this photo was taken — pick one from this week (Oct 19–25).",
    );
  });

  it("posts a photo from this week: the slot unlocks, the feed opens, and it's kept", async () => {
    const first = renderArchive();
    expect((await screen.findByRole("region", { name: "Week 43" })).textContent).toContain("1 friend posted this week");

    const dialog = await openPicker();
    choose(dialog, photo("in-week.jpg"));
    expect(await within(dialog).findByText("Once it's posted, it can't be replaced or edited.")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Post" }));

    const week = screen.getByRole("region", { name: "Photo of the week" });
    expect(await within(week).findByText("unlocked ✓")).toBeTruthy();
    expect(within(week).queryByRole("button")).toBeNull();
    const feed = screen.getByRole("region", { name: "Week 43" });
    expect(within(feed).getAllByRole("article").map((a) => a.getAttribute("aria-label"))).toEqual(["Leo, Week 43"]);

    first.unmount();
    renderArchive();
    const again = await screen.findByRole("region", { name: "Photo of the week" });
    expect(await within(again).findByText("unlocked ✓")).toBeTruthy();
  });

  it("the store refuses a second post for the same period (ARC-3)", async () => {
    const store = await openArchiveStore(dbName);
    const image = new Blob(["jpeg"]);
    await store.add({ period: "2026-W43", postedAt: NOW, takenAt: NOW, image });
    await expect(store.add({ period: "2026-W43", postedAt: NOW + 1, takenAt: NOW, image })).rejects.toThrow();
    await waitFor(async () => expect(await store.posts()).toHaveLength(1));
    store.close();
  });
});

describe("caption (ARC-13, ME-4)", () => {
  const preview = async () => {
    const dialog = await openPicker();
    choose(dialog, photo("in-week.jpg"));
    await within(dialog).findByText("Once it's posted, it can't be replaced or edited.");
    // Post stays disabled until the Archive store has opened.
    await waitFor(() => expect((within(dialog).getByRole("button", { name: "Post" }) as HTMLButtonElement).disabled).toBe(false));
    return dialog;
  };
  const caption = (dialog: HTMLElement) => within(dialog).getByRole("textbox", { name: "Caption" }) as HTMLInputElement;
  const saved = async () => {
    const store = await openArchiveStore(dbName);
    const posts = await store.posts();
    store.close();
    return posts;
  };

  it("an optional single-line field under the preview, at most 80 characters, with a placeholder for the period", async () => {
    renderArchive();
    const dialog = await openPicker();
    expect(within(dialog).queryByRole("textbox", { name: "Caption" })).toBeNull();
    choose(dialog, photo("in-week.jpg"));
    await within(dialog).findByText("Once it's posted, it can't be replaced or edited.");
    const field = caption(dialog);
    expect(field.tagName).toBe("INPUT");
    expect(field.maxLength).toBe(80);
    expect(field.placeholder).toBe("what made this week");
    expect(field.compareDocumentPosition(within(dialog).getByRole("img", { name: "The photo you picked" }))).toBe(Node.DOCUMENT_POSITION_PRECEDING);
  });

  it("is saved with the post, trimmed and cut to 80, and shows when opening the tile in Me", async () => {
    renderArchive();
    const dialog = await preview();
    fireEvent.change(caption(dialog), { target: { value: `  ${"the 6am run, finally ".repeat(5)}` } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Post" }));
    await within(screen.getByRole("region", { name: "Photo of the week" })).findByText("unlocked ✓");

    const [post] = await saved();
    expect(post.caption).toHaveLength(80);
    expect(post.caption!.startsWith("the 6am run, finally")).toBe(true);

    fireEvent.click(within(screen.getAllByRole("navigation", { name: "Main" })[0]).getByRole("button", { name: "Me" }));
    const grid = await screen.findByRole("list", { name: "Your 65 for 2026" });
    fireEvent.click(await within(grid).findByRole("button", { name: "Open Week 43" }));
    const open = screen.getByRole("dialog", { name: "Week 43" });
    expect(open.textContent).toContain(post.caption);
    expect(within(open).queryByRole("textbox")).toBeNull();
    fireEvent.click(within(open).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is optional: a blank caption isn't saved", async () => {
    renderArchive();
    const dialog = await preview();
    fireEvent.change(caption(dialog), { target: { value: "   " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Post" }));
    await within(screen.getByRole("region", { name: "Photo of the week" })).findByText("unlocked ✓");
    expect((await saved())[0].caption).toBeUndefined();
  });

  it("the monthly picker asks what defined the month", async () => {
    renderArchive();
    const month = await screen.findByRole("region", { name: "Photo of the month" });
    fireEvent.click(within(month).getByRole("button"));
    const dialog = screen.getByRole("dialog", { name: "Post your photo of October" });
    choose(dialog, photo("in-week.jpg"));
    await within(dialog).findByText("Once it's posted, it can't be replaced or edited.");
    expect(caption(dialog).placeholder).toBe("what defined October");
  });

  it("can't be edited: the store has no way to change a post", async () => {
    const store = await openArchiveStore(dbName);
    expect(Object.keys(store).sort()).toEqual(["add", "close", "image", "posts"]);
    store.close();
  });

  it("Post waits for the Archive store to open", async () => {
    render(
      <AppClient
        initialTab="Archive"
        data={fixtureData([])}
        now={() => NOW}
        openStore={() => openPhotoStore(`${dbName}-photos`)}
        openArchive={() => new Promise(() => {})}
        readCapture={async (f) => captureDates[f.name]}
        decode={async () => new Blob(["jpeg"], { type: "image/jpeg" })}
        hasFace={async () => true}
      />,
    );
    const dialog = await openPicker();
    choose(dialog, photo("in-week.jpg"));
    await within(dialog).findByText("Once it's posted, it can't be replaced or edited.");
    expect((within(dialog).getByRole("button", { name: "Post" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

