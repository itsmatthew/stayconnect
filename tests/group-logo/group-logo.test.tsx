import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";
import { groupParty, recipientSections } from "@/app/intro/parties";
import type { CropArea } from "@/app/intro/photo-file";
import { friends, placeholderGroups } from "@/app/intro/placeholder-data";
import { SendSheet } from "@/components/daily5/send-sheet";
import { PartyAvatar } from "@/components/messages/avatar";

const NOW = new Date(2026, 9, 21, 12).getTime();
let n = 0;
let dbName = "";
let urls = 0;
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => `blob:logo-${++urls}`);
  URL.revokeObjectURL = vi.fn();
  dbName = `group-logo-${++n}`;
});
afterEach(cleanup);

const madrid = placeholderGroups.find((g) => g.name === "Madrid Crew")!;
const CANOPY = madrid.palette.canopy;

const cropStub = () => vi.fn<(image: Blob, area: CropArea | undefined, max: number) => Promise<Blob>>(async () => new Blob(["logo"], { type: "image/jpeg" }));

function renderMessages(crop = cropStub()) {
  const utils = render(
    <AppClient
      initialTab="Messages"
      data={demoData}
      now={() => NOW}
      openStore={() => openPhotoStore(`${dbName}-photos`)}
      openArchive={() => openArchiveStore(`${dbName}-archive`)}
      openOrnaments={() => openOrnamentStore(dbName)}
      decode={async () => new Blob(["jpeg"], { type: "image/jpeg" })}
      crop={crop}
      hasFace={async () => true}
    />,
  );
  return { ...utils, crop };
}

const openChat = (name: string) => fireEvent.click(screen.getAllByRole("button", { name: new RegExp(`^${name}, `) })[0]);
const changeButton = () => screen.getByRole("button", { name: "Change Madrid Crew logo" });
const dialog = () => screen.getByRole("dialog", { name: "Madrid Crew logo" });
const save = () => within(dialog()).getByRole("button", { name: "Save" }) as HTMLButtonElement;
const choose = () =>
  fireEvent.change(within(dialog()).getByLabelText("Choose a photo"), {
    target: { files: [new File(["x"], "pic.jpg", { type: "image/jpeg" })] },
  });
/** The logo image inside an avatar, if it has one. */
const imageIn = (el: HTMLElement) => el.querySelector("img")?.getAttribute("src");
const headerLogo = () => within(changeButton()).getByRole("img", { name: "Madrid Crew logo" });

async function changeLogo() {
  openChat("Madrid Crew");
  fireEvent.click(changeButton());
  choose();
  await within(dialog()).findByRole("img", { name: "New photo" });
  fireEvent.click(save());
  await waitFor(() => expect(imageIn(headerLogo())).toMatch(/^blob:/));
}

describe("the default logo (LOGO-1/3)", () => {
  it("initials on the group's color, ringed in it", () => {
    const { container } = render(<PartyAvatar party={groupParty(madrid)} size={50} />);
    const logo = screen.getByRole("img", { name: "Madrid Crew logo" });
    expect(logo.textContent).toBe("MC");
    expect(logo.querySelector("img")).toBeNull();
    expect(logo.style.boxShadow).toContain(CANOPY);
    expect(container.textContent).toBe("MC");
  });

  it("numbers stay whole", () => {
    render(
      <>
        {["Fall 24", "Apt 4B", "Hoops Since ’14"].map((name) => (
          <PartyAvatar key={name} party={groupParty(placeholderGroups.find((g) => g.name === name)!)} size={50} />
        ))}
      </>,
    );
    expect(screen.getByRole("img", { name: "Fall 24 logo" }).textContent).toBe("F24");
    expect(screen.getByRole("img", { name: "Apt 4B logo" }).textContent).toBe("A4B");
    expect(screen.getByRole("img", { name: "Hoops Since ’14 logo" }).textContent).toBe("HS");
  });
});

describe("a custom logo (LOGO-2/3)", () => {
  it("shows the image, still ringed in the group's color", () => {
    render(<PartyAvatar party={groupParty({ ...madrid, logo: "blob:custom" })} size={50} />);
    const logo = screen.getByRole("img", { name: "Madrid Crew logo" });
    expect(imageIn(logo)).toBe("blob:custom");
    expect(logo.textContent).toBe("");
    expect(logo.style.boxShadow).toContain(CANOPY);
  });

  it("the send picker shows it", () => {
    const groups = placeholderGroups.map((g) => (g.id === madrid.id ? { ...g, logo: "blob:custom" } : g));
    render(<SendSheet photo={{ src: "blob:photo", alt: "Photo" }} recipients={recipientSections(groups, friends)} onSend={() => {}} onCancel={() => {}} />);
    const sheet = screen.getByRole("dialog", { name: "Send this to…" });
    expect(imageIn(within(sheet).getByRole("img", { name: "Madrid Crew logo" }))).toBe("blob:custom");
  });
});

describe("changing it (LOGO-4)", () => {
  it("only group threads have the button", () => {
    renderMessages();
    openChat("Leo");
    expect(screen.queryByRole("button", { name: /^Change .* logo$/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back to messages" }));
    openChat("Madrid Crew");
    expect(changeButton()).toBeTruthy();
  });

  it("opens a sheet: the current logo, a plain photo picker, Save once a photo is picked", async () => {
    renderMessages();
    openChat("Madrid Crew");
    fireEvent.click(changeButton());
    expect(within(dialog()).getByRole("img", { name: "Madrid Crew logo" }).textContent).toBe("MC");
    const input = within(dialog()).getByLabelText("Choose a photo") as HTMLInputElement;
    expect(input.type).toBe("file");
    expect(input.accept).toBe("image/*");
    expect(save().disabled).toBe(true);
    choose();
    await within(dialog()).findByRole("img", { name: "New photo" });
    expect(within(dialog()).getByRole("slider", { name: "Zoom" })).toBeTruthy();
    expect(save().disabled).toBe(false);
  });

  it("Cancel discards the photo", async () => {
    const { crop } = renderMessages();
    openChat("Madrid Crew");
    fireEvent.click(changeButton());
    choose();
    await within(dialog()).findByRole("img", { name: "New photo" });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(crop).not.toHaveBeenCalled();
    expect(imageIn(headerLogo())).toBeUndefined();
  });

  it("Save crops to a 512 px square and the logo shows in the thread and on the recents screen", async () => {
    const { crop } = renderMessages();
    await changeLogo();
    expect(crop).toHaveBeenCalledTimes(1);
    expect(crop.mock.calls[0][2]).toBe(512);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(headerLogo().style.boxShadow).toContain(CANOPY);
    fireEvent.click(screen.getByRole("button", { name: "Back to messages" }));
    const pinned = within(screen.getByRole("group", { name: "closest circles" })).getByRole("img", { name: "Madrid Crew logo" });
    expect(imageIn(pinned)).toMatch(/^blob:/);
  });

  it("is kept: still there after the app reopens (LOGO-6)", async () => {
    const first = renderMessages();
    await changeLogo();
    first.unmount();
    renderMessages();
    openChat("Madrid Crew");
    await waitFor(() => expect(imageIn(headerLogo())).toMatch(/^blob:/));
  });
});

describe("who changed it, and undo (LOGO-5)", () => {
  it("no line until it's changed; then “You changed the logo”, and undo brings back the initials", async () => {
    renderMessages();
    openChat("Madrid Crew");
    fireEvent.click(changeButton());
    expect(dialog().textContent).not.toContain("changed the logo");
    expect(within(dialog()).queryByRole("button", { name: "undo" })).toBeNull();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to messages" }));

    await changeLogo();
    fireEvent.click(changeButton());
    expect(dialog().textContent).toContain("You changed the logo · Oct 21");
    fireEvent.click(within(dialog()).getByRole("button", { name: "undo" }));
    await waitFor(() => expect(imageIn(headerLogo())).toBeUndefined());
    expect(headerLogo().textContent).toBe("MC");
    expect(dialog().textContent).not.toContain("changed the logo");
    expect(within(dialog()).queryByRole("button", { name: "undo" })).toBeNull();
  });
});
