import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { emptyData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { profileKey } from "@/app/intro/me/local-profile";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";

const NOV_9 = new Date(2026, 10, 9, 10).getTime();
let n = 0;
let urls = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => `blob:p${++urls}`);
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

const app = (senderName = "") => {
  const id = ++n;
  return (
    <AppClient
      data={{ ...emptyData, senderName }}
      now={() => NOV_9}
      openStore={() => openPhotoStore(`sc-photos-p${id}`)}
      openArchive={() => openArchiveStore(`sc-archive-p${id}`)}
      openOrnaments={() => openOrnamentStore(`sc-orn-p${id}`)}
      hasFace={async () => true}
      decode={async (f) => f}
      crop={async (b) => b}
      initialTab="Me"
    />
  );
};
const saved = () => JSON.parse(localStorage.getItem(profileKey("")) ?? "null");
const photo = (name: string) => new File(["x"], name, { type: "image/jpeg" });

describe("your profile on Me (ME-5 to ME-8)", () => {
  it("starts empty: now and then to add, a line to write, five questions to answer, three memories", async () => {
    render(app());
    expect(await screen.findByLabelText("Add a photo of you now")).toBeTruthy();
    expect(screen.getByLabelText("Add a photo of you as a kid")).toBeTruthy();
    expect(screen.getByText("you")).toBeTruthy();
    expect(screen.getByRole("button", { name: "A line about you: Write a line about you" })).toBeTruthy();
    expect(screen.getByLabelText("This week’s question, week 46")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /: tap to answer$/ })).toHaveLength(5);
    const memories = screen.getByRole("region", { name: "Memories that made me" });
    expect(within(memories).getAllByRole("button", { name: "Add a memory that made you who you are" })).toHaveLength(3);
  });

  it("writes a line and answers this week's question in place", async () => {
    render(app("Harry Beach"));
    expect(await screen.findByText("Harry Beach")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "A line about you: Write a line about you" }));
    const line = screen.getByLabelText("A line about you");
    fireEvent.change(line, { target: { value: "  Jesus   is King " } });
    fireEvent.keyDown(line, { key: "Enter" });
    expect(screen.getByRole("button", { name: "A line about you: Jesus is King" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Favorite Thanksgiving dish?: tap to answer" }));
    const answer = screen.getByLabelText("Favorite Thanksgiving dish?");
    fireEvent.change(answer, { target: { value: "stuffing" } });
    fireEvent.blur(answer);
    expect(screen.getByRole("button", { name: "Favorite Thanksgiving dish?: stuffing" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Hill I’d die on?: tap to answer" }));
    const hill = screen.getByLabelText("Hill I’d die on?");
    fireEvent.change(hill, { target: { value: "never mind" } });
    fireEvent.keyDown(hill, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Hill I’d die on?: tap to answer" })).toBeTruthy();

    await waitFor(() => expect(saved()).toMatchObject({ bio: "Jesus is King", answers: { "week:2026-W46": "stuffing" } }));
  });

  it("adds you now and you as a kid", async () => {
    render(app("Harry Beach"));
    fireEvent.change(await screen.findByLabelText("Add a photo of you now"), { target: { files: [photo("now.jpg")] } });
    expect(await screen.findByRole("img", { name: "Harry Beach now" })).toBeTruthy();
    expect(screen.getByLabelText("Change your photo now")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Add a photo of you as a kid"), { target: { files: [photo("kid.jpg")] } });
    expect(await screen.findByRole("img", { name: "Harry Beach as a kid" })).toBeTruthy();
  });

  it("keeps a memory that made you, shown only to your nest", async () => {
    render(app());
    const memories = await screen.findByRole("region", { name: "Memories that made me" });
    fireEvent.click(within(memories).getAllByRole("button", { name: "Add a memory that made you who you are" })[1]);
    const sheet = screen.getByRole("dialog", { name: "A memory that made you who you are" });
    expect(within(sheet).getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(true);
    fireEvent.change(sheet.querySelector("input[type=file]")!, { target: { files: [photo("lake.jpg")] } });
    await waitFor(() => expect(within(sheet).getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(false));
    fireEvent.change(within(sheet).getByLabelText("Caption"), { target: { value: "the summer at the lake" } });
    expect(within(sheet).getByRole("radio", { name: "Everyone in my circles" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(within(sheet).getByRole("radio", { name: "Only my nest" }));
    fireEvent.click(within(sheet).getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(await within(memories).findByRole("button", { name: "Memory 2: the summer at the lake, only your nest sees it" })).toBeTruthy();
    expect(saved().audience).toEqual(["circles", "nest", "circles"]);
  });

  it("the gifts pill counts your shelf (ME-9)", async () => {
    render(app());
    // The pill keeps its name, "gifts"; the count is for the eye.
    const pill = await screen.findByRole("button", { name: "gifts" });
    expect(pill.querySelector("[data-gift-count]")?.textContent).toBe("0");
  });
});
