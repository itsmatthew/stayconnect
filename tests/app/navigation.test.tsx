import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { demoData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

let n = 0;
const renderApp = () =>
  render(
    <AppClient
      data={demoData}
      openStore={() => openPhotoStore(`nav-test-${++n}`)}
      openArchive={() => openArchiveStore(`nav-archive-${n}`)}
      hasFace={async () => true}
    />,
  );
const nav = () => screen.getAllByRole("navigation", { name: "Main" })[0];
const tap = (label: string) => fireEvent.click(within(nav()).getByRole("button", { name: label }));
const current = () =>
  within(nav())
    .getAllByRole("button")
    .filter((b) => b.getAttribute("aria-current") === "page")
    .map((b) => b.textContent);

describe("main nav (D5-1, HOME-6, ARC-1)", () => {
  it("opens on Circles", () => {
    renderApp();
    expect(current()).toEqual(["Circles"]);
    expect(screen.getAllByRole("region", { name: "Selected circle" }).length).toBeGreaterThan(0);
  });

  it("Daily 5 opens the Daily 5 tab, Messages the Messages tab, Circles goes home", () => {
    renderApp();
    tap("Daily 5");
    expect(current()).toEqual(["Daily 5"]);
    expect(screen.getByRole("heading", { name: "Daily 5" })).toBeTruthy();
    for (const n of screen.getAllByRole("navigation", { name: "Main" })) {
      expect(within(n).getByRole("button", { name: "Daily 5" }).getAttribute("aria-current")).toBe("page");
    }
    tap("Messages");
    expect(current()).toEqual(["Messages"]);
    expect(screen.getByRole("heading", { name: "Messages" })).toBeTruthy();
    tap("Circles");
    expect(current()).toEqual(["Circles"]);
    expect(screen.getAllByRole("region", { name: "Selected circle" }).length).toBeGreaterThan(0);
  });

  it("Archive opens the 65 Archive and Me opens your 65 (ARC-1)", async () => {
    renderApp();
    tap("Archive");
    expect(current()).toEqual(["Archive"]);
    expect(await screen.findByRole("heading", { name: "65 Archive" })).toBeTruthy();
    tap("Me");
    expect(current()).toEqual(["Me"]);
    expect(await screen.findByRole("list", { name: /^Your 65 for \d{4}$/ })).toBeTruthy();
  });
});
