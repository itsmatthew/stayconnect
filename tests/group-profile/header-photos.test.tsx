import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData, type AppData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";
import { goalsStorageKey } from "@/app/intro/profile/use-goals";

const NOW = new Date(2026, 9, 21, 12).getTime();
let n = 0;
let dbName = "";
let urls = 0;

beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => `blob:header-${++urls}`);
  URL.revokeObjectURL = vi.fn();
  dbName = `header-photos-${++n}`;
});
afterEach(cleanup);

/** Demo data whose groups have no header photos yet: a real group's starting point. */
const unset: AppData = { ...demoData, groups: demoData.groups.map((g) => ({ ...g, firstPhoto: undefined, lastPhoto: undefined })) };
const pastGoal: Partial<AppData> = { goals: () => ({ "madrid-crew": { label: "lake weekend", date: "2026-10-20", setBy: "leo", in: ["leo"] } }) };

function renderApp(data: AppData = demoData, readCapture: (f: File) => Promise<number | undefined> = async () => undefined) {
  const decode = vi.fn(async () => new Blob(["jpeg"], { type: "image/jpeg" }));
  const utils = render(
    <AppClient
      initialTab="Messages"
      data={data}
      now={() => NOW}
      openStore={() => openPhotoStore(`${dbName}-photos`)}
      openArchive={() => openArchiveStore(`${dbName}-archive`)}
      openOrnaments={() => openOrnamentStore(dbName)}
      decode={decode}
      readCapture={readCapture}
      hasFace={async () => true}
    />,
  );
  return { ...utils, decode };
}

const openThread = (name = "Madrid Crew") => fireEvent.click(screen.getAllByRole("button", { name: new RegExp(`^${name}, `) })[0]);
const toProfile = () => fireEvent.click(screen.getAllByRole("button", { name: "Open Madrid Crew profile" })[1]);
const toChat = () => fireEvent.click(screen.getByRole("button", { name: "Back to the chat" }));
const profile = () => screen.getByRole("main", { name: "Madrid Crew profile" });
const first = (el: HTMLElement = document.body) => within(el).getByRole("img", { name: "Madrid Crew first photo together" });
const last = (el: HTMLElement = document.body) => within(el).getByRole("img", { name: "Madrid Crew last time together" });
const pick = (label: string) => fireEvent.change(within(profile()).getByLabelText(label), { target: { files: [new File(["x"], "pic.jpg", { type: "image/jpeg" })] } });
const imageIn = (el: HTMLElement) => el.querySelector("img")?.getAttribute("src");
const header = () => screen.getByRole("banner", { name: "Madrid Crew header" });

describe("the demo's header photos (GP-12)", () => {
  it("the thread shows both halves with their dates, and no instructions", () => {
    renderApp();
    openThread();
    expect(first().textContent).toContain("since Jun 2014");
    expect(last().textContent).toContain("Aug 2026");
    expect(header().textContent).not.toMatch(/Add |oldest photo/);
  });

  it("the profile shows them too, each a plain photo picker", () => {
    renderApp();
    openThread();
    toProfile();
    expect(first(profile()).textContent).toContain("since Jun 2014");
    expect(last(profile()).textContent).toContain("Aug 2026");
    for (const label of ["Change first photo together", "Change last time together"]) {
      const input = within(profile()).getByLabelText(label) as HTMLInputElement;
      expect(input.type).toBe("file");
      expect(input.accept).toBe("image/*");
    }
  });

  it("friends' threads keep their now / then art", () => {
    renderApp();
    openThread("Leo");
    expect(screen.getByRole("img", { name: "Leo now" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Leo then" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: /first photo together$/ })).toBeNull();
  });
});

describe("changing them from the profile (GP-12)", () => {
  it("picking a first photo saves it at once, downscaled, with “since” from its capture date, here and in the thread", async () => {
    const { decode } = renderApp(demoData, async () => new Date(2012, 6, 4).getTime());
    openThread();
    toProfile();
    pick("Change first photo together");
    await waitFor(() => expect(imageIn(first(profile()))).toMatch(/^blob:/));
    expect(decode).toHaveBeenCalledTimes(1);
    expect(first(profile()).textContent).toContain("since Jul 2012");
    toChat();
    expect(imageIn(first())).toMatch(/^blob:/);
    expect(first().textContent).toContain("since Jul 2012");
  });

  it("no capture date: no date line", async () => {
    renderApp();
    openThread();
    toProfile();
    pick("Change first photo together");
    await waitFor(() => expect(imageIn(first(profile()))).toMatch(/^blob:/));
    expect(first(profile()).textContent).not.toContain("since");
  });

  it("the last time together shows its month and year", async () => {
    renderApp(demoData, async () => new Date(2026, 2, 8).getTime());
    openThread();
    toProfile();
    pick("Change last time together");
    await waitFor(() => expect(imageIn(last(profile()))).toMatch(/^blob:/));
    expect(last(profile()).textContent).toContain("Mar 2026");
  });

  it("is kept: still there after the app reopens", async () => {
    const one = renderApp(demoData, async () => new Date(2012, 6, 4).getTime());
    openThread();
    toProfile();
    pick("Change first photo together");
    await waitFor(() => expect(imageIn(first(profile()))).toMatch(/^blob:/));
    one.unmount();
    renderApp();
    openThread();
    await waitFor(() => expect(first().textContent).toContain("since Jul 2012"));
  });
});

describe("empty (GP-12)", () => {
  it("the profile shows dashed slots that say what belongs there", () => {
    renderApp(unset);
    openThread();
    toProfile();
    const text = profile().textContent ?? "";
    expect(text).toContain("Add your first photo together");
    expect(text).toContain("The oldest photo you can find of this group — the one where it started.");
    expect(text).toContain("Add a photo from the last time you were all together.");
    expect(within(profile()).getByLabelText("Add your first photo together")).toBeTruthy();
    expect(within(profile()).getByLabelText("Add a photo from the last time you were all together.")).toBeTruthy();
    expect(profile().querySelectorAll("[data-empty]")).toHaveLength(2);
  });

  it("the thread shows the group's art, with no instructions and no dates", () => {
    renderApp(unset);
    openThread();
    expect(first().querySelector("svg")).toBeTruthy();
    expect(header().textContent).not.toMatch(/Add |oldest photo|since/);
  });
});

describe("after a next time together (GP-9, GP-12)", () => {
  const prompt = "How was lake weekend? Add a photo from it";

  it("a past goal turns the right half into a prompt", () => {
    renderApp({ ...demoData, ...pastGoal });
    openThread();
    toProfile();
    expect(profile().textContent).toContain(prompt);
    expect(within(profile()).getByLabelText(prompt)).toBeTruthy();
    expect(within(profile()).queryByRole("img", { name: "Madrid Crew last time together" })).toBeNull();
  });

  it("“Not now” dismisses it for good", async () => {
    renderApp({ ...demoData, ...pastGoal });
    openThread();
    toProfile();
    fireEvent.click(within(profile()).getByRole("button", { name: "Not now" }));
    expect(profile().textContent).not.toContain(prompt);
    expect(last(profile()).textContent).toContain("Aug 2026");
    await waitFor(() => expect(localStorage.getItem(goalsStorageKey(".demo"))).toBe("{}"));
  });

  it("picking a photo sets the last time together and ends the prompt", async () => {
    renderApp({ ...demoData, ...pastGoal }, async () => new Date(2026, 9, 18).getTime());
    openThread();
    toProfile();
    pick(prompt);
    await waitFor(() => expect(imageIn(last(profile()))).toMatch(/^blob:/));
    expect(last(profile()).textContent).toContain("Oct 2026");
    expect(profile().textContent).not.toContain(prompt);
    await waitFor(() => expect(localStorage.getItem(goalsStorageKey(".demo"))).toBe("{}"));
  });

  it("future and undated goals never prompt", () => {
    renderApp();
    openThread();
    toProfile();
    expect(profile().textContent).not.toContain("How was");
    cleanup();
    renderApp({ ...demoData, goals: () => ({ "madrid-crew": { label: "dinner soon", setBy: "leo", in: ["leo"] } }) });
    openThread();
    toProfile();
    expect(profile().textContent).not.toContain("How was");
  });
});
